import { useEffect, useRef, useState } from 'react';
import { PlayIcon, StopIcon, TrashIcon } from '@heroicons/react/16/solid';
import cx from '@src/cx.mjs';

export function TrackHeader({
  name,
  isSelected,
  isPlaying,
  pending,
  onSelect,
  onTogglePlay,
  onRename,
  onDelete,
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!editing) setDraft(name);
  }, [name, editing]);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  function commit() {
    setEditing(false);
    const next = draft.trim();
    if (next && next !== name) onRename?.(next);
    else setDraft(name);
  }

  return (
    <div
      className={cx(
        'flex items-center gap-2 px-3 py-2 cursor-pointer select-none border-b border-muted',
        isSelected ? 'bg-lineHighlight' : 'hover:bg-lineHighlight/40',
      )}
      onClick={onSelect}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onTogglePlay?.();
        }}
        title={isPlaying ? 'stop' : 'play'}
        className="shrink-0 p-1 rounded hover:opacity-70 text-foreground"
      >
        {isPlaying ? <StopIcon className="w-4 h-4" /> : <PlayIcon className="w-4 h-4" />}
      </button>

      <div
        className={cx(
          'shrink-0 w-1.5 h-1.5 rounded-full',
          isPlaying ? 'bg-green-500 animate-pulse' : pending ? 'bg-yellow-500' : 'bg-muted',
        )}
        aria-hidden
      />

      {editing ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
            else if (e.key === 'Escape') {
              setEditing(false);
              setDraft(name);
            }
          }}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 min-w-0 bg-background border border-muted rounded px-1 text-sm text-foreground"
        />
      ) : (
        <span
          className="flex-1 min-w-0 truncate text-sm text-foreground"
          onDoubleClick={(e) => {
            e.stopPropagation();
            setEditing(true);
          }}
          title="Double-click to rename"
        >
          {name}
        </span>
      )}

      <button
        onClick={(e) => {
          e.stopPropagation();
          if (window.confirm(`Delete "${name}"?`)) onDelete?.();
        }}
        title="delete track"
        className="shrink-0 p-1 rounded hover:opacity-70 text-foreground opacity-50 hover:opacity-100"
      >
        <TrashIcon className="w-4 h-4" />
      </button>
    </div>
  );
}
