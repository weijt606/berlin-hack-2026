import { getDrawContext } from '@strudel/draw';
import { initAudioOnFirstClick } from '@strudel/webaudio';
import { parseBoolean, settingsMap } from '../../settings.mjs';
import { loadModules } from '../util.mjs';
import { prebake } from '../prebake.mjs';

let modulesLoading;
let presets;
let drawContext;
let audioReady;

export function getAudioReady() {
  return audioReady;
}
export function getModulesLoading() {
  return modulesLoading;
}
export function getPresetsLoading() {
  return presets;
}
export function getSharedDrawContext() {
  return drawContext;
}

export function clearCanvas() {
  if (!drawContext) return;
  drawContext.clearRect(0, 0, drawContext.canvas.height, drawContext.canvas.width);
}

export async function getModule(name) {
  if (!modulesLoading) return;
  const mods = await modulesLoading;
  return mods.find((m) => m.packageName === name);
}

if (typeof window !== 'undefined') {
  const { maxPolyphony, audioDeviceName, multiChannelOrbits } = settingsMap.get();
  audioReady = initAudioOnFirstClick({
    maxPolyphony,
    audioDeviceName,
    multiChannelOrbits: parseBoolean(multiChannelOrbits),
  });
  modulesLoading = loadModules();
  presets = prebake();
  drawContext = getDrawContext();
}
