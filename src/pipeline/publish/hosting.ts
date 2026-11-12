// Temporary public hosting for platforms that pull video by URL (Buffer).
// Uses a GitHub Release asset of this repository; the cleanup workflow deletes old assets.
import {env, fetchRetry, okJson, PipelineError} from '../lib.ts';
import {fileBody} from '../lib.ts';

const TAG = 'media-temp';
const cache = new Map<string, string>();

export const ensurePublicUrl = async (file: string, name: string): Promise<string> => {
  if (env('MEDIA_BASE_URL')) return `${env('MEDIA_BASE_URL').replace(/\/$/, '')}/${name}`;
  if (cache.has(name)) return cache.get(name)!;
  const repo = env('GITHUB_REPOSITORY');
  const token = env('GITHUB_TOKEN');
  if (!repo || !token) throw new PipelineError('hosting', 'GITHUB_TOKEN / GITHUB_REPOSITORY not available for media hosting');
  const h = {authorization: `Bearer ${token}`, accept: 'application/vnd.github+json', 'x-github-api-version': '2022-11-28'};
  let rel = await fetchRetry(`https://api.github.com/repos/${repo}/releases/tags/${TAG}`, {headers: h}, {stage: 'hosting', retries: 2});
  if (rel.status === 404) {
    rel = await fetchRetry(`https://api.github.com/repos/${repo}/releases`, {method: 'POST', headers: {...h, 'content-type': 'application/json'}, body: JSON.stringify({tag_name: TAG, name: 'Temporary media (auto-cleaned)', body: 'Short-lived video files for social publishing. Managed by the pipeline.', prerelease: true})}, {stage: 'hosting', retries: 1});
  }
  const r = await okJson<{id: number; assets: {id: number; name: string; browser_download_url: string}[]}>(rel, 'hosting');
  const existing = (r.assets ?? []).find((a) => a.name === name);
  if (existing) { cache.set(name, existing.browser_download_url); return existing.browser_download_url; }
  const up = await fetchRetry(`https://uploads.github.com/repos/${repo}/releases/${r.id}/assets?name=${encodeURIComponent(name)}`, {method: 'POST', headers: {...h, 'content-type': 'video/mp4'}, body: fileBody(file)}, {stage: 'hosting', retries: 1, timeoutMs: 10 * 60 * 1000});
  const a = await okJson<{browser_download_url: string}>(up, 'hosting');
  cache.set(name, a.browser_download_url);
  return a.browser_download_url;
};

export const cleanupMedia = async (maxAgeDays: number): Promise<number> => {
  const repo = env('GITHUB_REPOSITORY');
  const token = env('GITHUB_TOKEN');
  if (!repo || !token) return 0;
  const h = {authorization: `Bearer ${token}`, accept: 'application/vnd.github+json'};
  const rel = await fetchRetry(`https://api.github.com/repos/${repo}/releases/tags/${TAG}`, {headers: h}, {stage: 'cleanup', retries: 1});
  if (!rel.ok) return 0;
  const r = (await rel.json()) as {assets: {id: number; created_at: string}[]};
  let n = 0;
  for (const a of r.assets ?? []) {
    if (Date.now() - Date.parse(a.created_at) > maxAgeDays * 864e5) {
      const d = await fetchRetry(`https://api.github.com/repos/${repo}/releases/assets/${a.id}`, {method: 'DELETE', headers: h}, {stage: 'cleanup', retries: 1});
      if (d.ok) n++;
    }
  }
  return n;
};
