import { getTrack, setTrackViz, setVizPending } from './tracksStore.mjs';
import { postRecommendViz } from '../components/panel/vibe/vibeApi.mjs';

// Background viz recommendation — never throws. Pulls the track's current
// code from the store, hands it to the Pioneer GLiNER2 classifier, and
// swaps the per-track viz on success. On any failure (Pioneer key unset,
// network blip, model returns junk) leaves the existing viz alone so the
// user's manual pick wins.
//
// Used by: (a) VibeTab right after applying freshly-generated code, and
// (b) the manual refresh button on each TrackVisualizer header.
export async function recommendVizForTrack(trackId, codeOverride) {
  if (!trackId) return null;
  const code = typeof codeOverride === 'string'
    ? codeOverride
    : getTrack(trackId)?.code ?? '';
  if (!code) return null;
  setVizPending(trackId, true);
  try {
    const data = await postRecommendViz({ code });
    if (data?.viz) {
      setTrackViz(trackId, data.viz);
      return data.viz;
    }
    return null;
  } catch {
    return null;
  } finally {
    setVizPending(trackId, false);
  }
}
