// HeyMariner photo card (4:5). Newsroom layout from the intelligence-engine spec:
// top = logo + date/UPDATE marker, main = strong maritime image, lower = 1-2 line headline + one factual line,
// bottom = category marker + brand bar. A real photo is used when the desk supplies one (with credit);
// otherwise the HeyMariner illustration is used, never presented as a photograph.
import React from 'react';
import {AbsoluteFill, Img, staticFile, useVideoConfig} from 'remotion';
import type {CardSpec, CardType} from '../../shared/types';
import {MotifArt} from '../components/Motifs';
import {BRAND, C, fit, FONT_BODY, FONT_HEAD, SOCIAL} from '../theme';

export const CARD_BADGE: Record<CardType, string> = {
  breaking: 'BREAKING', incident: 'MARITIME INCIDENT', casualty: 'MARINE CASUALTY', safety: 'SAFETY ALERT', lesson: 'LESSON LEARNED',
  investigation: 'INVESTIGATION', regulation: 'REGULATION', imo: 'IMO UPDATE', psc: 'PORT STATE CONTROL', navigation: 'NAVIGATION',
  cargo: 'CARGO SAFETY', machinery: 'MACHINERY', environment: 'ENVIRONMENT', security: 'MARITIME SECURITY', technology: 'TECHNOLOGY',
  seafarer: 'SEAFARER', knowledge: 'MARINER KNOWLEDGE', equipment: 'KNOW YOUR EQUIPMENT', analysis: 'HEYMARINER ANALYSIS',
};
const RED: CardType[] = ['breaking', 'incident', 'casualty', 'safety', 'security'];
const AMBER: CardType[] = ['regulation', 'imo', 'psc', 'investigation', 'lesson', 'cargo', 'machinery'];
const accentOf = (t: CardType) => (RED.includes(t) ? C.red : AMBER.includes(t) ? C.amber : t === 'environment' ? C.green : C.tealBright);
const MOTIF: Partial<Record<CardType, CardSpec['motif']>> = {
  breaking: 'voyage', incident: 'lighthouse', casualty: 'lighthouse', safety: 'tank', lesson: 'lighthouse', investigation: 'chart', regulation: 'globe', imo: 'globe',
  psc: 'voyage', navigation: 'radar', cargo: 'voyage', machinery: 'engine', environment: 'globe', security: 'radar', technology: 'globe', seafarer: 'voyage',
  knowledge: 'chart', equipment: 'radar', analysis: 'voyage',
};

export type CardProps = {card: CardSpec; logo: string | null};

export const PhotoCard: React.FC<CardProps> = ({card, logo}) => {
  const {width, height} = useVideoConfig();
  const u = width / 1080;
  const accent = accentOf(card.type);
  const onAccent = accent === C.red ? C.white : C.deep;
  const badge = card.badge ?? CARD_BADGE[card.type];
  const img = card.image;
  const src = img ? (/^https?:\/\//.test(img.url) ? img.url : staticFile(img.url)) : null;
  const imageH = 760 * u;
  const hs = fit(card.headline, 86, 34, 0.62) * u;
  return (
    <AbsoluteFill style={{background: C.deep}}>
      {/* main image area */}
      <div style={{position: 'absolute', left: 0, top: 0, width, height: imageH + 120 * u, overflow: 'hidden'}}>
        {src ? <Img src={src} style={{width: '100%', height: '100%', objectFit: 'cover'}} /> : <MotifArt motif={card.motif ?? MOTIF[card.type] ?? 'voyage'} t={7.3} seconds={10} accent={accent} id={`card${card.id}`} width={width} height={imageH + 120 * u} dim={0.05} />}
        <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(4,14,30,0.80) 0%, rgba(4,14,30,0.10) 22%, rgba(4,14,30,0.05) 60%, rgba(6,18,35,1) 100%)'}} />
      </div>
      {/* top: logo + date / UPDATE marker */}
      <div style={{position: 'absolute', left: 56 * u, right: 56 * u, top: 46 * u, display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
        {logo ? <Img src={staticFile(logo)} style={{height: 88 * u, width: 'auto', filter: 'drop-shadow(0 2px 10px rgba(2,8,20,0.85))'}} /> : <div style={{fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 50 * u, color: C.white}}>HEYMARINER</div>}
        <div style={{display: 'flex', gap: 12 * u}}>
          {card.update ? <div style={{background: C.white, color: C.deep, fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 26 * u, letterSpacing: 2, padding: `${10 * u}px ${18 * u}px`, borderRadius: 10 * u}}>UPDATE</div> : null}
          {card.dateLabel ? <div style={{background: 'rgba(4,14,30,0.78)', border: `2px solid ${C.white}55`, color: C.white, fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 26 * u, letterSpacing: 1.5, padding: `${8 * u}px ${18 * u}px`, borderRadius: 10 * u}}>{card.dateLabel}</div> : null}
        </div>
      </div>
      {img ? (
        <div style={{position: 'absolute', right: 56 * u, top: imageH - 10 * u, fontFamily: FONT_BODY, fontWeight: 600, fontSize: 18 * u, color: `${C.white}CC`, background: 'rgba(4,14,30,0.6)', padding: `${4 * u}px ${10 * u}px`, borderRadius: 6 * u}}>
          {img.representative ? 'Representative image' : `Photo: ${img.credit}`}
        </div>
      ) : null}
      {/* headline + supporting line */}
      <div style={{position: 'absolute', left: 56 * u, right: 56 * u, top: imageH + 30 * u}}>
        <div style={{fontFamily: FONT_HEAD, fontWeight: 800, fontSize: hs, lineHeight: 1.06, letterSpacing: -1.5, color: C.white}}>{card.headline}</div>
        {card.subheadline ? <div style={{marginTop: 14 * u, fontFamily: FONT_HEAD, fontWeight: 700, fontSize: fit(card.subheadline, 40, 34, 0.75) * u, color: accent === C.red ? '#FCA5A5' : accent}}>{card.subheadline}</div> : null}
        <div style={{marginTop: 18 * u, fontFamily: FONT_BODY, fontWeight: 500, fontSize: fit(card.insight, 32, 150, 0.82) * u, lineHeight: 1.38, color: '#D7E1EE'}}>{card.insight}</div>
      </div>
      {/* bottom: category marker + brand */}
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 104 * u, background: '#020914', display: 'flex', alignItems: 'stretch'}}>
        <div style={{background: accent, color: onAccent, display: 'flex', alignItems: 'center', padding: `0 ${34 * u}px`, fontFamily: FONT_HEAD, fontWeight: 800, fontSize: fit(badge, 32, 18, 0.72) * u, letterSpacing: 2.5, maxWidth: 560 * u}}>{badge}</div>
        <div style={{flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: `0 ${44 * u}px`, gap: 20 * u}}>
          <div style={{textAlign: 'right', fontFamily: FONT_BODY, fontWeight: 600, fontSize: 20 * u, lineHeight: 1.35, color: C.mist}}>
            <div style={{fontFamily: FONT_HEAD, fontWeight: 800, color: C.white, fontSize: 24 * u, letterSpacing: 1.5}}>HEYMARINER <span style={{color: accent}}>|</span> MARITIME INSIGHT</div>
            <div>{BRAND.website} · {SOCIAL.handles.instagram} on YouTube, Facebook, Instagram, TikTok, LinkedIn, X</div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
