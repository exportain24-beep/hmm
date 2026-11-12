// Platform-specific titles, captions and hashtags. Never the same text everywhere.
import type {ContentSpec, Metadata, PlatformId, PlatformMeta, Timeline} from '../shared/types.ts';
import {TEMPLATES} from '../shared/templates.ts';
import {config} from './lib.ts';
import {narrationText} from './spec.ts';

type Social = {website: string; baseHashtags: string[]; handles: Record<string, string>};
type Brand = {ctas: string[]; name: string};

const uniq = (a: string[]) => [...new Set(a.map((h) => (h.startsWith('#') ? h : '#' + h).replace(/\s+/g, '')))];
const clip = (s: string, n: number) => (s.length <= n ? s : s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…');

export const buildMetadata = (spec: ContentSpec, timeline: Timeline, voiceId: string | null, publishSchedule: string | null): Metadata => {
  const social = config<Social>('social');
  const brand = config<Brand>('brand');
  const tpl = TEMPLATES[spec.template];
  const tags = uniq([...spec.meta.hashtags, ...social.baseHashtags]);
  const cta = brand.ctas[spec.id.length % brand.ctas.length];
  const hook = spec.scenes[0].heading ?? spec.title;
  const srcLine = spec.sources.map((s) => `${s.publisher ?? s.title}: ${s.url}`).join('\n');
  const series = tpl.series ? `${tpl.series} | ` : '';
  const isShort = spec.aspect === '9:16' && timeline.totalSeconds <= 180;

  const platforms: Record<PlatformId, PlatformMeta> = {
    youtube: {
      title: clip(`${spec.title}${isShort ? ' #Shorts' : ''}`, 100),
      caption: `${spec.meta.description}\n\n${series}For: ${spec.audience.join(', ')}\n\n${cta}\n${social.website}\n\nSources:\n${srcLine}\n\n${tags.slice(0, 8).join(' ')}`,
      hashtags: tags.slice(0, 8), keywords: spec.meta.keywords.slice(0, 15),
    },
    tiktok: {title: clip(spec.title, 90), caption: clip(`${hook} ${tags.slice(0, 5).join(' ')}`, 300), hashtags: tags.slice(0, 5), keywords: spec.meta.keywords.slice(0, 5)},
    instagram: {title: clip(spec.title, 90), caption: `${hook}\n\n${clip(spec.meta.description, 300)}\n\n${cta}\n.\n${tags.slice(0, 10).join(' ')}`, hashtags: tags.slice(0, 10), keywords: spec.meta.keywords.slice(0, 8)},
    facebook: {title: clip(spec.title, 90), caption: `${spec.title}\n\n${spec.meta.description}\n\n${cta}\n\n${tags.slice(0, 4).join(' ')}`, hashtags: tags.slice(0, 4), keywords: spec.meta.keywords.slice(0, 8)},
    linkedin: {
      title: clip(spec.title, 90),
      caption: `${spec.title}\n\n${spec.meta.description}\n\nRelevant for: ${spec.audience.join(', ')}.\n\nSource: ${spec.sources[0]?.publisher ?? spec.sources[0]?.title ?? ''}\nMore maritime knowledge: ${social.website}\n\n${tags.slice(0, 4).join(' ')}`,
      hashtags: tags.slice(0, 4), keywords: spec.meta.keywords.slice(0, 8),
    },
    x: {title: clip(spec.title, 90), caption: clip(`${clip(spec.title, 200)} ${tags.slice(0, 2).join(' ')}`, 270), hashtags: tags.slice(0, 2), keywords: spec.meta.keywords.slice(0, 4)},
  };
  return {
    id: spec.id, title: spec.title, description: spec.meta.description, category: spec.pillar, template: spec.template,
    targetAudience: spec.audience, source: spec.sources, sourceDate: spec.origin.sourceDate ?? spec.sources[0]?.date ?? null,
    script: narrationText(spec), voiceId, duration: timeline.totalSeconds, publishSchedule, platforms,
  };
};

/** Copy-paste kit for a manual upload: one block per platform. */
export const uploadKit = (m: Metadata): string => {
  const P: [string, keyof Metadata['platforms']][] = [['YouTube Shorts', 'youtube'], ['Facebook Reel', 'facebook'], ['Instagram Reel', 'instagram'], ['TikTok', 'tiktok'], ['LinkedIn', 'linkedin'], ['X', 'x']];
  return [`# Upload kit: ${m.title}`, '', `Duration ${m.duration.toFixed(1)} s. Thumbnail: thumb.png (vertical), thumb_16x9.jpg (wide).`, '',
    ...P.flatMap(([name, k]) => {
      const x = m.platforms[k];
      return [`## ${name}`, '', '**Title**', '', '```', x.title, '```', '', '**Description / caption**', '', '```', x.caption, '```', '', ...(k === 'youtube' ? ['**Tags**', '', '```', x.keywords.join(', '), '```', ''] : [])];
    })].join('\n');
};
