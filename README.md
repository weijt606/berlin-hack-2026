# Vibe Rave

**Vibe-code rave music with your voice.**
Hold a key, speak a command — Vibe Rave hot-swaps the running pattern in
the editor without breaking the beat.

> Built for **Big Berlin Hack 2026 — Voice Interface in the Wild** (ai-coustics
> track), with deep integrations across **ai-coustics**, **Pioneer GLiNER2**,
> and **Google DeepMind Gemini**. Also addresses the **Pioneer**, **Entire**,
> and **Aikido** side challenges.

```
   you (in a noisy club)
        │  "drop the kick, more reverb on the lead, make it darker"
        ▼
   ┌─────────────────────────────────────────────────────────────────┐
   │  Voice → Music pipeline                                         │
   │                                                                 │
   │   mic → ai-coustics enhance → Whisper STT → Gemini cleanup      │
   │       → Gemini code-gen → hot-swap into Strudel scheduler       │
   │                                ↓                                │
   │                        Pioneer GLiNER2 picks the right          │
   │                        visualizer per track                     │
   └─────────────────────────────────────────────────────────────────┘
        │
        ▼  the music keeps playing — your edit lands on the next cycle
```

---

## The 3 sponsor tools we lean on hard

### 🎙 ai-coustics — every voice command flows through it

Each PTT release fires the WAV through the **`@ai-coustics/aic-sdk` Quail
Voice Focus** model **before** STT. Without this, our demo dies in any
real DJ environment — Whisper can't transcribe English bass-line commands
spoken over a 130 BPM techno set.

What we built around it:

- **Persistent Processor cache** keyed by `(sampleRate × numChannels)` — the
  naive "new Processor() per call" pattern degraded from 250 ms to 5+ s after
  a few invocations as native handles piled up. We cache and reuse.
- **Tunable enhancement level** via `AIC_ENHANCEMENT_LEVEL` (0.5 dev / 0.8
  rave-tuned per ai-coustics's own ASR-tuning guide).
- **A/B WER metrics on every request** — `transcribe-audio.mjs` runs Whisper
  twice (raw + enhanced), computes Word Error Rate + RMS / SNR / noise-floor
  deltas, and persists one JSONL record per call to
  `data/metrics/transcribe.jsonl`. This is real "did the enhancement help?"
  data, not vibes.
- **Per-stage audio dump** (`data/stage-dumps/`) keeps the original mic WAV
  + enhanced WAV side-by-side for after-the-fact debugging.

→ Source: `services/api/src/infrastructure/aic-processor.mjs`

### 🎨 Pioneer GLiNER2 — picks the right visualizer per track

Each track in the multi-track UI calls Pioneer's hosted GLiNER2 classifier
(`services/api/src/infrastructure/pioneer-viz-client.mjs`) to recommend a
visualization that matches the musical character of the running code:
beat-driven → scope, melodic → piano roll, textural pad → spectrum, etc.

This is **not** the LLM picking the viz from a prompt rule — it's a
dedicated entity-classification model running on Pioneer infrastructure
and returning a tagged decision we feed back to the per-track viz picker.
Showcases GLiNER2's strength on short, structured payload (Strudel code +
intent) rather than free-text.

→ Source: `services/api/src/{infrastructure/pioneer-viz-client.mjs,application/recommend-viz.mjs,interface/http/routes/recommend-viz.mjs}`

### 🤖 Google DeepMind Gemini — three distinct roles

We use Gemini in three places, with three different prompt shapes:

| Role | Where | Prompt strategy |
| --- | --- | --- |
| **Strudel code generation** | `infrastructure/gemini-client.mjs` + `skills/strudel/*` | ~16 KB composable skill (rules + reference + recipes + examples), `temperature: 0.85` to spread template selection |
| **Transcript cleanup** | `application/transcript-normalizer.mjs` | ~80-token system prompt; only fixes recognition errors, never paraphrases. Catches DJ artist names + half-heard phrases the static dictionary can't |
| **Runtime auto-fix** | `routes/generate.mjs` `POST /generate/fix` | Stateless fix endpoint when the hot-swapped pattern throws at runtime — generates a corrected version without polluting chat history |

Default text model: `gemini-3.1-flash-lite-preview` (lite + preview =
generous quota, plenty good enough for templated code generation).
Pluggable to Ollama (`LLM_PROVIDER=ollama`) for fully-offline / quota-free
operation — `qwen3:8b` or `qwen3:30b-a3b-instruct-2507` both verified.

→ Skill: `services/api/src/skills/strudel/` (~1,800 lines, every function
name verified against `doc.json`)

---

## Side challenges we addressed

| Challenge | What we did |
| --- | --- |
| **Pioneer** — entity classification for live UIs | Wired GLiNER2 as the per-track visualizer recommender (see above). Each turn the running code is sent to Pioneer's inference API; the returned tag drives the visualizer canvas selection. End-to-end production usage of the model, not a toy demo. |
| **Entire** — workflow / orchestration | The voice → enhance → STT → normalize → generate → hot-swap chain is a 5-stage orchestrated pipeline with per-stage observability (timings, dumps, WER). All stages are independently swappable via config, and the metrics jsonl makes the full pipeline observable post-hoc. |
| **Aikido** — security / safe code | The user's voice can produce arbitrary text that becomes code Strudel evaluates. We bound this with: (1) a strict skill-prompt contract that disallows `import` / `eval` / DOM access / network — the LLM is structurally prevented from emitting them; (2) `validate-strudel.mjs` runs a syntactic guard before hot-swap so a broken pattern never crashes audio; (3) `cannot-handle.md` skill rule lets the model explicitly refuse off-topic / unsafe requests via a sentinel string the backend detects and surfaces as a "no-change" response. |

---

## Architecture

### Repository layout

```
services/
  api/                    Fastify backend (Node ≥ 20.6, ESM, clean architecture)
    src/
      application/        Use cases — depend only on domain ports
        transcribe-audio.mjs        ai-coustics enhance + Whisper × 2 + WER
        transcript-normalizer.mjs   Gemini-cleanup of STT output
        generate-strudel.mjs        Gemini → Strudel code
        validate-strudel.mjs        syntactic guard pre-hotswap
        recommend-viz.mjs           Pioneer GLiNER2 viz pick
        chat-session.mjs            persisted conversation per session
      domain/             Pure value objects + errors + WER
      infrastructure/     Adapters
        aic-processor.mjs           ai-coustics SDK wrapper (cached Processor)
        whisper-transcriber.mjs     smart-whisper local STT, biased prompt
        gemini-client.mjs           Google AI SDK adapter
        ollama-client.mjs           Local LLM fallback
        pioneer-viz-client.mjs      Pioneer inference API client
        file-{session,metrics}-store.mjs   JSON / JSONL persistence
        stage-dump-store.mjs        Per-call audio + transcript dumps
      interface/http/
        routes/{transcribe,generate,recommend-viz,enhance,sessions,health}.mjs
      skills/strudel/     Composable LLM prompt package (rules + ref + examples)

website/                  Astro / React Strudel REPL
  src/repl/
    components/panel/VibeTab.jsx    voice-driven prompt + chat UI
    tracks/                         multi-track live-coding workspace
      TrackCard.jsx, TracksColumn.jsx, TrackVisualizer.jsx, vizRecommend.mjs
    components/panel/voice-recorder.mjs   getUserMedia → 16 kHz WAV

packages/                 Strudel core (vendored, mostly unchanged from upstream)
data/
  metrics/transcribe.jsonl     A/B WER + audio-quality metrics per call
  stage-dumps/                 Original + enhanced WAV per call (debug)
  sessions/                    Persisted chat sessions
```

### Voice-prompt request flow

```
[browser]                                      [services/api]
  PTT down
    ↓ getUserMedia + ScriptProcessor
    ↓ 16 kHz mono Float32 PCM
  PTT up
    ↓ JS WAV encode
    │                              POST /transcribe?lang=en
    └────────────────────────────────► transcribe-audio.mjs
                                         ├─ ai-coustics enhance ────► AIC SDK
                                         ├─ Whisper × 2 (raw + enhanced)
                                         │     ↳ smart-whisper (Metal GPU)
                                         ├─ WER + RMS/SNR/noise-floor
                                         ├─ transcript-normalizer ──► Gemini
                                         └─ persist metrics + audio dumps
    transcript ◄───────────────────────────── { text, raw, enhanced, comparison }
    ↓ pinned banner + 1.5 s confirm window
    ↓ POST /generate
    │                              POST /generate
    └────────────────────────────────► chat-session.sendTurn
                                         ├─ load session history
                                         ├─ generateStrudel ────────► Gemini (skill prompt)
                                         └─ persist turn
    code ◄─────────────────────────────────── { code, model, messages }
    ↓ validate-strudel (syntactic guard)
    ↓ Strudel REPL hotSwap
    ↓ scheduler.setPattern (no audible break)

  per-track viz update
    │ POST /recommend-viz { code }
    └────────────────────────────────► recommend-viz.mjs ──► Pioneer GLiNER2
    viz tag ◄─────────────────────────────── { viz: "pianoroll" | ... }
    ↓ TrackVisualizer switches canvas
```

Total wall time, end-to-end (warm): **~5–7 s** from PTT release to new
pattern audible. STT alone is ~1 s; the rest is LLM + UI confirm window.

---

## Running locally

Requires Node ≥ 20.6, [pnpm](https://pnpm.io), and (for whisper.cpp Metal
acceleration on macOS) the Xcode CLI tools.

### `.env` at repo root

```env
# Required for code generation + transcript cleanup
GEMINI_API_KEY=...                 # https://aistudio.google.com/app/apikey
GEMINI_MODEL=gemini-3.1-flash-lite-preview

# Required for the speech-enhancement stage (this IS the project's signature)
AIC_SDK_LICENSE=...                # https://developers.ai-coustics.com
AIC_ENHANCEMENT_LEVEL=0.8          # 0.5 dev / 0.8 noisy stage

# Required for per-track visualization recommendation
PIONEER_API_KEY=...                # Pioneer dashboard
PIONEER_VIZ_MODEL_ID=...

# Local STT (smart-whisper auto-downloads on first use)
WHISPER_MODEL=medium.en            # base.en | small.en | medium.en | large-v3-turbo
WHISPER_LANGUAGE=en                # skip auto-detect for speed + accuracy

# Optional knobs
LLM_CORRECT_TRANSCRIPT=true        # Gemini cleanup of STT output (~600 ms)
LLM_PROVIDER=gemini                # or 'ollama' for fully-offline mode
GEMINI_TEMPERATURE=0.85            # template variety dial
```

### Run

```bash
pnpm install
pnpm dev          # web on :4321, api on :4322 (concurrently)
```

Open http://localhost:4321, hit the **vibe** tab, hold **Alt+Space**
anywhere on the page, describe a track, release. Default voice phrases
the demo is tuned for:

- "lo-fi beat at 80 BPM with Rhodes"
- "techno four on the floor at 130 with 909"
- "drop the kick, more reverb on the lead"
- "left ear plays house, right ear plays techno, slow crossfade"
- "make it sound like Berghain"

---

## Notable engineering choices

- **Cached ai-coustics Processor** — hard-won fix for native-handle
  accumulation that took /enhance from 250 ms → 5+ s after several calls.
- **Whisper biasing prompt under 224-token cap** — DJ command vocabulary
  in `dj-vocabulary.json` is the source of truth, but the prompt
  hand-picks ~34 multi-word phrases that whisper actually mis-segments
  (`hi hat` → `hihat`, `build up` → `buildup`). Berghain anchor sits at
  the **end** of the prompt so it survives any front-truncation.
- **POST_PROCESS_FIXES dictionary** — deterministic fixes for common
  whisper homophones (`acid base` → `acid bass`, `roads` → `Rhodes`,
  `low-fi` → `lo-fi`).
- **Composable skill prompt** — every Strudel function name in the LLM's
  reference has been verified against `doc.json` (596 entries). Diversity
  rule prevents drum-kit / visualizer monotony across consecutive
  fresh-start turns; iteration mode (`<current>` block present) overrides
  diversity for "make the bass louder" continuity.
- **Pre-warm at boot** — silent 1-second WAV through the Whisper pipeline
  at startup so the first user PTT lands on the warm path (saves ~5 s).
- **Pluggable LLM** — `LLM_PROVIDER=ollama` swaps Gemini for local
  qwen3 in one env-var change. Same prompt cache, no quota.

---

## Demo prompts to try

```
1. "give me a chill lo-fi beat at 80 bpm with rhodes chords"
2. "now flip into a high-energy techno banger"
3. "drop the bass and add a clap on the offbeat"
4. "left ear plays jazz piano, right ear plays drum and bass, slow crossfade"
5. "make it sound like Berghain"
6. "show the spectrum"
7. "ambient breakdown — strip the drums, just pads and reverb"
```

Each prompt produces an immediately-playable Strudel program. Iteration
mode preserves the current kit / scale / tempo when you make small
changes; fresh starts (or explicit pivots like "now switch to") trigger
the diversity rule and pick a different drum machine, scale, and viz.

---

## License

[GNU AGPL v3](LICENSE) — inherited from Strudel. Anything you ship based
on this repo must be open-sourced under the same license.

Strudel itself was created by Felix Roos, Alex McLean, and many others;
the underlying packages (`@strudel/core`, `@strudel/mini`,
`@strudel/webaudio`, …) are unchanged in this fork. See
[Strudel's contributors](https://codeberg.org/uzu/strudel/activity/contributors).

Default sound bank licensing lives in
[dough-samples](https://github.com/felixroos/dough-samples/blob/main/README.md).

---

## Credits

- **ai-coustics** — speech enhancement SDK (the core of "voice in the
  wild") + the Big Berlin Hack 2026 main track sponsor.
- **Pioneer** — GLiNER2 entity classification model + side challenge.
- **Google DeepMind / Gemini** — multimodal LLM that powers code
  generation, transcript cleanup, and runtime auto-fix.
- **Entire** — workflow orchestration challenge (addressed via the
  pipeline observability stack).
- **Aikido** — security challenge (addressed via skill-prompt sandbox
  contract + syntactic validator + sentinel "cannot-handle" responses).
