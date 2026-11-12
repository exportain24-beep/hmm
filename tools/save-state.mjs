#!/usr/bin/env node
// Commit this run's state changes without ever losing a parallel run's changes.
// Usage: node tools/save-state.mjs "<commit message>" <path> [<path>...]
// JSON files under data/state/ are deep-merged into the latest remote version (objects merged key by key,
// arrays unioned); every other changed file is applied as this run changed it (written or deleted).
import {execFileSync} from 'node:child_process';
import {existsSync, mkdirSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {dirname} from 'node:path';

const [message, ...paths] = process.argv.slice(2);
const git = (...a) => execFileSync('git', a, {encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit']});
const branch = process.env.GITHUB_REF_NAME || 'main';
if (!message || paths.length === 0) { console.error('usage: save-state.mjs "<message>" <paths...>'); process.exit(2); }

git('add', '-A', '--', ...paths.filter((p) => existsSync(p)));
const changed = git('diff', '--cached', '--name-status', '--no-renames').trim().split('\n').filter(Boolean).map((l) => {
  const [st, file] = l.split('\t');
  return {st, file, body: st === 'D' ? null : readFileSync(file)};
});
if (changed.length === 0) { console.log('save-state: nothing to save'); process.exit(0); }

const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
const merge = (base, mine) => {
  if (isObj(base) && isObj(mine)) { const out = {...base}; for (const k of Object.keys(mine)) out[k] = merge(base[k], mine[k]); return out; }
  if (Array.isArray(base) && Array.isArray(mine)) { const seen = new Set(base.map((x) => JSON.stringify(x))); return [...base, ...mine.filter((x) => !seen.has(JSON.stringify(x)))]; }
  return mine === undefined ? base : mine;
};

for (let attempt = 1; attempt <= 5; attempt++) {
  git('fetch', '-q', 'origin', branch);
  git('reset', '-q', '--hard', `origin/${branch}`);
  for (const c of changed) {
    if (c.st === 'D') { rmSync(c.file, {force: true}); continue; }
    mkdirSync(dirname(c.file), {recursive: true});
    if (c.file.startsWith('data/state/') && c.file.endsWith('.json') && existsSync(c.file)) {
      try {
        const merged = merge(JSON.parse(readFileSync(c.file, 'utf8')), JSON.parse(c.body.toString('utf8')));
        writeFileSync(c.file, JSON.stringify(merged, null, 2) + '\n');
        continue;
      } catch { /* not valid JSON on one side: fall through and keep ours */ }
    }
    writeFileSync(c.file, c.body);
  }
  git('add', '-A', '--', ...changed.map((c) => c.file));
  if (git('diff', '--cached', '--name-only').trim() === '') { console.log('save-state: already up to date'); process.exit(0); }
  git('commit', '-q', '-m', message);
  try {
    git('push', '-q', 'origin', `HEAD:${branch}`);
    console.log(`save-state: pushed (${changed.length} file(s), attempt ${attempt})`);
    process.exit(0);
  } catch {
    console.log(`save-state: push rejected, retrying (${attempt}/5)`);
    execFileSync('sleep', [String(3 * attempt)]);
  }
}
console.error('save-state: could not push state after 5 attempts');
process.exit(1);
