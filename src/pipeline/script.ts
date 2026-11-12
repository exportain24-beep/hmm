// Script engine: turns a researched news item or a syllabus topic into a ContentSpec, then has a
// second, independent pass check every claim against the source text. Unverified = never published.
import {readFileSync} from 'node:fs';
import type {ContentSpec} from '../shared/types.ts';
import {TEMPLATES} from '../shared/templates.ts';
import {callLLM, extractJson} from './llm.ts';
import {fetchRetry, log, p, PipelineError, sha1} from './lib.ts';
import type {ResearchItem} from './research.ts';
import {validateSpec} from './spec.ts';

const prompt = (name: string) => readFileSync(p('prompts', `${name}.md`), 'utf8');
const templateGuide = () => Object.values(TEMPLATES).map((t) => `- ${t.id}: badge "${t.badge}", ${t.seconds[0]}-${t.seconds[1]} s, flow ${t.flow.join(' > ')}`).join('\n');

export const fetchArticleText = async (url: string): Promise<string> => {
  try {
    const res = await fetchRetry(url, {headers: {'user-agent': 'HeyMarinerResearch/1.0 (+https://www.heymariner.com)'}}, {stage: 'research', retries: 1, timeoutMs: 25_000});
    if (!res.ok) return '';
    const html = await res.text();
    const body = (html.match(/<article[\s\S]*?<\/article>/i) ?? [html])[0];
    return body.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').trim().slice(0, 9000);
  } catch {
    return '';
  }
};

const write = async (task: string, material: string): Promise<ContentSpec> => {
  const system = prompt('script').replace('{{TEMPLATES}}', templateGuide());
  let feedback = '';
  for (let attempt = 0; attempt < 3; attempt++) {
    const raw = await callLLM(system, `${task}\n\n<source_material>\n${material}\n</source_material>${feedback}`);
    let spec: ContentSpec;
    try {
      spec = extractJson<ContentSpec>(raw);
    } catch (e) {
      feedback = `\n\nYour previous answer was not valid JSON (${(e as Error).message}). Return only the JSON object.`;
      continue;
    }
    spec.factCheck = {status: 'unverified', by: 'writer'};
    const errors = validateSpec(spec);
    if (!errors.length) return spec;
    log('script', `draft ${attempt + 1} rejected`, errors.slice(0, 6));
    feedback = `\n\nYour previous draft failed validation. Fix exactly these problems and return the full JSON again:\n- ${errors.join('\n- ')}`;
  }
  throw new PipelineError('script', 'writer could not produce a valid spec in 3 attempts');
};

const verify = async (spec: ContentSpec, material: string): Promise<ContentSpec> => {
  const raw = await callLLM(prompt('validate'), `<script>\n${JSON.stringify({title: spec.title, scenes: spec.scenes.map((s) => ({id: s.id, narration: s.narration, heading: s.heading, body: s.body, items: s.items}))})}\n</script>\n\n<source_material>\n${material}\n</source_material>`);
  const v = extractJson<{verified: boolean; unsupported: string[]; notes: string}>(raw);
  const ok = v.verified === true && !(v.unsupported?.length);
  spec.factCheck = {status: ok ? 'verified' : 'unverified', by: 'independent validator pass', notes: ok ? v.notes : `Unsupported: ${(v.unsupported ?? []).join(' | ')}`.slice(0, 600), checkedAt: new Date().toISOString()};
  log('script', ok ? 'fact validation passed' : 'fact validation FAILED', {unsupported: v.unsupported?.length ?? 0});
  return spec;
};

export const specFromNews = async (item: ResearchItem): Promise<ContentSpec> => {
  const article = await fetchArticleText(item.url);
  if (article.length < 400 && item.tier !== 'authority') throw new PipelineError('script', 'article text could not be read, refusing to write news from a headline alone');
  const material = `Publisher: ${item.sourceName}\nURL: ${item.url}\nPublished: ${item.publishedAt}\nHeadline: ${item.title}\nSummary: ${item.summary}\n\nArticle text:\n${article}`;
  const spec = await write(`Write a short vertical video about this maritime news item. Choose the best template (breaking-news only for genuinely urgent safety or industry events). Use only facts found in the source material. The id must be "${new Date().toISOString().slice(0, 10)}-" followed by a short slug.`, material);
  spec.origin = {type: 'news', fingerprint: item.fingerprint, sourceDate: item.publishedAt ?? undefined};
  spec.sources = [{title: item.title, url: item.url, publisher: item.sourceName, date: item.publishedAt ?? undefined}];
  return verify(spec, material);
};

export const specFromTopic = async (t: {pillar: string; template: string; topic: string; audience: string[]}): Promise<ContentSpec> => {
  const material = `Topic: ${t.topic}\nPillar: ${t.pillar}\nTemplate: ${t.template}\nAudience: ${t.audience.join(', ')}\n\nThere is no article. Use only well-established content of the IMO conventions and codes (SOLAS, MARPOL, STCW, COLREG, ISM, MLC), IHO standards and standard marine engineering and seamanship practice. Quote rule or regulation numbers only if you are certain. If a precise figure is uncertain, leave it out. List the conventions you relied on as sources with their official IMO/IHO URLs.`;
  const spec = await write(`Write an evergreen educational video with template "${t.template}". The id must be "ev-${sha1(t.topic).slice(0, 6)}-" followed by a short slug.`, material);
  spec.origin = {type: 'evergreen-ai', fingerprint: sha1(t.topic)};
  return verify(spec, `${material}\n\nValidator: there is no article. Mark a claim unsupported if it states a regulation number, limit, date or figure that you are not certain is correct, or anything a master mariner or chief engineer would call wrong or unsafe.`);
};
