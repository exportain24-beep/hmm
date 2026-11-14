#!/usr/bin/env tsx
// HeyMariner pipeline entry point.
//   research                      pull + score feeds
//   due                           is a schedule slot due? (writes GitHub outputs)
//   run [--id X] [--slot S]       plan -> script -> voice -> render -> QC -> metadata -> publish (if allowed)
//   validate                      validate every spec in content/bank and content/queue
//   health                        check credentials, providers and the render environment
//   cleanup                       delete old temporary media
import {copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {config, env, isAutoPublish, isCardsEnabled, isDryRun, isPipelineEnabled, log, p, PipelineError, run, setOutput, state, summary, writeJson} from './lib.ts';
import {llmProvider} from './llm.ts';
import {buildMetadata, uploadKit} from './metadata.ts';
import {archiveQueueFile, choose, dueSlot, findSpec, loadBank, loadQueue, markSlot, slotPublishAt} from './plan.ts';
import {makeThumbnail, produce} from './produce.ts';
import {estimateTimeline} from '../shared/estimate.ts';
import {varietyProblems} from '../shared/motifs.ts';
import {setFacebookThumb} from './publish/meta.ts';
import {PUBLISHERS, publishAll} from './publish/index.ts';
import {cleanupMedia} from './publish/hosting.ts';
import {runQc} from './qc.ts';
import {runResearch} from './research.ts';
import {cardSlotsFor, chooseCard, dueCardSlot, runCard, scheduledDue, validateCard} from './cards.ts';
import {validateSpec} from './spec.ts';
import {seoFilename} from './seo.ts';
import {resolveVoice} from './voice.ts';

const arg = (name: string): string | undefined => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : undefined;
};
const has = (name: string) => process.argv.includes(`--${name}`);

const cmdRun = async () => {
  log('pipeline', 'started', {dryRun: isDryRun(), autoPublish: isAutoPublish(), llm: llmProvider()});
  const id = arg('id');
  const slotId = arg('slot');
  const sch = config<{slots: {id: string; utcHour: number; mode: 'news-first' | 'evergreen'; pillars: string[]}[]; oneOff?: {id: string; at: string; pillars: string[]}[]}>('schedule');
  const slots = [...sch.slots, ...(sch.oneOff ?? []).map((o) => ({id: o.id, utcHour: new Date(o.at).getUTCHours(), mode: 'evergreen' as const, pillars: o.pillars}))];
  const slot = slotId ? slots.find((s) => s.id === slotId) ?? null : null;
  if (slotId && !slot) log('plan', `unknown slot "${slotId}": no pillar preference`);

  let plan;
  if (id) {
    const spec = findSpec(id);
    if (!spec) throw new PipelineError('plan', `no spec with id "${id}" in content/queue or content/bank`);
    plan = {spec, reason: 'requested by id'};
  } else {
    // early (lead) window: only today's queued scripts; if none is ready yet, try again next hour (no bank fallback)
    const at = slot ? slotPublishAt(slot.id) : null;
    const pending = loadQueue().filter((q) => !state.published()[q.spec.id] && validateSpec(q.spec).length === 0);
    if (at && Date.now() < at.getTime() && pending.length === 0) {
      log('plan', `no queued script ready yet for ${slot!.id}; will retry at the next tick (slot ${at.toISOString()})`);
      summary(`### HeyMariner pipeline\n\nWaiting for today's scripts (slot ${slot!.id} at ${at.toISOString()}).\n`);
      setOutput('produced', 'false');
      return;
    }
    plan = await choose(slot, {research: true});
  }
  if (!plan.spec) {
    log('plan', plan.reason);
    summary(`### HeyMariner pipeline\n\nNothing produced: ${plan.reason}\n`);
    if (slot && !isDryRun()) markSlot(slot.id);
    setOutput('produced', 'false');
    return;
  }
  const spec = plan.spec;
  const errors = validateSpec(spec);
  if (errors.length) throw new PipelineError('script', `spec ${spec.id} invalid: ${errors.join('; ')}`);
  log('plan', 'topic selected', {id: spec.id, template: spec.template, reason: plan.reason});
  log('script', 'script generated', {scenes: spec.scenes.length, factCheck: spec.factCheck.status});

  const out = await produce(spec, {skipRender: has('skip-render')});
  const meta = buildMetadata(spec, out.timeline, out.voiceId, new Date().toISOString());
  writeJson(`${out.workDir}/metadata.json`, meta);
  writeFileSync(`${out.workDir}/upload.md`, uploadKit(meta));
  const qc = has('skip-render') ? null : runQc(spec, out.timeline, out.final, `${out.workDir}/qc.json`);

  // review bundle (uploaded as a workflow artifact)
  const outDir = p('out', spec.id);
  mkdirSync(outDir, {recursive: true});
  for (const f of ['final.mp4', 'sheet.jpg', 'thumb.png', 'thumb_16x9.jpg', 'upload.md', 'metadata.json', 'qc.json', 'spec.json', 'timeline.json']) {
    if (existsSync(`${out.workDir}/${f}`)) copyFileSync(`${out.workDir}/${f}`, `${outDir}/${f}`);
  }
  // SEO-aware file names for manual uploads
  const base = seoFilename(spec, 'video');
  if (existsSync(`${out.workDir}/final.mp4`)) copyFileSync(`${out.workDir}/final.mp4`, `${outDir}/${base}.mp4`);
  if (existsSync(`${out.workDir}/thumb_16x9.jpg`)) copyFileSync(`${out.workDir}/thumb_16x9.jpg`, `${outDir}/${seoFilename(spec, 'thumbnail')}.jpg`);
  summary([
    `### HeyMariner pipeline: ${spec.title}`, '',
    `- id: \`${spec.id}\` | template: ${spec.template} | ${out.timeline.totalSeconds.toFixed(1)} s | voice: ${out.timeline.voice} | 3D: ${out.uses3d}`,
    `- DRY_RUN=${isDryRun()} AUTO_PUBLISH=${isAutoPublish()}`,
    qc ? `- validation: ${qc.pass ? 'PASSED' : 'FAILED'}` : '- validation: skipped (no render)', '',
    ...(qc ? ['| Check | Result | Detail |', '|---|---|---|', ...qc.checks.map((c) => `| ${c.name} | ${c.pass ? 'ok' : c.blocking ? 'FAIL' : 'warn'} | ${c.detail.replace(/\|/g, '/')} |`)] : []), '',
  ].join('\n'));

  if (!isDryRun() && qc) {
    // record production so the same topic is never produced twice; publishing fills in platform ids
    const published = state.published();
    published[spec.id] = published[spec.id] ?? {title: spec.title, fingerprint: spec.origin.fingerprint, producedAt: new Date().toISOString(), platforms: {}};
    state.savePublished(published);
    if (slot) markSlot(slot.id);
    if ('queueFile' in plan && plan.queueFile && qc.pass) archiveQueueFile(plan.queueFile);
  }
  // rendered ahead of time: hold the finished video until the slot time, then publish
  if (qc?.pass && slot && !isDryRun() && !id) {
    const at = slotPublishAt(slot.id);
    const wait = at ? at.getTime() - Date.now() : 0;
    if (wait > 0 && wait < 3 * 3.6e6) {
      log('publish', `video ready ${Math.round(wait / 60000)} min early, holding until ${at!.toISOString()}`);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
  if (qc) await publishAll(spec.id, out.final, existsSync(out.thumb) ? out.thumb : null, meta, qc, arg('platforms')?.split(',').filter(Boolean));
  setOutput('produced', 'true');
  setOutput('content_id', spec.id);
  if (qc && !qc.pass) {
    state.addFailure({id: spec.id, stage: 'qc', error: qc.checks.filter((c) => !c.pass && c.blocking).map((c) => c.name).join('; ')});
    // A placeholder-voice dry run is an expected "not publishable" result, not a broken build.
    const hard = qc.checks.filter((c) => !c.pass && c.blocking && !/voice-over is real/.test(c.name));
    if (hard.length) throw new PipelineError('qc', `validation failed: ${hard.map((c) => c.name).join('; ')}`);
  }
};

const cmdHealth = async () => {
  const rows: [string, string, string][] = [];
  const add = (name: string, ok: boolean | null, detail: string) => rows.push([name, ok === null ? 'not configured' : ok ? 'ok' : 'FAIL', detail]);
  for (const [bin, a] of [['ffmpeg', ['-version']], ['ffprobe', ['-version']], ['python3', ['-c', 'import numpy, scipy; print("numpy+scipy")']], ['npx', ['remotion', 'versions']]] as [string, string[]][]) {
    const r = run(bin, a, {stage: 'health', allowFail: true, timeoutMs: 120_000});
    add(`render environment: ${bin}`, r.code === 0, (r.stdout || r.stderr).split('\n')[0].slice(0, 90));
  }
  const df = run('df', ['-BG', '--output=avail', '.'], {stage: 'health', allowFail: true}).stdout.split('\n')[1]?.trim() ?? '?';
  add('storage', parseInt(df) > 4, `${df} free`);
  const bank = loadBank();
  const bad = bank.filter((b) => validateSpec(b.spec).length);
  add('content bank', bad.length === 0, `${bank.length} specs, ${bad.length} invalid, ${bank.filter((b) => !state.published()[b.spec.id]).length} unused`);

  const v = resolveVoice(bank[0]?.spec ?? ({template: 'educational-explainer'} as never));
  if (!env('ELEVENLABS_API_KEY')) add('ElevenLabs', null, 'ELEVENLABS_API_KEY missing');
  else {
    try {
      const res = await fetch('https://api.elevenlabs.io/v1/user/subscription', {headers: {'xi-api-key': env('ELEVENLABS_API_KEY')}, signal: AbortSignal.timeout(20_000)});
      const j = (await res.json()) as {tier?: string; character_count?: number; character_limit?: number};
      add('ElevenLabs', res.ok && Boolean(v.voiceId), res.ok ? `tier ${j.tier}, voice id ${v.voiceId ? 'set' : 'MISSING (set ELEVENLABS_VOICE_ID)'}, model ${v.modelId}` : `HTTP ${res.status}`);
    } catch (e) { add('ElevenLabs', false, (e as Error).message); }
  }
  add('Script writer (LLM)', llmProvider() ? true : null, llmProvider() ?? 'no ANTHROPIC_API_KEY / OPENAI_API_KEY: only bank + queue content will be produced');
  if (env('META_ACCESS_TOKEN')) {
    // Meta diagnostics: which object rejects the token, and what the token itself is allowed to do
    const v = env('META_GRAPH_VERSION') || 'v23.0';
    for (const [name, path] of [['meta: token owner (/me)', 'me?fields=id,name'], ['meta: pages on token (/me/accounts)', 'me/accounts?fields=id,name,tasks'], ['meta: granted permissions', 'me/permissions']] as [string, string][]) {
      try {
        const r = await fetch(`https://graph.facebook.com/${v}/${path}${path.includes('?') ? '&' : '?'}access_token=${encodeURIComponent(env('META_ACCESS_TOKEN'))}`, {signal: AbortSignal.timeout(20_000)});
        const j = (await r.json()) as {data?: {id?: string; name?: string; permission?: string; status?: string}[]; name?: string; id?: string; error?: {message: string; code: number; error_subcode?: number}};
        if (j.error) add(name, false, `${j.error.message} (code ${j.error.code}/${j.error.error_subcode ?? '-'})`);
        else if (j.data) add(name, true, j.data.map((d) => d.permission ? `${d.permission}:${d.status}` : `${d.name} (${d.id})`).join(', ').slice(0, 400) || 'none');
        else add(name, true, `${j.name ?? ''} (${j.id ?? ''})`);
      } catch (e) { add(name, false, (e as Error).message); }
    }
  }
  for (const pub of PUBLISHERS) {
    const missing = pub.requiredEnv.filter((k) => !env(k));
    if (missing.length) { add(`publisher: ${pub.id}`, null, `missing ${missing.join(', ')}`); continue; }
    try { add(`publisher: ${pub.id}`, true, await pub.health()); } catch (e) { add(`publisher: ${pub.id}`, false, (e as Error).message.slice(0, 200)); }
  }
  const md = `### HeyMariner health check\n\n| Component | Status | Detail |\n|---|---|---|\n${rows.map((r) => `| ${r[0]} | ${r[1]} | ${r[2].replace(/\|/g, '/')} |`).join('\n')}\n`;
  summary(md);
  console.log(md);
  if (rows.some((r) => r[1] === 'FAIL')) process.exitCode = 1;
};

const main = async () => {
  const cmd = process.argv[2];
  if (cmd === 'research') {
    const items = await runResearch();
    summary(`### Research\n\n${items.slice(0, 12).map((i) => `- **${i.score}** ${i.title} (${i.sourceName})`).join('\n') || 'no items'}\n`);
  } else if (cmd === 'due') {
    const enabled = isPipelineEnabled();
    const slot = enabled ? dueSlot() : null;
    log('schedule', enabled ? (slot ? `slot due: ${slot.id}` : 'no slot due') : 'scheduled production is off (PIPELINE_ENABLED / config/runtime.json)');
    setOutput('slot', slot?.id ?? '');
  } else if (cmd === 'cards-due') {
    const timed = isCardsEnabled() ? scheduledDue() : null;
    const slot = isCardsEnabled() && !timed ? dueCardSlot() : null;
    const breaking = isCardsEnabled() && !slot && !timed ? chooseCard(undefined, true) : null;
    if (timed) setOutput('card_id', timed.card.id);
    log('schedule', timed ? `scheduled card due: ${timed.card.id} (${timed.card.publishAtUtc})` : slot ? `card slot due: ${slot.id}` : breaking ? `breaking card waiting: ${breaking.card.id}` : isCardsEnabled() ? `no card slot due (${cardSlotsFor().perDay}/day: ${cardSlotsFor().slots.join(', ')} UTC)` : 'photo cards are off');
    setOutput('slot', slot?.id ?? '');
    setOutput('breaking', breaking ? 'true' : '');
  } else if (cmd === 'card') {
    await runCard(arg('id'), arg('platforms')?.split(',').filter(Boolean), has('breaking'));
    const slot = arg('slot');
    if (slot && !isDryRun()) markSlot(slot);
  } else if (cmd === 'validate-cards') {
    let bad = 0;
    for (const f of ['content/cards/bank', 'content/cards/queue']) {
      for (const n of existsSync(p(f)) ? readdirSync(p(f)).filter((x) => x.endsWith('.json')) : []) {
        const e = validateCard(JSON.parse(readFileSync(p(f, n), 'utf8')));
        console.log(`${e.length ? 'FAIL' : 'ok  '} ${n}${e.length ? ' - ' + e.join('; ') : ''}`);
        if (e.length) bad++;
      }
    }
    if (bad) process.exitCode = 1;
  } else if (cmd === 'run') {
    await cmdRun();
  } else if (cmd === 'validate') {
    let bad = 0;
    const queue = existsSync(p('content/queue')) ? readdirSync(p('content/queue')).filter((f) => f.endsWith('.json')).map((f) => ({spec: JSON.parse(readFileSync(p('content/queue', f), 'utf8'))})) : [];
    // visual variety: each queued video against the last 6 published videos and the queued ones before it
    const recent = Object.entries(state.published()).sort((a, b) => String(a[1].producedAt ?? '').localeCompare(String(b[1].producedAt ?? ''))).slice(-6).map(([id]) => findSpec(id)).filter((x): x is NonNullable<typeof x> => Boolean(x));
    const pending = queue.filter((q) => !state.published()[q.spec.id]).sort((a, b) => String(a.spec.id).localeCompare(String(b.spec.id)));
    const variety = new Map<string, string[]>();
    pending.forEach((q, i) => variety.set(q.spec.id, varietyProblems(q.spec, [...recent, ...pending.slice(0, i).map((x) => x.spec)].slice(-6))));
    for (const b of [...loadBank(), ...queue]) {
      const e = [...validateSpec(b.spec), ...(variety.get(b.spec.id) ?? []).map((x) => `variety: ${x}`)];
      console.log(`${e.length ? 'FAIL' : 'ok  '} ${b.spec.id}${e.length ? '\n   - ' + e.join('\n   - ') : ''}`);
      if (e.length) bad++;
    }
    if (bad) process.exitCode = 1;
  } else if (cmd === 'health') {
    await cmdHealth();
  } else if (cmd === 'repost') {
    // Publish an already rendered video (kept in the media-temp release) to platforms it missed. Never re-renders.
    const id = arg('id');
    const only = arg('platforms')?.split(',').filter(Boolean) ?? [];
    if (!id || only.length === 0) throw new PipelineError('repost', 'usage: repost --id <spec id> --platforms facebook,instagram');
    const spec = findSpec(id);
    if (!spec) throw new PipelineError('repost', `no spec with id "${id}"`);
    const url = `https://github.com/${env('GITHUB_REPOSITORY') || 'exportain24-beep/hmm'}/releases/download/media-temp/${id}.mp4`;
    const res = await fetch(url);
    if (!res.ok) throw new PipelineError('repost', `rendered video not found in media-temp (HTTP ${res.status})`);
    mkdirSync(p('work/repost'), {recursive: true});
    const file = p(`work/repost/${id}.mp4`);
    writeFileSync(file, Buffer.from(await res.arrayBuffer()));
    const dur = Number(run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file], {stage: 'repost'}).stdout.trim());
    const tl = estimateTimeline(spec); const k = dur / tl.totalSeconds;
    tl.scenes = tl.scenes.map((s) => ({...s, start: s.start * k, end: s.end * k, cueTimes: s.cueTimes.map((c) => c * k)})); tl.totalSeconds = dur;
    const thumb = p(`work/repost/${id}-cover.png`);
    const tr = makeThumbnail(spec, tl, file, thumb, p(`work/repost/${id}-wide.jpg`));
    const hasThumb = tr.code === 0 && existsSync(thumb);
    const meta = buildMetadata(spec, tl, null, null);
    if (only.includes('fb-thumb')) {
      // only refresh the cover of a Facebook reel that is already published
      const fb = state.published()[id]?.platforms.facebook?.id;
      if (!fb || !hasThumb) throw new PipelineError('repost', `no Facebook post or no cover for ${id}`);
      if (!(await setFacebookThumb(fb, thumb))) process.exitCode = 1;
    } else {
      log('repost', `re-using rendered video ${id} (${dur.toFixed(1)} s) for ${only.join(', ')}`);
      const results = await publishAll(id, file, hasThumb ? thumb : null, meta, {pass: true, publishable: true, checks: []}, only);
      if (Object.values(results).some((r) => r.startsWith('FAILED'))) process.exitCode = 1;
    }
  } else if (cmd === 'topics-next') {
    // highest-priority open topics per stream from data/topics/backlog.json (IMO + ADMIRALTY + mariners' questions)
    const b = JSON.parse(readFileSync(p('data/topics/backlog.json'), 'utf8')) as {topics: {id: string; title: string; stream: string; level: string; priority: number; status: string; tags: string[]; startFrom: string[]}[]};
    const n = Number(arg('n') ?? 5);
    for (const stream of (arg('stream') ?? 'deck,engine,safety').split(',')) {
      console.log(`\n${stream.toUpperCase()}`);
      for (const t of b.topics.filter((x) => x.stream === stream && x.status === 'open').slice(0, n)) console.log(`  ${t.priority}  ${t.level}  ${t.id}  | ${t.title}  [${t.tags.join(',')}]  ${t.startFrom.join(' ')}`);
    }
  } else if (cmd === 'cleanup') {
    const n = await cleanupMedia(Number(arg('days') ?? 3));
    for (const d of ['work', 'out']) if (existsSync(p(d))) rmSync(p(d), {recursive: true, force: true});
    log('cleanup', `removed ${n} old media asset(s) and local work files`);
  } else {
    console.log('usage: pipeline <research|due|run|validate|health|cleanup> [--id X] [--slot S] [--platforms a,b] [--skip-render]');
    process.exitCode = 2;
  }
};

main().catch((e) => {
  const stage = e instanceof PipelineError ? e.stage : 'pipeline';
  log(stage, 'failure', {error: (e as Error).message});
  summary(`### Pipeline failure\n\nStage **${stage}**: ${(e as Error).message}\n`);
  try { state.addFailure({stage, error: (e as Error).message}); } catch { /* state write is best effort */ }
  process.exit(1);
});
