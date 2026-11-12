// Publishing layer. The content engine knows nothing about platforms; each adapter is independent.
import type {Metadata, PlatformId} from '../../shared/types.ts';
import {config, env, isAutoPublish, isDryRun, log, state, summary} from '../lib.ts';
import type {QcReport} from '../qc.ts';
import {LinkedInPublisher, TikTokPublisher, XPublisher} from './buffer.ts';
import {FacebookPublisher, InstagramPublisher} from './meta.ts';
import {YouTubePublisher} from './youtube.ts';

export type PublishInput = {id: string; file: string; thumb: string | null; meta: Metadata; cfg: Record<string, unknown>};
export type Publisher = {
  id: PlatformId;
  requiredEnv: string[];
  health: () => Promise<string>;
  publish: (input: PublishInput) => Promise<{id: string; url?: string}>;
};

export const PUBLISHERS: Publisher[] = [YouTubePublisher, FacebookPublisher, InstagramPublisher, TikTokPublisher, LinkedInPublisher, XPublisher];

type Social = {platforms: Record<string, {enabled: boolean; via: string} & Record<string, unknown>>};

/** The five conditions of section 68. All must hold, per platform. */
export const publishGate = (qc: QcReport | null, platform: Publisher, alreadyPosted: boolean) => {
  const reasons: string[] = [];
  if (isDryRun()) reasons.push('DRY_RUN is not false');
  if (!isAutoPublish()) reasons.push('AUTO_PUBLISH is not true');
  if (!qc?.publishable) reasons.push('content validation did not pass');
  const missing = platform.requiredEnv.filter((k) => !env(k));
  if (missing.length) reasons.push(`missing credentials: ${missing.join(', ')}`);
  if (alreadyPosted) reasons.push('duplicate: already published on this platform');
  return {allowed: reasons.length === 0, reasons};
};

export const publishAll = async (id: string, file: string, thumb: string | null, meta: Metadata, qc: QcReport | null, only?: string[]) => {
  const social = config<Social>('social');
  const results: Record<string, string> = {};
  for (const pub of PUBLISHERS) {
    const cfg = social.platforms[pub.id];
    if (!cfg?.enabled || (only?.length && !only.includes(pub.id))) { results[pub.id] = 'disabled'; continue; }
    const published = state.published();
    const entry = published[id] ?? {title: meta.title, platforms: {}};
    const gate = publishGate(qc, pub, Boolean(entry.platforms[pub.id]));
    if (!gate.allowed) { results[pub.id] = `skipped (${gate.reasons.join('; ')})`; log('publish', `${pub.id}: not publishing`, gate.reasons); continue; }
    try {
      log('publish', `${pub.id}: publishing started`);
      const r = await pub.publish({id, file, thumb, meta, cfg});
      entry.platforms[pub.id] = {id: r.id, url: r.url, at: new Date().toISOString()};
      published[id] = entry;
      state.savePublished(published); // saved after every platform so a rerun can never double-post
      results[pub.id] = `published (${r.id})`;
      log('publish', `${pub.id}: published`, {platformId: r.id, url: r.url});
    } catch (e) {
      const msg = (e as Error).message;
      results[pub.id] = `FAILED (${msg.slice(0, 160)})`;
      state.addFailure({id, stage: `publish:${pub.id}`, error: msg});
      log('publish', `${pub.id}: failure`, {error: msg});
    }
  }
  summary(`### Publishing\n\n| Platform | Result |\n|---|---|\n${Object.entries(results).map(([k, v]) => `| ${k} | ${v} |`).join('\n')}\n`);
  return results;
};
