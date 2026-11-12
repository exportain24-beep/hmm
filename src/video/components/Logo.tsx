import React from 'react';
import {Img, staticFile} from 'remotion';
import {BRAND, C, FONT_HEAD} from '../theme';

/** Compass-rose mark drawn in code; used until the real logo file is placed at public/brand/logo.png. */
export const Mark: React.FC<{size: number; color?: string; accent?: string}> = ({size, color = C.white, accent = C.tealBright}) => (
  <svg width={size} height={size} viewBox="0 0 100 100">
    <circle cx="50" cy="50" r="45" fill="none" stroke={color} strokeWidth="5" />
    <path d="M50 10 L60 50 L50 90 L40 50 Z" fill={accent} />
    <path d="M10 50 L50 41 L90 50 L50 59 Z" fill={color} opacity="0.9" />
    <circle cx="50" cy="50" r="6" fill={C.navy} stroke={color} strokeWidth="2" />
  </svg>
);

export const Logo: React.FC<{height: number; logo: string | null; accent?: string}> = ({height, logo, accent}) => {
  if (logo) {
    return (
      <div style={{background: C.white, borderRadius: height * 0.22, padding: `${height * 0.12}px ${height * 0.22}px`, display: 'flex', alignItems: 'center'}}>
        <Img src={staticFile(logo)} style={{height: height * 0.76, width: 'auto'}} />
      </div>
    );
  }
  return (
    <div style={{display: 'flex', alignItems: 'center', gap: height * 0.22}}>
      <Mark size={height} accent={accent} />
      <div style={{fontFamily: FONT_HEAD, fontWeight: 700, fontSize: height * 0.62, color: C.white, letterSpacing: -0.5, lineHeight: 1}}>
        Hey<span style={{color: accent ?? C.tealBright}}>Mariner</span>
      </div>
    </div>
  );
};
export const BRAND_NAME = BRAND.name;
