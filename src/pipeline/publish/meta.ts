// Facebook Reels + Instagram Reels through the official Graph API (binary upload, no public URL needed).
import {readFileSync, statSync} from 'node:fs';
import {config, env, fetchRetry, log, okJson, PipelineError} from '../lib.ts';
import {fileBody} from '../lib.ts';
import type {Publisher} from './index.ts';
import {ensurePublicUrl} from './hosting.ts';
import {sanitizeSocialCaption} from '../seo.ts';

const ver = () => env('META_GRAPH_VERSION') || config<{metaGraphVersion: string}>('social').metaGraphVersion;
const graph = (path: string) => `https://graph.facebook.com/${ver()}/${path}`;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const explain = (status: number, body: string) =>
  /"code":\s*190/.test(body) ? 'Meta access token is expired or invalid (code 190). Generate a new long-lived token.' : `HTTP ${status}: ${body.slice(0, 400)}`;

const call = async <T>(url: string, params: Record<string, string>, method: 'GET' | 'POST', stage: string, retries = 2): Promise<T> => {
  const qs = new URLSearchParams(params);
  const res = method === 'GET'
    ? await fetchRetry(`${url}?${qs}`, {}, {stage, retries})
    : await fetchRetry(url, {method: 'POST', body: qs}, {stage, retries});
  const text = await res.text();
  if (!res.ok) throw new PipelineError(stage, explain(res.status, text));
  return JSON.parse(text) as T;
};

/** A user/system-user token is exchanged for the Page token; a Page token is used as-is. */
const pageToken = async (): Promise<string> => {
  const token = env('META_ACCESS_TOKEN');
  try {
    const j = await call<{access_token?: string}>(graph(env('META_PAGE_ID')), {fields: 'access_token', access_token: token}, 'GET', 'facebook', 1);
    return j.access_token || token;
  } catch {
    return token;
  }
};

const rupload = async (url: string, token: string, file: string, stage: string) => {
  const size = statSync(file).size;
  // not retried: an unknown outcome must not turn into two uploads
  const res = await fetchRetry(url, {method: 'POST', headers: {authorization: `OAuth ${token}`, offset: '0', file_size: String(size), 'content-type': 'application/octet-stream'}, body: fileBody(file)}, {stage, retries: 0, timeoutMs: 15 * 60 * 1000});
  const text = await res.text();
  if (!res.ok) throw new PipelineError(stage, explain(res.status, text));
};

/** Custom cover for a Facebook video/reel. Facebook only accepts it once the upload is processed, so retry. */
export const setFacebookThumb = async (videoId: string, thumb: string): Promise<boolean> => {
  const token = await pageToken();
  for (let i = 0; i < 8; i++) {
    const form = new FormData();
    form.append('is_preferred', 'true');
    form.append('access_token', token);
    form.append('source', new Blob([readFileSync(thumb)], {type: 'image/png'}), 'cover.png');
    const res = await fetchRetry(graph(`${videoId}/thumbnails`), {method: 'POST', body: form}, {stage: 'facebook', retries: 0, timeoutMs: 120000});
    const text = await res.text();
    if (res.ok) { log('facebook', `custom cover set on ${videoId}`); return true; }
    log('facebook', `cover not accepted yet (HTTP ${res.status}): ${text.slice(0, 160)}`);
    await sleep(20000);
  }
  return false;
};

export const FacebookPublisher: Publisher = {
  id: 'facebook',
  requiredEnv: ['META_ACCESS_TOKEN', 'META_PAGE_ID'],
  async health() {
    const j = await call<{name: string}>(graph(env('META_PAGE_ID')), {fields: 'name', access_token: await pageToken()}, 'GET', 'facebook', 1);
    return `page: ${j.name}`;
  },
  async publish({file, thumb, meta}) {
    const token = await pageToken();
    const page = env('META_PAGE_ID');
    const start = await call<{video_id: string; upload_url: string}>(graph(`${page}/video_reels`), {upload_phase: 'start', access_token: token}, 'POST', 'facebook');
    await rupload(start.upload_url, token, file, 'facebook');
    const m = meta.platforms.facebook;
    await call<{success: boolean}>(graph(`${page}/video_reels`), {upload_phase: 'finish', video_id: start.video_id, video_state: 'PUBLISHED', description: sanitizeSocialCaption('facebook', m.caption), title: m.title, access_token: token}, 'POST', 'facebook', 0);
    if (thumb) { try { await setFacebookThumb(start.video_id, thumb); } catch (e) { log('facebook', `cover failed: ${(e as Error).message.slice(0, 160)}`); } }
    return {id: start.video_id, url: `https://www.facebook.com/reel/${start.video_id}`};
  },
};

const igUser = async (token: string): Promise<string> => {
  if (env('META_IG_USER_ID')) return env('META_IG_USER_ID');
  const j = await call<{instagram_business_account?: {id: string}}>(graph(env('META_PAGE_ID')), {fields: 'instagram_business_account', access_token: token}, 'GET', 'instagram', 1);
  if (!j.instagram_business_account?.id) throw new PipelineError('instagram', 'no Instagram professional account is linked to the Page (or set META_IG_USER_ID)');
  return j.instagram_business_account.id;
};

export const InstagramPublisher: Publisher = {
  id: 'instagram',
  requiredEnv: ['META_ACCESS_TOKEN', 'META_PAGE_ID'],
  async health() {
    const token = await pageToken();
    const id = await igUser(token);
    const j = await call<{username: string}>(graph(id), {fields: 'username', access_token: token}, 'GET', 'instagram', 1);
    return `account: @${j.username}`;
  },
  async publish({file, thumb, meta, id}) {
    const token = await pageToken();
    const ig = await igUser(token);
    let cover = '';
    if (thumb) { try { cover = await ensurePublicUrl(thumb, `${id}-cover.png`); } catch { cover = ''; } }
    const caption = sanitizeSocialCaption('instagram', meta.platforms.instagram.caption);
    const base = {media_type: 'REELS', caption, share_to_feed: 'true', ...(cover ? {cover_url: cover} : {}), access_token: token};
    const waitFinished = async (cid: string) => {
      let status = '';
      for (let i = 0; i < 45; i++) {
        await sleep(8000);
        status = (await call<{status_code: string}>(graph(cid), {fields: 'status_code', access_token: token}, 'GET', 'instagram', 1)).status_code;
        if (status === 'FINISHED') return;
        if (status === 'ERROR' || status === 'EXPIRED') throw new PipelineError('instagram', `container processing ${status}`);
      }
      throw new PipelineError('instagram', 'container processing timed out');
    };
    let creation = '';
    try {
      // 1. resumable binary upload, whole file in one request with an exact content length
      const c = await call<{id: string; uri: string}>(graph(`${ig}/media`), {...base, upload_type: 'resumable'}, 'POST', 'instagram');
      const buf = readFileSync(file);
      const res = await fetchRetry(c.uri, {method: 'POST', headers: {authorization: `OAuth ${token}`, offset: '0', file_size: String(buf.length)}, body: buf}, {stage: 'instagram', retries: 0, timeoutMs: 15 * 60 * 1000});
      const text = await res.text();
      if (!res.ok) throw new PipelineError('instagram', explain(res.status, text));
      await waitFinished(c.id);
      creation = c.id;
    } catch (e) {
      // 2. fallback: Instagram fetches the file from its temporary public URL
      log('instagram', `binary upload failed, trying video_url: ${(e as Error).message.slice(0, 160)}`);
      const url = await ensurePublicUrl(file, `${id}.mp4`);
      const c = await call<{id: string}>(graph(`${ig}/media`), {...base, video_url: url}, 'POST', 'instagram');
      await waitFinished(c.id);
      creation = c.id;
    }
    const pub = await call<{id: string}>(graph(`${ig}/media_publish`), {creation_id: creation, access_token: token}, 'POST', 'instagram', 0);
    return {id: pub.id};
  },
};
