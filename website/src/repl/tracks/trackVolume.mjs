// Per-track volume: we wrap the output function the scheduler calls and
// multiply each event's `gain` by a live ref. Updating `volumeRef.current`
// affects every subsequent event without needing to re-evaluate the
// pattern, so fades are smooth and glitch-free.
//
// hap.ensureObjectValue() is called inside webaudioOutput (via hap2value),
// so we touch hap.value directly here as well.

export function makeTrackOutput(baseOutput, volumeRef) {
  return (hap, deadline, hapDuration, cps, t) => {
    if (!hap?.value) hap.ensureObjectValue?.();
    const v = hap.value || (hap.value = {});
    const original = typeof v.gain === 'number' ? v.gain : 1;
    v.gain = original * volumeRef.current;
    try {
      return baseOutput(hap, deadline, hapDuration, cps, t);
    } finally {
      // Restore so the same hap object isn't permanently mutated if the
      // scheduler reuses it elsewhere.
      v.gain = original;
    }
  };
}
