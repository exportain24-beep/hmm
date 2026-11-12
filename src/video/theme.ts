import {Easing, interpolate} from 'remotion';
import brand from '../../config/brand.json';
import social from '../../config/social.json';
import {TEMPLATES} from '../shared/templates';
import type {TemplateId} from '../shared/types';

export const C = brand.colors;
export const BRAND = brand;
export const SOCIAL = social;
export const FONT_HEAD = `'${brand.fonts.heading}', 'Inter', sans-serif`;
export const FONT_BODY = `'${brand.fonts.body}', sans-serif`;

export const accentOf = (template: TemplateId): string => {
  const a = TEMPLATES[template]?.accent ?? 'teal';
  return a === 'amber' ? C.amber : a === 'red' ? C.red : a === 'green' ? C.green : C.tealBright;
};

const CLAMP = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
/** 0 -> 1 eased entrance starting at `at` seconds. */
export const enter = (frame: number, fps: number, at = 0, dur = 0.5): number =>
  interpolate(frame, [at * fps, (at + dur) * fps], [0, 1], {...CLAMP, easing: Easing.out(Easing.cubic)});
export const ramp = (frame: number, fps: number, from: number, to: number): number =>
  interpolate(frame, [from * fps, Math.max(to, from + 0.01) * fps], [0, 1], {...CLAMP, easing: Easing.inOut(Easing.cubic)});
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
/** Shrinks a font size when text is longer than `comfy` characters. */
export const fit = (text: string, size: number, comfy: number, min = 0.55): number =>
  Math.round(size * Math.max(min, Math.min(1, Math.sqrt(comfy / Math.max(1, text.length)))));
/** When does item i appear? Uses the spoken cue when there is one, otherwise spreads items over the scene. */
export const cueAt = (cueTimes: number[], i: number, n: number, sceneSeconds: number, first = 0.5): number =>
  cueTimes[i] !== undefined ? Math.max(0.15, cueTimes[i] - 0.12) : first + (i * Math.max(0.5, sceneSeconds - first - 1.2)) / Math.max(1, n);
