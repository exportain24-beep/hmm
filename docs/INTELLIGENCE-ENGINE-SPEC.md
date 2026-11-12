# HEYMARINER
## REAL-TIME MARITIME INTELLIGENCE → RESEARCH → VERIFICATION → PHOTO CARD → PUBLISHING ENGINE

---

## 1. PRIMARY OBJECTIVE

Build a fully automated real-time maritime intelligence and photo-card publishing system for HeyMariner.

The system must continuously monitor the global maritime ecosystem, identify important new information, verify it against authoritative sources, classify its maritime significance, transform the information into a professional HeyMariner photo card, generate platform-specific copy, and publish/schedule the content automatically.

This system is NOT the educational video engine.

This system is specifically for:

- Recent maritime incidents
- Marine casualties
- Near misses
- Collisions
- Groundings
- Fires
- Explosions
- Allisions
- Capsizing
- Sinking
- Man-overboard incidents
- Fatalities and serious injuries
- Pollution incidents
- Cargo incidents
- Dangerous goods incidents
- Machinery failures
- Navigation failures
- Mooring accidents
- Enclosed-space incidents
- Lifting accidents
- Port accidents
- Towing incidents
- Salvage incidents
- Piracy/security incidents
- Maritime cyber incidents
- PSC deficiencies
- PSC detentions
- Safety alerts
- Safety bulletins
- New regulations
- Regulation amendments
- IMO circulars
- IMO resolutions
- SOLAS changes
- MARPOL changes
- STCW changes
- ISM developments
- ISPS developments
- MLC developments
- COLREG-related developments
- ECDIS/navigation changes
- GMDSS changes
- IHO developments
- Flag-state notices
- Port-state notices
- Class society technical alerts
- Manufacturer safety notices
- Maritime enforcement actions
- Investigation findings
- Lessons learned
- Recurring industry safety trends
- New maritime technologies affecting safety/compliance
- Environmental regulations
- Alternative-fuel safety developments
- CII/EEXI developments
- EU ETS/FuelEU developments
- Dangerous cargo regulations
- Container/lashing developments
- Cybersecurity requirements
- Seafarer safety developments
- Any other information that can materially affect a professional mariner.

The system must prioritize information that is:

1. NEW
2. VERIFIED
3. MARITIME-RELEVANT
4. OPERATIONALLY IMPORTANT
5. SAFETY-RELEVANT
6. REGULATORY
7. ACTIONABLE
8. INTERESTING TO PROFESSIONAL MARINERS

---

# 2. CORE PRINCIPLE

Never behave like a generic news scraper.

The engine must behave like a:

> Maritime Intelligence Analyst + Safety Analyst + Regulatory Monitoring System + Maritime Media Editor.

The goal is not to publish the largest number of stories.

The goal is to publish the MOST IMPORTANT verified maritime developments.

---

# 3. REAL-TIME DOES NOT MEAN BLINDLY INSTANT

The system must distinguish between:

### A. Breaking Information

Information that is very recent and potentially operationally important.

Example:

- Major collision
- Fire onboard
- Sinking
- Port closure
- Navigational hazard
- Major pollution event
- Fatal accident
- Security incident

These may receive priority processing immediately.

### B. Confirmed Development

Information where an authoritative source has confirmed the event.

### C. Regulatory Update

A new:

- IMO amendment
- Circular
- Resolution
- regulation
- guidance
- safety bulletin
- marine notice
- flag-state requirement
- PSC requirement

### D. Investigation/Lessons Learned

Older incident information that has newly released investigation findings or safety lessons.

### E. Industry Insight

A meaningful trend or recurring safety/compliance issue discovered from multiple sources.

The system must never create artificial urgency simply to increase posting frequency.

---

# 4. SOURCE HIERARCHY

Create a strict source-trust hierarchy.

## TIER 1 — AUTHORITATIVE PRIMARY SOURCES

Highest priority.

Monitor:

### IMO

- IMO news
- IMO meetings
- IMO resolutions
- IMO circulars
- IMO MSC
- IMO MEPC
- IMO LEG
- IMO FAL
- IMO III
- IMO documents
- amendments
- entry-into-force information
- casualty-related publications
- safety recommendations
- maritime security updates

Use official IMO material as the primary source whenever available.

---

### FLAG STATES

Monitor major flag administrations.

Examples:

- UK MCA
- USCG
- Australian Maritime Safety Authority
- Maritime and Port Authority of Singapore
- Transport Canada
- Norwegian Maritime Authority
- Danish Maritime Authority
- Maritime Authority of Panama
- Liberia Maritime Authority
- Marshall Islands
- Bahamas Maritime Authority
- Cyprus Shipping Deputy Ministry
- Malta Transport
- Hong Kong Marine Department
- Japan MLIT
- China maritime authorities
- Indian maritime authorities
- UAE maritime authorities
- other major flag administrations

---

### PORT STATE CONTROL

Monitor:

- Paris MoU
- Tokyo MoU
- Indian Ocean MoU
- Mediterranean MoU
- Black Sea MoU
- Abuja MoU
- Caribbean MoU
- Riyadh MoU
- USCG PSC information
- other recognized PSC authorities

Priority topics:

- detention
- deficiencies
- concentrated inspection campaigns
- new inspection focus
- safety violations
- ISM deficiencies
- fire safety
- navigation deficiencies
- machinery deficiencies
- MLC deficiencies
- pollution deficiencies

---

### HYDROGRAPHIC / NAVIGATION AUTHORITIES

Monitor:

- IHO
- UKHO
- NAVAREA information
- NAVTEX-related information
- official navigational warnings
- chart updates
- ECDIS standards
- S-100/S-101 developments
- maritime safety information

Official navigational warning systems should be treated as a distinct high-priority source category.

---

### CASUALTY INVESTIGATION AUTHORITIES

Monitor official investigation bodies such as:

- MAIB
- NTSB
- Australian Transport Safety Bureau
- Transportation Safety Board of Canada
- Danish Maritime Accident Investigation Board
- Norwegian Safety Investigation Authority
- Dutch Safety Board
- other recognized marine casualty investigation authorities

Prioritize:

- final reports
- preliminary reports
- safety recommendations
- lessons learned
- causal findings
- recurring failures

---

# 5. TIER 2 — CLASSIFICATION SOCIETIES

Monitor:

- DNV
- Lloyd's Register
- ABS
- Bureau Veritas
- ClassNK
- RINA
- CCS
- other recognized classification societies

Track:

- technical alerts
- class rules
- safety alerts
- survey requirements
- machinery issues
- structural issues
- alternative fuels
- cyber security
- cargo safety
- fire safety
- equipment failures

---

# 6. TIER 3 — MARITIME INDUSTRY ORGANIZATIONS

Monitor relevant organizations including:

- BIMCO
- ICS
- INTERTANKO
- INTERCARGO
- IACS
- OCIMF
- SIGTTO
- INTERMANAGER
- Nautical Institute
- industry safety organizations
- recognized maritime training organizations

Use these as secondary sources and industry context.

---

# 7. TIER 4 — TRUSTED MARITIME MEDIA

Monitor established maritime media such as:

- TradeWinds
- Lloyd's List
- Splash247
- gCaptain
- Seatrade Maritime
- Offshore Energy
- MarineLink
- The Maritime Executive
- other reputable maritime publications

IMPORTANT:

Media reports are discovery sources.

Whenever possible, verify important claims against an official or primary source before publishing them as confirmed facts.

---

# 8. TIER 5 — GENERAL NEWS / SOCIAL SIGNALS

Use:

- Reuters
- AP
- major international media
- publicly available social signals

ONLY for discovery.

Do not automatically treat social-media claims as confirmed facts.

If information is not independently verified:

DO NOT PRESENT IT AS CONFIRMED.

Use wording such as:

"Reports indicate..."

"Authorities are investigating..."

"Initial reports suggest..."

Only when appropriate and when the source itself supports that characterization.

---

# 9. SOURCE MONITORING ENGINE

Build a source registry.

Each source should have:

```text
source_id
source_name
source_type
country
authority_level
url
feed_url
scrape_method
update_frequency
last_checked
last_success
status
reliability_score
```

The system must support:

- RSS
- official APIs
- XML
- JSON feeds
- sitemap monitoring
- webpage monitoring
- structured extraction
- email/newsletter ingestion where technically permitted
- manual source configuration

Never hard-code the system around a small number of sources.

The source registry must be expandable.

---

# 10. POLLING / DISCOVERY ENGINE

The system should continuously monitor sources.

Recommended architecture:

### High-priority sources

Check approximately every:

5–15 minutes

### Medium-priority sources

Check approximately every:

30–60 minutes

### Low-priority sources

Check approximately every:

2–4 hours

Do not unnecessarily hammer websites.

Respect:

- robots.txt
- rate limits
- API limits
- terms of service
- HTTP caching
- ETag
- Last-Modified headers
- RSS polling efficiency

Use incremental fetching.

---

# 11. EVENT INGESTION

Every discovered item must first enter a raw event database.

Example:

```json
{
  "event_id": "...",
  "source": "...",
  "source_url": "...",
  "published_at": "...",
  "discovered_at": "...",
  "title": "...",
  "raw_text": "...",
  "category": "...",
  "location": "...",
  "vessel": "...",
  "confidence": 0,
  "status": "unverified"
}
```

Do not immediately publish.

---

# 12. DEDUPLICATION ENGINE

The same incident may appear in:

- Reuters
- TradeWinds
- IMO
- coast guard
- local authority
- social media

These must not become five separate posts.

Create:

## EVENT CLUSTERING

Use:

- URL similarity
- title similarity
- entity matching
- vessel name
- IMO number
- location
- date/time
- incident type
- semantic similarity

Example:

```text
Incident A
Incident B
Incident C
Incident D
```

must become:

```text
MASTER EVENT #4821
```

with multiple source references.

---

# 13. INCIDENT ENTITY EXTRACTION

Extract whenever available:

- vessel name
- IMO number
- flag
- vessel type
- operator
- location
- port
- country
- date
- time
- incident type
- casualties
- injuries
- fatalities
- pollution
- cargo
- fire
- collision
- grounding
- machinery failure
- weather
- navigation issue
- regulatory relevance

Do NOT invent missing information.

Use:

```text
unknown
not yet confirmed
not disclosed
```

where appropriate.

---

# 14. FACT VERIFICATION ENGINE

Before publication, classify every claim as:

### VERIFIED

Supported by authoritative/primary source.

### CORROBORATED

Supported by multiple credible independent sources.

### UNCONFIRMED

Reported but not sufficiently verified.

### FALSE / CONTRADICTED

Evidence contradicts the claim.

Only VERIFIED and appropriately CORROBORATED information should normally be used in factual photo cards.

---

# 15. REGULATORY CHANGE DETECTION

Create a dedicated regulatory monitoring engine.

Track:

- IMO amendments
- SOLAS amendments
- MARPOL amendments
- STCW amendments
- ISM
- ISPS
- MLC
- COLREG
- Load Lines
- IMDG Code
- IBC Code
- IGC Code
- IGF Code
- Polar Code
- LSA Code
- FSS Code
- CSS Code
- ESP Code
- ECDIS standards
- IHO standards
- GMDSS
- MASS
- alternative fuels
- emissions
- CII
- EEXI
- EU ETS
- FuelEU Maritime
- regional maritime regulations

For every regulatory change identify:

```text
What changed?
Who is affected?
When does it enter into force?
Is it mandatory?
Which vessels are affected?
What must shipowners/operators do?
What does a Master/OOW/Chief Engineer need to know?
What is the practical consequence?
```

---

# 16. "WHAT CHANGED?" ENGINE

Never publish a regulatory update merely saying:

"IMO updated regulation X."

Instead produce:

### BEFORE

What was the previous requirement?

### CHANGE

What changed?

### EFFECTIVE DATE

When does the change apply?

### WHO IS AFFECTED

Which ships/seafarers/operators?

### OPERATIONAL IMPACT

What changes onboard?

### COMPLIANCE ACTION

What should companies/ships do?

This makes the card useful to actual mariners.

---

# 17. SAFETY ALERT DETECTION

Safety-related content should receive high priority.

Detect:

- recurring accidents
- equipment failure patterns
- improper procedures
- unsafe mooring
- enclosed-space failures
- hot-work incidents
- lifting incidents
- pilot ladder failures
- gangway accidents
- cargo securing failures
- fire/explosion
- electrical incidents
- machinery failures
- navigation failures
- bridge resource management failures
- fatigue-related incidents
- human-factor failures
- permit-to-work failures
- LOTO failures
- PPE failures

The system should extract the:

```text
HAZARD
CAUSE
CONSEQUENCE
LESSON
PREVENTIVE ACTION
```

---

# 18. PSC INTELLIGENCE

Create a separate PSC intelligence classifier.

Detect:

- new deficiencies
- detention cases
- recurring deficiency categories
- CIC campaigns
- inspection focus
- ISM failures
- navigation deficiencies
- fire safety deficiencies
- machinery deficiencies
- MLC deficiencies
- pollution deficiencies

Generate cards such as:

> "PSC Focus: 5 Deficiencies Mariners Should Watch"

or

> "Why Ships Are Being Detained for This Deficiency"

Do not sensationalize.

---

# 19. MARITIME INCIDENT PRIORITY SCORE

Every event receives a score.

Example:

```text
Recency                  0–20
Safety impact            0–20
Operational relevance    0–15
Regulatory relevance     0–15
Human consequence        0–10
Industry significance    0–10
Source reliability       0–10
```

Total:

```text
100
```

Priority:

### 85–100
BREAKING / HIGH PRIORITY

### 70–84
HIGH VALUE

### 55–69
NORMAL

### 40–54
LOW

### <40
ARCHIVE / DO NOT PUBLISH

---

# 20. CONTENT SELECTION ENGINE

Do not simply publish the newest item.

Every hour:

1. collect new information
2. cluster duplicates
3. verify
4. score
5. classify
6. compare against previously published content
7. identify the most valuable story
8. generate card
9. validate
10. publish

If there is no meaningful new story:

DO NOT CREATE FAKE NEWS.

Instead:

- wait
- use a newly confirmed update
- publish an important regulatory development
- publish a newly released investigation finding
- publish a meaningful safety insight

Never manufacture "breaking" content.

---

# 21. REAL-TIME PHOTO CARD CONTENT TYPES

Rotate across:

### INCIDENT

"Container Ship Collision Reported..."

### SAFETY ALERT

"Safety Alert: Pilot Ladder Failure..."

### REGULATION

"IMO Rule Change: What Mariners Need to Know"

### PSC

"PSC Detention: Key Deficiency Identified"

### INVESTIGATION

"Investigation Finds Root Cause..."

### LESSON LEARNED

"Marine Casualty Lesson: Why This Happened"

### NAVIGATION

"New Navigational Warning..."

### CARGO

"Cargo Safety Alert..."

### MACHINERY

"Engine Failure: Investigation Highlights..."

### ENVIRONMENT

"Oil Pollution / MARPOL Development..."

### SECURITY

"Maritime Security Update..."

### TECHNOLOGY

"New Maritime Technology / Safety Development"

### SEAFARER

"New Safety / Welfare / STCW Development"

---

# 22. PHOTO CARD DESIGN

The photo card must look like a premium professional maritime media publication.

Not like:

- a generic Canva template
- clickbait
- meme
- low-quality news graphic
- random stock-photo collage

Visual identity:

## HEYMARINER

Use the official HeyMariner logo.

Use the established brand identity.

The card should contain:

### Top

HeyMariner logo / brand marker

### Main area

Strong maritime image or AI-generated realistic maritime visual.

### Center / lower-center

Short headline.

Prefer:

1–2 lines.

### Supporting line

One concise factual insight.

### Bottom

Category marker:

```text
MARITIME INCIDENT
SAFETY ALERT
IMO UPDATE
PSC
REGULATION
MARINE CASUALTY
```

### Optional

Date/time or "UPDATED" marker when relevant.

---

# 23. VISUAL STYLE

Use:

- realistic maritime photography
- cinematic ship imagery
- authentic vessel appearance
- professional news-card composition
- strong hierarchy
- clean typography
- restrained colors
- maritime atmosphere
- high contrast
- professional newsroom aesthetic

Avoid:

- cartoon graphics
- excessive gradients
- unrealistic ships
- impossible navigation equipment
- wrong vessel types
- fake IMO numbers
- fake logos
- excessive text
- sensational imagery

---

# 24. AI IMAGE GENERATION

When an actual incident photograph is not available or cannot legally be reused:

Generate a REPRESENTATIVE visual.

Never present an AI-generated image as the actual incident photograph.

If needed:

```text
Representative Image
```

or equivalent subtle disclosure.

If an authentic public-domain/authorized image is available, prefer the authentic image.

---

# 25. INCIDENT IMAGE SAFETY

For casualties:

DO NOT use:

- graphic corpses
- graphic injuries
- gore
- sensationalized death imagery

Prefer:

- vessel at sea
- smoke
- rescue vessel
- port response
- coast guard vessel
- damaged ship from safe distance
- maritime environment
- equipment
- symbolic operational visual

---

# 26. CARD COPY GENERATION

Every card must answer:

### WHAT?

What happened?

### WHERE?

Where?

### WHEN?

When?

### WHY IMPORTANT?

Why should a mariner care?

Use the minimum text necessary.

Example:

```text
FATAL ENGINE-ROOM INCIDENT

A crew member died following an
engine-room accident aboard a
commercial vessel.

SAFETY LESSON:
Permit-to-work and isolation controls
remain critical during machinery work.
```

Never add facts not supported by sources.

---

# 27. SOURCE TRACEABILITY

Every generated story must maintain internal metadata:

```text
primary_source
secondary_sources
source_urls
publication_date
verification_time
editorial_status
confidence
```

The public social post does not necessarily need to expose every URL, but the backend must retain the full evidence trail.

---

# 28. EDITORIAL AUDIT TRAIL

Store:

```text
raw article
extracted facts
verified facts
AI analysis
final headline
final caption
image prompt
generated image
source references
publication timestamp
platform IDs
```

This makes the system auditable.

---

# 29. REAL-TIME UPDATE MODEL

A story must be updateable.

Example:

### Version 1

"Collision reported involving two vessels."

### Version 2

"Authorities confirm collision; rescue operation underway."

### Version 3

"Authorities report one fatality."

### Version 4

"Investigation launched."

Do NOT create four unrelated stories if they are the same event.

Create:

```text
EVENT ID
```

and update the event.

---

# 30. UPDATE DETECTION

If a previously published event receives meaningful new information:

Generate an UPDATE CARD.

Examples:

```text
UPDATE — Collision Investigation

UPDATE — Death Toll Confirmed

UPDATE — Vessel Salvaged

UPDATE — Port Reopened

UPDATE — Investigation Findings Released
```

Only publish an update when the new information is materially significant.

---

# 31. ANTI-DUPLICATION

Maintain:

```text
published_event_ids
published_story_hashes
published_topics
published_headlines
published_entities
```

Prevent:

- same incident repeated
- same regulation repeated
- same headline repeated
- same image repeated
- same story angle repeated

unless there is a legitimate update.

---

# 32. CONTENT ROTATION

The system must balance:

```text
Incidents
Safety
Regulations
PSC
Investigation
Navigation
Cargo
Machinery
Environment
Security
Seafarer
Technology
```

Do not publish eight collision stories in one day just because they are available.

---

# 33. DAILY PUBLISHING RAMP

Implement the following exact rollout.

## WEEK 1

Target:

### 3 photo cards/day

The system should run at the configured hourly scheduler but publish only the highest-value 3 items per day.

Recommended spacing:

```text
Morning
Afternoon
Evening
```

---

## WEEK 2

Target:

### 6 photo cards/day

Approximately every 4 hours, while still allowing event-driven breaking updates.

---

## WEEK 3 AND ONWARD

Target:

### 8 photo cards/day

Approximately every 3 hours.

However, the schedule must remain intelligent.

DO NOT publish low-quality content merely to hit eight.

---

# 34. IMPORTANT SCHEDULER RULE

The system should use a scheduler around:

```text
HH:22
```

Example:

```text
06:22
07:22
08:22
09:22
...
```

The scheduler can perform a research scan every hour at approximately XX:22.

BUT:

### SCAN ≠ PUBLISH

Every hourly scan should:

1. fetch new information
2. compare with previous data
3. verify
4. score
5. determine whether there is publish-worthy content

Only the daily publishing quota should determine normal publishing.

Breaking events may bypass the normal queue if their priority score is extremely high.

---

# 35. FIRST-WEEK SCHEDULE

Example:

```text
06:22 → Research scan
07:22 → Research scan
08:22 → Research scan
09:22 → Research scan
10:22 → Research scan
...
```

Publishing engine selects 3 strongest stories.

Example:

```text
08:22 → Card 1
14:22 → Card 2
20:22 → Card 3
```

Do not hard-code these exact publication times if the research engine finds a better distribution.

---

# 36. SECOND-WEEK SCHEDULE

Research continuously.

Publish approximately:

```text
06:22
10:22
14:22
18:22
21:22
23:22
```

But intelligently adapt based on:

- story priority
- audience timezone
- freshness
- platform performance
- breaking events

---

# 37. WEEK 3+

Target:

```text
8 photo cards/day
```

Use approximately 3-hour intervals.

Example:

```text
06:22
09:22
12:22
15:22
18:22
20:22
22:22
00:22
```

Again:

The scheduler is a baseline.

The intelligence engine controls the actual publication decision.

---

# 38. BREAKING EVENT OVERRIDE

If:

```text
priority_score >= 90
```

and the event is:

- major casualty
- major collision
- major fire
- sinking
- major pollution
- major navigational hazard
- major regulatory emergency
- major maritime security incident

the system may publish outside the normal schedule.

Mark:

```text
BREAKING
```

or:

```text
URGENT MARITIME UPDATE
```

only when justified.

---

# 39. TIMEZONE STRATEGY

Because HeyMariner has an international audience, do not build the system around Bangladesh time alone.

Store all timestamps internally in:

```text
UTC
```

Then calculate publishing schedules for target audiences.

Primary audience:

- international seafarers
- officers
- cadets
- maritime professionals
- shipowners
- maritime students

The system should eventually learn optimal publication times from analytics.

---

# 40. CONTENT DATABASE

Create database entities:

```text
Source
RawEvent
MasterEvent
Fact
Verification
Story
Image
PhotoCard
Publication
Platform
Topic
Regulation
Incident
Entity
```

---

# 41. MASTER EVENT SCHEMA

Example:

```json
{
  "event_id": "HM-2026-000123",
  "event_type": "collision",
  "title": "...",
  "vessels": [],
  "location": "...",
  "event_time": "...",
  "discovered_at": "...",
  "sources": [],
  "verified_facts": [],
  "unverified_claims": [],
  "priority_score": 87,
  "status": "verified",
  "last_updated": "...",
  "published": true
}
```

---

# 42. REGULATION SCHEMA

```json
{
  "regulation_id": "...",
  "organization": "IMO",
  "instrument": "SOLAS",
  "reference": "...",
  "change_type": "amendment",
  "old_requirement": "...",
  "new_requirement": "...",
  "adoption_date": "...",
  "effective_date": "...",
  "affected_vessels": [],
  "affected_seafarers": [],
  "operational_impact": "...",
  "compliance_action": "...",
  "sources": []
}
```

---

# 43. RESEARCH PIPELINE

Implement:

```text
SOURCE MONITORING
      ↓
RAW INGESTION
      ↓
NORMALIZATION
      ↓
ENTITY EXTRACTION
      ↓
DUPLICATE DETECTION
      ↓
EVENT CLUSTERING
      ↓
SOURCE VERIFICATION
      ↓
FACT EXTRACTION
      ↓
MARITIME RELEVANCE SCORE
      ↓
PRIORITY SCORE
      ↓
EDITORIAL DECISION
      ↓
STORY GENERATION
      ↓
IMAGE GENERATION
      ↓
QUALITY CONTROL
      ↓
SEO / PLATFORM COPY
      ↓
PUBLISHING QUEUE
      ↓
SOCIAL APIs
      ↓
ANALYTICS
      ↓
FEEDBACK LOOP
```

---

# 44. QUALITY CONTROL BEFORE IMAGE GENERATION

Check:

### FACTS

Are all factual claims supported?

### DATE

Is the date correct?

### LOCATION

Is the location correct?

### VESSEL

Is the vessel identity correct?

### REGULATION

Is the regulation/reference correct?

### EFFECTIVE DATE

Is the effective date correct?

### SOURCE

Is the source authoritative enough?

### DUPLICATION

Has this already been published?

### SENSITIVITY

Does the story involve death/injury?

### LANGUAGE

Is the wording professional?

Only proceed if the card passes QC.

---

# 45. IMAGE QUALITY CONTROL

After image generation:

Check:

- vessel geometry
- ship type
- bridge
- deck
- cranes
- containers
- lifeboats
- navigation lights
- smokestacks
- maritime environment
- weather
- port/sea setting

Do not generate obviously impossible maritime visuals.

For example:

Never generate:

- tanker with container cranes unless appropriate
- bulk carrier with impossible deck equipment
- navigation equipment in wrong location
- incorrect vessel proportions
- impossible bridge layout
- aircraft-style cockpit on a ship
- fake IMO numbers

---

# 46. SOCIAL COPY

Generate platform-specific content.

## FACEBOOK

Professional maritime news/safety caption.

No URL.

No external links.

Focus on:

- what happened
- why it matters
- safety/regulatory insight
- discussion question when appropriate

---

## INSTAGRAM

Shorter caption.

No URL.

Strong first line.

Relevant maritime hashtags.

---

## TIKTOK

Short caption.

No URL.

More than 10 relevant hashtags.

Include discovery hashtags such as:

```text
#Maritime
#MerchantNavy
#Seafarers
#MarineSafety
#Shipping
#MaritimeNews
#Seaman
#DeckOfficer
#MarineEngineer
#HeyMariner
#FYP
#ForYou
```

Only use hashtags relevant to the actual story.

---

## LINKEDIN

Professional industry analysis.

No unnecessary clickbait.

Emphasize:

- compliance
- operational impact
- safety
- lessons learned
- regulatory significance

---

## X

Short breaking-news style summary.

---

# 47. YOUTUBE COMMUNITY / SHORT-FORM SUPPORT

If useful, create:

- community post
- short-form news card
- image post

But this engine's primary output remains the photo card.

---

# 48. HASHTAG ENGINE

Do not hard-code the same hashtags forever.

Generate hashtags from:

```text
topic
incident type
vessel type
regulation
geography
maritime profession
audience
```

Keep a global blacklist for:

- spam hashtags
- irrelevant hashtags
- banned terms
- misleading terms

---

# 49. SEO ENGINE

Generate:

### Primary keyword

Example:

```text
maritime safety alert
```

### Secondary keywords

```text
merchant navy
marine incident
ship safety
maritime regulation
IMO
SOLAS
```

### Long-tail keyword

Example:

```text
what mariners should learn from recent ship collision
```

Use naturally.

Do not keyword stuff.

---

# 50. IMAGE FILE NAMING

Use:

```text
heymariner-[topic]-[event]-[date]-[slug].webp
```

Example:

```text
heymariner-cargo-ship-collision-red-sea-2026-11-13.webp
```

---

# 51. IMAGE METADATA

Store:

```text
alt_text
caption
source
license
generated_by_ai
prompt
created_at
event_id
```

---

# 52. BRANDING

Every photo card must visibly establish HeyMariner.

Use:

```text
HEYMARINER
```

with the official logo.

Do not redesign the brand automatically.

Do not alter the logo.

Do not distort it.

Maintain consistent:

- logo placement
- typography
- spacing
- visual hierarchy
- brand proportions

---

# 53. MULTI-LANGUAGE POSSIBILITY

Architecture should support future languages:

```text
English
Bangla
German
Arabic
Hindi
```

But initial production language:

## ENGLISH

Do not translate automatically unless explicitly enabled.

---

# 54. HUMAN-READABILITY

The final card must be understandable by:

- cadets
- junior officers
- senior officers
- Masters
- Chief Engineers
- maritime students
- ship managers
- safety professionals

Avoid unnecessary legal/technical jargon unless the topic requires it.

When technical terminology is necessary, use the correct maritime terminology.

---

# 55. EDITORIAL STYLE

Tone:

- professional
- factual
- calm
- maritime-industry focused
- safety-oriented
- educational
- analytical

Never use:

- fake urgency
- fabricated claims
- sensationalism
- fearmongering
- clickbait
- political bias
- speculation presented as fact

---

# 56. "WHY MARINERS SHOULD CARE" LAYER

This is one of the most important HeyMariner differentiators.

For every relevant story, identify:

> Why should a mariner care?

Example:

Incident:

"Engine-room fire"

Maritime insight:

"Fuel leakage near hot surfaces can rapidly escalate into an engine-room fire."

Practical relevance:

"Engine-room rounds should include inspection for fuel-oil leakage around hot surfaces and insulation."

This converts news into professional maritime intelligence.

---

# 57. LESSON-LEARNED ENGINE

For casualty/investigation content:

```text
EVENT
↓
CAUSE
↓
CONTRIBUTING FACTORS
↓
FAILURE
↓
CONSEQUENCE
↓
LESSON
↓
PREVENTIVE ACTION
```

This is especially valuable for HeyMariner.

---

# 58. REGULATION → PRACTICAL IMPACT ENGINE

For regulatory content:

```text
RULE
↓
CHANGE
↓
EFFECTIVE DATE
↓
AFFECTED SHIPS
↓
AFFECTED CREW
↓
ONBOARD IMPACT
↓
COMPLIANCE ACTION
```

This should become a signature HeyMariner content format.

---

# 59. SAFETY → ACTION ENGINE

For safety alerts:

```text
HAZARD
↓
WHAT CAUSED IT
↓
WHAT WENT WRONG
↓
WHAT MARINERS SHOULD CHECK
```

---

# 60. SOURCE CITATION POLICY

The internal database must preserve source URLs.

When a story is based on an official source, record:

```text
Source: IMO
Source URL: ...
Published: ...
Verified: ...
```

For regulatory claims, prefer primary sources.

For incident claims, prefer:

1. investigating authority
2. coast guard / maritime authority
3. shipowner/operator statement
4. reputable media
5. secondary reports

---

# 61. CONFLICTING REPORTS

If sources disagree:

DO NOT merge contradictory claims into one statement.

Store:

```text
Claim A
Claim B
```

and identify the conflict.

If unresolved, use wording such as:

> "Initial reports differ regarding..."

Do not choose a version simply because it is more dramatic.

---

# 62. SOURCE FAILURE

If a source fails:

```text
retry
↓
exponential backoff
↓
fallback source
↓
log failure
```

Never allow one failed website to stop the whole engine.

---

# 63. RATE LIMITING

Implement:

```text
per-source rate limit
global request limit
retry policy
cache
request timeout
circuit breaker
```

---

# 64. SYSTEM RESILIENCE

If:

- AI image generation fails
- one news source fails
- one API fails
- social platform fails
- one image model fails

the pipeline should continue where possible.

Example:

```text
Research
    ↓
Story created
    ↓
Image API failed
    ↓
Retry
    ↓
Fallback image generation
    ↓
Continue
```

---

# 65. PUBLISHING ARCHITECTURE

The publishing system must be API-driven.

Preferred architecture:

```text
Research Engine
      ↓
Content Database
      ↓
Media Generator
      ↓
Publishing Queue
      ↓
GitHub Actions
      ↓
Platform APIs
```

GitHub should execute the scheduled workflows.

Claude/Muse is the engineering/planning/maintenance layer.

Do not make Claude/Muse itself the production publisher.

---

# 66. GITHUB SECRETS

Never hard-code credentials.

Use GitHub Secrets for:

```text
OPENAI_API_KEY
ELEVENLABS_API_KEY
FACEBOOK_ACCESS_TOKEN
FACEBOOK_PAGE_ID
INSTAGRAM_ACCESS_TOKEN
YOUTUBE_CLIENT_ID
YOUTUBE_CLIENT_SECRET
LINKEDIN_ACCESS_TOKEN
X_API_KEY
X_API_SECRET
X_ACCESS_TOKEN
X_ACCESS_SECRET
DATABASE_URL
STORAGE credentials
```

Only include secrets actually required by the implementation.

---

# 67. GITHUB WORKFLOW

Create separate workflows:

```text
research-hourly.yml
event-processor.yml
story-generator.yml
image-generator.yml
photo-card-qc.yml
publish-facebook.yml
publish-instagram.yml
publish-linkedin.yml
publish-x.yml
analytics.yml
cleanup.yml
health-check.yml
```

Do not create one giant workflow if modular workflows are cleaner.

---

# 68. CRON

Primary research scheduler:

```text
HH:22
```

Every hour.

Example:

```cron
22 * * * *
```

Publishing scheduler should be independent from research.

---

# 69. DATABASE / STORAGE

Use a persistent database.

Do not rely on GitHub repository files as the primary database.

Recommended logical tables:

```text
sources
raw_items
events
event_sources
facts
verifications
stories
images
photo_cards
publications
platform_posts
analytics
regulations
topics
```

---

# 70. CONTENT LIFECYCLE

```text
DISCOVERED
↓
INGESTED
↓
NORMALIZED
↓
CLUSTERED
↓
VERIFIED
↓
SCORED
↓
SELECTED
↓
DRAFTED
↓
IMAGE GENERATED
↓
QC
↓
APPROVED
↓
QUEUED
↓
PUBLISHED
↓
ANALYZED
↓
ARCHIVED
```

---

# 71. ANALYTICS FEEDBACK

After publishing track:

- impressions
- reach
- engagement
- shares
- comments
- saves
- CTR where available
- watch/attention metrics where applicable
- best-performing topics
- best-performing headlines
- best-performing visual styles
- best publishing times

Use this data to improve:

```text
topic priority
headline style
publication timing
visual style
content mix
```

Do NOT allow analytics to override factual/editorial integrity.

---

# 72. TREND DETECTION

If multiple events occur around the same subject:

Example:

```text
5 enclosed-space incidents
3 pilot-ladder failures
4 mooring accidents
```

detect:

## TREND

Then create a higher-level maritime insight card:

> "Why Enclosed-Space Incidents Keep Appearing in Marine Casualty Reports"

This is more valuable than simply publishing every individual event.

---

# 73. WEEKLY INTELLIGENCE SUMMARY

Although the primary system publishes daily cards, maintain an internal weekly report:

```text
Top incidents
Top regulations
Top safety issues
Top PSC deficiencies
Emerging risks
Most discussed topics
```

This can later feed long-form HeyMariner content.

---

# 74. ARCHIVE

Never delete important intelligence immediately.

Maintain:

```text
event history
regulation history
source history
publication history
```

This allows future:

- trend analysis
- monthly reports
- annual reports
- educational videos
- investigation explainers
- regulatory timelines

---

# 75. IMPORTANT: CURRENT INFORMATION MUST ALWAYS BE CHECKED

Before describing something as:

```text
NEW
LATEST
RECENT
TODAY
BREAKING
JUST ANNOUNCED
EFFECTIVE NOW
```

the engine must verify the timestamp.

Never use old information as current simply because an article is resurfacing.

---

# 76. DATE LOGIC

Store:

```text
published_at
updated_at
discovered_at
verified_at
effective_date
event_date
```

These are different fields.

Do not confuse:

```text
article publication date
```

with:

```text
incident date
```

or:

```text
regulation effective date
```

---

# 77. CURRENT-DATE VALIDATION

Every research cycle should know:

```text
CURRENT UTC DATE
CURRENT UTC TIME
```

All freshness calculations should be based on UTC.

---

# 78. FRESHNESS SCORE

Example:

```text
< 1 hour       = 100
1–3 hours      = 90
3–6 hours      = 80
6–12 hours     = 70
12–24 hours    = 60
1–3 days       = 45
3–7 days       = 30
> 7 days       = context dependent
```

But older content may still receive high priority if:

- new investigation released
- new regulation effective
- major official update
- safety lesson newly published

---

# 79. DO NOT CHASE EVERY STORY

The engine must reject:

- celebrity content
- generic world news
- unverified social media
- irrelevant political stories
- recycled clickbait
- minor shipping announcements
- commercial press releases with no maritime value

unless they have genuine maritime significance.

---

# 80. FINAL DAILY CONTENT MIX

For the 8-card/day mature system, aim approximately for:

### 2 Incident / Casualty

### 2 Safety / Lessons Learned

### 1 Regulation / IMO / Compliance

### 1 PSC / Inspection / Enforcement

### 1 Navigation / Cargo / Machinery / Technical

### 1 Maritime Industry / Emerging Risk / Important Development

This is a TARGET, not a rigid rule.

Breaking events override the normal mix.

---

# 81. EXAMPLE DAY

### CARD 1

MARINE CASUALTY

"Bulk Carrier Grounds Near..."

### CARD 2

SAFETY ALERT

"Investigation Highlights Mooring-Line Risk"

### CARD 3

IMO UPDATE

"New SOLAS Requirement: What Changes?"

### CARD 4

PSC

"Port State Control Targets This Deficiency"

### CARD 5

NAVIGATION

"New Maritime Safety Information Issued"

### CARD 6

MACHINERY

"Engine Failure Investigation Reveals..."

### CARD 7

SEAFARER SAFETY

"New Guidance on Working Aloft"

### CARD 8

LESSON LEARNED

"3 Lessons From Recent Marine Casualties"

---

# 82. SYSTEM PRIORITY

The system's priorities are:

```text
1. Accuracy
2. Safety
3. Authority
4. Freshness
5. Maritime relevance
6. Practical value
7. Professional presentation
8. Engagement
9. Publishing frequency
```

Publishing frequency must NEVER outrank accuracy.

---

# 83. FINAL ACCEPTANCE TEST

Before declaring the system complete, test:

### Research

Can it discover a new maritime event?

### Verification

Can it distinguish primary vs secondary sources?

### Deduplication

Can it merge five reports about the same incident?

### Regulation

Can it identify what changed and effective date?

### Safety

Can it extract lessons learned?

### Image

Can it create a professional HeyMariner photo card?

### QC

Can it reject hallucinated facts?

### Scheduler

Can it scan every hour at XX:22?

### Week 1

Can it publish 3/day?

### Week 2

Can it publish 6/day?

### Week 3+

Can it publish 8/day?

### Breaking

Can it bypass the normal schedule for a genuinely critical event?

### Publishing

Can GitHub publish automatically using encrypted secrets?

### Recovery

Can the system recover from API/source failures?

### Audit

Can every published card be traced back to its source evidence?

---

# 84. MOST IMPORTANT ENGINEERING RULE

Do not build a simple:

```text
RSS → AI → Image → Facebook
```

pipeline.

Build:

```text
GLOBAL MARITIME SOURCES
        ↓
REAL-TIME MONITORING
        ↓
INTELLIGENCE INGESTION
        ↓
ENTITY EXTRACTION
        ↓
DUPLICATE CLUSTERING
        ↓
SOURCE VERIFICATION
        ↓
FACT VALIDATION
        ↓
MARITIME RELEVANCE
        ↓
SAFETY / REGULATORY ANALYSIS
        ↓
PRIORITY SCORING
        ↓
EDITORIAL SELECTION
        ↓
HEYMARINER STORY
        ↓
HEYMARINER PHOTO CARD
        ↓
QUALITY CONTROL
        ↓
PLATFORM SEO/COPY
        ↓
GITHUB PUBLISHING
        ↓
ANALYTICS
        ↓
TREND DETECTION
        ↓
INTELLIGENCE FEEDBACK LOOP
```

This architecture is the foundation of the HeyMariner Real-Time Maritime Intelligence Engine.

---

# 85. CLAUDE/MUSE EXECUTION INSTRUCTION

Do not merely explain this architecture.

Inspect the existing HeyMariner repository and existing automation infrastructure first.

Identify:

- current framework
- existing video engine
- existing image generation system
- current GitHub workflows
- current secrets
- current publishing APIs
- database
- storage
- existing brand assets
- existing logo
- existing social integrations
- existing SEO system

Then produce an implementation plan.

After that:

1. create the required architecture
2. create database schemas
3. create source registry
4. create research engine
5. create event clustering
6. create verification engine
7. create scoring engine
8. create content generator
9. create photo-card generator
10. create QC system
11. create scheduler
12. create GitHub Actions
13. integrate publishing APIs
14. integrate analytics
15. test the full pipeline
16. document everything

Do not unnecessarily replace working infrastructure.

Reuse existing components where technically sound.

Do not ask for permission for every small implementation decision.

Make reasonable engineering decisions independently.

If an API, source, package, or platform has changed, verify its current documentation before implementing against it.

Never hard-code API keys.

Never expose secrets in logs.

Never publish unverified maritime information as fact.

The final system must be production-oriented, modular, fault-tolerant, auditable, scalable, and maintainable.

Most importantly:

## HeyMariner must become a REAL-TIME MARITIME INTELLIGENCE PLATFORM, not merely an automated social-media poster.