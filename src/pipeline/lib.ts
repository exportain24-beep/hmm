import {appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
export const p = (...parts: string[]) => resolve(ROOT, ...parts);

// ---------- env ----------
export const env = (k: string): string => (process.env[k] ?? '').trim();
export const flag = (k: string, def: boolean): boolean => {
  const v = env(k).toLowerCase();
  if (!v) return def;
  return v === 'true' || v === '1' || v === 'yes';
};
/** Safe by default: DRY_RUN is true unless explicitly set to false. */
export const isDryRun = () => flag('DRY_RUN', true);
export const isAutoPublish = () => flag('AUTO_PUBLISH', false);

// ---------- logging (never prints secret values) ----------
const SECRET_KEYS = /(KEY|TOKEN|SECRET|PASSWORD)/i;
const redact = (s: string): string => {
  let out = s;
  for (const [k, v] of Object.entries(process.env)) {
    if (v && v.length >= 8 && SECRET_KEYS.test(k)) out = out.split(v).join('***');
  }
  return out;
};
export const log = (stage: string, msg: string, data?: unknown) => {
  const line = `[${new Date().toISOString()}] [${stage}] ${msg}${data === undefined ? '' : ' ' + JSON.stringify(data)}`;
  console.log(redact(line));
};
export const summary = (md: string) => {
  const f = env('GITHUB_STEP_SUMMARY');
  if (f) appendFileSync(f, redact(md) + '\n');
};
export const setOutput = (k: string, v: string) => {
  const f = env('GITHUB_OUTPUT');
  if (f) appendFileSync(f, `${k}=${v}\n`);
  log('output', `${k}=${v}`);
};
export class PipelineError extends Error {
  constructor(public stage: string, message: string) {
    super(redact(message));
  }
}

// ---------- json / fs ----------
export const readJson = <T>(file: string, fallback?: T): T => {
  if (!existsSync(file)) {
    if (fallback !== undefined) return fallback;
    throw new Error(`Missing file: ${file}`);
  }
  return JSON.parse(readFileSync(file, 'utf8')) as T;
};
export const writeJson = (file: string, data: unknown) => {
  mkdirSync(dirname(file), {recursive: true});
  writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
};
export const config = <T>(name: string): T => readJson<T>(p('config', `${name}.json`));
export const sha1 = (s: string) => createHash('sha1').update(s).digest('hex');

// ---------- processes ----------
export const run = (cmd: string, args: string[], opts: {stage: string; timeoutMs?: number; allowFail?: boolean} = {stage: 'run'}) => {
  const r = spawnSync(cmd, args, {encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: opts.timeoutMs ?? 40 * 60 * 1000});
  if ((r.status !== 0 || r.error) && !opts.allowFail) {
    const tail = ((r.stderr || '') + (r.stdout || '')).slice(-1500);
    throw new PipelineError(opts.stage, `${cmd} failed (${r.error?.message ?? 'exit ' + r.status}): ${tail}`);
  }
  return {code: r.status ?? 1, stdout: r.stdout ?? '', stderr: r.stderr ?? ''};
};
export const mediaDuration = (file: string): number => {
  const r = run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file], {stage: 'ffprobe'});
  return parseFloat(r.stdout.trim());
};

export const fileBody = (file: string): BodyInit => readFileSync(file) as unknown as BodyInit;

// ---------- http with bounded retry + backoff ----------
export type RetryOpts = {stage: string; retries?: number; timeoutMs?: number; retryOn?: (status: number) => boolean};
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
export const fetchRetry = async (url: string, init: RequestInit, o: RetryOpts): Promise<Response> => {
  const retries = o.retries ?? 3;
  const retryOn = o.retryOn ?? ((s) => s === 429 || s >= 500);
  let lastErr = '';
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {...init, signal: AbortSignal.timeout(o.timeoutMs ?? 120_000)});
      if (!retryOn(res.status) || attempt === retries) return res;
      const ra = Number(res.headers.get('retry-after'));
      const wait = Math.min(Number.isFinite(ra) && ra > 0 ? ra * 1000 : 1500 * 2 ** attempt, 60_000);
      lastErr = `HTTP ${res.status}`;
      log(o.stage, `retry ${attempt + 1}/${retries} after ${wait}ms (${lastErr})`);
      await sleep(wait);
    } catch (e) {
      lastErr = (e as Error).message;
      if (attempt === retries) break;
      const wait = 1500 * 2 ** attempt;
      log(o.stage, `retry ${attempt + 1}/${retries} after ${wait}ms (network: ${lastErr})`);
      await sleep(wait);
    }
  }
  throw new PipelineError(o.stage, `request failed after ${retries + 1} attempts: ${lastErr}`);
};
export const okJson = async <T>(res: Response, stage: string): Promise<T> => {
  const text = await res.text();
  if (!res.ok) throw new PipelineError(stage, `HTTP ${res.status}: ${text.slice(0, 600)}`);
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new PipelineError(stage, `invalid JSON response: ${text.slice(0, 200)}`);
  }
};

// ---------- state (plain JSON committed to the repo by the workflow) ----------
export type PublishedEntry = {
  title: string;
  fingerprint?: string;
  producedAt?: string;
  platforms: Record<string, {id: string; url?: string; at: string}>;
};
export const state = {
  published: () => readJson<Record<string, PublishedEntry>>(p('data/state/published.json'), {}),
  savePublished: (d: Record<string, PublishedEntry>) => writeJson(p('data/state/published.json'), d),
  seen: () => readJson<{fingerprints: Record<string, string>}>(p('data/state/seen.json'), {fingerprints: {}}),
  saveSeen: (d: {fingerprints: Record<string, string>}) => writeJson(p('data/state/seen.json'), d),
  slots: () => readJson<Record<string, string>>(p('data/state/slots.json'), {}),
  saveSlots: (d: Record<string, string>) => writeJson(p('data/state/slots.json'), d),
  addFailure: (f: {id?: string; stage: string; error: string}) => {
    const file = p('data/state/failures.json');
    const all = readJson<unknown[]>(file, []);
    all.push({...f, error: redact(f.error).slice(0, 500), at: new Date().toISOString(), run: env('GITHUB_RUN_ID') || null});
    writeJson(file, all.slice(-100));
  },
};
