# Architecture

## Flow of one run

1. **Gate** (`pipeline due`): the workflow wakes hourly; `config/schedule.json` decides whether a slot is due.
   Nothing happens unless the repository variable `PIPELINE_ENABLED` is `true`. A slot runs once per day.
2. **Plan** (`src/pipeline/plan.ts`), in this order:
   1. a spec waiting in `content/queue/` (hand-fed, or written by a Claude scheduled task);
   2. for `news-first` slots: the best researched story above `config/scoring.json -> minScore`, written by the
      script engine and then checked by an independent validator pass. A story that fails validation is dropped;
   3. the next unused item of the evergreen bank that matches the slot's pillars;
   4. the next syllabus topic of `config/topics.json`, written and validated by the LLM.
   If none qualifies, the run ends without a video. Weak topics are never forced.
3. **Research** (`research.ts`): RSS/Atom feeds of `config/sources.json`, de-duplicated by URL and by story key,
   scored on recency, reliability, maritime relevance, educational value, seafarer value, shareability, visual
   potential and regulatory importance. Stories carried by several outlets get a corroboration bonus.
4. **Script** (`script.ts`, `prompts/`): the writer returns a `ContentSpec` (see `src/shared/types.ts`).
   `spec.ts` enforces structure and text budgets before any money is spent: hook first, end card last, cues that
   really occur in the narration, character limits for every on-screen text, duration range per template.
5. **Voice** (`voice.ts`): one ElevenLabs request per scene with character timestamps. `config/pronunciation.json`
   maps display words to spoken forms (CATZOC -> "cat-zock") while captions keep the display word. Scene
   boundaries, word timings and cue times all come from the real audio, so picture and speech cannot drift.
   Audio is cached by hash: a re-run never pays for the same narration twice.
6. **Render** (`produce.ts`): Remotion renders the silent picture (`--gl=swangle`, software WebGL for runners
   without a GPU). `tools/audio` writes an original music bed, synced sound effects and a sidechain-ducked mix at
   -14 LUFS; ffmpeg muxes the final MP4. A thumbnail still is rendered from the same props.
7. **Quality control** (`qc.ts`): resolution, aspect, frame rate, codec, duration, audio stream, silence,
   loudness, black frames, frozen picture, voice/scene sync, every 3D scene actually rendered, real voice (not
   placeholder), fact check verified, sources present. Any blocking failure means no publishing.
8. **Metadata** (`metadata.ts`): different title, caption, hashtags and keywords for each platform.
9. **Publish** (`publish/`): one adapter per platform behind the same interface. State is saved after every
   platform, so a workflow re-run can never post the same video twice.
10. **State** (`data/state/*.json`): published ids per platform, seen source fingerprints, slot runs, failures.
    The workflow commits these files back to the repository.

## Video engine

`HeyMarinerVideo` receives `{spec, timeline, logo}` and maps each scene to a component. All motion is a pure
function of the frame number.

| Scene kind | Component | Use |
|---|---|---|
| `hook` | kinetic headline | first 3 seconds, no logo intro |
| `term` | giant term + definition | Maritime Term of the Day |
| `statement`, `qa` | heading + card / question chip | context, regulation "what / why / who" |
| `bullets`, `checklist` | items revealed on the spoken cue | duties, procedures |
| `compare`, `stat`, `timeline` | table, big figure, dated steps | data, limits, entry-into-force dates |
| `radar`, `ukc` | SVG technical diagrams | CPA/TCPA plot, under-keel clearance section |
| `colreg3d` | Three.js two-vessel simulation | Rules 13, 14, 15 with correct sidelights and manoeuvres |
| `contour3d` | Three.js seabed section | ECDIS safety contour selection |
| `zoc3d` | Three.js survey coverage | CATZOC A1 vs C |
| `takeaway`, `endcard` | key lesson, brand close | signature ending |

Reusable 3D parts (`src/video/three/Models.tsx`): `Ocean`, `ShipModel` (cargo / container / tanker, navigation
lights), `Vessel`, `SeaLine`, `SeaRing`, `SeaSector`, `Buoy`. They are procedural: no model files to download.

## Templates

All 20 categories are registered in `src/shared/templates.ts` (badge, accent colour, music mood, voice profile,
recommended scene flow, duration range): breaking-news, maritime-news, regulation-update, safety-alert,
educational-explainer, equipment-explained, maritime-term, navigation-scenario, colreg-scenario, ship-type,
one-minute-mariner, maritime-fact, market-insight, technology-update, environmental-update, career-advice,
seafarer-tip, maritime-history, accident-lesson, heymariner-insight. A template is a preset over the shared
scene system, so a new category needs no new rendering code.

## Long-form

`aspect: "16:9"` switches every component to the wide layout (`src/shared/layout.ts`). The same pipeline renders
it; raise `maxCharsPerVideo` in `config/voice.json` and the template's `seconds` range for longer videos.
