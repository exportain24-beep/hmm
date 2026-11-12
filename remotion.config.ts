import {Config} from '@remotion/cli/config';

// GitHub runners have no GPU: 'swangle' is the software path that still renders Three.js.
// On a desktop with a GPU you can override with --gl=angle.
Config.setChromiumOpenGlRenderer('swangle');
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(92);
Config.setOverwriteOutput(true);
Config.setConcurrency(null);
