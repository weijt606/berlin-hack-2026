import { useCallback, useEffect, useRef, useState } from 'react';
import { useStore } from '@nanostores/react';
import { defaultSettings } from '@strudel/codemirror';
import { settingsMap, useSettings } from '../../settings.mjs';
import { createTrackEditor } from './createTrackEditor.mjs';
import {
  $tracks,
  $selectedTrackId,
  ensureInitialTrack,
  selectTrack,
  setTrackViz,
} from './tracksStore.mjs';
import { DEFAULT_VIZ } from './painters.mjs';
import { setLatestCode } from '../../user_pattern_utils.mjs';
import { spotlight as runSpotlight } from './spotlight.mjs';

const EMPTY_STATE = { started: false, isDirty: false, error: null, activeCode: '', pending: false };

export function useTrackEditors() {
  const { isSyncEnabled, audioEngineTarget, prebakeScript } = useSettings();
  const editorsRef = useRef({}); // { [trackId]: StrudelMirror }
  const [editorStates, setEditorStates] = useState({}); // { [trackId]: replState }

  const tracks = useStore($tracks);
  const selectedTrackId = useStore($selectedTrackId);

  // On first mount, make sure there is at least one track. We deliberately
  // do NOT auto-select it — the default state is "all collapsed", so users
  // see the track list, not a code editor. They click a header to expand.
  useEffect(() => {
    const seedCode = settingsMap.get().latestCode || undefined;
    ensureInitialTrack(seedCode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Push codemirror display settings into every live editor when they change
  const _settings = useStore(settingsMap, { keys: Object.keys(defaultSettings) });
  useEffect(() => {
    const editorSettings = {};
    Object.keys(defaultSettings).forEach((key) => {
      editorSettings[key] = _settings[key];
    });
    Object.values(editorsRef.current).forEach((ed) => ed?.updateSettings(editorSettings));
  }, [_settings]);

  // Keep window.strudelMirror pointing at the currently selected track so
  // legacy debug helpers (audiograph, etc.) keep working.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const ed = editorsRef.current[selectedTrackId];
    if (ed) window.strudelMirror = ed;
  }, [selectedTrackId, editorStates]);

  // Push live viz changes from the store into each editor's vizRef so
  // switching is instant — the next animation frame paints with the new
  // painter, no editor rebuild needed.
  useEffect(() => {
    for (const t of tracks) {
      const ed = editorsRef.current[t.id];
      if (ed?.vizRef) ed.vizRef.current = t.viz || DEFAULT_VIZ;
    }
  }, [tracks]);

  // When the user deletes a track, dispose its editor.
  useEffect(() => {
    const liveIds = new Set(tracks.map((t) => t.id));
    Object.keys(editorsRef.current).forEach((id) => {
      if (!liveIds.has(id)) {
        try {
          editorsRef.current[id]?.stop?.();
        } catch {}
        delete editorsRef.current[id];
        setEditorStates((prev) => {
          if (!(id in prev)) return prev;
          const next = { ...prev };
          delete next[id];
          return next;
        });
      }
    });
  }, [tracks]);

  // Called from each TrackCard once both the editor container and the
  // visualizer canvas are mounted. Idempotent: only the first call for a
  // given trackId actually constructs a StrudelMirror.
  const mountTrack = useCallback(
    (trackId, container, drawContext) => {
      if (!container) return;
      // Idempotent: if the editor already exists, just hot-swap its ctx so
      // a remounted canvas (HMR, viz layout change) keeps painting.
      const existing = editorsRef.current[trackId];
      if (existing) {
        if (existing.drawContextRef && drawContext) {
          existing.drawContextRef.current = drawContext;
        }
        return;
      }
      const track = $tracks.get().find((t) => t.id === trackId);
      const editor = createTrackEditor({
        trackId,
        container,
        drawContext,
        initialCode: track?.code ?? '',
        initialViz: track?.viz || DEFAULT_VIZ,
        isSyncEnabled,
        audioEngineTarget,
        prebakeScript,
        onUpdateState: (state) => {
          setEditorStates((prev) => ({ ...prev, [trackId]: state }));
          if (typeof state.code === 'string' && trackId === $selectedTrackId.get()) {
            setLatestCode(state.code);
          }
        },
      });
      editor.setCode(track?.code ?? '');
      editorsRef.current[trackId] = editor;
      if (typeof window !== 'undefined' && trackId === $selectedTrackId.get()) {
        window.strudelMirror = editor;
      }
    },
    [isSyncEnabled, audioEngineTarget, prebakeScript],
  );

  const getEditor = useCallback((trackId) => editorsRef.current[trackId] || null, []);
  const getState = useCallback((trackId) => editorStates[trackId] || EMPTY_STATE, [editorStates]);

  const togglePlay = useCallback((trackId) => {
    editorsRef.current[trackId]?.toggle();
  }, []);
  const stopTrack = useCallback((trackId) => {
    editorsRef.current[trackId]?.stop();
  }, []);
  const evaluateTrack = useCallback((trackId) => {
    editorsRef.current[trackId]?.evaluate();
  }, []);
  const setCodeFor = useCallback((trackId, code) => {
    const ed = editorsRef.current[trackId];
    if (!ed) return;
    ed.setCode(code);
  }, []);

  const spotlight = useCallback(
    (trackId, durationMs) => {
      runSpotlight({
        trackId,
        allTrackIds: $tracks.get().map((t) => t.id),
        getEditor,
        getState,
        durationMs,
      });
    },
    [getEditor, getState],
  );

  return {
    tracks,
    selectedTrackId,
    editorStates,
    mountTrack,
    getEditor,
    getState,
    togglePlay,
    stopTrack,
    evaluateTrack,
    setCodeFor,
    spotlight,
  };
}
