// HeyMariner photo card, following the owner's reference design:
// full-bleed incident photo, slanted yellow category badge (top left), logo on a curved navy panel (top right),
// two-colour uppercase headline, location line, two-line factual summary, teal wave, platform handle row.
// The photo is an authentic public-domain / licensed image downloaded by the workflow into public/cards-media
// (deleted after posting). Without one, the HeyMariner illustration fills the frame; it is never presented as a photo.
import React from 'react';
import {AbsoluteFill, Img, staticFile, useVideoConfig} from 'remotion';
import type {CardSpec, CardType} from '../../shared/types';
import {MotifArt} from '../components/Motifs';
import {C, fit, FONT_BODY, FONT_HEAD, SOCIAL} from '../theme';

export const CARD_BADGE: Record<CardType, string> = {
  breaking: 'BREAKING', incident: 'MARITIME INCIDENT', casualty: 'MARINE CASUALTY', safety: 'SAFETY ALERT', lesson: 'LESSON LEARNED',
  investigation: 'INVESTIGATION', regulation: 'REGULATION UPDATE', imo: 'IMO UPDATE', psc: 'PORT STATE CONTROL', navigation: 'NAVIGATION',
  cargo: 'CARGO SAFETY', machinery: 'MACHINERY', environment: 'ENVIRONMENT', security: 'MARITIME SECURITY', technology: 'TECHNOLOGY',
  seafarer: 'SEAFARER', knowledge: 'MARINER KNOWLEDGE', equipment: 'KNOW YOUR EQUIPMENT', analysis: 'HEYMARINER ANALYSIS',
};
const MOTIF: Partial<Record<CardType, CardSpec['motif']>> = {
  breaking: 'voyage', incident: 'voyage', casualty: 'lighthouse', safety: 'tank', lesson: 'lighthouse', investigation: 'chart', regulation: 'globe', imo: 'globe',
  psc: 'voyage', navigation: 'radar', cargo: 'voyage', machinery: 'engine', environment: 'globe', security: 'radar', technology: 'globe', seafarer: 'voyage',
  knowledge: 'chart', equipment: 'radar', analysis: 'voyage',
};
const YELLOW = '#FFC20E';
const TEAL = '#1FC8D6';
const PLATFORMS: [string, string][] = [['youtube', 'YouTube'], ['facebook', 'Facebook'], ['instagram', 'Instagram'], ['tiktok', 'TikTok'], ['linkedin', 'LinkedIn'], ['x', 'X']];

/** Optional official platform icons dropped in public/brand/social/<id>.png by the owner (never redrawn here). */
export type CardProps = {card: CardSpec; logo: string | null; socialIcons?: string[]; photo?: string | null};

const splitHeadline = (h: string, accent?: string): [string, string] => {
  const up = h.toUpperCase();
  if (accent && up.endsWith(accent.toUpperCase()) && up.length > accent.length) return [up.slice(0, up.length - accent.length).trim(), accent.toUpperCase()];
  const w = up.split(/\s+/);
  const k = Math.max(1, Math.ceil(w.length / 2));
  return [w.slice(0, k).join(' '), w.slice(k).join(' ')];
};

export const PhotoCard: React.FC<CardProps> = ({card, logo, socialIcons = [], photo}) => {
  const {width, height} = useVideoConfig();
  const u = width / 1080;
  const badge = card.badge ?? CARD_BADGE[card.type];
  const [l1, l2] = splitHeadline(card.headline, card.headlineAccent);
  const longest = Math.max(l1.length, l2.length);
  const hs = Math.min(118, Math.floor(980 / Math.max(6, longest) / 0.66)) * u;
  const src = photo ? staticFile(photo) : null;
  const handle = SOCIAL.handles.youtube; // @HeyMariner
  return (
    <AbsoluteFill style={{background: '#06203F', overflow: 'hidden'}}>
      {/* full-bleed image */}
      <div style={{position: 'absolute', left: 0, top: 0, width, height: height * 0.78, overflow: 'hidden'}}>
        {src ? <Img src={src} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 40%'}} /> : <MotifArt motif={card.motif ?? MOTIF[card.type] ?? 'voyage'} t={8.2} seconds={10} accent={TEAL} id={`card${card.id}`} width={width} height={height * 0.78} />}
      </div>
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(4,20,44,0.35) 0%, rgba(4,20,44,0) 18%, rgba(4,20,44,0) 40%, rgba(6,32,63,0.88) 58%, #06203F 72%, #051A33 100%)'}} />
      {src && card.image ? <div style={{position: 'absolute', right: 24 * u, top: height * 0.5, fontFamily: FONT_BODY, fontWeight: 600, fontSize: 16 * u, color: 'rgba(255,255,255,0.75)', textShadow: '0 1px 4px rgba(0,0,0,0.8)'}}>{card.image.representative ? 'Representative image' : `Photo: ${card.image.credit}`}</div> : null}

      {/* category badge, slanted, top left */}
      <div style={{position: 'absolute', left: 36 * u, top: 74 * u, display: 'flex', alignItems: 'center', gap: 10 * u}}>
        <div style={{transform: 'skewX(-18deg)', background: YELLOW, padding: `${12 * u}px ${30 * u}px`, borderRadius: 8 * u, boxShadow: '0 8px 24px rgba(0,0,0,0.35)'}}>
          <div style={{transform: 'skewX(18deg)', fontFamily: FONT_HEAD, fontWeight: 800, fontStyle: 'italic', fontSize: fit(badge, 34, 18, 0.7) * u, color: '#0A2444', letterSpacing: 0.5, whiteSpace: 'nowrap'}}>{badge}</div>
        </div>
        {[0, 1].map((i) => <div key={i} style={{width: 9 * u, height: 54 * u, background: YELLOW, transform: 'skewX(-18deg)', borderRadius: 2 * u}} />)}
      </div>
      {/* dates / update chips under the badge */}
      {card.update || card.dateLabel ? (
        <div style={{position: 'absolute', left: 44 * u, top: 152 * u, display: 'flex', gap: 10 * u}}>
          {card.update ? <div style={{background: '#FFFFFF', color: '#0A2444', fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 22 * u, padding: `${5 * u}px ${14 * u}px`, borderRadius: 6 * u, letterSpacing: 1.5}}>UPDATE</div> : null}
          {card.dateLabel ? <div style={{background: 'rgba(6,32,63,0.82)', color: '#FFFFFF', fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 22 * u, padding: `${5 * u}px ${14 * u}px`, borderRadius: 6 * u, letterSpacing: 1.5}}>{card.dateLabel}</div> : null}
        </div>
      ) : null}
      {/* logo on a curved navy panel, top right */}
      <svg width={460 * u} height={170 * u} style={{position: 'absolute', right: 0, top: 0}} viewBox="0 0 460 170">
        <path d="M0 0 C 40 0, 50 128, 120 136 L 460 136 L 460 0 Z" fill="#082546" opacity="0.94" />
        <path d="M0 0 C 40 0, 50 128, 120 136 L 460 136" fill="none" stroke={TEAL} strokeWidth="5" />
      </svg>
      {logo ? <Img src={staticFile(logo)} style={{position: 'absolute', right: 34 * u, top: 18 * u, height: 98 * u, width: 'auto'}} /> : null}

      {/* headline */}
      <div style={{position: 'absolute', left: 40 * u, right: 40 * u, top: height * 0.535, textAlign: 'center'}}>
        <div style={{fontFamily: FONT_HEAD, fontWeight: 800, fontSize: hs, lineHeight: 1.0, letterSpacing: -1, color: '#FFFFFF', textShadow: '0 6px 24px rgba(0,0,0,0.45)'}}>{l1}</div>
        {l2 ? <div style={{fontFamily: FONT_HEAD, fontWeight: 800, fontSize: hs, lineHeight: 1.05, letterSpacing: -1, color: YELLOW, textShadow: '0 6px 24px rgba(0,0,0,0.45)'}}>{l2}</div> : null}
        {card.location || card.subheadline ? (
          <div style={{marginTop: 24 * u, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24 * u}}>
            <div style={{width: 120 * u, height: 4 * u, background: TEAL, borderRadius: 2}} />
            {card.location ? (
              <svg width={30 * u} height={40 * u} viewBox="0 0 24 32"><path d="M12 0C5.4 0 0 5.2 0 11.6 0 20.3 12 32 12 32s12-11.7 12-20.4C24 5.2 18.6 0 12 0zm0 16.5a5 5 0 1 1 0-10 5 5 0 0 1 0 10z" fill="#FFFFFF" /></svg>
            ) : null}
            <div style={{fontFamily: FONT_HEAD, fontWeight: 600, fontSize: fit(card.location ?? card.subheadline ?? '', 40, 18, 0.62) * u, letterSpacing: card.location ? 9 * u : 2 * u, color: '#FFFFFF', textTransform: card.location ? 'uppercase' : 'none', whiteSpace: 'nowrap'}}>{card.location ?? card.subheadline}</div>
            <div style={{width: 120 * u, height: 4 * u, background: TEAL, borderRadius: 2}} />
          </div>
        ) : null}
        <div style={{marginTop: 26 * u, fontFamily: FONT_BODY, fontWeight: 500, fontSize: fit(card.insight, 34, 120, 0.8) * u, lineHeight: 1.36, color: '#FFFFFF', padding: `0 ${20 * u}px`}}>{card.insight}</div>
      </div>

      {/* teal wave and handle row */}
      <svg width={width} height={80 * u} viewBox="0 0 1080 80" style={{position: 'absolute', left: 0, bottom: 116 * u}} preserveAspectRatio="none">
        <path d="M0 52 C 260 18, 520 18, 760 40 S 1000 54, 1080 20" fill="none" stroke={TEAL} strokeWidth="5" />
        <path d="M0 52 C 260 18, 520 18, 760 40 S 1000 54, 1080 20 L 1080 80 L 0 80 Z" fill="#041A33" opacity="0.9" />
      </svg>
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 120 * u, background: '#041A33', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14 * u, padding: `0 ${24 * u}px`}}>
        {PLATFORMS.map(([id, label], i) => {
          const icon = socialIcons.find((f) => f.split('/').pop()!.startsWith(id + '.'));
          return (
            <React.Fragment key={id}>
              {i ? <div style={{width: 2 * u, height: 36 * u, background: 'rgba(255,255,255,0.35)'}} /> : null}
              <div style={{display: 'flex', alignItems: 'center', gap: 8 * u}}>
                {icon ? <Img src={staticFile(icon)} style={{height: 34 * u, width: 34 * u, objectFit: 'contain'}} /> : <div style={{fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 17 * u, color: TEAL, letterSpacing: 0.5}}>{label}</div>}
                <div style={{fontFamily: FONT_BODY, fontWeight: 600, fontSize: (icon ? 19 : 16) * u, color: '#FFFFFF'}}>{handle}</div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
