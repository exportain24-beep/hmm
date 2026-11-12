# HeyMariner Media Engine

Autonomous maritime video engine for [www.heymariner.com](https://www.heymariner.com).

```
RESEARCH -> SOURCE VALIDATION -> TOPIC SCORING -> SCRIPT -> FACT CHECK -> ELEVENLABS VOICE
        -> REMOTION + THREE.JS RENDER -> MUSIC/SFX MIX -> QUALITY CONTROL -> METADATA -> PUBLISH
```

Everything runs headless in GitHub Actions. All credentials live in GitHub Secrets. Nothing is published unless
`DRY_RUN=false` **and** `AUTO_PUBLISH=true` **and** quality control passed **and** the platform credentials exist
**and** the video was not already posted there.

| Part | Where | What it does |
|---|---|---|
| Video engine | `src/video` | Remotion compositions, 16 scene types, 3D maritime scenes (Three.js), captions, branding |
| Content pipeline | `src/pipeline` | research, scoring, planning, script writer + validator, voice, audio, render, QC, metadata |
| Publishers | `src/pipeline/publish` | YouTube API, Meta Graph API (Facebook + Instagram Reels), Buffer (TikTok, LinkedIn, X) |
| Content bank | `content/bank` | hand-written, source-checked evergreen videos (work with no AI key at all) |
| Queue | `content/queue` | drop a spec JSON here and it is produced next |
| Config | `config/` | brand, social handles, schedule, voices, pronunciation, sources, scoring, topics |
| Audio tools | `tools/audio` | original music bed, synced sound design, ducked -14 LUFS mix |
| Studio | `apps/studio` | Next.js + Remotion Player preview of any spec |
| Workflows | `.github/workflows` | `video-pipeline`, `research`, `health-check`, `cleanup`, `ci` |

## Quick start (safe)

1. **Actions -> Video pipeline -> Run workflow**, leave `dry_run` ticked, set `content_id` to `catzoc-explained`.
2. When it finishes, download the artifact `heymariner-video-<run id>`: `final.mp4`, `thumb.png`, `metadata.json`, `qc.json`.
3. Without an ElevenLabs key the video is rendered with a silent placeholder voice track and is marked *not publishable*.

Docs: [Architecture](docs/ARCHITECTURE.md) · [Secrets](docs/SECRETS.md) · [Operations](docs/OPERATIONS.md) · [বাংলা সেটআপ গাইড](docs/SETUP-BN.md)

## Local

```bash
npm install
npm test                                   # unit tests
npm run pipeline -- validate               # validate every spec
npm run studio                             # Remotion Studio
npm run pipeline -- run --id catzoc-explained   # needs ffmpeg, python3 + numpy/scipy
cd apps/studio && npm install && npm run dev    # Next.js preview
```

Remotion is free for individuals and companies of up to three people; larger companies need a
[Remotion company licence](https://www.remotion.dev/docs/license).
