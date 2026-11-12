// Buffer GraphQL API (https://api.buffer.com) for TikTok, LinkedIn and X.
// Buffer has no binary upload: it pulls the video from a public URL (see hosting.ts).
import {env, fetchRetry, okJson, PipelineError} from '../lib.ts';
import type {PlatformId} from '../../shared/types.ts';
import type {Publisher} from './index.ts';
import {ensurePublicUrl} from './hosting.ts';

const gql = async <T>(query: string, variables: Record<string, unknown>, retries: number): Promise<T> => {
  const res = await fetchRetry('https://api.buffer.com', {
    method: 'POST',
    headers: {authorization: `Bearer ${env('BUFFER_ACCESS_TOKEN')}`, 'content-type': 'application/json'},
    body: JSON.stringify({query, variables}),
  }, {stage: 'buffer', retries});
  if (res.status === 401 || res.status === 403) throw new PipelineError('buffer', 'Buffer rejected the API key (expired or wrong account).');
  const j = await okJson<{data?: T; errors?: {message: string}[]}>(res, 'buffer');
  if (j.errors?.length) throw new PipelineError('buffer', j.errors.map((e) => e.message).join('; ').slice(0, 400));
  return j.data as T;
};

type Channel = {id: string; name: string; service: string};
const SERVICE: Record<string, string[]> = {tiktok: ['tiktok'], linkedin: ['linkedin'], x: ['twitter', 'x']};

export const listChannels = async (): Promise<Channel[]> => {
  const acc = await gql<{account: {organizations: {id: string}[]}}>('query { account { organizations { id } } }', {}, 1);
  const out: Channel[] = [];
  for (const org of acc.account.organizations) {
    const d = await gql<{channels: Channel[]}>('query Channels($input: ChannelsInput!) { channels(input: $input) { id name service } }', {input: {organizationId: org.id}}, 1);
    out.push(...d.channels);
  }
  return out;
};

const channelId = async (platform: string, channelVar: string): Promise<string> => {
  if (env(channelVar)) return env(channelVar);
  const found = (await listChannels()).filter((c) => SERVICE[platform]?.includes(c.service.toLowerCase()));
  if (found.length === 1) return found[0].id;
  throw new PipelineError('buffer', found.length ? `several ${platform} channels in Buffer: set the ${channelVar} variable` : `no ${platform} channel is connected in this Buffer account`);
};

const CREATE = `mutation CreatePost($input: CreatePostInput!) {
  createPost(input: $input) {
    ... on PostActionSuccess { post { id } }
    ... on MutationError { message }
  }
}`;

const make = (platform: 'tiktok' | 'linkedin' | 'x'): Publisher => ({
  id: platform as PlatformId,
  requiredEnv: ['BUFFER_ACCESS_TOKEN'],
  async health() {
    const ch = await listChannels();
    const mine = ch.filter((c) => SERVICE[platform].includes(c.service.toLowerCase()));
    return mine.length ? `channel: ${mine.map((c) => c.name).join(', ')}` : `NO ${platform} channel connected (found: ${ch.map((c) => c.service).join(', ') || 'none'})`;
  },
  async publish({file, meta, cfg, id}) {
    const url = await ensurePublicUrl(file, `${id}.mp4`);
    const input = {
      text: meta.platforms[platform as PlatformId].caption,
      channelId: await channelId(platform, String(cfg.channelVar ?? '')),
      schedulingType: 'automatic',
      mode: String(cfg.bufferMode ?? 'shareNow'),
      assets: {videos: [{url}]},
    };
    // not retried: createPost is not idempotent
    const d = await gql<{createPost: {post?: {id: string}; message?: string}}>(CREATE, {input}, 0);
    if (!d.createPost.post?.id) throw new PipelineError('buffer', `createPost refused: ${d.createPost.message ?? 'unknown error'}`);
    return {id: d.createPost.post.id};
  },
});

export const TikTokPublisher = make('tiktok');
export const LinkedInPublisher = make('linkedin');
export const XPublisher = make('x');
