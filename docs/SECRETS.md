# Secrets and variables

Add them in **GitHub -> Settings -> Secrets and variables -> Actions**. Only names are listed here.
Never put a value in a file, a commit, an issue or a workflow log.

## Secrets

| Name | Needed for | Notes |
|---|---|---|
| `ELEVENLABS_API_KEY` | voice-over | without it videos render with a silent placeholder and are never published |
| `ANTHROPIC_API_KEY` *or* `OPENAI_API_KEY` | news + new evergreen scripts | optional. Without one, only the bank and the queue are produced |
| `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET`, `YOUTUBE_REFRESH_TOKEN` | YouTube | OAuth client + refresh token. Scopes: `youtube.upload`, `youtube`, `youtube.force-ssl`, `yt-analytics.readonly` (see YOUTUBE-SETUP-BN.md) |
| `META_ACCESS_TOKEN`, `META_PAGE_ID` | Facebook Reels, Instagram Reels | long-lived system-user or Page token with `pages_manage_posts`, `pages_read_engagement`, `pages_show_list`, `instagram_basic`, `instagram_content_publish` |
| `BUFFER_ACCESS_TOKEN` | TikTok, LinkedIn, X | API key of the Buffer account that holds the HeyMariner channels |

`META_APP_ID` / `META_APP_SECRET` are not used at run time (they are only needed when you generate the token).

## Variables (not secret)

| Name | Default | Purpose |
|---|---|---|
| `PIPELINE_ENABLED` | off | `true` turns on scheduled production |
| `DRY_RUN` | `true` | set `false` for production |
| `AUTO_PUBLISH` | `false` | `true` publishes videos that pass QC; `false` keeps them as artifacts for review |
| `ELEVENLABS_VOICE_ID` | `config/voice.json` | optional override of the HeyMariner voice set in `defaultVoiceId` |
| `ELEVENLABS_VOICE_ID_NEWS` | narrator | optional separate news voice |
| `LLM_MODEL`, `OPENAI_MODEL` | see `config/ai.json` | script model. `OPENAI_MODEL` is required when OpenAI is used |
| `META_IG_USER_ID` | auto | Instagram account id; found through the Page when empty |
| `META_GRAPH_VERSION` | `v23.0` | Graph API version |
| `BUFFER_CHANNEL_TIKTOK`, `BUFFER_CHANNEL_LINKEDIN`, `BUFFER_CHANNEL_X` | auto | Buffer channel ids; auto-detected when there is exactly one channel per network |
| `MEDIA_BASE_URL` | empty | optional own public storage for Buffer; otherwise a temporary GitHub Release asset is used |

Run **Actions -> Health check** after adding anything: it reports each credential as ok / FAIL / not configured.

The ElevenLabs model is locked to `eleven_v4_turbo` in `config/voice.json` (`lockedModelId`); no variable overrides it.
