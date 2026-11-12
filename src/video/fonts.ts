import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';

// Bundled OFL fonts: rendering never depends on a font CDN.
const load = (family: string, file: string, weight: string) =>
  loadFont({family, url: staticFile(`fonts/${file}`), weight}).catch((e) => console.error('font load failed', file, e));

let started = false;
export const ensureFonts = () => {
  if (started) return;
  started = true;
  load('Inter', 'Inter.ttf', '100 900');
  load('Poppins', 'Poppins-Medium.ttf', '500');
  load('Poppins', 'Poppins-SemiBold.ttf', '600');
  load('Poppins', 'Poppins-Bold.ttf', '700');
  load('Poppins', 'Poppins-ExtraBold.ttf', '800');
};
