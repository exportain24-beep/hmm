# Operations

## Daily schedule (on since 13 Nov 2026)

- 3 educational videos a day (deck, engine, safety/regulation): production at 06, 12 and 17 UTC (12:00, 18:00, 23:00 Dhaka), published after render + QC.
- 2 photo cards a day: 04 and 14 UTC (10:00 and 20:00 Dhaka) to Facebook, Instagram, LinkedIn, X.
- Content: a Claude scheduled task writes the day's specs into `content/queue/` and `content/cards/queue/` at 09:23 Dhaka (rules: `docs/CONTENT-ENGINE.md`); empty slots fall back to the bank.
- Switches: `config/runtime.json` (`pipelineEnabled`, `cardsEnabled`, `dryRun`, `autoPublish`). A GitHub variable of the same name always overrides it. To stop everything set `pipelineEnabled` and `cardsEnabled` to false (or add the variable `PIPELINE_ENABLED=false`).

## Dry run (safe test)

Actions -> **Video pipeline** -> Run workflow, `dry_run` ticked. Research, script, voice, render, QC and metadata
all run; the publishing step lists every platform as skipped. Download the artifact to review the video.
A manual run is a dry run unless you untick the box. `DRY_RUN` is treated as `true` whenever it is not exactly `false`.

## Review mode

`DRY_RUN=false`, `AUTO_PUBLISH=false`: videos are produced on schedule, recorded in `data/state/published.json`
(so the topic is not repeated) and kept as artifacts for 7 days. To publish a reviewed video, run the workflow
with its `content_id`, `dry_run` off and `auto_publish` on.

## Production activation

1. Add the secrets and variables of [SECRETS.md](SECRETS.md).
2. Put the logo at `public/brand/logo.png` (transparent PNG). Until then the built-in wordmark is used.
3. Run **Health check**. Every line you need must say `ok`.
4. Run **Video pipeline** once as a dry run and watch the video with sound.
5. Run it once with `dry_run` off, `auto_publish` on and `platforms` = `youtube` to test a single platform.
6. Set variables `DRY_RUN=false`, `AUTO_PUBLISH=true`, `PIPELINE_ENABLED=true`.

From then on the workflow wakes every hour, produces the slots of `config/schedule.json` and publishes what passes.

## Changing things

| I want to | Edit |
|---|---|
| change posting times / number of videos per day | `config/schedule.json` |
| add a hand-written video | add a JSON spec to `content/bank/` or `content/queue/` (CI validates it) |
| fix a pronunciation | `config/pronunciation.json` |
| add or remove a news source | `config/sources.json` |
| make topic selection stricter | `minScore` in `config/scoring.json` |
| switch a platform off | `enabled: false` in `config/social.json` |
| change voice settings | `config/voice.json` |

## Feeding scripts from a Claude scheduled task

A scheduled Claude task can research, write a `ContentSpec` and commit it to `content/queue/<id>.json`.
The next slot renders it first. Set `factCheck.status` to `verified` only when every claim was checked against the
listed sources; anything else is rendered for review but never published.

## When something fails

Every run writes a summary table (Actions -> the run -> Summary) and appends to `data/state/failures.json`.
Expired tokens are reported by name. Uploads are never retried blindly, so a failure cannot create a double post;
re-running the workflow with the same `content_id` only publishes to the platforms that are still missing.
