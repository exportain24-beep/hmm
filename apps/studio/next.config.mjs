import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
// The video engine lives in ../../src. Force a single copy of Remotion / Three for both trees (Next supplies React itself).
const single = ['remotion', 'three', '@react-three/fiber', '@remotion/three', '@remotion/fonts'];

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {externalDir: true},
  typescript: {ignoreBuildErrors: true},
  eslint: {ignoreDuringBuilds: true},
  webpack: (config) => {
    for (const name of single) config.resolve.alias[name] = resolve(here, 'node_modules', name);
    return config;
  },
};

export default nextConfig;
