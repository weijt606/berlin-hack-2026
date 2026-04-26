# Rule: musical & visual diversity

The user is doing live coding for a rave / DJ set. **Predictability kills the
vibe.** Each turn should feel different from the last, even on similar
prompts.

## Anti-monotony rules

These apply across consecutive turns in the same session (you can see prior
turns in the chat history):

1. **Don't reuse the same drum kit two turns in a row.** If last turn was
   `RolandTR909`, this turn pick `RolandTR808`, `LinnDrum`, `AkaiMPC60`,
   `OberheimDMX`, etc. unless the user explicitly said "keep the kit".
2. **Don't reuse the same visualizer two turns in a row.** Cycle through
   `.scope()`, `.pianoroll()`, `.spectrum()`, `.spiral()`, `.pitchwheel()`,
   `.fscope()` based on the musical character (see `reference/visualization.md`).
3. **Vary the structure idiom.** If last turn was `stack(drums, bass, chord)`,
   this turn try one of:
   - `arrange([4, drums], [4, drumsAndBass], [8, fullStack])`
   - `stack(drums, melody.jux(rev))`
   - `stack(drums, layer.off(0.125, x => x.add(7)))`
   - euclidean: `s("bd").euclid(5, 8)` instead of `bd*4`
4. **Reach for a less-common transform every 2-3 turns**: `.chunk(N, fn)`,
   `.iter(N)`, `.swing(N)`, `.palindrome()`, `.ply("<1 2 3>")`,
   `.degradeBy(0.2)`, `.mask("<1 [0 1]>")`, `.struct("x ~ x ~")`.
5. **Don't always pick the obvious sound.** "Lo-fi" doesn't HAVE to be
   `gm_rhodes_ep` — sometimes try `gm_celesta`, `gm_vibraphone`, or a
   bandpass-filtered `triangle`.

## Choosing visualizer by character

| Music character | Default viz |
| --- | --- |
| Beat-driven, percussive (techno, house, dnb) | `.scope()` |
| Melodic / chord-heavy (jazz, lo-fi, ambient) | `.pianoroll()` |
| Textural pad / drone | `.spectrum()` |
| Acid / fast filter movement | `.fscope()` |
| Looping arp / repetitive patterns | `.spiral()` |
| Microtonal / pitch-bending content | `.pitchwheel()` |

If you've used `.scope()` two turns in a row, **rotate** to whichever option
above isn't `.scope()` — even if `.scope()` would technically fit.

## Don't pretend to randomize

Don't write `Math.random()` or `irand(4).pick(...)` purely to manufacture
variety — use the user's intent. Variety means *picking* a different idiom
each turn, not stuffing randomness inside one program.

## Edge cases

- **First turn of a session** (no history): full freedom, just pick a
  cohesive starting point.
- **User says "again" / "same vibe"**: relax this rule — they explicitly
  asked for continuity. Match the previous structure.
- **User explicitly references a viz** ("show the spectrum"): that wins
  over the rotation rule.
