// Validation of a ContentSpec before any money (voice) or CPU (render) is spent.
import type {ContentSpec, SceneSpec} from '../shared/types.ts';
import {BUDGET, SCENE_KINDS, TEMPLATES} from '../shared/templates.ts';
import {config} from './lib.ts';

const NEEDS_ITEMS = new Set(['bullets', 'checklist', 'compare', 'timeline']);
const VISUAL_FOR: Record<string, string> = {colreg3d: 'colreg', contour3d: 'safety-contour', zoc3d: 'zoc', radar: 'radar', ukc: 'ukc'};

export const validateSpec = (s: ContentSpec): string[] => {
  const e: string[] = [];
  const voice = config<{maxCharsPerVideo: number; placeholderCharsPerSecond: number}>('voice');
  if (!/^[a-z0-9][a-z0-9-]{2,80}$/.test(s.id ?? '')) e.push('id must be a lowercase slug');
  const tpl = TEMPLATES[s.template];
  if (!tpl) e.push(`unknown template "${s.template}"`);
  if (s.aspect !== '9:16' && s.aspect !== '16:9') e.push('aspect must be 9:16 or 16:9');
  if (!s.title || s.title.length > BUDGET.title) e.push(`title missing or longer than ${BUDGET.title}`);
  if (!s.thumbnailText || s.thumbnailText.length > BUDGET.thumbnailText) e.push(`thumbnailText missing or longer than ${BUDGET.thumbnailText}`);
  if (!Array.isArray(s.audience) || !s.audience.length) e.push('audience missing');
  if (!Array.isArray(s.sources) || !s.sources.length) e.push('at least one source is required');
  for (const src of s.sources ?? []) if (!/^https?:\/\//.test(src.url ?? '')) e.push(`source url invalid: ${src.title}`);
  if (!s.meta?.description || !Array.isArray(s.meta?.hashtags) || !Array.isArray(s.meta?.keywords)) e.push('meta.description / hashtags / keywords missing');
  if (!s.factCheck || !['verified', 'unverified'].includes(s.factCheck.status)) e.push('factCheck.status missing');
  const sc = s.scenes ?? [];
  if (sc.length < 3 || sc.length > 12) e.push('scenes: need 3 to 12');
  if (sc[0]?.kind !== 'hook') e.push('first scene must be a hook (no logo intro)');
  if (sc[sc.length - 1]?.kind !== 'endcard') e.push('last scene must be an endcard');
  const ids = new Set<string>();
  let chars = 0;
  sc.forEach((x: SceneSpec, i) => {
    const at = `scene ${i} (${x.kind})`;
    if (!SCENE_KINDS.includes(x.kind)) e.push(`${at}: unknown kind`);
    if (!x.id || ids.has(x.id)) e.push(`${at}: id missing or duplicated`);
    ids.add(x.id);
    const n = (x.narration ?? '').trim();
    chars += n.length;
    if (x.kind !== 'endcard' && n.length < 20) e.push(`${at}: narration too short`);
    if (n.length > 420) e.push(`${at}: narration longer than 420 chars, split the scene`);
    if (x.kind === 'hook' && n.length > 170) e.push(`${at}: hook narration must be under 170 chars (about 3-10 s)`);
    if ((x.heading ?? '').length > (x.kind === 'hook' ? BUDGET.hookHeading : BUDGET.heading)) e.push(`${at}: heading too long`);
    if (x.kind !== 'endcard' && !x.heading) e.push(`${at}: heading missing`);
    if ((x.label ?? '').length > BUDGET.label) e.push(`${at}: label too long`);
    if ((x.body ?? '').length > BUDGET.body) e.push(`${at}: body too long`);
    if (NEEDS_ITEMS.has(x.kind) && !(x.items?.length)) e.push(`${at}: items required`);
    if ((x.items?.length ?? 0) > BUDGET.items) e.push(`${at}: more than ${BUDGET.items} items`);
    for (const it of x.items ?? []) {
      if (!it.title || it.title.length > BUDGET.itemTitle) e.push(`${at}: item title missing/too long: "${it.title}"`);
      if ((it.text ?? '').length > BUDGET.itemText) e.push(`${at}: item text too long: "${it.title}"`);
      if ((it.value ?? '').length > BUDGET.itemValue) e.push(`${at}: item value too long: "${it.title}"`);
    }
    const want = VISUAL_FOR[x.kind];
    if (want && x.visual?.type !== want) e.push(`${at}: needs visual.type "${want}"`);
    let pos = 0;
    for (const cue of x.cues ?? []) {
      const j = n.indexOf(cue, pos);
      if (j < 0) e.push(`${at}: cue "${cue}" is not in the narration (in order)`);
      else pos = j + cue.length;
    }
  });
  if (chars > voice.maxCharsPerVideo) e.push(`narration is ${chars} chars, limit ${voice.maxCharsPerVideo}`);
  const est = chars / voice.placeholderCharsPerSecond;
  if (tpl && (est < tpl.seconds[0] * 0.7 || est > tpl.seconds[1] * 1.35)) e.push(`estimated ${est.toFixed(0)} s is outside the ${tpl.id} range ${tpl.seconds[0]}-${tpl.seconds[1]} s`);
  return e;
};

export const narrationText = (s: ContentSpec) => s.scenes.map((x) => x.narration.trim()).filter(Boolean).join(' ');
