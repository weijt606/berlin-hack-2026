import { useCallback, useRef } from 'react';
import cx from '@src/cx.mjs';
import { TrackHeader } from './TrackHeader.jsx';
import { TrackVisualizer } from './TrackVisualizer.jsx';

export function TrackCard({
  track,
  isSelected,
  state,
  onSelect,
  onTogglePlay,
  onSpotlight,
  onVizChange,
  onRename,
  onDelete,
  mountTrack,
}) {
  // We need both the StrudelMirror's container element AND the visualizer
  // canvas's 2d context before constructing the editor (so the per-track
  // pianoroll has somewhere to paint). Hold both and call mountTrack only
  // when both have arrived. Mount happens at most once per track.
  const containerRef = useRef(null);
  const ctxRef = useRef(null);
  const mountedRef = useRef(false);

  const tryMount = useCallback(() => {
    if (mountedRef.current) return;
    if (!containerRef.current || !ctxRef.current) return;
    mountedRef.current = true;
    mountTrack(track.id, containerRef.current, ctxRef.current);
  }, [track.id, mountTrack]);

  const setContainerRef = useCallback(
    (el) => {
      containerRef.current = el || null;
      if (el) tryMount();
    },
    [tryMount],
  );

  const onCanvas = useCallback(
    (canvas, ctx) => {
      ctxRef.current = ctx;
      tryMount();
    },
    [tryMount],
  );

  return (
    <div className={cx('flex flex-col', isSelected && 'border-l-2 border-foreground')}>
      <TrackHeader
        name={track.name}
        isSelected={isSelected}
        isPlaying={!!state?.started}
        pending={!!state?.pending}
        onSelect={() => onSelect(track.id)}
        onTogglePlay={() => onTogglePlay(track.id)}
        onSpotlight={() => onSpotlight(track.id)}
        onRename={(name) => onRename(track.id, name)}
        onDelete={() => onDelete(track.id)}
      />

      {/* Always-visible per-track visualization */}
      <TrackVisualizer
        onCanvas={onCanvas}
        isPlaying={!!state?.started}
        viz={track.viz}
        onVizChange={(v) => onVizChange(track.id, v)}
      />

      {/* Collapsible code editor — expands when the track is selected */}
      <div
        className={cx(
          'overflow-hidden transition-[max-height] duration-150 border-t border-muted',
          isSelected ? 'max-h-[60vh]' : 'max-h-0',
        )}
      >
        <section
          ref={setContainerRef}
          className="code-container text-gray-100 cursor-text overflow-auto"
          style={{ minHeight: isSelected ? '160px' : '0' }}
        />
      </div>
    </div>
  );
}
