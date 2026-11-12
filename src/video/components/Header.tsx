import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {layoutFor} from '../../shared/layout';
import {C, enter, FONT_HEAD} from '../theme';
import {Logo} from './Logo';

/** Persistent brand bar: series badge on the left, logo on the right. Small, never covers content. */
export const Header: React.FC<{badge: string; accent: string; logo: string | null}> = ({badge, accent, logo}) => {
  const frame = useCurrentFrame();
  const {width, height, fps} = useVideoConfig();
  const L = layoutFor(width, height);
  const a = enter(frame, fps, 0.1, 0.5);
  const dark = accent === C.amber || accent === C.tealBright || accent === C.green;
  return (
    <div style={{position: 'absolute', left: L.header.x, top: L.header.y, width: L.header.w, height: L.header.h, display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: a, transform: `translateY(${(1 - a) * -24}px)`}}>
      <div style={{background: accent, color: dark ? C.deep : C.white, fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 30 * L.u, letterSpacing: 2.2, padding: `${13 * L.u}px ${24 * L.u}px`, borderRadius: 12 * L.u, maxWidth: L.header.w * 0.6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>
        {badge}
      </div>
      <Logo height={(logo ? 84 : 56) * L.u} logo={logo} accent={accent} />
    </div>
  );
};
