// SEO + platform copy rules shared by videos and photo cards.
import type {ContentSpec, Pillar, PlatformId} from '../shared/types.ts';

const URL_RE = /(https?:\/\/\S+|www\.\S+|\b[a-z0-9-]+\.(?:com|net|org|io|co|info|biz|me|tv)(?:\/\S*)?\b)/gi;

/** Facebook and Instagram never carry a link anywhere in the copy. YouTube may. Others follow config. */
export const sanitizeSocialCaption = (platform: PlatformId | string, caption: string): string => {
  if (platform !== 'facebook' && platform !== 'instagram') return caption.trim();
  return caption.replace(URL_RE, '').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').replace(/[ \t]{2,}/g, ' ').trim();
};
export const hasLink = (s: string) => new RegExp(URL_RE.source, 'i').test(s);

export const PLAYLISTS: Record<string, string> = {
  news: 'Maritime News', regulation: 'Maritime Regulations', safety: 'Maritime Safety', deck: 'Deck Officer Knowledge',
  engine: 'Marine Engineering', equipment: 'Maritime Equipment', terminology: 'Maritime Terminology', colreg: 'COLREG Explained',
  'ship-type': 'Ship Operations', career: 'Seafarer Career', technology: 'Maritime Technology', market: 'Maritime Insights',
  environment: 'Green Shipping', history: 'Maritime Facts',
};
const SERIES_PLAYLIST: Record<string, string> = {'One Minute Mariner': 'One Minute Mariner', 'Know Your Equipment': 'Know Your Equipment', 'Maritime Term of the Day': 'Maritime Terminology', 'Who Gives Way?': 'COLREG Explained'};
export const playlistFor = (spec: ContentSpec): string[] => {
  const out = [PLAYLISTS[spec.pillar] ?? 'HeyMariner Originals'];
  if (spec.series && SERIES_PLAYLIST[spec.series] && !out.includes(SERIES_PLAYLIST[spec.series])) out.push(SERIES_PLAYLIST[spec.series]);
  if (/ecdis|catzoc|ukc|radar|cpa|passage/i.test(spec.title) && !out.includes('ECDIS & Navigation')) out.push('ECDIS & Navigation');
  return out;
};
/** YouTube category ids: 27 Education, 25 News & Politics, 28 Science & Technology. */
export const youtubeCategory = (p: Pillar): string => (p === 'news' ? '25' : p === 'technology' ? '28' : '27');

export const SEARCH_INTENT: Record<string, string> = {news: 'News', regulation: 'Regulatory', safety: 'Safety', career: 'Career'};
export const intentOf = (spec: ContentSpec) => SEARCH_INTENT[spec.pillar] ?? (/^how|how does|explained/i.test(spec.title) ? 'Informational' : 'Educational');

const QUESTIONS: Partial<Record<Pillar, string>> = {
  colreg: 'As OOW, at what range would you make your alteration?',
  regulation: 'Is your ship ready for this? Tell us how your company is preparing.',
  safety: 'Have you seen this done wrong on board? Share what you learned.',
  terminology: 'Where do you check this on your bridge?',
  equipment: 'What is the first thing you check on this equipment at handover?',
  engine: 'Engineers: how do you handle this in your engine room?',
  deck: 'Deck officers: how do you handle this on your ship?',
  news: 'How does this affect your next voyage?',
};
export const engagementQuestion = (spec: ContentSpec) => (spec.meta as {question?: string}).question ?? QUESTIONS[spec.pillar] ?? 'What would you add from your own sea time?';

const AUDIENCE_TAGS: Record<string, string> = {
  'Deck Cadet': '#DeckCadet', 'Engine Cadet': '#EngineCadet', OOW: '#OOW', 'Chief Officer': '#ChiefOfficer', Master: '#Captain',
  'Chief Engineer': '#ChiefEngineer', 'Second Engineer': '#MarineEngineer', 'Junior Engineer': '#MarineEngineer', 'Marine Engineer': '#MarineEngineer', Rating: '#Seafarers',
};
const PILLAR_TAGS: Partial<Record<Pillar, string[]>> = {
  colreg: ['#COLREG', '#Navigation', '#RulesOfTheRoad', '#BridgeWatchkeeping'],
  deck: ['#Navigation', '#DeckOfficer', '#NauticalScience'],
  engine: ['#MarineEngineering', '#EngineRoom', '#MarineEngineer'],
  equipment: ['#MaritimeEquipment', '#ShipSystems'],
  regulation: ['#IMO', '#MaritimeRegulations', '#Shipping'],
  environment: ['#GreenShipping', '#IMO', '#Decarbonisation'],
  safety: ['#MaritimeSafety', '#SafetyAtSea', '#ShipSafety'],
  terminology: ['#MaritimeTerms', '#MaritimeEducation'],
  news: ['#ShippingNews', '#MaritimeNews'],
};
/** Topic-specific hashtags, never one fixed block. */
export const hashtagsFor = (spec: ContentSpec, n: number, extra: string[] = []): string[] => {
  const norm = (h: string) => (h.startsWith('#') ? h : '#' + h).replace(/[^#A-Za-z0-9]/g, '');
  const pool = [
    ...spec.meta.hashtags,
    ...(PILLAR_TAGS[spec.pillar] ?? []),
    ...spec.audience.map((a) => AUDIENCE_TAGS[a]).filter(Boolean),
    '#Maritime', '#MerchantNavy', '#Seafarers', '#MaritimeEducation', '#HeyMariner',
    ...extra,
  ].map(norm);
  const seen = new Set<string>();
  return pool.filter((h) => h.length > 2 && !seen.has(h.toLowerCase()) && seen.add(h.toLowerCase())).slice(0, n);
};

/** Primary / secondary / semantic keywords and YouTube tags. */
export const keywordsFor = (spec: ContentSpec) => {
  const primary = spec.meta.keywords[0] ?? spec.title;
  const secondary = spec.meta.keywords.slice(1, 6);
  const semantic = spec.meta.keywords.slice(6);
  const audience = spec.audience.map((a) => a.toLowerCase());
  const variations = [`${primary} explained`, `${primary} for seafarers`, 'merchant navy', 'maritime education'];
  const tags: string[] = [];
  let len = 0;
  for (const t of [primary, ...secondary, ...variations, ...semantic, ...audience, 'HeyMariner']) {
    const k = t.trim();
    if (!k || tags.some((x) => x.toLowerCase() === k.toLowerCase())) continue;
    if (len + k.length + 2 > 480) break; // YouTube limit is 500 characters in total
    tags.push(k);
    len += k.length + 2;
  }
  return {primary, secondary, semantic, audience, tags};
};

export const slugify = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 70);
export const seoFilename = (spec: ContentSpec, kind: 'video' | 'thumbnail') => `heymariner-${slugify(spec.meta.keywords[0] ?? spec.id)}-${slugify(spec.template)}${kind === 'thumbnail' ? '-thumbnail' : ''}`;
