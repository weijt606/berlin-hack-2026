export function Message({ msg, onReuse }) {
  if (msg.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] px-3 py-2 rounded-md bg-foreground text-background text-sm whitespace-pre-wrap break-words">
          {msg.text}
        </div>
      </div>
    );
  }
  if (msg.noChange) {
    return (
      <div className="flex justify-start">
        <div className="max-w-[85%] px-3 py-2 rounded-md border border-dashed border-muted text-sm italic opacity-70 whitespace-pre-wrap break-words">
          {msg.text || "Couldn't generate or modify — please try again."}
        </div>
      </div>
    );
  }
  return (
    <div className="flex justify-start">
      <div className="max-w-[95%] w-full border border-muted rounded-md p-2 space-y-2">
        {msg.viz && (
          <div className="text-[10px] opacity-60">viz: {msg.viz}</div>
        )}
        <pre className="text-xs whitespace-pre-wrap break-words text-foreground">{msg.code}</pre>
        <div className="flex gap-2">
          <button
            onClick={() => onReuse(msg.code, msg.viz)}
            className="px-2 py-0.5 rounded border border-muted text-xs hover:opacity-80"
          >
            ▶ Re-run
          </button>
          <button
            onClick={() => navigator.clipboard?.writeText(msg.code)}
            className="px-2 py-0.5 rounded border border-muted text-xs hover:opacity-80"
          >
            Copy
          </button>
        </div>
      </div>
    </div>
  );
}
