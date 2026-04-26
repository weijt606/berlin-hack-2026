import { useCallback } from 'react';
import cx from '@src/cx.mjs';
import { TrackHeader } from './TrackHeader.jsx';

export function TrackCard({
  track,
  isSelected,
  state,
  onSelect,
  onTogglePlay,
  onRename,
  onDelete,
  mountTrack,
}) {
  // Ref callback that hands the container element to the editor manager.
  // We keep the container in the DOM at all times — only its visibility
  // changes when the card collapses — so the StrudelMirror is never torn
  // down on selection changes.
  const setRef = useCallback(
    (el) => {
      if (el) mountTrack(track.id, el);
    },
    [track.id, mountTrack],
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
        onRename={(name) => onRename(track.id, name)}
        onDelete={() => onDelete(track.id)}
      />
      <div
        className={cx(
          'overflow-hidden transition-[max-height] duration-150',
          isSelected ? 'max-h-[60vh]' : 'max-h-0',
        )}
      >
        <section
          ref={setRef}
          className="code-container text-gray-100 cursor-text overflow-auto"
          style={{ minHeight: isSelected ? '160px' : '0' }}
        />
      </div>
    </div>
  );
}
