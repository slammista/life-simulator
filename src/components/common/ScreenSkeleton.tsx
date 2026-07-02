// Suspense fallback for lazy-loaded screens — a shimmering placeholder instead of
// flat "Caricamento..." text, so a slow chunk load still reads as "the game is here,
// just filling in" rather than a stall.
export function ScreenSkeleton() {
  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="skeleton-block" style={{ height: 88, width: '100%' }} />
      <div className="skeleton-block" style={{ height: 20, width: '55%' }} />
      <div className="skeleton-block" style={{ height: 64, width: '100%' }} />
      <div className="skeleton-block" style={{ height: 64, width: '100%' }} />
      <div className="skeleton-block" style={{ height: 64, width: '85%' }} />
    </div>
  )
}
