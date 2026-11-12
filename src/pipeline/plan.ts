// Content planning: what (if anything) should be produced now?
import {existsSync, readdirSync, renameSync, mkdirSync} from 'node:fs';
import type {ContentSpec} from '../shared/types.ts';
import {config, log, p, readJson, sha1, state} from './lib.ts';
import {llmProvider} from './llm.ts';
import {pickNewsCandidate, runResearch} from './research.ts';
import {specFromNews, specFromTopic} from './script.ts';
import {validateSpec} from './spec.ts';

type Slot = {id: string; utcHour: number; mode: 'news-first' | 'evergreen'; pillars: string[]};
type Schedule = {graceHours: number; slots: Slot[]};

/** Which slot is due right now and has not run today? Reruns of the same hour return null. */
export const dueSlot = (now = new Date()): Slot | null => {
  const sch = config<Schedule & {oneOff?: {id: string; at: string; pillars: string[]}[]}>('schedule');
  const done = state.slots();
  const day = now.toISOString().slice(0, 10);
  // one-off launch slots (exact UTC times)
  for (const o of sch.oneOff ?? []) {
    const at = Date.parse(o.at);
    if (now.getTime() >= at - 5 * 60_000 && now.getTime() < at + sch.graceHours * 3.6e6 && !done[o.id]) return {id: o.id, utcHour: new Date(at).getUTCHours(), mode: 'evergreen', pillars: o.pillars};
  }
  const hour = now.getUTCHours() + now.getUTCMinutes() / 60;
  for (const s of sch.slots) {
    if (hour >= s.utcHour && hour < s.utcHour + sch.graceHours && done[s.id] !== day) return s;
  }
  return null;
};
export const markSlot = (slotId: string, now = new Date()) => {
  const d = state.slots();
  d[slotId] = now.toISOString().slice(0, 10);
  state.saveSlots(d);
};

const loadDir = (dir: string): {file: string; spec: ContentSpec}[] =>
  existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.json')).sort().map((f) => ({file: `${dir}/${f}`, spec: readJson<ContentSpec>(`${dir}/${f}`)})) : [];

export const loadBank = () => loadDir(p('content/bank'));
export const findSpec = (id: string): ContentSpec | null =>
  [...loadDir(p('content/queue')), ...loadBank()].find((x) => x.spec.id === id)?.spec ?? null;

const alreadyProduced = (id: string) => Boolean(state.published()[id]);

export type Plan = {spec: ContentSpec; reason: string; queueFile?: string} | {spec: null; reason: string};

export const choose = async (slot: Slot | null, opts: {research: boolean}): Promise<Plan> => {
  // 1. hand-fed queue (a Claude scheduled task or a human can drop a spec in content/queue)
  for (const q of loadDir(p('content/queue'))) {
    if (alreadyProduced(q.spec.id)) continue;
    const errors = validateSpec(q.spec);
    if (errors.length) { log('plan', `queue item ${q.spec.id} is invalid, skipped`, errors.slice(0, 5)); continue; }
    return {spec: q.spec, reason: 'queued spec', queueFile: q.file};
  }
  // 2. verified news (only for slots configured as news-first; the daily educational schedule has none)
  const mode = slot?.mode ?? 'evergreen';
  if (mode === 'news-first') {
    if (!llmProvider()) log('plan', 'news slot but no LLM key: research is scored, script writing skipped');
    else {
      if (opts.research) await runResearch();
      const cand = pickNewsCandidate();
      if (cand) {
        log('plan', 'topic selected', {title: cand.title, score: cand.score, source: cand.sourceName});
        const seen = state.seen();
        seen.fingerprints[cand.fingerprint] = new Date().toISOString();
        seen.fingerprints[cand.storyKey] = new Date().toISOString();
        state.saveSeen(seen); // marked before writing: a story is attempted once, never looped on
        try {
          const spec = await specFromNews(cand);
          if (spec.factCheck.status === 'verified') return {spec, reason: `news, score ${cand.score}`};
          log('plan', 'news script failed fact validation, falling back to evergreen', {notes: spec.factCheck.notes});
          state.addFailure({id: spec.id, stage: 'fact-check', error: spec.factCheck.notes ?? 'unverified'});
        } catch (e) {
          log('plan', 'news script failed, falling back to evergreen', {error: (e as Error).message});
          state.addFailure({stage: 'script', error: (e as Error).message});
        }
      } else log('plan', 'no news topic above the score threshold: not forcing a weak video');
    }
  }
  // 3. hand-written, fact-checked evergreen bank
  const bank = loadBank().filter((b) => !alreadyProduced(b.spec.id));
  const pref = slot?.pillars ?? [];
  const pick = bank.find((b) => pref.includes(b.spec.pillar)) ?? bank[0];
  if (pick) return {spec: pick.spec, reason: 'evergreen bank'};
  // 4. syllabus topics written by the LLM and independently validated
  if (llmProvider()) {
    const topics = config<{topics: {pillar: string; template: string; topic: string; audience: string[]}[]}>('topics').topics;
    const seen = state.seen();
    const next = topics.find((t) => !seen.fingerprints[sha1(t.topic)] && (!pref.length || pref.includes(t.pillar))) ?? topics.find((t) => !seen.fingerprints[sha1(t.topic)]);
    if (next) {
      seen.fingerprints[sha1(next.topic)] = new Date().toISOString();
      state.saveSeen(seen);
      const spec = await specFromTopic(next);
      if (spec.factCheck.status === 'verified') return {spec, reason: 'evergreen syllabus (AI written, validated)'};
      state.addFailure({id: spec.id, stage: 'fact-check', error: spec.factCheck.notes ?? 'unverified'});
      return {spec: null, reason: 'syllabus script failed fact validation'};
    }
  }
  return {spec: null, reason: 'nothing to produce: bank used up and no validated topic available'};
};

export const archiveQueueFile = (file: string) => {
  const dir = p('content/queue/done');
  mkdirSync(dir, {recursive: true});
  renameSync(file, `${dir}/${file.split('/').pop()}`);
};
