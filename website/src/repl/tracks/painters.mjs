// Per-track painter registry. Each entry is a painter factory:
//   () => (ctx, time, haps, drawTime) => paint
// matching Strudel's onPaint signature. We expose a friendly label and a
// stable `key` for storage/UI.
//
// To add a new viz: import its draw function from @strudel/draw and wrap
// it in a painter that takes (ctx, time, haps, drawTime).

import { __pianoroll, getPunchcardPainter, pitchwheel, drawSpiral } from '@strudel/draw';

function getDrawOptions(drawTime, options = {}) {
  // Mirrors getDrawOptions from @strudel/draw without re-importing the
  // un-exported helper. Translates the editor's [lookbehind, lookahead]
  // window into the cycles/playhead pair the painters expect.
  let [lookbehind, lookahead] = drawTime;
  lookbehind = Math.abs(lookbehind);
  const cycles = lookahead + lookbehind;
  const playhead = cycles !== 0 ? lookbehind / cycles : 0;
  return { ...options, cycles, playhead };
}

// Punchcard = pianoroll(fold:1) — chunky bars, our default.
const punchcard = getPunchcardPainter({});

// Plain pianoroll (no folding) — thinner notes per midi value.
const pianoroll = (ctx, time, haps, drawTime) =>
  __pianoroll({ ctx, time, haps, ...getDrawOptions(drawTime, { fold: 0 }) });

// Wordfall = vertical pianoroll with labels.
const wordfall = (ctx, time, haps, drawTime) =>
  __pianoroll({
    ctx,
    time,
    haps,
    ...getDrawOptions(drawTime, {
      vertical: 1,
      labels: 1,
      stroke: 0,
      fillActive: 1,
      active: 'white',
      fold: 1,
    }),
  });

const spiral = (ctx, time, haps, drawTime) =>
  drawSpiral({ ctx, time, haps, drawTime });

const pitchwheelPainter = (ctx, time, haps, _drawTime) =>
  pitchwheel({ ctx, time, haps });

export const PAINTERS = {
  punchcard: { label: 'Punchcard', paint: punchcard },
  pianoroll: { label: 'Pianoroll', paint: pianoroll },
  wordfall: { label: 'Wordfall', paint: wordfall },
  spiral: { label: 'Spiral', paint: spiral },
  pitchwheel: { label: 'Pitch wheel', paint: pitchwheelPainter },
};

export const VIZ_KEYS = Object.keys(PAINTERS);
export const DEFAULT_VIZ = 'punchcard';

export function getPainter(viz) {
  return PAINTERS[viz]?.paint || PAINTERS[DEFAULT_VIZ].paint;
}
