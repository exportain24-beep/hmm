import {statSync} from 'node:fs';
import {env, fetchRetry, log, okJson, PipelineError} from '../lib.ts';
import {fileBody} from '../lib.ts';
import type {Publisher} from './index.ts';

const accessToken = async (): Promise<string> => {
  const res = await fetchRetry('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {'content-type': 'application/x-www-form-urlencoded'},
    body: new URLSearchParams({client_id: env('YOUTUBE_CLIENT_ID'), client_secret: env('YOUTUBE_CLIENT_SECRET'), refresh_token: env('YOUTUBE_REFRESH_TOKEN'), grant_type: 'refresh_token'}),
  }, {stage: 'youtube', retries: 2});
  if (res.status === 400 || res.status === 401) throw new PipelineError('youtube', 'YouTube refresh token is expired or revoked. Create a new YOUTUBE_REFRESH_TOKEN.');
  return (await okJson<{access_token: string}>(res, 'youtube')).access_token;
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
        snippet: {title: m.title, description: m.caption, tags: m.keywords, categoryId: String(cfg.categoryId ?? '27'), defaultLanguage: 'en', defaultAudioLanguage: 'en'},
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
      if (!t.ok) log('youtube', `custom thumbnail not set (HTTP ${t.status}); the channel may need verification`);
    }
    return {id: j.id, url: `https://www.youtube.com/watch?v=${j.id}`};
  },
};
