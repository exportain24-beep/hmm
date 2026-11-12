// ElevenLabs voice-over with character timestamps -> per-word timing -> scene timeline.
// One request per scene (exact scene boundaries, so speech and motion cannot drift).
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import type {ContentSpec, SceneTiming, Timeline, WordTiming} from '../shared/types.ts';
import {FPS, SIZES} from '../shared/types.ts';
import {TEMPLATES} from '../shared/templates.ts';
import {config, env, fetchRetry, log, mediaDuration, okJson, p, PipelineError, run, sha1} from './lib.ts';

type Profile = {voiceIdEnv: string; fallbackProfile?: string; stability: number; similarityBoost: number; style: number; speed: number};
type VoiceCfg = {
  defaultProfile: string; profiles: Record<string, Profile>; modelIdEnv: string; defaultModelId: string; outputFormat: string;
  leadSeconds: number; gapSeconds: number; tailSeconds: number; placeholderCharsPerSecond: number;
};

export const resolveVoice = (spec: ContentSpec) => {
  const cfg = config<VoiceCfg>('voice');
  let name = spec.voiceProfile ?? TEMPLATES[spec.template]?.voiceProfile ?? cfg.defaultProfile;
  let prof = cfg.profiles[name] ?? cfg.profiles[cfg.defaultProfile];
  let voiceId = env(prof.voiceIdEnv);
  if (!voiceId && prof.fallbackProfile) {
    name = prof.fallbackProfile;
    prof = {...cfg.profiles[name], speed: prof.speed};
    voiceId = env(cfg.profiles[name].voiceIdEnv);
  }
  return {cfg, profile: prof, profileName: name, voiceId, modelId: env(cfg.modelIdEnv) || cfg.defaultModelId, ready: Boolean(env('ELEVENLABS_API_KEY') && voiceId)};
};

/** Display words -> text the voice reads, with the character span of every display word in it. */
export const toSpoken = (narration: string) => {
  const dict = config<Record<string, string>>('pronunciation');
  const words = narration.trim().split(/\s+/).filter(Boolean);
  let spoken = '';
  const spans: {word: string; from: number; to: number}[] = [];
  for (const w of words) {
    const m = w.match(/^([^A-Za-z0-9]*)(.*?)([^A-Za-z0-9%]*)$/) ?? ['', '', w, ''];
    const core = m[2];
    const say = Object.prototype.hasOwnProperty.call(dict, core) && core !== '_comment' ? m[1] + dict[core] + m[3] : w;
    if (spoken) spoken += ' ';
    spans.push({word: w, from: spoken.length, to: spoken.length + say.length});
    spoken += say;
  }
  return {spoken, spans};
};

type TtsResult = {audio_base64: string; alignment: {characters: string[]; character_start_times_seconds: number[]; character_end_times_seconds: number[]} | null};

const synthScene = async (text: string, v: ReturnType<typeof resolveVoice>, outMp3: string): Promise<TtsResult['alignment']> => {
  const key = sha1([text, v.voiceId, v.modelId, JSON.stringify(v.profile)].join('|'));
  const cacheDir = p('.cache/voice');
  mkdirSync(cacheDir, {recursive: true});
  const cMp3 = `${cacheDir}/${key}.mp3`;
  const cJson = `${cacheDir}/${key}.json`;
  if (!existsSync(cMp3) || !existsSync(cJson)) {
    const res = await fetchRetry(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(v.voiceId)}/with-timestamps?output_format=${v.cfg.outputFormat}`, {
      method: 'POST',
      headers: {'xi-api-key': env('ELEVENLABS_API_KEY'), 'content-type': 'application/json'},
      body: JSON.stringify({text, model_id: v.modelId, voice_settings: {stability: v.profile.stability, similarity_boost: v.profile.similarityBoost, style: v.profile.style, speed: v.profile.speed}}),
    }, {stage: 'voice', retries: 3, timeoutMs: 120_000});
    if (res.status === 401 || res.status === 403) throw new PipelineError('voice', `ElevenLabs rejected the credentials (HTTP ${res.status}). Check ELEVENLABS_API_KEY and the plan.`);
    const j = await okJson<TtsResult>(res, 'voice');
    if (!j.audio_base64) throw new PipelineError('voice', 'ElevenLabs returned no audio');
    writeFileSync(cMp3, Buffer.from(j.audio_base64, 'base64'));
    writeFileSync(cJson, JSON.stringify(j.alignment ?? null));
  } else {
    log('voice', 'cache hit, no characters spent', {chars: text.length});
  }
  writeFileSync(outMp3, readFileSync(cMp3));
  return JSON.parse(readFileSync(cJson, 'utf8'));
};

const wordsFromAlignment = (spans: {word: string; from: number; to: number}[], al: TtsResult['alignment'], dur: number): WordTiming[] => {
  const totalChars = spans.length ? spans[spans.length - 1].to : 1;
  return spans.map((s) => {
    if (al && al.character_start_times_seconds.length >= s.to) {
      return {text: s.word, start: al.character_start_times_seconds[s.from], end: al.character_end_times_seconds[Math.max(s.from, s.to - 1)]};
    }
    return {text: s.word, start: (s.from / totalChars) * dur, end: (s.to / totalChars) * dur};
  });
};

export const cueTimesFor = (narration: string, cues: string[] | undefined, words: WordTiming[], sceneStart: number): number[] => {
  const out: number[] = [];
  // character offset of each word in the display narration
  const offsets: number[] = [];
  let pos = 0;
  const flat = narration.trim();
  for (const w of words) {
    const j = flat.indexOf(w.text, pos);
    offsets.push(j < 0 ? pos : j);
    pos = (j < 0 ? pos : j) + w.text.length;
  }
  let from = 0;
  for (const cue of cues ?? []) {
    const j = flat.indexOf(cue, from);
    if (j < 0) { out.push(out.length ? out[out.length - 1] + 0.8 : 0.4); continue; }
    from = j + cue.length;
    let wi = offsets.findIndex((o, k) => o <= j && j < o + words[k].text.length + 1);
    if (wi < 0) wi = Math.max(0, offsets.findIndex((o) => o >= j));
    out.push(Math.max(0, (words[wi]?.start ?? sceneStart) - sceneStart));
  }
  return out;
};

export const buildVoice = async (spec: ContentSpec, workDir: string): Promise<{timeline: Timeline; voFile: string; voiceId: string | null}> => {
  const v = resolveVoice(spec);
  const {cfg} = v;
  const size = SIZES[spec.aspect];
  mkdirSync(`${workDir}/voice`, {recursive: true});
  if (!v.ready) log('voice', 'ElevenLabs key or voice id not configured: building a SILENT placeholder timeline (cannot be published)');

  const scenes: SceneTiming[] = [];
  const clips: {file: string; at: number}[] = [];
  let t = 0;
  const narrated = spec.scenes.filter((s) => s.narration.trim());
  for (let i = 0; i < spec.scenes.length; i++) {
    const sc = spec.scenes[i];
    const text = sc.narration.trim();
    const start = t;
    if (!text) {
      const d = 2.6;
      scenes.push({id: sc.id, start, end: start + d, cueTimes: [], words: []});
      t += d;
      continue;
    }
    const {spoken, spans} = toSpoken(text);
    const voiceStart = start + (i === 0 ? cfg.leadSeconds : 0.12);
    let dur: number;
    let al: TtsResult['alignment'] = null;
    if (v.ready) {
      const mp3 = `${workDir}/voice/${String(i).padStart(2, '0')}.mp3`;
      al = await synthScene(spoken, v, mp3);
      dur = mediaDuration(mp3);
      clips.push({file: mp3, at: voiceStart});
    } else {
      dur = Math.max(1.4, spoken.length / cfg.placeholderCharsPerSecond);
    }
    const rel = wordsFromAlignment(spans, al, dur);
    const words = rel.map((w) => ({text: w.text, start: voiceStart + w.start, end: voiceStart + Math.max(w.end, w.start + 0.05)}));
    const isLastNarrated = sc === narrated[narrated.length - 1];
    const end = voiceStart + dur + (isLastNarrated ? cfg.tailSeconds + (sc.kind === 'endcard' ? 1.2 : 0) : cfg.gapSeconds);
    scenes.push({id: sc.id, start, end, cueTimes: cueTimesFor(text, sc.cues, words, start), words});
    t = end;
  }
  const totalSeconds = Math.ceil(t * FPS) / FPS;
  scenes[scenes.length - 1].end = totalSeconds;

  const voFile = `${workDir}/vo.wav`;
  if (clips.length) {
    const args = ['-y', '-loglevel', 'error'];
    for (const c of clips) args.push('-i', c.file);
    const fc = clips.map((c, k) => `[${k}:a]aresample=48000,aformat=channel_layouts=stereo,adelay=${Math.round(c.at * 1000)}|${Math.round(c.at * 1000)}[a${k}]`).join(';')
      + ';' + clips.map((_, k) => `[a${k}]`).join('') + `amix=inputs=${clips.length}:normalize=0:duration=longest,apad=whole_dur=${totalSeconds},atrim=0:${totalSeconds}[out]`;
    run('ffmpeg', [...args, '-filter_complex', fc, '-map', '[out]', '-ar', '48000', voFile], {stage: 'voice'});
  } else {
    run('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo', '-t', String(totalSeconds), voFile], {stage: 'voice'});
  }
  const timeline: Timeline = {fps: FPS, width: size.width, height: size.height, totalSeconds, voice: v.ready ? 'elevenlabs' : 'placeholder', scenes};
  log('voice', v.ready ? 'voice generated' : 'placeholder voice timeline built', {seconds: totalSeconds, scenes: scenes.length, profile: v.profileName, model: v.ready ? v.modelId : null});
  return {timeline, voFile, voiceId: v.ready ? v.voiceId : null};
};
