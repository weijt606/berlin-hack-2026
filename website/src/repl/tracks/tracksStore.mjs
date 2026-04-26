import { atom, computed } from 'nanostores';
import { useStore } from '@nanostores/react';
import { nanoid } from 'nanoid';
import { settingsMap } from '../../settings.mjs';

const TRACKS_KEY = 'tracks';
const SELECTED_KEY = 'selectedTrackId';

const DEFAULT_CODE = '$: s("[bd <hh oh>]*2").bank("tr909").dec(.4)';

function readTracks() {
  const raw = settingsMap.get()[TRACKS_KEY];
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function writeTracks(list) {
  settingsMap.setKey(TRACKS_KEY, JSON.stringify(list));
}

export function createTrackId() {
  return nanoid(10);
}

export function makeTrack({ name, code } = {}) {
  return {
    id: createTrackId(),
    name: name || 'Untitled track',
    code: code ?? DEFAULT_CODE,
    createdAt: Date.now(),
  };
}

export const $tracks = atom(readTracks() ?? []);

settingsMap.subscribe((state, key) => {
  if (key === TRACKS_KEY) {
    const next = readTracks() ?? [];
    if (next !== $tracks.get()) $tracks.set(next);
  }
});

const sessionAtom = (name, initial) => {
  const storage = typeof sessionStorage !== 'undefined' ? sessionStorage : {};
  const store = atom(typeof storage[name] !== 'undefined' ? storage[name] : initial);
  store.listen((v) => {
    if (typeof v === 'undefined' || v === null) delete storage[name];
    else storage[name] = v;
  });
  return store;
};

export const $selectedTrackId = sessionAtom(SELECTED_KEY, null);

export const $selectedTrack = computed([$tracks, $selectedTrackId], (tracks, id) => {
  if (!id) return null;
  return tracks.find((t) => t.id === id) || null;
});

export function useTracks() {
  return useStore($tracks);
}
export function useSelectedTrackId() {
  return useStore($selectedTrackId);
}
export function useSelectedTrack() {
  return useStore($selectedTrack);
}

export function selectTrack(id) {
  $selectedTrackId.set(id || null);
}

export function ensureInitialTrack(seedCode) {
  const list = $tracks.get();
  if (list.length > 0) return list[0];
  const t = makeTrack({ name: 'Track 1', code: seedCode || DEFAULT_CODE });
  writeTracks([t]);
  $tracks.set([t]);
  return t;
}

export function addTrack(partial = {}) {
  const list = $tracks.get();
  const idx = list.length + 1;
  const t = makeTrack({ name: partial.name || `Track ${idx}`, code: partial.code });
  const next = [...list, t];
  writeTracks(next);
  $tracks.set(next);
  return t;
}

export function deleteTrack(id) {
  const list = $tracks.get();
  const next = list.filter((t) => t.id !== id);
  writeTracks(next);
  $tracks.set(next);
  if ($selectedTrackId.get() === id) {
    $selectedTrackId.set(next[0]?.id || null);
  }
}

export function updateTrack(id, patch) {
  const list = $tracks.get();
  let changed = false;
  const next = list.map((t) => {
    if (t.id !== id) return t;
    const merged = { ...t, ...patch };
    if (merged.code === t.code && merged.name === t.name) return t;
    changed = true;
    return merged;
  });
  if (!changed) return;
  writeTracks(next);
  $tracks.set(next);
}

export function setTrackCode(id, code) {
  updateTrack(id, { code });
}

export function renameTrack(id, name) {
  updateTrack(id, { name });
}

export function getTrack(id) {
  return $tracks.get().find((t) => t.id === id) || null;
}
