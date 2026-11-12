import React from 'react';
import {Composition} from 'remotion';
import sample from '../../content/bank/catzoc-explained.json';
import {estimateTimeline} from '../shared/estimate';
import type {ContentSpec, VideoProps} from '../shared/types';
import {FPS} from '../shared/types';
import {ensureFonts} from './fonts';
import {HeyMarinerVideo} from './HeyMarinerVideo';
import {Thumbnail} from './Thumbnail';

ensureFonts();

const sampleSpec = sample as unknown as ContentSpec;
const defaultProps: VideoProps = {spec: sampleSpec, timeline: estimateTimeline(sampleSpec), logo: null};

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="HeyMariner"
        component={HeyMarinerVideo}
        defaultProps={defaultProps}
        fps={FPS}
        width={1080}
        height={1920}
        durationInFrames={Math.round(defaultProps.timeline.totalSeconds * FPS)}
        calculateMetadata={({props}) => ({
          durationInFrames: Math.max(1, Math.round(props.timeline.totalSeconds * props.timeline.fps)),
          fps: props.timeline.fps,
          width: props.timeline.width,
          height: props.timeline.height,
        })}
      />
      <Composition id="ThumbnailVertical" component={Thumbnail} defaultProps={defaultProps} fps={FPS} width={1080} height={1920} durationInFrames={1} />
      <Composition id="ThumbnailWide" component={Thumbnail} defaultProps={defaultProps} fps={FPS} width={1280} height={720} durationInFrames={1} />
    </>
  );
};
