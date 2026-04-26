import { getPerformanceTimeSeconds, silence } from '@strudel/core';
import { transpiler, evaluate } from '@strudel/transpiler';
import {
  getAudioContextCurrentTime,
  webaudioOutput,
} from '@strudel/webaudio';
import { superdirtOutput } from '@strudel/osc/superdirtoutput';
import { StrudelMirror } from '@strudel/codemirror';
import { clearHydra } from '@strudel/hydra';
import { getPunchcardPainter } from '@strudel/draw';
import { setInterval, clearInterval } from 'worker-timers';
import { audioEngineTargets } from '../../settings.mjs';
import {
  getAudioReady,
  getModulesLoading,
  getPresetsLoading,
  getSharedDrawContext,
} from './strudelGlobalInit.mjs';
import { setTrackCode } from './tracksStore.mjs';
import { makeTrackOutput } from './trackVolume.mjs';

// Build a StrudelMirror bound to a single track. Each editor runs its own
// scheduler so multiple tracks can play in parallel — we pass solo:false to
// suppress the default "stop the others" event.
export function createTrackEditor({
  trackId,
  container,
  initialCode,
  initialVolume = 1,
  isSyncEnabled,
  audioEngineTarget,
  prebakeScript,
  onUpdateState,
  drawContext, // optional per-track 2d ctx; falls back to the shared one
}) {
  const shouldUseWebaudio = audioEngineTarget !== audioEngineTargets.osc;
  const baseOutput = shouldUseWebaudio ? webaudioOutput : superdirtOutput;
  const getTime = shouldUseWebaudio ? getAudioContextCurrentTime : getPerformanceTimeSeconds;
  const drawTime = [-2, 2];

  // Live mutable volume — read on every event, written by the volume
  // slider and the spotlight fade engine. Stays attached to the editor
  // so callers can update it without a re-render or re-evaluation.
  const volumeRef = { current: typeof initialVolume === 'number' ? initialVolume : 1 };
  const defaultOutput = makeTrackOutput(baseOutput, volumeRef);

  // Always paint a punchcard-style pianoroll into the per-track canvas,
  // even if the user's pattern doesn't call .pianoroll() / .punchcard().
  // Also forwards to any user-set painters so .scope() etc. still work.
  const punchcard = getPunchcardPainter({});
  const onDraw = (haps, time, painters) => {
    const ctx = drawContext;
    if (ctx) {
      // Clear the per-track canvas before each frame.
      const c = ctx.canvas;
      const ratio = window.devicePixelRatio || 1;
      ctx.clearRect(0, 0, c.width / ratio, c.height / ratio);
      try {
        punchcard(ctx, time, haps, drawTime);
      } catch {}
    }
    painters?.forEach?.((painter) => {
      try {
        painter(ctx, time, haps, drawTime);
      } catch {}
    });
  };

  const editor = new StrudelMirror({
    id: `track-${trackId}`,
    sync: isSyncEnabled,
    defaultOutput,
    getTime,
    setInterval,
    clearInterval,
    transpiler,
    autodraw: false,
    root: container,
    initialCode: initialCode ?? '',
    pattern: silence,
    drawTime,
    drawContext: drawContext || getSharedDrawContext(),
    onDraw,
    solo: false,
    prebake: async () => {
      await Promise.all([getModulesLoading(), getPresetsLoading()]);
      if (prebakeScript) {
        return evaluate(prebakeScript, { addReturn: false });
      }
    },
    onUpdateState: (state) => onUpdateState?.({ ...state }),
    onToggle: (playing) => {
      if (!playing) clearHydra();
    },
    beforeEval: () => getAudioReady(),
    afterEval: () => {
      const code = editor.code;
      if (typeof code === 'string') setTrackCode(trackId, code);
    },
    bgFill: false,
  });

  // Expose the live volume ref so the hook can update it for fades.
  editor.volumeRef = volumeRef;
  return editor;
}
