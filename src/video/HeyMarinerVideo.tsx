import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {TEMPLATES} from '../shared/templates';
import type {SceneKind, VideoProps} from '../shared/types';
import {Background} from './components/Background';
import {Captions} from './components/Captions';
import {Header} from './components/Header';
import type {SceneProps} from './components/SceneShell';
import {ensureFonts} from './fonts';
import {BulletsScene, CompareScene, EndCardScene, HookScene, StatementScene, StatScene, TakeawayScene, TermScene, TimelineScene} from './scenes/basic';
import {RadarScene, UkcScene} from './scenes/diagrams';
import {accentOf} from './theme';
import {Colreg3DScene} from './three/Colreg3D';
import {Contour3DScene, Zoc3DScene} from './three/Seabed3D';

ensureFonts();

/** Scene registry: every content category reuses the same scene, caption, brand and audio systems. */
export const SCENES: Record<SceneKind, React.FC<SceneProps>> = {
  hook: HookScene,
  term: TermScene,
  statement: StatementScene,
  qa: StatementScene,
  bullets: BulletsScene,
  checklist: BulletsScene,
  compare: CompareScene,
  stat: StatScene,
  timeline: TimelineScene,
  colreg3d: Colreg3DScene,
  contour3d: Contour3DScene,
  zoc3d: Zoc3DScene,
  radar: RadarScene,
  ukc: UkcScene,
  takeaway: TakeawayScene,
  endcard: EndCardScene,
};

export const HeyMarinerVideo: React.FC<VideoProps> = ({spec, timeline, logo}) => {
  const accent = accentOf(spec.template);
  const tpl = TEMPLATES[spec.template];
  const fps = timeline.fps;
  return (
    <AbsoluteFill style={{backgroundColor: '#061223'}}>
      <Background accent={accent} />
      {spec.scenes.map((scene, i) => {
        const timing = timeline.scenes[i];
        if (!timing) return null;
        const from = Math.round(timing.start * fps);
        const to = Math.round(timing.end * fps);
        const Scene = SCENES[scene.kind] ?? StatementScene;
        return (
          <Sequence key={scene.id} from={from} durationInFrames={Math.max(1, to - from)} name={`${i + 1} ${scene.kind}`}>
            <Scene scene={scene} timing={timing} accent={accent} logo={logo} />
          </Sequence>
        );
      })}
      <Header badge={spec.series ? spec.series.toUpperCase() : tpl?.badge ?? 'HEYMARINER'} accent={accent} logo={logo} />
      <Captions timeline={timeline} accent={accent} />
    </AbsoluteFill>
  );
};
