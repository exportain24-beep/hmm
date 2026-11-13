// Toon 3D scene: flat inked seafarers acting in a maritime set (ship deck, bridge, engine room, quay,
// lifeboat station, office). Engine adapted from the RicksClips-Engine; HeyMariner layout, captions and audio stay.
import React, {useEffect, useLayoutEffect, useMemo, useRef, useState} from 'react';
import {cancelRender, continueRender, delayRender} from 'remotion';
import {start} from '../../toon/engine/index.js';
import {buildToonStory} from '../../toon/maritime.js';
import {Title, useScene, type SceneProps} from '../components/SceneShell';
import {C} from '../theme';

const hash = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0) % 100000;
};
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9']/g, '');

export const ToonScene: React.FC<SceneProps> = ({spec, scene, timing, accent}) => {
  const {frame, t, seconds, L, vis} = useScene(timing);
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const api = useRef<{renderAt: (t: number) => void; renderer: {dispose: () => void}} | null>(null);
  const [ready, setReady] = useState(false);
  const [handle] = useState(() => delayRender(`toon ${scene.id}`, {timeoutInMilliseconds: 600000}));
  const w = L.panel.w;
  const h = L.panel.h;
  // render at 70 % and scale up: about 2x faster on software GL, the ink lines stay clean
  const rw = Math.round(w * 0.7);
  const rh = Math.round(h * 0.7);

  const story = useMemo(() => {
    const toon = scene.toon ?? {set: 'deck'};
    // a beat lands on the first spoken word that matches its "on" text, searched after the previous beat
    let from = 0;
    const beats = (toon.beats ?? []).map((b) => {
      const target = norm(b.on.split(/\s+/)[0] ?? '');
      const wd = timing.words.find((x) => x.start - timing.start >= from - 1e-6 && norm(x.text) === target);
      const at = wd ? wd.start - timing.start : from + 0.6;
      from = at + 0.05;
      return {...b, t: at};
    });
    return buildToonStory({...toon, beats, seconds, seed: hash(`${spec.id}|${scene.id}`)});
  }, [spec.id, scene.id, scene.toon, timing, seconds]);

  useEffect(() => {
    let dead = false;
    (async () => {
      try {
        const a = await start(story, {root: rootRef.current!, canvas: canvasRef.current!, W: rw, H: rh, duration: seconds, style: {captions: false, ink_px: 7}});
        if (dead) return;
        api.current = a;
        setReady(true);
        continueRender(handle);
      } catch (e) {
        console.error('[toon] setup failed', e);
        cancelRender(e as Error);
      }
    })();
    return () => {
      dead = true;
      try { api.current?.renderer.dispose(); } catch { /* ignore */ }
    };
  }, []);

  useLayoutEffect(() => {
    if (ready) api.current!.renderAt(Math.min(seconds, t));
  }, [ready, frame]);

  return (
    <div style={{position: 'absolute', inset: 0, opacity: vis}}>
      <div ref={rootRef} style={{position: 'absolute', left: L.panel.x, top: L.panel.y, width: w, height: h, borderRadius: 34 * L.u, overflow: 'hidden', background: '#0b1a2c', border: `3px solid ${C.white}2E`, boxShadow: '0 30px 80px rgba(0,0,0,0.5)'}}>
        <canvas ref={canvasRef} width={rw} height={rh} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block'}} />
      </div>
      <Title scene={scene} accent={accent} L={L} frame={frame} fps={30} />
    </div>
  );
};
