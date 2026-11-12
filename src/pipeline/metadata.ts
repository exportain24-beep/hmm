// Platform-specific titles, captions and hashtags. Never the same text everywhere.
import type {ContentSpec, Metadata, PlatformId, PlatformMeta, Timeline} from '../shared/types.ts';
import {TEMPLATES} from '../shared/templates.ts';
import {config} from './lib.ts';
import {engagementQuestion, hasLink, hashtagsFor, intentOf, keywordsFor, playlistFor, sanitizeSocialCaption, youtubeCategory} from './seo.ts';
import {narrationText} from './spec.ts';

type Social = {website: string; handles: Record<string, string>};
type Brand = {ctas: string[]; name: string};

const clip = (s: string, n: number) => (s.length <= n ? s : s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…');
const firstLine = (spec: ContentSpec) => {
  const h = spec.scenes[0].heading ?? spec.title;
  return /\?$/.test(h) ? h : spec.title.includes('?') ? spec.title.split('?')[0] + '?' : h;
};
const keyPoints = (spec: ContentSpec) =>
  spec.scenes.filter((s) => !['hook', 'endcard'].includes(s.kind)).flatMap((s) => (s.items?.length ? s.items.map((i) => i.title) : [s.heading ?? ''])).filter(Boolean).slice(0, 6);

export type FullMetadata = Metadata & {seo: {primary: string; secondary: string[]; semantic: string[]; intent: string; tags: string[]; playlists: string[]; categoryId: string; titleCandidates: string[]}};

export const buildMetadata = (spec: ContentSpec, timeline: Timeline, voiceId: string | null, publishSchedule: string | null): FullMetadata => {
  const social = config<Social>('social');
  const brand = config<Brand>('brand');
  const tpl = TEMPLATES[spec.template];
  const kw = keywordsFor(spec);
  const cta = brand.ctas[spec.id.length % brand.ctas.length];
  const q = engagementQuestion(spec);
  const hook = firstLine(spec);
  const isShort = spec.aspect === '9:16' && timeline.totalSeconds <= 180;
  const points = keyPoints(spec);
  const src = spec.sources.map((s) => `${s.publisher ?? s.title}: ${s.url}`).join('\n');

  const titleCandidates = [spec.title, `${kw.primary} explained: ${spec.thumbnailText.toLowerCase()}`, `${spec.title.split(':')[0]} | ${tpl.series ?? tpl.badge.toLowerCase()}`].map((t) => clip(t, 90));
  // strongest = the one that starts with the primary topic words and stays under 70 characters
  const best = [...titleCandidates].sort((a, b) => Number(b.toLowerCase().includes(kw.primary.toLowerCase().split(' ')[0])) - Number(a.toLowerCase().includes(kw.primary.toLowerCase().split(' ')[0])) || Math.abs(a.length - 60) - Math.abs(b.length - 60))[0];

  const ytTags = hashtagsFor(spec, 5);
  const youtubeDesc = [
    spec.meta.description, '',
    'In this video:', ...points.map((p) => `• ${p}`), '',
    `Who should watch: ${spec.audience.join(', ')}.`, '',
    ...(src ? ['Sources:', src, ''] : []),
    `${cta}`, `More maritime knowledge: ${social.website}`, '',
    ytTags.join(' '),
  ].join('\n');

  const fb = sanitizeSocialCaption('facebook', [hook, '', spec.meta.description, '', q, '', hashtagsFor(spec, 4).join(' ')].join('\n'));
  const ig = sanitizeSocialCaption('instagram', [hook, '', clip(spec.meta.description, 320), '', `${cta} Follow ${social.handles.instagram}.`, '', q, '.', hashtagsFor(spec, 10).join(' ')].join('\n'));
  const tt = clip(`${hook} ${spec.thumbnailText.toLowerCase()} ${hashtagsFor(spec, 12, ['#FYP', '#ForYou', '#LearnOnTikTok']).join(' ')}`, 2000);
  const li = [spec.title, '', spec.meta.description, '', `Relevant for: ${spec.audience.join(', ')}.`, '', `Source: ${spec.sources.map((s) => s.publisher ?? s.title).join('; ')}`, `More practical maritime knowledge: ${social.website}`, '', hashtagsFor(spec, 4).join(' ')].join('\n');
  const x = clip(`${clip(hook, 180)} ${hashtagsFor(spec, 2).join(' ')}`, 270);

  if (hasLink(fb) || hasLink(ig)) throw new Error('link found in a Facebook/Instagram caption after sanitising');

  const platforms: Record<PlatformId, PlatformMeta> = {
    youtube: {title: clip(`${best}${isShort ? ' #Shorts' : ''}`, 100), caption: youtubeDesc, hashtags: ytTags, keywords: kw.tags},
    facebook: {title: clip(best, 90), caption: fb, hashtags: hashtagsFor(spec, 4), keywords: spec.meta.keywords.slice(0, 8)},
    instagram: {title: clip(best, 90), caption: ig, hashtags: hashtagsFor(spec, 10), keywords: spec.meta.keywords.slice(0, 8)},
    tiktok: {title: clip(spec.thumbnailText, 90), caption: tt, hashtags: hashtagsFor(spec, 12, ['#FYP', '#ForYou']), keywords: spec.meta.keywords.slice(0, 5)},
    linkedin: {title: clip(best, 90), caption: li, hashtags: hashtagsFor(spec, 4), keywords: spec.meta.keywords.slice(0, 8)},
    x: {title: clip(best, 90), caption: x, hashtags: hashtagsFor(spec, 2), keywords: spec.meta.keywords.slice(0, 4)},
  };
  return {
    id: spec.id, title: best, description: spec.meta.description, category: spec.pillar, template: spec.template,
    targetAudience: spec.audience, source: spec.sources, sourceDate: spec.origin.sourceDate ?? spec.sources[0]?.date ?? null,
    script: narrationText(spec), voiceId, duration: timeline.totalSeconds, publishSchedule, platforms,
    seo: {primary: kw.primary, secondary: kw.secondary, semantic: kw.semantic, intent: intentOf(spec), tags: kw.tags, playlists: playlistFor(spec), categoryId: youtubeCategory(spec.pillar), titleCandidates},
  };
};

/** Copy-paste kit for a manual upload: one block per platform. */
export const uploadKit = (m: Metadata | FullMetadata): string => {
  const P: [string, PlatformId][] = [['YouTube Shorts', 'youtube'], ['Facebook Reel', 'facebook'], ['Instagram Reel', 'instagram'], ['TikTok', 'tiktok'], ['LinkedIn', 'linkedin'], ['X', 'x']];
  const seo = (m as FullMetadata).seo;
  return [`# Upload kit: ${m.title}`, '', `Duration ${m.duration.toFixed(1)} s.`,
    ...(seo ? [`YouTube playlist: ${seo.playlists.join(' + ')} · category id ${seo.categoryId} (27 = Education) · audience: not made for kids · intent: ${seo.intent}`] : []), '',
    ...P.flatMap(([name, k]) => {
      const x = m.platforms[k];
      return [`## ${name}`, '', '**Title**', '', '```', x.title, '```', '', '**Description / caption**', '', '```', x.caption, '```', '', ...(k === 'youtube' ? ['**Tags**', '', '```', x.keywords.join(', '), '```', ''] : [])];
    })].join('\n');
};
