import { getPerformanceTimeSeconds, silence } from '@strudel/core';
import { transpiler, evaluate } from '@strudel/transpiler';
import {
  getAudioContextCurrentTime,
  webaudioOutput,
} from '@strudel/webaudio';
import { superdirtOutput } from '@strudel/osc/superdirtoutput';
import { StrudelMirror } from '@strudel/codemirror';
import { clearHydra } from '@strudel/hydra';
import { setInterval, clearInterval } from 'worker-timers';
import { audioEngineTargets } from '../../settings.mjs';
import {
  getAudioReady,
  getModulesLoading,
  getPresetsLoading,
  getSharedDrawContext,
} from './strudelGlobalInit.mjs';
import { setTrackCode } from './tracksStore.mjs';

// Build a StrudelMirror bound to a single track. Each editor runs its own
// scheduler so multiple tracks can play in parallel — we pass solo:false to
// suppress the default "stop the others" event.
export function createTrackEditor({
  trackId,
  container,
  initialCode,
  isSyncEnabled,
  audioEngineTarget,
  prebakeScript,
  onUpdateState,
}) {
  const shouldUseWebaudio = audioEngineTarget !== audioEngineTargets.osc;
  const defaultOutput = shouldUseWebaudio ? webaudioOutput : superdirtOutput;
  const getTime = shouldUseWebaudio ? getAudioContextCurrentTime : getPerformanceTimeSeconds;
  const drawTime = [-2, 2];

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
    drawContext: getSharedDrawContext(),
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

  return editor;
}
