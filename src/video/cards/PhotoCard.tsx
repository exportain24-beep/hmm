// Branded 4:5 photo card: animated maritime illustration frozen at a strong moment + newsroom typography.
import React from 'react';
import {AbsoluteFill, Img, staticFile, useVideoConfig} from 'remotion';
import type {CardSpec, CardType} from '../../shared/types';
import {MotifArt} from '../components/Motifs';
import {BRAND, C, fit, FONT_BODY, FONT_HEAD, SOCIAL} from '../theme';

export const CARD_BADGE: Record<CardType, string> = {
  breaking: 'BREAKING MARITIME NEWS', incident: 'INCIDENT INSIGHT', regulation: 'REGULATION UPDATE', safety: 'SAFETY INSIGHT',
  knowledge: 'MARINER KNOWLEDGE', equipment: 'KNOW YOUR EQUIPMENT', analysis: 'HEYMARINER ANALYSIS',
};
const ACCENT: Record<CardType, string> = {breaking: C.red, incident: C.amber, regulation: C.amber, safety: C.red, knowledge: C.tealBright, equipment: C.tealBright, analysis: C.tealBright};
const MOTIF: Record<CardType, CardSpec['motif']> = {breaking: 'globe', incident: 'lighthouse', regulation: 'globe', safety: 'tank', knowledge: 'chart', equipment: 'radar', analysis: 'voyage'};

export type CardProps = {card: CardSpec; logo: string | null};

export const PhotoCard: React.FC<CardProps> = ({card, logo}) => {
  const {width, height} = useVideoConfig();
  const u = width / 1080;
  const accent = ACCENT[card.type];
  const dark = accent !== C.red;
  const badge = card.badge ?? CARD_BADGE[card.type];
  const words = card.headline.split(/\s+/);
  const hs = fit(card.headline, 104, 26, 0.6) * u;
  return (
    <AbsoluteFill style={{background: C.deep}}>
      <MotifArt motif={card.motif ?? MOTIF[card.type] ?? 'voyage'} t={7.3} seconds={10} accent={accent} id={`card${card.id}`} width={width} height={height} dim={0.12} />
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(4,14,30,0.92) 0%, rgba(4,14,30,0.55) 22%, rgba(4,14,30,0.25) 42%, rgba(4,14,30,0.82) 64%, rgba(4,14,30,0.97) 100%)'}} />
      {/* top bar */}
      <div style={{position: 'absolute', left: 60 * u, right: 60 * u, top: 52 * u, display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
        {logo ? <Img src={staticFile(logo)} style={{height: 92 * u, width: 'auto', filter: 'drop-shadow(0 2px 8px rgba(2,8,20,0.8))'}} /> : <div style={{fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 52 * u, color: C.white}}>HEYMARINER</div>}
        <div style={{background: accent, color: dark ? C.deep : C.white, fontFamily: FONT_HEAD, fontWeight: 800, fontSize: fit(badge, 30, 22, 0.7) * u, letterSpacing: 2, padding: `${12 * u}px ${22 * u}px`, borderRadius: 12 * u, maxWidth: 560 * u, textAlign: 'center'}}>{badge}</div>
      </div>
      {/* headline block, lower half so the illustration reads first */}
      <div style={{position: 'absolute', left: 60 * u, right: 60 * u, top: 690 * u}}>
        <div style={{width: 120 * u, height: 10 * u, background: accent, borderRadius: 6 * u, marginBottom: 26 * u}} />
        <div style={{fontFamily: FONT_HEAD, fontWeight: 800, fontSize: hs, lineHeight: 1.04, letterSpacing: -2, color: C.white, textShadow: '0 6px 30px rgba(0,0,0,0.6)'}}>
          {words.map((w, i) => <span key={i} style={{color: /\d/.test(w) ? accent : C.white}}>{w} </span>)}
        </div>
        {card.subheadline ? (
          <div style={{display: 'inline-block', marginTop: 22 * u, background: C.amber === accent ? C.amber : '#FACC15', color: C.deep, fontFamily: FONT_HEAD, fontWeight: 800, fontSize: fit(card.subheadline, 46, 30, 0.7) * u, padding: `${8 * u}px ${20 * u}px`, borderRadius: 12 * u}}>{card.subheadline}</div>
        ) : null}
        <div style={{marginTop: 26 * u, fontFamily: FONT_BODY, fontWeight: 500, fontSize: fit(card.insight, 36, 140, 0.8) * u, lineHeight: 1.36, color: '#E2EAF4', maxWidth: 940 * u}}>{card.insight}</div>
        {card.points?.length ? (
          <div style={{display: 'flex', gap: 14 * u, marginTop: 24 * u, flexWrap: 'wrap'}}>
            {card.points.slice(0, 3).map((p, i) => (
              <div key={i} style={{display: 'flex', alignItems: 'center', gap: 10 * u, background: 'rgba(255,255,255,0.10)', border: `2px solid ${accent}`, borderRadius: 40 * u, padding: `${9 * u}px ${18 * u}px`, fontFamily: FONT_HEAD, fontWeight: 600, fontSize: 26 * u, color: C.white}}>
                <span style={{width: 12 * u, height: 12 * u, borderRadius: 6 * u, background: accent}} />{p}
              </div>
            ))}
          </div>
        ) : null}
      </div>
      {/* bottom brand bar */}
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 118 * u, background: 'rgba(2,9,20,0.92)', borderTop: `4px solid ${accent}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `0 ${60 * u}px`}}>
        <div style={{fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 30 * u, letterSpacing: 2, color: C.white}}>HEYMARINER <span style={{color: accent}}>|</span> MARITIME INSIGHT</div>
        <div style={{textAlign: 'right', fontFamily: FONT_BODY, fontWeight: 600, color: C.mist, fontSize: 22 * u, lineHeight: 1.35}}>
          <div style={{color: C.white, fontWeight: 700, fontSize: 26 * u}}>{BRAND.website}</div>
          <div>{SOCIAL.handles.instagram} · YouTube · Facebook · Instagram · TikTok · LinkedIn · X</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
