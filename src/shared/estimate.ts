// Pure (browser-safe) timeline estimate, used for Remotion Studio default props and the Next.js preview.
// The real timeline comes from ElevenLabs timestamps in src/pipeline/voice.ts.
import type {ContentSpec, SceneTiming, Timeline} from './types';
import {FPS, SIZES} from './types';

export const estimateTimeline = (spec: ContentSpec, charsPerSecond = 14.5): Timeline => {
  const size = SIZES[spec.aspect];
  const scenes: SceneTiming[] = [];
  let t = 0;
  spec.scenes.forEach((sc, i) => {
    const text = sc.narration.trim();
    const start = t;
    if (!text) {
      scenes.push({id: sc.id, start, end: start + 2.6, cueTimes: [], words: []});
      t += 2.6;
      return;
    }
    const voiceStart = start + (i === 0 ? 0.25 : 0.12);
    const dur = Math.max(1.4, text.length / charsPerSecond);
    const raw = text.split(/\s+/);
    let pos = 0;
    const words = raw.map((w) => {
      const a = voiceStart + (pos / text.length) * dur;
      pos += w.length + 1;
      return {text: w, start: a, end: voiceStart + (Math.min(pos - 1, text.length) / text.length) * dur};
    });
    const cueTimes = (sc.cues ?? []).map((c) => {
      const j = text.indexOf(c);
      return j < 0 ? 0.5 : voiceStart - start + (j / text.length) * dur;
    });
    const end = voiceStart + dur + (sc.kind === 'endcard' ? 1.5 : 0.32);
    scenes.push({id: sc.id, start, end, cueTimes, words});
    t = end;
  });
  const totalSeconds = Math.ceil(t * FPS) / FPS;
  scenes[scenes.length - 1].end = totalSeconds;
  return {fps: FPS, width: size.width, height: size.height, totalSeconds, voice: 'placeholder', scenes};
};
