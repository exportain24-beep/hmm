import type {Pillar, SceneKind, TemplateId} from './types';

export type TemplateDef = {
  id: TemplateId;
  /** Badge shown in the header of every scene. */
  badge: string;
  series?: string;
  accent: 'teal' | 'amber' | 'red' | 'green';
  mood: 'calm' | 'hopeful' | 'upbeat' | 'warm' | 'curious' | 'tense' | 'epic';
  voiceProfile: 'narrator' | 'news';
  pillars: Pillar[];
  /** Recommended scene flow. The writer may deviate, the validator only enforces hook-first / endcard-last. */
  flow: SceneKind[];
  /** Target narrated length in seconds [min, max]. */
  seconds: [number, number];
};

const T = (d: TemplateDef) => d;

export const TEMPLATES: Record<TemplateId, TemplateDef> = {
  'breaking-news': T({id: 'breaking-news', badge: 'BREAKING', accent: 'red', mood: 'tense', voiceProfile: 'news', pillars: ['news'], flow: ['hook', 'statement', 'bullets', 'takeaway', 'endcard'], seconds: [20, 40]}),
  'maritime-news': T({id: 'maritime-news', badge: 'MARITIME NEWS', accent: 'teal', mood: 'curious', voiceProfile: 'news', pillars: ['news'], flow: ['hook', 'statement', 'bullets', 'takeaway', 'endcard'], seconds: [25, 50]}),
  'regulation-update': T({id: 'regulation-update', badge: 'REGULATION UPDATE', accent: 'amber', mood: 'curious', voiceProfile: 'narrator', pillars: ['regulation', 'environment'], flow: ['hook', 'qa', 'qa', 'timeline', 'qa', 'checklist', 'endcard'], seconds: [40, 75]}),
  'safety-alert': T({id: 'safety-alert', badge: 'SAFETY', accent: 'red', mood: 'tense', voiceProfile: 'narrator', pillars: ['safety'], flow: ['hook', 'statement', 'stat', 'checklist', 'takeaway', 'endcard'], seconds: [35, 60]}),
  'educational-explainer': T({id: 'educational-explainer', badge: 'MARITIME INSIGHT', accent: 'teal', mood: 'hopeful', voiceProfile: 'narrator', pillars: ['deck', 'engine'], flow: ['hook', 'statement', 'bullets', 'takeaway', 'endcard'], seconds: [35, 90]}),
  'equipment-explained': T({id: 'equipment-explained', badge: 'KNOW YOUR EQUIPMENT', series: 'Know Your Equipment', accent: 'teal', mood: 'curious', voiceProfile: 'narrator', pillars: ['equipment'], flow: ['hook', 'statement', 'contour3d', 'bullets', 'takeaway', 'endcard'], seconds: [40, 75]}),
  'maritime-term': T({id: 'maritime-term', badge: 'MARITIME TERM OF THE DAY', series: 'Maritime Term of the Day', accent: 'teal', mood: 'curious', voiceProfile: 'narrator', pillars: ['terminology'], flow: ['hook', 'term', 'compare', 'statement', 'takeaway', 'endcard'], seconds: [30, 50]}),
  'navigation-scenario': T({id: 'navigation-scenario', badge: 'NAVIGATION', accent: 'teal', mood: 'curious', voiceProfile: 'narrator', pillars: ['deck'], flow: ['hook', 'radar', 'bullets', 'takeaway', 'endcard'], seconds: [35, 60]}),
  'colreg-scenario': T({id: 'colreg-scenario', badge: 'COLREG', series: 'Who Gives Way?', accent: 'teal', mood: 'curious', voiceProfile: 'narrator', pillars: ['colreg'], flow: ['hook', 'colreg3d', 'bullets', 'takeaway', 'endcard'], seconds: [35, 60]}),
  'ship-type': T({id: 'ship-type', badge: 'KNOW YOUR SHIP', series: 'Know Your Ship', accent: 'teal', mood: 'hopeful', voiceProfile: 'narrator', pillars: ['ship-type'], flow: ['hook', 'statement', 'bullets', 'bullets', 'takeaway', 'endcard'], seconds: [40, 75]}),
  'one-minute-mariner': T({id: 'one-minute-mariner', badge: 'ONE MINUTE MARINER', series: 'One Minute Mariner', accent: 'teal', mood: 'upbeat', voiceProfile: 'narrator', pillars: ['deck', 'engine', 'safety', 'terminology'], flow: ['hook', 'statement', 'bullets', 'takeaway', 'endcard'], seconds: [45, 60]}),
  'maritime-fact': T({id: 'maritime-fact', badge: 'MARITIME FACT', accent: 'teal', mood: 'warm', voiceProfile: 'narrator', pillars: ['history', 'ship-type'], flow: ['hook', 'stat', 'statement', 'endcard'], seconds: [15, 30]}),
  'market-insight': T({id: 'market-insight', badge: 'MARKET INSIGHT', accent: 'teal', mood: 'calm', voiceProfile: 'news', pillars: ['market'], flow: ['hook', 'stat', 'bullets', 'takeaway', 'endcard'], seconds: [30, 60]}),
  'technology-update': T({id: 'technology-update', badge: 'MARITIME TECH', accent: 'teal', mood: 'upbeat', voiceProfile: 'news', pillars: ['technology'], flow: ['hook', 'statement', 'bullets', 'takeaway', 'endcard'], seconds: [30, 60]}),
  'environmental-update': T({id: 'environmental-update', badge: 'ENVIRONMENT', accent: 'green', mood: 'hopeful', voiceProfile: 'narrator', pillars: ['environment'], flow: ['hook', 'qa', 'timeline', 'checklist', 'endcard'], seconds: [35, 70]}),
  'career-advice': T({id: 'career-advice', badge: 'CADET TO CAPTAIN', series: 'Cadet to Captain', accent: 'teal', mood: 'warm', voiceProfile: 'narrator', pillars: ['career'], flow: ['hook', 'statement', 'bullets', 'takeaway', 'endcard'], seconds: [35, 75]}),
  'seafarer-tip': T({id: 'seafarer-tip', badge: 'SEAFARER TIP', accent: 'teal', mood: 'warm', voiceProfile: 'narrator', pillars: ['career', 'safety', 'deck', 'engine'], flow: ['hook', 'checklist', 'takeaway', 'endcard'], seconds: [20, 45]}),
  'maritime-history': T({id: 'maritime-history', badge: 'MARITIME HISTORY', accent: 'amber', mood: 'epic', voiceProfile: 'narrator', pillars: ['history'], flow: ['hook', 'timeline', 'statement', 'takeaway', 'endcard'], seconds: [40, 90]}),
  'accident-lesson': T({id: 'accident-lesson', badge: 'LESSONS LEARNED', accent: 'amber', mood: 'tense', voiceProfile: 'narrator', pillars: ['safety'], flow: ['hook', 'statement', 'bullets', 'checklist', 'takeaway', 'endcard'], seconds: [45, 90]}),
  'heymariner-insight': T({id: 'heymariner-insight', badge: 'MARITIME INSIGHT', accent: 'teal', mood: 'hopeful', voiceProfile: 'narrator', pillars: ['deck', 'engine', 'market', 'technology'], flow: ['hook', 'statement', 'bullets', 'takeaway', 'endcard'], seconds: [35, 75]}),
};

export const SCENE_KINDS: SceneKind[] = ['hook', 'term', 'statement', 'bullets', 'qa', 'checklist', 'compare', 'stat', 'timeline', 'colreg3d', 'contour3d', 'zoc3d', 'radar', 'ukc', 'takeaway', 'endcard'];
export const THREE_D_KINDS: SceneKind[] = ['colreg3d', 'contour3d', 'zoc3d'];

/** Text budgets (characters). Components auto-shrink a little, the validator rejects anything beyond this. */
export const BUDGET = {heading: 64, hookHeading: 72, label: 30, body: 230, itemTitle: 44, itemText: 90, itemValue: 16, items: 5, thumbnailText: 30, title: 90};
