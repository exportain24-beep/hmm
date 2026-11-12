// Real-time research: pull configured feeds, de-duplicate, score. No LLM, no cost.
import {config, fetchRetry, log, p, sha1, state, writeJson, readJson} from './lib.ts';

export type ResearchItem = {
  fingerprint: string;
  storyKey: string;
  sourceId: string;
  sourceName: string;
  tier: string;
  reliability: number;
  title: string;
  url: string;
  summary: string;
  publishedAt: string | null;
  score: number;
  scores: Record<string, number>;
};
type Feed = {id: string; name: string; url: string; reliability: number; tier: string};
type SourcesCfg = {feeds: Feed[]; maxItemsPerFeed: number; maxAgeHours: number; keepItems: number};
type ScoringCfg = {minScore: number; weights: Record<string, number>; recencyHalfLifeHours: number; keywords: Record<string, string[]>};

const decode = (s: string) =>
  s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&#8217;|&#39;|&apos;/g, "'").replace(/&#8211;|&#8212;/g, '-').replace(/&#\d+;/g, ' ').replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ').trim();
const tag = (xml: string, name: string) => {
  const m = xml.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, 'i'));
  return m ? decode(m[1]) : '';
};

export const parseFeed = (xml: string): {title: string; url: string; summary: string; publishedAt: string | null}[] => {
  const blocks = xml.match(/<item[\s>][\s\S]*?<\/item>|<entry[\s>][\s\S]*?<\/entry>/gi) ?? [];
  return blocks.map((b) => {
    let url = tag(b, 'link');
    if (!url) url = (b.match(/<link[^>]*href="([^"]+)"/i) ?? [])[1] ?? '';
    const date = tag(b, 'pubDate') || tag(b, 'updated') || tag(b, 'published') || tag(b, 'dc:date');
    const d = date ? new Date(date) : null;
    return {
      title: tag(b, 'title'),
      url: url.trim(),
      summary: (tag(b, 'description') || tag(b, 'summary') || tag(b, 'content')).slice(0, 700),
      publishedAt: d && !isNaN(d.getTime()) ? d.toISOString() : null,
    };
  }).filter((i) => i.title && i.url);
};

const STOP = new Set('the a an of to in on for and or with at by from as is are was were be has have after over into new says said its their his her this that'.split(' '));
/** Same story from two outlets should produce the same key. */
export const storyKey = (title: string) =>
  sha1(title.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w)).sort().slice(0, 7).join(' '));

const hits = (text: string, words: string[]) => words.reduce((n, w) => n + (text.includes(w) ? 1 : 0), 0);
const sat = (n: number, full: number) => Math.min(1, n / full);

export const scoreItem = (i: {title: string; summary: string; publishedAt: string | null; reliability: number}, cfg: ScoringCfg, now = Date.now()) => {
  const text = ` ${i.title} ${i.summary} `.toLowerCase();
  const k = cfg.keywords;
  const ageH = i.publishedAt ? Math.max(0, (now - Date.parse(i.publishedAt)) / 3.6e6) : 48;
  const parts: Record<string, number> = {
    recency: Math.pow(0.5, ageH / cfg.recencyHalfLifeHours),
    reliability: i.reliability,
    maritimeRelevance: sat(hits(text, k.maritime), 3),
    educationalValue: sat(hits(text, k.educational), 2),
    seafarerValue: sat(hits(text, k.seafarer), 2),
    shareability: sat(hits(text, k.shareable), 1),
    visualPotential: sat(hits(text, k.visual), 2),
    regulatoryImportance: sat(hits(text, k.regulatory), 2),
  };
  let total = 0;
  let wsum = 0;
  for (const [name, w] of Object.entries(cfg.weights)) {
    total += (parts[name] ?? 0) * w;
    wsum += w;
  }
  let score = Math.round((total / wsum) * 100);
  if (hits(text, k.reject) > 0) score = Math.min(score, 20);
  return {score, scores: Object.fromEntries(Object.entries(parts).map(([a, b]) => [a, Math.round(b * 100) / 100]))};
};

export const runResearch = async (): Promise<ResearchItem[]> => {
  const src = config<SourcesCfg>('sources');
  const scoring = config<ScoringCfg>('scoring');
  const now = Date.now();
  const items: ResearchItem[] = [];
  const feedStatus: Record<string, string> = {};
  for (const f of src.feeds) {
    try {
      const res = await fetchRetry(f.url, {headers: {'user-agent': 'HeyMarinerResearch/1.0 (+https://www.heymariner.com)', accept: 'application/rss+xml, application/atom+xml, text/xml, */*'}}, {stage: 'research', retries: 1, timeoutMs: 25_000});
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const parsed = parseFeed(await res.text()).slice(0, src.maxItemsPerFeed);
      feedStatus[f.id] = `ok (${parsed.length})`;
      for (const it of parsed) {
        if (it.publishedAt && now - Date.parse(it.publishedAt) > src.maxAgeHours * 3.6e6) continue;
        const s = scoreItem({...it, reliability: f.reliability}, scoring, now);
        items.push({fingerprint: sha1(it.url.split('?')[0]), storyKey: storyKey(it.title), sourceId: f.id, sourceName: f.name, tier: f.tier, reliability: f.reliability, ...it, ...s});
      }
    } catch (e) {
      feedStatus[f.id] = `failed: ${(e as Error).message.slice(0, 80)}`;
    }
  }
  // corroboration: the same story reported by several outlets is more reliable
  const byStory = new Map<string, ResearchItem[]>();
  for (const it of items) byStory.set(it.storyKey, [...(byStory.get(it.storyKey) ?? []), it]);
  const merged: ResearchItem[] = [];
  for (const group of byStory.values()) {
    group.sort((a, b) => b.score - a.score);
    const best = {...group[0]};
    const outlets = new Set(group.map((g) => g.sourceId)).size;
    if (outlets > 1) best.score = Math.min(100, best.score + 4 * (outlets - 1));
    best.scores = {...best.scores, corroboratingOutlets: outlets};
    merged.push(best);
  }
  merged.sort((a, b) => b.score - a.score);
  const kept = merged.slice(0, src.keepItems);
  writeJson(p('data/research/latest.json'), {updatedAt: new Date().toISOString(), feedStatus, minScore: scoring.minScore, items: kept});
  log('research', 'research completed', {feeds: feedStatus, items: kept.length, aboveThreshold: kept.filter((i) => i.score >= scoring.minScore).length});
  return kept;
};

/** Best fresh candidate that has not been used before, or null. */
export const pickNewsCandidate = (): ResearchItem | null => {
  const scoring = config<ScoringCfg>('scoring');
  const data = readJson<{items: ResearchItem[]}>(p('data/research/latest.json'), {items: []});
  const seen = state.seen().fingerprints;
  return data.items.find((i) => i.score >= scoring.minScore && !seen[i.fingerprint] && !seen[i.storyKey]) ?? null;
};
