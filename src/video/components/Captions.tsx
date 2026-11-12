import React, {useMemo} from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {layoutFor} from '../../shared/layout';
import type {Timeline, WordTiming} from '../../shared/types';
import {C, FONT_HEAD} from '../theme';

type Group = {words: WordTiming[]; start: number; end: number};

/** Professional subtitles: short phrases, the spoken word highlighted, exact ElevenLabs word timing. */
const groupWords = (timeline: Timeline, maxChars: number): Group[] => {
  const groups: Group[] = [];
  for (const scene of timeline.scenes) {
    let cur: WordTiming[] = [];
    let len = 0;
    const flush = () => {
      if (cur.length) groups.push({words: cur, start: cur[0].start, end: cur[cur.length - 1].end});
      cur = [];
      len = 0;
    };
    for (const w of scene.words) {
      if (len + w.text.length > maxChars && cur.length) flush();
      cur.push(w);
      len += w.text.length + 1;
      if (/[.?!:;]$/.test(w.text) || (/,$/.test(w.text) && len > maxChars * 0.55)) flush();
    }
    flush();
  }
  return groups;
};

export const Captions: React.FC<{timeline: Timeline; accent: string}> = ({timeline, accent}) => {
  const frame = useCurrentFrame();
  const {width, height, fps} = useVideoConfig();
  const L = layoutFor(width, height);
  const t = frame / fps;
  const groups = useMemo(() => groupWords(timeline, L.vertical ? 26 : 44), [timeline, L.vertical]);
  const g = groups.find((x, i) => t >= x.start - 0.08 && t < (groups[i + 1]?.start ?? x.end + 0.5) - 0.08 && t < x.end + 0.45);
  if (!g) return null;
  const pop = Math.min(1, (t - (g.start - 0.08)) / 0.12);
  const size = (L.vertical ? 58 : 50) * L.u;
  return (
    <div style={{position: 'absolute', left: L.captions.x, top: L.captions.y, width: L.captions.w, height: L.captions.h, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      <div style={{background: 'rgba(4,12,26,0.78)', border: `2px solid ${C.white}1F`, borderRadius: 26 * L.u, padding: `${18 * L.u}px ${34 * L.u}px`, transform: `scale(${0.94 + 0.06 * pop})`, opacity: 0.4 + 0.6 * pop, textAlign: 'center', maxWidth: L.captions.w}}>
        <span style={{fontFamily: FONT_HEAD, fontWeight: 700, fontSize: size, lineHeight: 1.22, letterSpacing: -0.3}}>
          {g.words.map((w, i) => {
            const active = t >= w.start - 0.03 && t < (g.words[i + 1]?.start ?? w.end + 0.3) - 0.03;
            const said = t >= w.start - 0.03;
            return (
              <span key={i} style={{color: active ? accent : said ? C.white : `${C.white}8C`}}>
                {w.text}{i < g.words.length - 1 ? ' ' : ''}
              </span>
            );
          })}
        </span>
      </div>
    </div>
  );
};
