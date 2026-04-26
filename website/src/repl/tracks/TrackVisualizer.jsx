import { useEffect, useRef } from 'react';
import { TrackVizPicker } from './TrackVizPicker.jsx';

// A per-track canvas. The actual painting is done by the editor (chosen
// painter from painters.mjs); this component just owns the DOM element
// and exposes its 2d context to the editor via the `onCanvas` callback
// (called once the element mounts). Also renders the viz picker.
//
// Sized in CSS pixels; the editor's draw loop paints relative to these
// dimensions. We track devicePixelRatio so the pianoroll stays crisp on
// high-DPI displays.

export function TrackVisualizer({ onCanvas, isPlaying, viz, onVizChange }) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ratio = window.devicePixelRatio || 1;
    const cssW = canvas.clientWidth || 320;
    const cssH = canvas.clientHeight || 80;
    canvas.width = Math.round(cssW * ratio);
    canvas.height = Math.round(cssH * ratio);
    const ctx = canvas.getContext('2d');
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    onCanvas?.(canvas, ctx);
  }, [onCanvas]);

  return (
    <div className="px-3 py-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] opacity-50">
          {isPlaying ? '▶ playing' : 'idle'}
        </span>
        <TrackVizPicker value={viz} onChange={onVizChange} />
      </div>
      <canvas
        ref={ref}
        className="block w-full rounded border border-muted bg-background/40"
        style={{ height: 80 }}
      />
    </div>
  );
}
