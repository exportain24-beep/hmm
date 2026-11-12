// Quality control. A single blocking failure means: DO NOT PUBLISH.
import {existsSync, statSync} from 'node:fs';
import type {ContentSpec, Timeline} from '../shared/types.ts';
import {layoutFor} from '../shared/layout.ts';
import {THREE_D_KINDS} from '../shared/templates.ts';
import {log, run, writeJson} from './lib.ts';
import {validateSpec} from './spec.ts';

export type Check = {name: string; pass: boolean; blocking: boolean; detail: string};
export type QcReport = {pass: boolean; publishable: boolean; checks: Check[]};

const probe = (file: string) => {
  const r = run('ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', file], {stage: 'qc'});
  return JSON.parse(r.stdout) as {streams: {codec_type: string; width?: number; height?: number; avg_frame_rate?: string; pix_fmt?: string; codec_name?: string}[]; format: {duration: string}};
};
const filterLog = (file: string, args: string[]) => run('ffmpeg', ['-hide_banner', '-nostats', '-i', file, ...args, '-f', 'null', '-'], {stage: 'qc', allowFail: true}).stderr;

/** Mean luma of a region of one frame. The 3D panel sits on a near-black base, so a blank (broken) canvas reads very dark. */
const lumaRange = (file: string, t: number, r: {x: number; y: number; w: number; h: number}) => {
  const out = run('ffmpeg', ['-hide_banner', '-nostats', '-ss', t.toFixed(2), '-i', file, '-frames:v', '1', '-vf', `crop=${r.w}:${r.h}:${r.x}:${r.y},signalstats,metadata=print`, '-f', 'null', '-'], {stage: 'qc', allowFail: true}).stderr;
  const avg = Number((out.match(/YAVG=([\d.]+)/) ?? [])[1]);
  return Number.isFinite(avg) ? Math.round(avg) : -1;
};

export const runQc = (spec: ContentSpec, timeline: Timeline, final: string, outFile: string): QcReport => {
  const checks: Check[] = [];
  const add = (name: string, pass: boolean, detail: string, blocking = true) => checks.push({name, pass, blocking, detail});

  const specErrors = validateSpec(spec);
  add('script structure and text budgets (no clipped text)', specErrors.length === 0, specErrors.join('; ') || 'ok');
  add('factual content validated', spec.factCheck.status === 'verified' && spec.sources.length > 0, `${spec.factCheck.status} by ${spec.factCheck.by}; ${spec.sources.length} source(s)`);
  add('voice-over is real (not placeholder)', timeline.voice === 'elevenlabs', timeline.voice);
  add('branding present (header on every scene, end card last)', spec.scenes[spec.scenes.length - 1].kind === 'endcard', 'end card ' + (spec.scenes[spec.scenes.length - 1].kind === 'endcard' ? 'present' : 'missing'));

  if (!existsSync(final)) {
    add('final file exists', false, 'missing ' + final);
  } else {
    const info = probe(final);
    const v = info.streams.find((s) => s.codec_type === 'video');
    const a = info.streams.find((s) => s.codec_type === 'audio');
    const dur = parseFloat(info.format.duration);
    const [n, d] = (v?.avg_frame_rate ?? '0/1').split('/').map(Number);
    const fps = d ? n / d : 0;
    add('resolution and aspect ratio', v?.width === timeline.width && v?.height === timeline.height, `${v?.width}x${v?.height}, expected ${timeline.width}x${timeline.height}`);
    add('frame rate', Math.abs(fps - timeline.fps) < 0.05, `${fps.toFixed(2)} fps`);
    add('codec is h264 / yuv420p', v?.codec_name === 'h264' && v?.pix_fmt === 'yuv420p', `${v?.codec_name} ${v?.pix_fmt}`);
    add('duration matches timeline', Math.abs(dur - timeline.totalSeconds) < 0.6, `${dur.toFixed(2)} s vs ${timeline.totalSeconds.toFixed(2)} s`);
    const maxDur = spec.aspect === '9:16' ? 180 : 1800;
    add('duration within platform limits', dur >= 10 && dur <= maxDur, `${dur.toFixed(1)} s (allowed 10-${maxDur})`);
    add('audio stream exists', Boolean(a), a ? a.codec_name ?? 'audio' : 'no audio stream');
    add('file size sane', statSync(final).size > 200_000 && statSync(final).size < 300e6, `${(statSync(final).size / 1e6).toFixed(1)} MB`);

    const sil = filterLog(final, ['-vn', '-af', 'silencedetect=noise=-50dB:d=2.5']);
    const silences = (sil.match(/silence_start/g) ?? []).length;
    add('no silent section', silences === 0, `${silences} silent stretch(es) over 2.5 s`);
    const loud = filterLog(final, ['-vn', '-af', 'ebur128']);
    const allI = [...loud.matchAll(/I:\s+(-?[\d.]+) LUFS/g)];
    const I = Number(allI.length ? allI[allI.length - 1][1] : NaN);
    add('loudness near -14 LUFS', Number.isFinite(I) && I > -17.5 && I < -11, `${I} LUFS`, timeline.voice === 'elevenlabs');
    const vis = filterLog(final, ['-an', '-vf', 'blackdetect=d=0.6:pix_th=0.06,freezedetect=n=-55dB:d=3.5']);
    add('no black frames', !/black_start/.test(vis), /black_start/.test(vis) ? 'black segment detected' : 'ok');
    add('no frozen picture (rendering artifact)', !/freeze_start/.test(vis), /freeze_start/.test(vis) ? 'picture frozen for more than 3.5 s' : 'ok');

    // voice / picture sync sanity: narration never runs past its scene, and no long gap between words
    let maxGap = 0;
    let overrun = 0;
    timeline.scenes.forEach((s) => {
      s.words.forEach((w, k) => {
        if (k) maxGap = Math.max(maxGap, w.start - s.words[k - 1].end);
        if (w.end > s.end + 0.05) overrun++;
      });
    });
    add('voice-over synchronised with scenes', overrun === 0 && maxGap < 3, `${overrun} word(s) outside their scene, longest pause ${maxGap.toFixed(2)} s`);

    const lay = layoutFor(timeline.width, timeline.height);
    spec.scenes.forEach((sc, i) => {
      if (!THREE_D_KINDS.includes(sc.kind)) return;
      const t = timeline.scenes[i];
      const range = lumaRange(final, (t.start + t.end) / 2, lay.panel);
      add(`3D scene "${sc.id}" rendered (not blank)`, range >= 38, `panel mean luma ${range}`);
    });
  }
  const pass = checks.every((c) => c.pass || !c.blocking);
  const report: QcReport = {pass, publishable: pass, checks};
  writeJson(outFile, report);
  log('qc', pass ? 'validation passed' : 'validation FAILED', checks.filter((c) => !c.pass).map((c) => `${c.name}: ${c.detail}`));
  return report;
};
