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
  // The StrudelMirror needs an editor container element AND a 2d ctx for
  // per-track painting. Hold both refs; mountTrack itself is idempotent —
  // first call constructs the editor, later calls just swap the ctx so a
  // remounted canvas (HMR / layout change) keeps painting.
  const containerRef = useRef(null);
  const ctxRef = useRef(null);

  const tryMount = useCallback(() => {
    if (!containerRef.current || !ctxRef.current) return;
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
    <div className="flex flex-col">
      <TrackHeader
        name={track.name}
        isSelected={isSelected}
        isPlaying={!!state?.started}
        pending={!!state?.pending}
        viz={track.viz}
        onVizChange={(v) => onVizChange(track.id, v)}
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
