import { TrackCard } from './TrackCard.jsx';
import { NewTrackButton } from './NewTrackButton.jsx';

export function TracksColumn({ context }) {
  const {
    tracks,
    selectedTrackId,
    selectTrack,
    addTrack,
    deleteTrack,
    renameTrack,
    togglePlayTrack,
    spotlightTrack,
    setTrackViz,
    mountTrack,
    getTrackState,
  } = context;

  // Click a header to expand it. Click the already-expanded one to collapse.
  const onSelect = (id) => selectTrack(selectedTrackId === id ? null : id);

  return (
    <div className="flex flex-col grow overflow-auto bg-background">
      {tracks.length === 0 && (
        <div className="px-4 py-6 text-sm opacity-60">
          No tracks yet — add one to start.
        </div>
      )}
      {tracks.map((track) => (
        <TrackCard
          key={track.id}
          track={track}
          state={getTrackState(track.id)}
          isSelected={track.id === selectedTrackId}
          onSelect={onSelect}
          onTogglePlay={togglePlayTrack}
          onSpotlight={spotlightTrack}
          onVizChange={setTrackViz}
          onRename={renameTrack}
          onDelete={deleteTrack}
          mountTrack={mountTrack}
        />
      ))}
      <NewTrackButton onAdd={addTrack} />
    </div>
  );
}
