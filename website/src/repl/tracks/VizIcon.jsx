// Tiny inline SVGs for each picker viz, sized to fit the 16×16 icon
// buttons in TrackHeader. We don't pull these from heroicons because
// their library doesn't have a clean match for "spectrogram bars" or
// "scope sine" — these hand-drawn paths read well at 16px.

const baseProps = { width: 16, height: 16, viewBox: '0 0 16 16', 'aria-hidden': true };

export function VizIcon({ viz }) {
  switch (viz) {
    case 'pianoroll':
      return (
        <svg {...baseProps} fill="currentColor">
          <rect x="0" y="3" width="9" height="2" rx="0.5" />
          <rect x="3" y="7" width="13" height="2" rx="0.5" />
          <rect x="6" y="11" width="7" height="2" rx="0.5" />
        </svg>
      );
    case 'waveform':
      return (
        <svg {...baseProps} fill="currentColor">
          <path d="M0 8 Q 2 2 4 8 T 8 8 T 12 8 T 16 8 L 16 8 L 0 8 Z" />
          <path d="M0 8 Q 2 14 4 8 T 8 8 T 12 8 T 16 8 L 0 8 Z" />
        </svg>
      );
    case 'spectrum':
      return (
        <svg {...baseProps} fill="currentColor">
          <rect x="1" y="9" width="2" height="6" rx="0.5" />
          <rect x="5" y="4" width="2" height="11" rx="0.5" />
          <rect x="9" y="7" width="2" height="8" rx="0.5" />
          <rect x="13" y="2" width="2" height="13" rx="0.5" />
        </svg>
      );
    case 'scope':
      return (
        <svg
          {...baseProps}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M0 8 C 3 2 5 2 8 8 C 11 14 13 14 16 8" />
        </svg>
      );
    case 'spiral':
      return (
        <svg
          {...baseProps}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        >
          <path d="M8 8 m-1.5 0 a1.5 1.5 0 1 1 3 0 a3 3 0 1 1 -6 0 a4.5 4.5 0 1 1 9 0 a6 6 0 1 1 -12 0" />
        </svg>
      );
    default:
      return null;
  }
}
