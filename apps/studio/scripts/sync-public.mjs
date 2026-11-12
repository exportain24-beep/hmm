// Copies brand fonts and logo from the repository /public so the Player can load them.
import {cpSync, mkdirSync} from 'node:fs';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const src = resolve(here, '../../../public');
const dst = resolve(here, '../public');
mkdirSync(dst, {recursive: true});
cpSync(src, dst, {recursive: true});
console.log('synced public assets');
