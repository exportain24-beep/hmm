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
  /** L1 beginner (cadet) .. L5 expert (Master / Chief Engineer). */
  level?: 'L1' | 'L2' | 'L3' | 'L4' | 'L5';
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
export type CardType =
  | 'breaking' | 'incident' | 'casualty' | 'safety' | 'lesson' | 'investigation' | 'regulation' | 'imo' | 'psc'
  | 'navigation' | 'cargo' | 'machinery' | 'environment' | 'security' | 'technology' | 'seafarer'
  | 'knowledge' | 'equipment' | 'analysis';

export type CardImage = {
  /** https URL of an authentic public-domain or licensed photo, or a repository path under public/. */
  url: string;
  credit: string;
  license: string;
  /** true = representative image (AI or illustrative), shown with a "Representative image" label. */
  representative: boolean;
};

export type CardSpec = {
  id: string;
  type: CardType;
  /** Optional series label, e.g. "ONE RULE MARINERS SHOULD KNOW". Defaults to the type's badge. */
  badge?: string;
  /** Max 60 characters. */
  headline: string;
  /** Max 56 characters, e.g. "What should mariners know?" (used in captions; on the card when there is no location). */
  subheadline?: string;
  /** The end of the headline shown on the second line in yellow, e.g. "FIRE REPORTED". Must be the headline's last words. */
  headlineAccent?: string;
  /** Location line under the headline, e.g. "OFF SINGAPORE". */
  location?: string;
  /** The practical insight, 1-2 lines, max 170 characters. */
  insight: string;
  /** Up to 3 short points (max 34 characters each). */
  points?: string[];
  motif?: Motif;
  image?: CardImage;
  pillar: Pillar;
  audience: string[];
  sources: Source[];
  factCheck: {status: 'verified' | 'unverified'; by: string; notes?: string; checkedAt?: string};
  meta: {description: string; keywords: string[]; hashtags: string[]; question?: string; altText: string};
  /** Real-time layer (intelligence desk). */
  eventId?: string;
  /** "UPDATE" card for an event published before. */
  update?: boolean;
  /** Event date shown on the card, e.g. "12 NOV 2026". */
  dateLabel?: string;
  priorityScore?: number;
  /** Publish immediately outside the slots (only with priorityScore >= breakingMinScore). */
  breaking?: boolean;
};
