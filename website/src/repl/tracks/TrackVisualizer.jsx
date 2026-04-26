import { useEffect, useRef } from 'react';
import { useStore } from '@nanostores/react';
import { ArrowPathIcon } from '@heroicons/react/16/solid';
import cx from '@src/cx.mjs';
import { TrackVizPicker } from './TrackVizPicker.jsx';
import { getShape } from './painters.mjs';
import { $vizPending } from './tracksStore.mjs';
import { recommendVizForTrack } from './vizRecommend.mjs';

// A per-track canvas. The actual painting is done by the editor (chosen
// painter from painters.mjs); this component just owns the DOM element
// and exposes its 2d context to the editor via the `onCanvas` callback
// (called once the element mounts). The viz picker is a small dropdown
// pinned to the top-right of the canvas area.
//
// The canvas backing store is sized at CSS-pixels × devicePixelRatio so
// the painters draw at full hi-DPI resolution and the browser scales the
// backing store down to the CSS box. Painters in @strudel/draw read
// ctx.canvas.width directly, so we deliberately do NOT apply a CSS-px
// transform — that would double the scale and clip half the drawing.

const SQUARE_SIDE = 160; // px — square viz fits this width × height

export function TrackVisualizer({ trackId, onCanvas, viz, onVizChange }) {
  const ref = useRef(null);
  const shape = getShape(viz);
  // Per-track flag flipped by VibeTab while the Pioneer GLiNER2
  // classifier is choosing a painter for freshly-generated code. We
  // surface it as a small inline badge next to the picker so the user
  // sees the "smart pick" actively running.
  const pendingMap = useStore($vizPending);
  const pending = trackId ? !!pendingMap[trackId] : false;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ratio = window.devicePixelRatio || 1;
    const sync = () => {
      const cssW = canvas.clientWidth || 320;
      const cssH = canvas.clientHeight || 80;
      canvas.width = Math.round(cssW * ratio);
      canvas.height = Math.round(cssH * ratio);
    };
    sync();
    const ctx = canvas.getContext('2d');
    onCanvas?.(canvas, ctx);
    const ro = new ResizeObserver(sync);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [onCanvas]);

  // CSS box: wide viz fills the row at 80px high; square viz is a 160px
  // box centered horizontally. Same canvas element across viz switches
  // so the editor's ctx ref stays valid.
  const canvasStyle = shape === 'square'
    ? { width: SQUARE_SIDE, height: SQUARE_SIDE }
    : { width: '100%', height: 80 };

  return (
    <div className="px-3 py-2">
      <div className="flex items-center justify-end mb-1 gap-2">
        {pending ? (
          <span
            className="text-[10px] px-1.5 py-0.5 rounded border border-foreground/40 text-foreground/80 inline-flex items-center gap-1 animate-pulse"
            title="Pioneer GLiNER2 is picking a visualizer for the new pattern"
          >
            <span aria-hidden>✨</span>
            Pioneer picking viz…
          </span>
        ) : (
          <span
            className="text-[10px] opacity-50"
            title="Visualizer suggestions come from a Pioneer-trained GLiNER2 classifier"
          >
            ⚡ Powered by Pioneer GLiNER2
          </span>
        )}
        <button
          type="button"
          onClick={() => recommendVizForTrack(trackId)}
          disabled={pending || !trackId}
          title="Re-run Pioneer GLiNER2 viz suggestion for the current code"
          className={cx(
            'text-foreground/60 hover:text-foreground p-0.5 rounded',
            'disabled:opacity-30 disabled:cursor-not-allowed',
          )}
        >
          <ArrowPathIcon className={cx('w-3.5 h-3.5', pending && 'animate-spin')} />
        </button>
        <TrackVizPicker value={viz} onChange={onVizChange} />
      </div>
      <canvas
        ref={ref}
        className="block rounded border border-muted bg-background/40 mx-auto"
        style={canvasStyle}
      />
    </div>
  );
}
