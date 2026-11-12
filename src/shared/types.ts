// Shared contract between the content pipeline (Node) and the video engine (Remotion).
// Use `type`, not `interface`: Remotion composition props must be index-signature compatible.

export type TemplateId =
  | 'breaking-news' | 'maritime-news' | 'regulation-update' | 'safety-alert'
  | 'educational-explainer' | 'equipment-explained' | 'maritime-term' | 'navigation-scenario'
  | 'colreg-scenario' | 'ship-type' | 'one-minute-mariner' | 'maritime-fact'
  | 'market-insight' | 'technology-update' | 'environmental-update' | 'career-advice'
  | 'seafarer-tip' | 'maritime-history' | 'accident-lesson' | 'heymariner-insight';

export type Pillar =
  | 'news' | 'regulation' | 'safety' | 'deck' | 'engine' | 'equipment' | 'terminology'
  | 'colreg' | 'ship-type' | 'career' | 'technology' | 'market' | 'environment' | 'history';

export type SceneKind =
  | 'hook' | 'term' | 'statement' | 'bullets' | 'qa' | 'checklist' | 'compare' | 'stat'
  | 'timeline' | 'colreg3d' | 'contour3d' | 'zoc3d' | 'radar' | 'ukc' | 'takeaway' | 'endcard';

export type Visual =
  | {type: 'colreg'; scenario: 'crossing' | 'head-on' | 'overtaking'}
  | {type: 'safety-contour'; draft: number; enteredValue: number; contours: number[]}
  | {type: 'zoc'; highlight: 'A1' | 'A2' | 'B' | 'C' | 'D' | 'U'}
  | {type: 'radar'; cpaNm: number; tcpaMin: number; limitNm: number}
  | {type: 'ukc'; depth: number; draft: number; squat: number};

export type Motif = 'voyage' | 'radar' | 'chart' | 'engine' | 'tank' | 'globe' | 'lighthouse';

export type SceneItem = {title: string; text?: string; value?: string};

export type SceneSpec = {
  id: string;
  kind: SceneKind;
  /** What the voice says during this scene. Empty only for a silent end card. */
  narration: string;
  /** Small kicker above the heading, e.g. "RULE 15" or "WHAT CHANGED?" */
  label?: string;
  heading?: string;
  body?: string;
  items?: SceneItem[];
  /** Substrings of the narration, in spoken order. Item i / phase i appears when cue i is spoken. */
  cues?: string[];
  visual?: Visual;
  /** Animated backdrop behind the scene. Chosen automatically from the words when left out. */
  motif?: Motif;
};

export type Source = {title: string; url: string; publisher?: string; date?: string};

export type ContentSpec = {
  id: string;
  template: TemplateId;
  pillar: Pillar;
  series?: string;
  audience: string[];
  title: string;
  /** Short line for thumbnails (max ~28 chars). */
  thumbnailText: string;
  aspect: '9:16' | '16:9';
  mood: 'calm' | 'hopeful' | 'upbeat' | 'warm' | 'curious' | 'tense' | 'epic';
  voiceProfile?: string;
  scenes: SceneSpec[];
  sources: Source[];
  factCheck: {status: 'verified' | 'unverified'; by: string; notes?: string; checkedAt?: string};
  meta: {description: string; keywords: string[]; hashtags: string[]};
  origin: {type: 'bank' | 'queue' | 'news' | 'evergreen-ai'; fingerprint?: string; sourceDate?: string};
};

export type WordTiming = {text: string; start: number; end: number};

export type SceneTiming = {
  id: string;
  start: number;
  end: number;
  /** Seconds from scene start at which each cue is spoken. */
  cueTimes: number[];
  /** Absolute seconds. */
  words: WordTiming[];
};

export type Timeline = {
  fps: number;
  width: number;
  height: number;
  totalSeconds: number;
  voice: 'elevenlabs' | 'placeholder';
  scenes: SceneTiming[];
};

export type VideoProps = {
  spec: ContentSpec;
  timeline: Timeline;
  /** Path inside /public, or null to draw the built-in wordmark. */
  logo: string | null;
};

export type PlatformId = 'youtube' | 'facebook' | 'instagram' | 'tiktok' | 'linkedin' | 'x';

export type PlatformMeta = {title: string; caption: string; hashtags: string[]; keywords: string[]};

export type Metadata = {
  id: string;
  title: string;
  description: string;
  category: Pillar;
  template: TemplateId;
  targetAudience: string[];
  source: Source[];
  sourceDate: string | null;
  script: string;
  voiceId: string | null;
  duration: number;
  publishSchedule: string | null;
  platforms: Record<PlatformId, PlatformMeta>;
};

export const FPS = 30;
export const SIZES: Record<'9:16' | '16:9', {width: number; height: number}> = {
  '9:16': {width: 1080, height: 1920},
  '16:9': {width: 1920, height: 1080},
};

// ---------- photo cards ----------
export type CardType = 'breaking' | 'incident' | 'regulation' | 'safety' | 'knowledge' | 'equipment' | 'analysis';

export type CardSpec = {
  id: string;
  type: CardType;
  /** Optional series label, e.g. "ONE RULE MARINERS SHOULD KNOW". Defaults to the type's badge. */
  badge?: string;
  /** Max 60 characters. */
  headline: string;
  /** Max 48 characters, shown on a highlight bar, e.g. "What should mariners know?" */
  subheadline?: string;
  /** The practical insight, 1-2 lines, max 170 characters. */
  insight: string;
  /** Up to 3 short points (max 34 characters each). */
  points?: string[];
  motif?: Motif;
  pillar: Pillar;
  audience: string[];
  sources: Source[];
  factCheck: {status: 'verified' | 'unverified'; by: string; notes?: string; checkedAt?: string};
  meta: {description: string; keywords: string[]; hashtags: string[]; question?: string; altText: string};
};
