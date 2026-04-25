# TalkToRave

Vibe-code music with your voice. TalkToRave is a voice-driven live-coding
environment built on top of [Strudel](https://codeberg.org/uzu/strudel) —
hold a key, describe the track you want, and an LLM rewrites the running
pattern in place without breaking the beat.

- **Frontend** — Astro / React REPL, forked from Strudel
- **Backend** — `services/api` ([Fastify](https://fastify.dev)) wrapping:
  - Google Gemini for natural-language → Strudel code
  - the [ai-coustics](https://www.ai-coustics.com) speech-enhancement SDK
    as a quality stage for noisy mic input
- **Voice in** — Web Speech API for STT, push-to-talk hotkey (default
  `Space`), conversation history persisted server-side per session

Built for the **Big Berlin Hack 2026 — Voice Interface in the Wild** track.

## Running locally

Requires Node ≥ 20.6 and [pnpm](https://pnpm.io). Add a `.env` at the repo
root:

```env
GEMINI_API_KEY=...        # https://aistudio.google.com/app/apikey
GEMINI_MODEL=gemini-2.5-flash
AIC_SDK_LICENSE=...       # https://developers.ai-coustics.com (optional)
```

Then:

```bash
pnpm install
pnpm dev          # REPL frontend on http://localhost:4321
pnpm dev:api      # backend on http://localhost:4322
```

Open the **vibe** tab in the side panel, hold `Space` anywhere on the page,
describe a track, release. The generated pattern hot-swaps into the running
scheduler — no audible break.

## License

[GNU AGPL v3](LICENSE) — inherited from Strudel. Anything you ship based on
this repo must be open-sourced under the same license.

Strudel itself was created by Felix Roos, Alex McLean, and many others; the
underlying packages (`@strudel/core`, `@strudel/mini`, `@strudel/webaudio`,
…) are unchanged in this fork. See
[Strudel's contributors](https://codeberg.org/uzu/strudel/activity/contributors).

Default sound bank licensing lives in
[dough-samples](https://github.com/felixroos/dough-samples/blob/main/README.md).
