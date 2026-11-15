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
  | 'timeline' | 'colreg3d' | 'contour3d' | 'zoc3d' | 'radar' | 'ukc' | 'toon' | 'diagram' | 'takeaway' | 'endcard';

export type Visual =
  | {type: 'colreg'; scenario: 'crossing' | 'head-on' | 'overtaking'}
  | {type: 'safety-contour'; draft: number; enteredValue: number; contours: number[]}
  | {type: 'zoc'; highlight: 'A1' | 'A2' | 'B' | 'C' | 'D' | 'U'}
  | {type: 'radar'; cpaNm: number; tcpaMin: number; limitNm: number}
  | {type: 'ukc'; depth: number; draft: number; squat: number};

export type Motif = 'voyage' | 'radar' | 'chart' | 'engine' | 'tank' | 'globe' | 'lighthouse' | 'mooring' | 'generator' | 'pump' | 'fire' | 'lifeboat' | 'anchor' | 'cargo' | 'weather' | 'clock' | 'bridge' | 'inspection';
export const MOTIFS: Motif[] = ['voyage', 'radar', 'chart', 'engine', 'tank', 'globe', 'lighthouse', 'mooring', 'generator', 'pump', 'fire', 'lifeboat', 'anchor', 'cargo', 'weather', 'clock', 'bridge', 'inspection'];

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
  /** kind "toon": flat inked seafarers acting in a toon 3D maritime set (switched off by the owner on 15 Nov 2026). */
  toon?: ToonSpec;
  /** kind "diagram": a detailed ship-related 2D explainer that builds up word by word. */
  diagram?: DiagramSpec;
  /** lesson step this scene carries (docs/CONTENT-ARCHITECT-SPEC.md): hook > context > explain > example > mistake > takeaway */
  beat?: 'hook' | 'context' | 'explain' | 'example' | 'mistake' | 'takeaway' | 'endcard';
};

/** Concept metadata (docs/CONTENT-ARCHITECT-SPEC.md sections 16-18). */
export type ConceptMeta = {
  domain: string;
  category: string;
  subcategory?: string;
  concept: string;
  microConcept?: string;
  contentType: string;
  audience: string;
  department: 'deck' | 'engine' | 'both';
  knowledgeLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  shipType?: string;
  regulation?: string;
  equipment?: string;
  calculation?: string;
  operationalStage?: string;
  safetyCriticality: 'high' | 'medium' | 'low';
  series?: string;
  episode?: number;
  keyTakeaway: string;
  commonMistake: string;
  relatedTopics: string[];
};

export type DiagramEl = {
  type: string;
  /** position on the 1000 x 800 canvas */
  x: number;
  y: number;
  /** appears on this spoken word (first match after the previous element's word) */
  on?: string;
  /** fades out on this later word */
  off?: string;
  s?: number;
  r?: number;
  flip?: boolean;
  anim?: 'fade' | 'pop' | 'slide' | 'none';
  pulse?: boolean;
  color?: string;
  text?: string;
  view?: 'side' | 'top';
  variant?: string;
  len?: number;
  w?: number;
  h?: number;
  to?: [number, number];
  points?: [number, number][];
  level?: number;
  value?: number;
  danger?: number;
  chain?: number;
  flow?: boolean;
  size?: number;
  r2?: number;
  from?: number;
  to2?: number;
  unit?: string;
  decimals?: number;
  mover?: 'ship' | 'dot';
  move?: {to: [number, number]; on: string; dur?: number};
  /** nightvessel: observer's relative bearing from the vessel's head (0 ahead, 90 her starboard beam, 180 astern) */
  bearing?: number;
  masthead?: 0 | 1 | 2;
  sidelights?: boolean;
  stern?: boolean;
  towing?: boolean;
  /** all-round lights top to bottom: white | red | green | yellow | blue */
  allround?: string[];
  anchor?: 0 | 1 | 2;
  /** nightvessel COLREG status preset (vessel >= 50 m): power | sailing | nuc | ram | cbd | anchored | aground | trawling | fishing | pilot | towing | towing-long */
  status?: string;
  makingWay?: boolean;
  mastheadVertical?: number;
  /** dayshape: ball | cone-up | cone-down | cylinder | diamond, top to bottom */
  shapes?: string[];
};
export type DiagramSpec = {bg?: 'sea' | 'night' | 'deck' | 'engine' | 'chart' | 'blueprint'; elements: DiagramEl[]};

export type ToonSet = 'deck' | 'bridge' | 'engineroom' | 'quay' | 'lifeboat' | 'office';
export type ToonRole = 'master' | 'officer' | 'cadet' | 'engineer' | 'rating' | 'pilot' | 'inspector';
export type ToonFace = 'neutral' | 'happy' | 'grin' | 'laugh' | 'surprised' | 'shocked' | 'worried' | 'sad' | 'angry' | 'smug' | 'confused' | 'thinking' | 'sleepy' | 'determined';
export type ToonArms = 'idle' | 'wave' | 'point' | 'armsUp' | 'shrug' | 'hips' | 'hold' | 'think' | 'cross' | 'reach' | 'clap' | 'facepalm';
export type ToonFx = 'smoke' | 'steam' | 'splash' | 'sparkle' | 'ring' | 'dust' | 'exclaim' | 'question' | 'stars' | 'sweat' | 'burst';
export type ToonSpec = {
  set: ToonSet;
  time?: 'day' | 'golden' | 'night';
  /** 1-3 characters, first one is the main subject. */
  cast?: {role: ToonRole; face?: ToonFace; arms?: ToonArms}[];
  /** Acting beats: each lands on the first spoken word of "on" (searched after the previous beat). */
  beats?: {on: string; who?: number; face?: ToonFace; arms?: ToonArms; fx?: ToonFx; hop?: boolean; walk?: [number, number]}[];
  shot?: 'wide' | 'medium' | 'close' | 'aerial';
  move?: 'push' | 'pull' | 'locked';
};

export type Source = {title: string; url: string; publisher?: string; date?: string};

export type ContentSpec = {
  id: string;
  template: TemplateId;
  pillar: Pillar;
  series?: string;
  /** L1 beginner (cadet) .. L5 expert (Master / Chief Engineer). */
  level?: 'L1' | 'L2' | 'L3' | 'L4' | 'L5';
  /** concept metadata, required for new videos */
  concept?: ConceptMeta;
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
  /** Exact UTC publish time (ISO). The hourly HH:22 run posts the card once this time has passed. */
  publishAtUtc?: string;
  /** Publish immediately outside the slots (only with priorityScore >= breakingMinScore). */
  breaking?: boolean;
};
