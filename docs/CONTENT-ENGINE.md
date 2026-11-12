# HeyMariner daily content engine: editorial and SEO rules

Every day a Claude scheduled task researches, writes and commits:

- **3 video specs** to `content/queue/` (one per video slot: 06, 12, 17 UTC)
- **2 photo-card specs** to `content/cards/queue/` (card slots: 04, 14 UTC)

GitHub Actions then renders, quality-checks and publishes them. Any slot with nothing in the queue falls back to the evergreen bank.

## Principle

> Don't just tell mariners what happened. Tell them what it means, why it matters, and what they should know.

NEWS -> VERIFY -> ANALYZE -> EXPLAIN -> VISUALIZE. Never copy a headline, never repost.

## Daily mix

| Slot | Video | Card |
|---|---|---|
| 1 | Current maritime insight: news, incident or regulation, only if verified today. Otherwise regulation/safety evergreen | Incident / news / regulation insight (verified) |
| 2 | Deck or COLREG / navigation knowledge | Mariner knowledge, equipment, term of the day or "one rule" |
| 3 | Engine, safety or equipment knowledge | |

Rotate deck and engine fairly. Vary the audience: cadet, OOW, chief officer / master, junior engineer, chief engineer.
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

## Photo card rules

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
