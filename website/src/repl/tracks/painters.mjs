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

// Pianoroll with proper midi spacing — autorange so the bars fill the
// canvas vertically (default minMidi=10..maxMidi=90 makes 80 slots, which
// flattens to ~1px-tall notes on an 80px canvas). Solid fill, dim inactive
// vs bright active so you can read the playhead at a glance.
const pianoroll = (ctx, time, haps, drawTime) =>
  __pianoroll({
    ctx,
    time,
    haps,
    ...getDrawOptions(drawTime, {
      fold: 0,
      autorange: 1,
      fill: 1,
      fillActive: 1,
      stroke: 0,
      strokeActive: 0,
      inactive: 'rgba(180,210,255,0.45)',
      active: '#ffffff',
      playheadColor: 'rgba(255,255,255,0.6)',
    }),
  });

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

// `shape` tells the host how to size the canvas:
//   'wide'   — short horizontal bar (time axis runs left↔right)
//   'square' — radial / vertical viz that wants ~equal width and height
export const PAINTERS = {
  punchcard: { label: 'Punchcard', paint: punchcard, shape: 'wide' },
  pianoroll: { label: 'Pianoroll', paint: pianoroll, shape: 'wide' },
  wordfall: { label: 'Wordfall', paint: wordfall, shape: 'square' },
  spiral: { label: 'Spiral', paint: spiral, shape: 'square' },
  pitchwheel: { label: 'Pitch wheel', paint: pitchwheelPainter, shape: 'square' },
};

export const VIZ_KEYS = Object.keys(PAINTERS);
export const DEFAULT_VIZ = 'punchcard';

export function getPainter(viz) {
  return PAINTERS[viz]?.paint || PAINTERS[DEFAULT_VIZ].paint;
}

export function getShape(viz) {
  return PAINTERS[viz]?.shape || PAINTERS[DEFAULT_VIZ].shape;
}
