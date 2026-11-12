# HeyMariner daily content engine: editorial and SEO rules

Every day a Claude scheduled task researches, writes and commits:

- **3 video specs** to `content/queue/` (one per video slot: 06, 12, 17 UTC)
- **2 photo-card specs** to `content/cards/queue/` (card slots: 04, 14 UTC)

GitHub Actions then renders, quality-checks and publishes them. Any slot with nothing in the queue falls back to the evergreen bank.

## Principle

> Don't just tell mariners what happened. Tell them what it means, why it matters, and what they should know.

NEWS -> VERIFY -> ANALYZE -> EXPLAIN -> VISUALIZE. Never copy a headline, never repost.

## Daily mix

**The 3 daily videos are 100% educational. No news video, ever.** The full syllabus is `docs/VIDEO-CURRICULUM-BN.md`.

| Slot (UTC) | Video stream | Topics (rotate, never repeat) |
|---|---|---|
| 1 (06) | DECK / NAVIGATION / SEAMANSHIP | ECDIS, radar/ARPA, AIS, GNSS, gyro, echo sounder, parallel indexing, passage planning (appraisal to monitoring, safety contour, UKC, XTD, wheel-over, abort point), COLREG Rules 1-19 one per video (rule -> situation -> vessel movement -> correct action), mooring, anchoring, berthing, pilotage, ship handling, cargo, ballast, tanker / bulk / container operations |
| 2 (12) | ENGINE / MACHINERY / ELECTRICAL / TECHNICAL | main engine systems, generators, boilers, purifiers, FWG, compressors, pumps, STP, OWS, incinerator, refrigeration, switchboard, emergency generator, insulation, batteries, automation, PLC, alarms, and troubleshooting videos (symptoms -> possible causes -> investigation -> corrective action -> safety) |
| 3 (17) | SAFETY / REGULATION / EQUIPMENT / PROFESSIONAL | SOLAS, MARPOL annexes, STCW, ISM, ISPS, MLC, enclosed space, permit to work, hot work, working aloft, LOTO, fire, emergencies ("what would you do?"), Know Your Equipment (what / how / why / what can go wrong / what to check), term of the day, cadet academy, career, green shipping, maritime technology |

Weekly rotation example: Mon ECDIS / main engine / SOLAS; Tue COLREG / purifier / enclosed space; Wed passage planning / boiler / MARPOL; Thu radar-ARPA / generator / ISM; Fri mooring / OWS / STCW; Sat cargo / automation / fire safety; Sun seamanship / troubleshooting / cadet academy. Next week the same categories with new topics.

**Difficulty level** on every video (`level` in the spec): L1 beginner (cadet, student), L2 basic professional (junior officer), L3 intermediate (experienced officer), L4 advanced (senior officer), L5 expert (Master / Chief Engineer). A topic may return at another level, never as the same video (ECDIS L1 "what is ECDIS?", L2 "safety contour", L3 "CATZOC and route planning", L4 "route-checking errors", L5 "ECDIS risk management").

**Photo cards** (2 a day) carry the current layer: card 1 = verified incident / regulation / news insight, card 2 = mariner knowledge.
Series names: ONE MINUTE MARINER, MARITIME TERM OF THE DAY, KNOW YOUR EQUIPMENT, ONE RULE MARINERS SHOULD KNOW, REGULATION WATCH, SAFETY INSIGHT, INCIDENT LESSON, COLREG CHALLENGE, CADET CORNER, ENGINE ROOM INSIGHT.

## Frameworks

- **Incident:** what happened, where, what is confirmed, why it matters, what mariners should learn. Only verified facts; never speculate about cause unless officially established (otherwise label it as analysis). No graphic detail.
- **Regulation:** what changed, who is affected, when it applies, what the ship must do, what the mariner should know. Exact instrument names only when verified (SOLAS, MARPOL, MEPC.xxx); never invent circular or resolution numbers.
- **Safety:** what happened, why, what would have prevented it, lesson for mariners.
- **Equipment:** what it does, what can go wrong, what the officer checks.
- **Term:** what it is, why it matters, where you see it.

## Sources

Prefer: IMO (imo.org media centre and hot topics), flag states and maritime authorities (USCG, MCA, AMSA, MPA Singapore), accident investigators (MAIB, NTSB, TSB, DMAIB), ReCAAP ISC, UKMTO, IMB, classification societies (DNV, LR, ABS, BV, ClassNK), P&I clubs, then established press (Lloyd's List, TradeWinds, Splash247, gCaptain, The Maritime Executive, SAFETY4SEA). A news spec needs the primary source or two independent outlets.

## Fact check

Set `factCheck.status` to `verified` only when every number, date, name, rule number and limit in the narration and on screen has been checked against a listed source. Anything else stays `unverified`: it is rendered for review but never published.

## Video spec rules

Follow `prompts/script.md` and `src/shared/types.ts` (ContentSpec). Aim for 40-50 s (580-720 characters of narration); longer only when a rule cannot be explained in less. Animation-led: short heading, item titles of 2-5 words, the explanation in the narration. Use 3D scenes where they explain (colreg3d, contour3d, zoc3d), radar/ukc diagrams, and set a fitting `motif` for other scenes. Thumbnail text 3-7 words, complementing (not repeating) the title.

## Photo card rules (reference design, 13 Nov 2026)

Layout: full-bleed authentic incident photo, slanted yellow category badge top left, HeyMariner logo (transparent, white wordmark) on a curved navy panel top right, two-line uppercase headline (second line yellow = `headlineAccent`), location line with pin (`location`), two-line factual summary (`insight`), teal wave, platform handle row.

- `headline` max 48 characters; `headlineAccent` = its last words; `location` max 28 (e.g. "OFF SINGAPORE"); `insight` max 170: what happened + the key fact. Put the full verified incident data in `meta.description`.
- Photo: `image.url` = direct https link to an authentic photo of the real event that is public domain or licensed for reuse (government agencies such as the U.S. Coast Guard, NOAA, national coastguards and navies releasing to public domain; Wikimedia Commons with a free licence; official press-release images marked for media use). Never a photo carrying another outlet's logo or watermark, never remove a watermark, never a copyrighted news-agency photo. Give `credit` and `license`. GitHub Actions downloads it to `public/cards-media/` (temporary) and deletes it after posting. No suitable photo: leave `image` out and the HeyMariner illustration is used.
- Captions: Facebook and Instagram carry the headline, place/date, the full summary, why it matters, a question and exactly 5 hashtags, never a link. LinkedIn and X go through Buffer.

## Photo card rules (fields)

`CardSpec` in `src/shared/types.ts`. Headline max 60 characters with searchable topic words; subheadline max 48 (often a question: "What should mariners know?"); insight 1-2 lines, max 190; up to 3 points of max 34 characters; `meta.altText` describes the graphic for accessibility. No link in any card text.

## SEO rules (enforced in code: `src/pipeline/seo.ts`, `metadata.ts`)

- Facebook and Instagram: never a URL anywhere in captions or descriptions; `sanitizeSocialCaption` strips any that slip in.
- YouTube: SEO title with the topic first, structured description (summary, key points, who should watch, sources, CTA, website link), tags, 3-5 hashtags, playlist, category, custom thumbnail.
- Facebook: hook first line, context, insight, engagement question, 3-4 hashtags.
- Instagram: topic first line, short description, question, 8-10 topic hashtags.
- TikTok: short caption, 10+ relevant hashtags including #FYP #ForYou.
- LinkedIn: professional industry language, source, website allowed.
- X: one concise line with the key insight, 1-2 hashtags.
- Never keyword-stuff, never invent urgency, statistics, news or regulation changes.
