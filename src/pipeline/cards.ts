// Daily photo cards: validate -> render (Remotion still) -> platform copy -> publish (Facebook, Instagram, LinkedIn, X).
import {copyFileSync, existsSync, mkdirSync, readdirSync, renameSync, rmSync, writeFileSync} from 'node:fs';
import type {CardSpec, PlatformId} from '../shared/types.ts';
import {config, env, fetchRetry, isAutoPublish, isDryRun, log, okJson, p, PipelineError, readJson, run, state, summary, writeJson} from './lib.ts';
import {ensurePublicUrl} from './publish/hosting.ts';
import {hasLink, sanitizeSocialCaption, slugify} from './seo.ts';

const CARD_TOPIC: Record<string, string> = {incident: 'maritime-incident', casualty: 'marine-casualty', safety: 'safety-alert', lesson: 'lesson-learned', imo: 'imo-update', psc: 'port-state-control', regulation: 'regulation'};
const LIM = {headline: 48, subheadline: 56, insight: 170, point: 34, badge: 34};

export const validateCard = (c: CardSpec): string[] => {
  const e: string[] = [];
  if (!/^[a-z0-9][a-z0-9-]{2,80}$/.test(c.id ?? '')) e.push('id must be a slug');
  if (!['breaking', 'incident', 'casualty', 'safety', 'lesson', 'investigation', 'regulation', 'imo', 'psc', 'navigation', 'cargo', 'machinery', 'environment', 'security', 'technology', 'seafarer', 'knowledge', 'equipment', 'analysis'].includes(c.type)) e.push('unknown type');
  if (c.image && (!c.image.url || !c.image.credit || !c.image.license)) e.push('image needs url, credit and license');
  if (c.breaking && (c.priorityScore ?? 0) < config<{breakingMinScore: number}>('cards').breakingMinScore) e.push('breaking needs priorityScore >= breakingMinScore');
  if (['breaking', 'incident', 'casualty', 'investigation', 'psc'].includes(c.type) && !c.eventId) e.push('real-time cards need an eventId');
  if (!c.headline || c.headline.length > LIM.headline) e.push(`headline missing or over ${LIM.headline}`);
  if ((c.subheadline ?? '').length > LIM.subheadline) e.push('subheadline too long');
  if (c.headlineAccent && !c.headline.toUpperCase().endsWith(c.headlineAccent.toUpperCase())) e.push('headlineAccent must be the last words of the headline');
  if ((c.location ?? '').length > 28) e.push('location max 28 characters');
  if (!c.insight || c.insight.length > LIM.insight) e.push(`insight missing or over ${LIM.insight}`);
  if ((c.badge ?? '').length > LIM.badge) e.push('badge too long');
  if ((c.points ?? []).length > 3 || (c.points ?? []).some((x) => x.length > LIM.point)) e.push('max 3 points of 34 chars');
  if (!c.sources?.length || c.sources.some((s) => !/^https?:\/\//.test(s.url))) e.push('sources missing or invalid');
  if (!c.meta?.description || !c.meta?.altText || !c.meta?.hashtags?.length) e.push('meta.description / altText / hashtags missing');
  if (hasLink(`${c.headline} ${c.subheadline ?? ''} ${c.insight}`)) e.push('no links in card text');
  return e;
};

const loadDir = (dir: string) => (existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.json')).sort().map((f) => ({file: `${dir}/${f}`, card: readJson<CardSpec>(`${dir}/${f}`)})) : []);

const posted = () => readJson<Record<string, {platforms: Record<string, {id: string; at: string}>; at: string}>>(p('data/state/cards.json'), {});

export const chooseCard = (id?: string, breakingOnly = false) => {
  const queue = loadDir(p('content/cards/queue')).sort((a, b) => Number(Boolean(b.card.breaking)) - Number(Boolean(a.card.breaking)) || (b.card.priorityScore ?? 0) - (a.card.priorityScore ?? 0));
  const bank = config<{fallbackToBank: boolean}>('cards').fallbackToBank ? loadDir(p('content/cards/bank')) : [];
  const all = [...queue, ...bank];
  if (id) return all.find((x) => x.card.id === id) ?? null;
  const done = posted();
  const ok = (x: {card: CardSpec}) => !done[x.card.id] && validateCard(x.card).length === 0 && x.card.factCheck.status === 'verified';
  if (breakingOnly) return queue.find((x) => ok(x) && x.card.breaking) ?? null;
  return all.find(ok) ?? null;
};

const tags = (c: CardSpec, n: number, extra: string[] = []) => {
  const seen = new Set<string>();
  return [...c.meta.hashtags, ...extra, '#Maritime', '#Seafarers', '#MerchantNavy', '#MaritimeEducation', '#HeyMariner']
    .map((h) => (h.startsWith('#') ? h : `#${h}`).replace(/[^#A-Za-z0-9]/g, ''))
    .filter((h) => !seen.has(h.toLowerCase()) && seen.add(h.toLowerCase())).slice(0, n);
};

export const cardCopy = (c: CardSpec): Record<'facebook' | 'instagram' | 'linkedin' | 'x', string> => {
  const social = config<{website: string; handles: Record<string, string>}>('social');
  const q = c.meta.question ?? 'What would you add from your own sea time?';
  const where = [c.location ? c.location.replace(/\b\w/g, (m) => m.toUpperCase()).replace(/\B\w+/g, (m) => m.toLowerCase()) : '', c.dateLabel ?? ''].filter(Boolean).join(' · ');
  const five = tags(c, 5);
  const src = c.sources[0]?.publisher ? `Source: ${c.sources.map((s) => s.publisher ?? s.title).join(', ')}.` : '';
  const facebook = [c.headline, ...(where ? [`📍 ${where}`] : []), '', c.meta.description, '', `Why it matters: ${c.insight}`, '', src, '', q, '', five.join(' ')].filter((x, i, arr) => !(x === '' && arr[i - 1] === '')).join('\n');
  const instagram = [c.headline, ...(where ? [`📍 ${where}`] : []), '', c.meta.description, '', c.insight, '', `Follow ${social.handles.instagram} for practical maritime knowledge.`, '', q, '.', five.join(' ')].join('\n');
  return {
    facebook: sanitizeSocialCaption('facebook', facebook),
    instagram: sanitizeSocialCaption('instagram', instagram),
    linkedin: [c.headline, ...(where ? [where] : []), '', c.meta.description, '', `Why it matters: ${c.insight}`, '', `Relevant for: ${c.audience.join(', ')}.`, src, `More: ${social.website}`, '', five.slice(0, 4).join(' ')].join('\n'),
    x: (() => { const body = `${c.headline}${where ? ` (${where})` : ''}. ${c.insight.split(/(?<=[.!?])\s/)[0]}`; return `${body.length > 240 ? body.slice(0, 237).replace(/\s+\S*$/, '') + '…' : body} ${five.slice(0, 2).join(' ')}`; })(),
  };
};

const graph = (path: string) => `https://graph.facebook.com/${env('META_GRAPH_VERSION') || config<{metaGraphVersion: string}>('social').metaGraphVersion}/${path}`;
const metaPost = async <T>(url: string, params: Record<string, string>, stage: string): Promise<T> => okJson<T>(await fetchRetry(url, {method: 'POST', body: new URLSearchParams(params)}, {stage, retries: 0}), stage);
const pageToken = async () => {
  const j = await okJson<{access_token?: string}>(await fetchRetry(`${graph(env('META_PAGE_ID'))}?fields=access_token&access_token=${encodeURIComponent(env('META_ACCESS_TOKEN'))}`, {}, {stage: 'facebook', retries: 1}), 'facebook').catch(() => ({access_token: ''}));
  return j.access_token || env('META_ACCESS_TOKEN');
};

const PUB: Record<string, (img: string, url: string, text: string, c: CardSpec) => Promise<string>> = {
  facebook: async (_img, url, text) => {
    const j = await metaPost<{id: string; post_id?: string}>(graph(`${env('META_PAGE_ID')}/photos`), {url, caption: text, published: 'true', access_token: await pageToken()}, 'facebook');
    return j.post_id ?? j.id;
  },
  instagram: async (_img, url, text, c) => {
    const token = await pageToken();
    let ig = env('META_IG_USER_ID');
    if (!ig) ig = (await okJson<{instagram_business_account?: {id: string}}>(await fetchRetry(`${graph(env('META_PAGE_ID'))}?fields=instagram_business_account&access_token=${encodeURIComponent(token)}`, {}, {stage: 'instagram', retries: 1}), 'instagram')).instagram_business_account?.id ?? '';
    if (!ig) throw new PipelineError('instagram', 'no Instagram account linked to the Page');
    const m = await metaPost<{id: string}>(graph(`${ig}/media`), {image_url: url, caption: text, alt_text: c.meta.altText, access_token: token}, 'instagram');
    for (let i = 0; i < 15; i++) {
      const s = await okJson<{status_code?: string}>(await fetchRetry(`${graph(m.id)}?fields=status_code&access_token=${encodeURIComponent(token)}`, {}, {stage: 'instagram', retries: 1}), 'instagram');
      if (s.status_code === 'FINISHED') break;
      if (s.status_code === 'ERROR') throw new PipelineError('instagram', 'image container failed');
      await new Promise((r) => setTimeout(r, 4000));
    }
    return (await metaPost<{id: string}>(graph(`${ig}/media_publish`), {creation_id: m.id, access_token: token}, 'instagram')).id;
  },
};

const bufferImage = async (platform: 'linkedin' | 'x', url: string, text: string): Promise<string> => {
  const services = platform === 'x' ? ['twitter', 'x'] : ['linkedin'];
  const gql = async <T>(query: string, variables: Record<string, unknown>) => {
    const j = await okJson<{data?: T; errors?: {message: string}[]}>(await fetchRetry('https://api.buffer.com', {method: 'POST', headers: {authorization: `Bearer ${env('BUFFER_ACCESS_TOKEN')}`, 'content-type': 'application/json'}, body: JSON.stringify({query, variables})}, {stage: 'buffer', retries: 0}), 'buffer');
    if (j.errors?.length) throw new PipelineError('buffer', j.errors.map((e) => e.message).join('; '));
    return j.data as T;
  };
  let ch = env(platform === 'x' ? 'BUFFER_CHANNEL_X' : 'BUFFER_CHANNEL_LINKEDIN');
  if (!ch) {
    const acc = await gql<{account: {organizations: {id: string}[]}}>('query { account { organizations { id } } }', {});
    for (const o of acc.account.organizations) {
      const d = await gql<{channels: {id: string; service: string}[]}>('query C($input: ChannelsInput!) { channels(input: $input) { id service } }', {input: {organizationId: o.id}});
      ch = d.channels.find((c) => services.includes(c.service.toLowerCase()))?.id ?? ch;
    }
  }
  if (!ch) throw new PipelineError('buffer', `no ${platform} channel in Buffer`);
  const d = await gql<{createPost: {post?: {id: string}; message?: string}}>('mutation P($input: CreatePostInput!) { createPost(input: $input) { ... on PostActionSuccess { post { id } } ... on MutationError { message } } }',
    {input: {text, channelId: ch, schedulingType: 'automatic', mode: 'shareNow', needsApproval: false, assets: [{image: {url}}]}});
  if (!d.createPost.post?.id) throw new PipelineError('buffer', d.createPost.message ?? 'createPost failed');
  return d.createPost.post.id;
};

/** Downloads the card's authentic photo into public/cards-media (temporary; removed after posting). */
const fetchPhoto = async (c: CardSpec): Promise<string | null> => {
  if (!c.image?.url) return null;
  if (!/^https?:\/\//.test(c.image.url)) return c.image.url;
  try {
    const res = await fetchRetry(c.image.url, {headers: {'user-agent': 'HeyMarinerCards/1.0 (+https://www.heymariner.com)'}}, {stage: 'cards', retries: 1, timeoutMs: 30_000});
    const type = res.headers.get('content-type') ?? '';
    if (!res.ok || !/image\/(jpeg|png|webp)/.test(type)) throw new Error(`HTTP ${res.status} ${type}`);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 20_000) throw new Error('image too small');
    const ext = type.includes('png') ? 'png' : type.includes('webp') ? 'webp' : 'jpg';
    mkdirSync(p('public/cards-media'), {recursive: true});
    writeFileSync(p('public/cards-media', `${c.id}.${ext}`), buf);
    log('cards', 'photo downloaded', {bytes: buf.length, credit: c.image.credit, license: c.image.license});
    return `cards-media/${c.id}.${ext}`;
  } catch (e) {
    log('cards', 'photo could not be downloaded, using the illustration', {error: (e as Error).message});
    return null;
  }
};

export const runCard = async (id?: string, only?: string[], breakingOnly = false) => {
  const pick = chooseCard(id, breakingOnly);
  if (!pick) { log('cards', 'no card to post'); summary('### Photo card\n\nNothing to post: card bank and queue are used up.\n'); return; }
  const c = pick.card;
  const errs = validateCard(c);
  if (errs.length) throw new PipelineError('cards', `card ${c.id} invalid: ${errs.join('; ')}`);
  const dir = p('work', 'cards', c.id);
  mkdirSync(dir, {recursive: true});
  const logo = config<{logoFile: string}>('brand').logoFile;
  const photo = await fetchPhoto(c);
  const socialIcons = existsSync(p('public/brand/social')) ? readdirSync(p('public/brand/social')).filter((f) => /\.(png|svg|webp)$/i.test(f)).map((f) => `brand/social/${f}`) : [];
  writeJson(`${dir}/props.json`, {card: c, logo, photo, socialIcons});
  const img = `${dir}/card.png`;
  run('npx', ['remotion', 'still', 'src/video/index.ts', 'PhotoCard', img, `--props=${dir}/props.json`, '--gl=swangle', '--log=error'], {stage: 'cards', timeoutMs: 10 * 60 * 1000});
  const copy = cardCopy(c);
  writeJson(`${dir}/copy.json`, copy);
  const out = p('out', 'cards');
  mkdirSync(out, {recursive: true});
  const name = `heymariner-${slugify(CARD_TOPIC[c.type] ?? c.type)}-${slugify(c.headline).slice(0, 48)}-${(c.dateLabel ? new Date(c.dateLabel) : new Date()).toISOString().slice(0, 10)}`.replace(/-+/g, '-');
  copyFileSync(img, `${out}/${name}.png`);
  writeJson(`${out}/${name}.json`, {card: c, copy});
  log('cards', 'card rendered', {id: c.id, file: `${name}.png`});

  const verified = c.factCheck.status === 'verified';
  const results: Record<string, string> = {};
  const done = posted();
  const entry = done[c.id] ?? {platforms: {}, at: new Date().toISOString()};
  const enabled = (config<{cards?: Record<string, boolean>}>('social').cards ?? {facebook: true, instagram: true, linkedin: true, x: true}) as Record<string, boolean>;
  for (const pf of ['facebook', 'instagram', 'linkedin', 'x'] as const) {
    if (!enabled[pf] || (only?.length && !only.includes(pf))) { results[pf] = 'disabled'; continue; }
    const need = pf === 'facebook' || pf === 'instagram' ? ['META_ACCESS_TOKEN', 'META_PAGE_ID'] : ['BUFFER_ACCESS_TOKEN'];
    const why = [isDryRun() && 'DRY_RUN', !isAutoPublish() && 'AUTO_PUBLISH off', !verified && 'not fact-checked', need.some((k) => !env(k)) && 'missing credentials', entry.platforms[pf] && 'already posted'].filter(Boolean);
    if (why.length) { results[pf] = `skipped (${why.join(', ')})`; continue; }
    try {
      const url = await ensurePublicUrl(img, `${name}.png`);
      const pid = pf === 'linkedin' || pf === 'x' ? await bufferImage(pf, url, copy[pf]) : await PUB[pf](img, url, copy[pf], c);
      entry.platforms[pf] = {id: pid, at: new Date().toISOString()};
      done[c.id] = entry;
      writeJson(p('data/state/cards.json'), done);
      results[pf] = `posted (${pid})`;
    } catch (e) {
      results[pf] = `FAILED (${(e as Error).message.slice(0, 150)})`;
      state.addFailure({id: c.id, stage: `card:${pf}`, error: (e as Error).message});
    }
  }
  if (!isDryRun() && Object.keys(entry.platforms).length) {
    done[c.id] = entry;
    writeJson(p('data/state/cards.json'), done);
    if (pick.file.includes('/cards/queue/')) { mkdirSync(p('content/cards/queue/done'), {recursive: true}); renameSync(pick.file, p('content/cards/queue/done', pick.file.split('/').pop()!)); }
  }
  if (!isDryRun() && !Object.keys(entry.platforms).length && Object.values(results).every((r) => r.startsWith('FAILED'))) {
    // every platform failed: still record the attempt so the same card does not block the queue forever
    done[c.id] = {...entry, at: new Date().toISOString()};
    writeJson(p('data/state/cards.json'), done);
  }
  // temporary photo is never kept in the repository
  if (photo && photo.startsWith('cards-media/')) rmSync(p('public', photo), {force: true});
  summary(`### Photo card: ${c.headline}\n\n| Platform | Result |\n|---|---|\n${Object.entries(results).map(([k, v]) => `| ${k} | ${v} |`).join('\n')}\n`);
  log('cards', 'done', results);
};

type CardsCfg = {startDate: string; ramp: {fromDay: number; perDay: number; slotsUtc: string[]}[]; graceMinutes: number};
/** Today's slot list from the ramp (week 1: 3/day, week 2: 6/day, week 3+: 8/day). */
export const cardSlotsFor = (now = new Date()) => {
  const cfg = config<CardsCfg>('cards');
  const day = Math.floor((Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) - Date.parse(`${cfg.startDate}T00:00:00Z`)) / 864e5);
  const step = [...cfg.ramp].sort((a, b) => b.fromDay - a.fromDay).find((r) => day >= r.fromDay) ?? cfg.ramp[0];
  return {day, perDay: step.perDay, slots: step.slotsUtc};
};
export const dueCardSlot = (now = new Date()) => {
  const cfg = config<CardsCfg>('cards');
  const {slots} = cardSlotsFor(now);
  const done = state.slots();
  const today = now.toISOString().slice(0, 10);
  const mins = now.getUTCHours() * 60 + now.getUTCMinutes();
  for (const s of slots) {
    const [h, m] = s.split(':').map(Number);
    const id = `card-${s.replace(':', '')}`;
    if (mins >= h * 60 + m - 5 && mins <= h * 60 + m + cfg.graceMinutes && done[id] !== today) return {id, utc: s};
  }
  return null;
};
export type {PlatformId};
