import {statSync} from 'node:fs';
import {env, fetchRetry, log, okJson, PipelineError} from '../lib.ts';
import {fileBody} from '../lib.ts';
import type {Publisher} from './index.ts';
import type {FullMetadata} from '../metadata.ts';

const accessToken = async (): Promise<string> => {
  const res = await fetchRetry('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {'content-type': 'application/x-www-form-urlencoded'},
    body: new URLSearchParams({client_id: env('YOUTUBE_CLIENT_ID'), client_secret: env('YOUTUBE_CLIENT_SECRET'), refresh_token: env('YOUTUBE_REFRESH_TOKEN'), grant_type: 'refresh_token'}),
  }, {stage: 'youtube', retries: 2});
  if (res.status === 400 || res.status === 401) throw new PipelineError('youtube', 'YouTube refresh token is expired or revoked. Create a new YOUTUBE_REFRESH_TOKEN.');
  return (await okJson<{access_token: string}>(res, 'youtube')).access_token;
};

const PL_DESC: Record<string, string> = {
  'COLREG Explained': 'The International Regulations for Preventing Collisions at Sea, explained rule by rule with 3D scenarios.',
  'Maritime Regulations': 'IMO, SOLAS, MARPOL, STCW and MLC updates explained for seafarers: what changed and what the ship must do.',
  'Maritime Safety': 'Practical safety knowledge for life at sea: enclosed spaces, mooring, fire, lifeboats and more.',
  'Marine Engineering': 'Engine-room knowledge for cadets, engineers and chief engineers.',
  'Maritime Terminology': 'Maritime terms explained simply, with practical examples.',
};
let playlistCache: Record<string, string> | null = null;
const ensurePlaylist = async (token: string, title: string): Promise<string> => {
  const h = {authorization: `Bearer ${token}`, 'content-type': 'application/json'};
  if (!playlistCache) {
    playlistCache = {};
    let page = '';
    for (let i = 0; i < 5; i++) {
      const r = await okJson<{items: {id: string; snippet: {title: string}}[]; nextPageToken?: string}>(await fetchRetry(`https://www.googleapis.com/youtube/v3/playlists?part=snippet&mine=true&maxResults=50${page ? `&pageToken=${page}` : ''}`, {headers: h}, {stage: 'youtube', retries: 1}), 'youtube');
      for (const it of r.items) playlistCache[it.snippet.title.toLowerCase()] = it.id;
      if (!r.nextPageToken) break;
      page = r.nextPageToken;
    }
  }
  const hit = playlistCache[title.toLowerCase()];
  if (hit) return hit;
  const c = await okJson<{id: string}>(await fetchRetry('https://www.googleapis.com/youtube/v3/playlists?part=snippet,status', {method: 'POST', headers: h, body: JSON.stringify({snippet: {title, description: `${PL_DESC[title] ?? `HeyMariner: ${title}.`} Practical maritime knowledge from HeyMariner.`, defaultLanguage: 'en'}, status: {privacyStatus: 'public'}})}, {stage: 'youtube', retries: 0}), 'youtube');
  playlistCache[title.toLowerCase()] = c.id;
  log('youtube', `playlist created: "${title}"`);
  return c.id;
};

export const YouTubePublisher: Publisher = {
  id: 'youtube',
  requiredEnv: ['YOUTUBE_CLIENT_ID', 'YOUTUBE_CLIENT_SECRET', 'YOUTUBE_REFRESH_TOKEN'],
  async health() {
    const token = await accessToken();
    const res = await fetchRetry('https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true', {headers: {authorization: `Bearer ${token}`}}, {stage: 'youtube', retries: 1});
    const j = await okJson<{items?: {snippet: {title: string}}[]}>(res, 'youtube');
    return `channel: ${j.items?.[0]?.snippet.title ?? 'none found'}`;
  },
  async publish({file, thumb, meta, cfg}) {
    const token = await accessToken();
    const m = meta.platforms.youtube;
    const size = statSync(file).size;
    const init = await fetchRetry('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status', {
      method: 'POST',
      headers: {authorization: `Bearer ${token}`, 'content-type': 'application/json; charset=UTF-8', 'x-upload-content-length': String(size), 'x-upload-content-type': 'video/mp4'},
      body: JSON.stringify({
        snippet: {title: m.title, description: m.caption, tags: m.keywords, categoryId: String((meta as FullMetadata).seo?.categoryId ?? cfg.categoryId ?? '27'), defaultLanguage: 'en', defaultAudioLanguage: 'en'},
        status: {privacyStatus: cfg.privacyStatus ?? 'public', selfDeclaredMadeForKids: false, embeddable: true},
      }),
    }, {stage: 'youtube', retries: 2});
    if (!init.ok) throw new PipelineError('youtube', `upload init HTTP ${init.status}: ${(await init.text()).slice(0, 400)}`);
    const uploadUrl = init.headers.get('location');
    if (!uploadUrl) throw new PipelineError('youtube', 'no resumable upload URL returned');
    // Single PUT, not retried blindly: a retry after an unknown outcome could create a duplicate video.
    const up = await fetchRetry(uploadUrl, {method: 'PUT', headers: {'content-type': 'video/mp4'}, body: fileBody(file)}, {stage: 'youtube', retries: 0, timeoutMs: 15 * 60 * 1000});
    const j = await okJson<{id: string}>(up, 'youtube');
    if (thumb) {
      const t = await fetchRetry(`https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId=${j.id}`, {method: 'POST', headers: {authorization: `Bearer ${token}`, 'content-type': 'image/png'}, body: fileBody(thumb)}, {stage: 'youtube', retries: 1});
      if (!t.ok) log('youtube', `custom thumbnail not set (HTTP ${t.status}); the channel may need phone verification`);
      else log('youtube', 'custom thumbnail uploaded');
    }
    for (const name of (meta as FullMetadata).seo?.playlists ?? []) {
      try {
        const pl = await ensurePlaylist(token, name);
        const add = await fetchRetry('https://www.googleapis.com/youtube/v3/playlistItems?part=snippet', {method: 'POST', headers: {authorization: `Bearer ${token}`, 'content-type': 'application/json'}, body: JSON.stringify({snippet: {playlistId: pl, resourceId: {kind: 'youtube#video', videoId: j.id}}})}, {stage: 'youtube', retries: 1});
        log('youtube', add.ok ? `added to playlist "${name}"` : `playlist "${name}" add failed (HTTP ${add.status})`);
      } catch (e) {
        log('youtube', `playlist "${name}" skipped: ${(e as Error).message.slice(0, 160)}`);
      }
    }
    return {id: j.id, url: `https://www.youtube.com/watch?v=${j.id}`};
  },
};
