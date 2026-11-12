// Spec -> voice -> silent Remotion render -> music + SFX mix -> final MP4 -> thumbnail.
import {existsSync, mkdirSync, statSync} from 'node:fs';
import type {ContentSpec, Timeline, VideoProps} from '../shared/types.ts';
import {TEMPLATES, THREE_D_KINDS} from '../shared/templates.ts';
import {layoutFor} from '../shared/layout.ts';
import {config, log, p, run, sha1, writeJson} from './lib.ts';
import {buildVoice} from './voice.ts';

const ENTRY = 'src/video/index.ts';
const accentHex = (spec: ContentSpec) => {
  const c = config<{colors: Record<string, string>}>('brand').colors;
  const a = TEMPLATES[spec.template]?.accent ?? 'teal';
  return a === 'amber' ? c.amber : a === 'red' ? c.red : a === 'green' ? c.green : c.tealBright;
};

const sfxEvents = (spec: ContentSpec, tl: Timeline) => {
  const ev: {name: string; t: number}[] = [];
  spec.scenes.forEach((sc, i) => {
    const t = tl.scenes[i];
    if (i === 0) ev.push({name: 'swoosh', t: 0.05});
    else if (sc.kind === 'endcard') ev.push({name: 'riser', t: t.start - 1.5}, {name: 'boom', t: t.start + 0.05}, {name: 'chime', t: t.start + 0.45});
    else ev.push({name: 'whoosh', t: t.start - 0.1});
    const cueSound = sc.kind === 'checklist' ? 'tick' : THREE_D_KINDS.includes(sc.kind) || sc.kind === 'radar' ? 'ping' : sc.kind === 'takeaway' ? 'ding' : 'pop';
    t.cueTimes.forEach((c) => ev.push({name: cueSound, t: t.start + c}));
    if (sc.kind === 'takeaway' && !t.cueTimes.length) ev.push({name: 'ding', t: t.start + 0.25});
    if (sc.kind === 'term' || sc.kind === 'stat') ev.push({name: 'pop', t: t.start + 0.3});
  });
  return {total: tl.totalSeconds, events: ev};
};

/** Review sheet: two frames per scene (early and late), so a whole video can be checked at a glance. */
export const contactSheet = (video: string, tl: Timeline, out: string) => {
  const dir = `${out}.frames`;
  mkdirSync(dir, {recursive: true});
  const times = tl.scenes.flatMap((s) => [s.start + (s.end - s.start) * 0.45, s.end - Math.min(0.5, (s.end - s.start) * 0.12)]);
  times.forEach((t, i) => run('ffmpeg', ['-y', '-loglevel', 'error', '-ss', t.toFixed(2), '-i', video, '-frames:v', '1', '-vf', `scale=${tl.width > tl.height ? 480 : 270}:-2`, `${dir}/f${String(i).padStart(3, '0')}.jpg`], {stage: 'review', allowFail: true}));
  const cols = Math.min(times.length, tl.width > tl.height ? 4 : 8);
  run('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', '1', '-i', `${dir}/f%03d.jpg`, '-vf', `tile=${cols}x${Math.ceil(times.length / cols)}:padding=6:color=white`, '-frames:v', '1', '-q:v', '3', out], {stage: 'review', allowFail: true});
};

export type Produced = {workDir: string; final: string; thumb: string; timeline: Timeline; voiceId: string | null; uses3d: boolean};

export const produce = async (spec: ContentSpec, opts: {skipRender?: boolean} = {}): Promise<Produced> => {
  const workDir = p('work', spec.id);
  mkdirSync(workDir, {recursive: true});
  writeJson(`${workDir}/spec.json`, spec);

  const {timeline, voFile, voiceId} = await buildVoice(spec, workDir);
  writeJson(`${workDir}/timeline.json`, timeline);
  const brand = config<{logoFile: string}>('brand');
  const props: VideoProps = {spec, timeline, logo: existsSync(p('public', brand.logoFile)) ? brand.logoFile : null};
  writeJson(`${workDir}/props.json`, props);
  const uses3d = spec.scenes.some((s) => THREE_D_KINDS.includes(s.kind));

  // audio: original music bed + synced sound design + ducked broadcast mix (-14 LUFS)
  const seed = parseInt(sha1(spec.id).slice(0, 6), 16) % 97 + 1;
  const turn = timeline.scenes[Math.max(1, Math.floor(timeline.scenes.length / 2))].start;
  run('python3', [p('tools/audio/music_bed.py'), '--duration', timeline.totalSeconds.toFixed(2), '--mood', spec.mood, '--seed', String(seed), '--drop', turn.toFixed(2), '--out', `${workDir}/music.wav`], {stage: 'audio'});
  writeJson(`${workDir}/sfx.json`, sfxEvents(spec, timeline));
  run('python3', [p('tools/audio/sfx.py'), '--events', `${workDir}/sfx.json`, '--out', `${workDir}/sfx.wav`], {stage: 'audio'});
  run('python3', [p('tools/audio/mix_audio.py'), '--voice', voFile, '--music', `${workDir}/music.wav`, '--sfx', `${workDir}/sfx.wav`, '--music-db', '-24', '--sfx-db', '-9', '--total', timeline.totalSeconds.toFixed(2), '--out', `${workDir}/mix.m4a`], {stage: 'audio'});
  log('audio', 'mix completed', {seconds: timeline.totalSeconds});

  const final = `${workDir}/final.mp4`;
  const thumb = `${workDir}/thumb.png`;
  if (opts.skipRender) return {workDir, final, thumb, timeline, voiceId, uses3d};

  log('render', 'render started', {composition: 'HeyMariner', frames: Math.round(timeline.totalSeconds * timeline.fps), uses3d});
  const common = [`--props=${workDir}/props.json`, '--gl=swangle', '--log=error'];
  run('npx', ['remotion', 'render', ENTRY, 'HeyMariner', `${workDir}/silent.mp4`, ...common, '--muted', '--codec=h264', '--crf=14', '--timeout=120000'], {stage: 'render', timeoutMs: 100 * 60 * 1000});
  // Final encode: broadcast-safe limited-range yuv420p with BT.709 tags (Remotion's JPEG frames arrive full-range).
  run('ffmpeg', ['-y', '-loglevel', 'error', '-i', `${workDir}/silent.mp4`, '-i', `${workDir}/mix.m4a`, '-map', '0:v:0', '-map', '1:a:0',
    '-vf', 'scale=in_range=full:out_range=tv,format=yuv420p', '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-profile:v', 'high',
    '-color_range', 'tv', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709',
    '-c:a', 'copy', '-movflags', '+faststart', '-shortest', final], {stage: 'render', timeoutMs: 20 * 60 * 1000});
  log('render', 'render completed', {file: final, mb: +(statSync(final).size / 1e6).toFixed(1)});
  contactSheet(final, timeline, `${workDir}/sheet.jpg`);
  // Thumbnail from the strongest visual moment of the video itself (topic graphic + big highlighted headline).
  const vis = spec.scenes.findIndex((s) => THREE_D_KINDS.includes(s.kind) || ['radar', 'ukc', 'stat', 'compare'].includes(s.kind));
  const k = vis >= 0 ? vis : 1;
  const tt = timeline.scenes[k];
  const at = tt.start + Math.min(tt.end - tt.start - 0.4, (tt.cueTimes[0] ?? 0.8) + 1.4);
  const tpl = TEMPLATES[spec.template];
  const lay = layoutFor(timeline.width, timeline.height);
  const r = run('python3', [p('tools/thumbnail.py'), '--video', final, '--at', at.toFixed(2), '--text', spec.thumbnailText, '--badge', spec.series ? spec.series.toUpperCase() : tpl.badge,
    '--logo', p('public', config<{logoFile: string}>('brand').logoFile), '--fonts', p('public/fonts'), '--accent', accentHex(spec), '--out', thumb, '--wide', `${workDir}/thumb_16x9.jpg`, '--crop', [lay.panel.x, lay.panel.y, lay.panel.w, lay.panel.h].join(',')], {stage: 'thumbnail', allowFail: true});
  if (r.code !== 0) {
    log('thumbnail', 'custom thumbnail failed, falling back to the Remotion still', {error: r.stderr.slice(-300)});
    run('npx', ['remotion', 'still', ENTRY, timeline.height > timeline.width ? 'ThumbnailVertical' : 'ThumbnailWide', thumb, ...common], {stage: 'render', timeoutMs: 10 * 60 * 1000});
  }
  return {workDir, final, thumb, timeline, voiceId, uses3d};
};
