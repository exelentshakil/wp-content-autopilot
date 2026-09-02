# PRD — WP Content Autopilot

## Problem

David runs a WordPress site built on ACF. Every article costs him seven manual
steps: prompt ChatGPT, strip dashes/HTML, wrap headings in `.david`, insert CTA
shortcodes, hand-link keywords, build a topic image in Photoshop against 2-3
templates, then paste everything into 3-4 ACF fields and publish.

## Core principle

**The pipeline is rule-driven, not a black box.** Every formatting decision —
heading class, CTA text and position, the keyword→URL dictionary, which ACF
field each piece lands in — lives in Settings, not in a prompt or in code. That
is what lets David trust the output matches *his* rules instead of generic AI
formatting he'd have to fix by hand anyway. `/api/format-rules` publishes the
active rule set so it can be audited without generating anything.

## Scope

**In:** title → LLM article generation (configurable system prompt) →
formatting pipeline (dash strip, HTML strip, heading wrap, CTA insert, keyword
auto-link) → topic image generation (title baked onto a branded template) →
ACF field mapping preview → WordPress publish (instant or scheduled) via
REST + ACF REST.

**Out (this phase):** literal Photoshop `.psd` rendering (recreated in code
instead — see Honest gap), batch/queue processing of many titles unattended,
auth/multi-user accounts, editorial review workflow.

## Data model

Nothing is persisted server-side except anonymous traffic logs. All operating
config (`Settings`: API keys, WP credentials, formatting rules, ACF field
names) lives in the browser's `localStorage` and is sent per-request to this
app's own API routes — never stored on a server.

## Pipeline

1. `POST /api/generate` — calls Gemini/OpenAI (or a deterministic simulator
   with no key configured) with the user's system prompt, then runs the
   formatting pipeline against the raw article.
2. `GET /api/image` — renders a 1200×630 topic image at request time
   (`next/og`, edge runtime, no external service or key needed) using the
   title and a chosen template.
3. `POST /api/publish` — maps the formatted body, CTA, and image URL into the
   configured ACF field names and POSTs to `/wp-json/wp/v2/posts` with Basic
   Auth (WordPress Application Passwords). With no WP credentials configured,
   returns a clearly-labelled simulated result instead of failing.
4. `POST /api/format-rules` — returns the active rule set for audit.

## Non-functionals

- Every external dependency has a credential-free fallback so the demo works
  with zero setup.
- `/api/health` reports which layers are actually live.
- No secrets stored server-side; API keys and WP credentials never leave the
  request that uses them.

## Phases

- **Phase 0 (done, this demo):** full pipeline above, working UI, simulated +
  live paths for both LLM and WordPress.
- **Phase 1:** wire to David's real WordPress site + real ACF field names,
  confirm the REST/ACF plugin config on his install.
- **Phase 2:** match his actual `.psd` templates pixel-for-pixel (background
  photo compositing, exact fonts/colors) instead of the current three
  code-native templates.
- **Phase 3:** batch mode — paste a list of titles, generate/publish/schedule
  all of them in one run.

## Risks

- ACF's REST exposure depends on his plugin/version — some setups need the
  ACF-to-REST-API plugin or `show_in_rest` on each field group. Needs a quick
  check against his actual site.
- Image compositing won't be pixel-identical to his `.psd` templates until we
  see them.

## Acceptance criteria (checked against his own steps)

- [x] 1. Title → generated article
- [x] 2. Long dashes stripped, stray HTML stripped
- [x] 3. Headings wrapped in his configured class
- [x] 4. CTA shortcode inserted at a configurable position
- [x] 5. Keyword→URL auto-linking from a dictionary
- [x] 6. Topic image generated with the title baked in, template-selectable
- [x] 7. Content + image mapped into named ACF fields and posted to WordPress,
      instant or scheduled
