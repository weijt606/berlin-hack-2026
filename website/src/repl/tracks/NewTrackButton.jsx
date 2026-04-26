import { PlusIcon } from '@heroicons/react/16/solid';

export function NewTrackButton({ onAdd }) {
  return (
    <button
      onClick={onAdd}
      className="flex items-center justify-center gap-1 w-full py-2 text-sm text-foreground opacity-70 hover:opacity-100 hover:bg-lineHighlight border-b border-muted"
      title="Add a new track"
    >
      <PlusIcon className="w-4 h-4" />
      <span>New track</span>
    </button>
  );
}
