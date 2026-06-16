import type { App } from '@/lib/types';
import { THUMBNAIL_COLORS } from '@/lib/mock-data';

interface AppCardProps {
  app: App;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// One SVG composition per thumbnail key — abstract but thematically related
function ThumbnailArt({ thumbKey, color }: { thumbKey: string; color: string }) {
  const c = color;
  const hi  = `${c}cc`; // ~80% opacity fill
  const mid = `${c}55`; // ~33%
  const lo  = `${c}22`; // ~13%

  const art: Record<string, React.ReactNode> = {

    // Product Description Generator — document with text lines + sparkle
    thumb_blue: (
      <svg viewBox="0 0 120 90" fill="none" className="w-full h-full" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <rect x="22" y="10" width="54" height="70" rx="5" fill={mid} />
        <rect x="22" y="10" width="54" height="70" rx="5" stroke={hi} strokeWidth="1" />
        <rect x="30" y="26" width="36" height="4" rx="2" fill={hi} />
        <rect x="30" y="34" width="28" height="3" rx="1.5" fill={mid} />
        <rect x="30" y="41" width="32" height="3" rx="1.5" fill={mid} />
        <rect x="30" y="48" width="22" height="3" rx="1.5" fill={lo} />
        {/* sparkle */}
        <path d="M87 22 L89 15 L91 22 L98 24 L91 26 L89 33 L87 26 L80 24Z" fill={hi} />
        <circle cx="96" cy="55" r="7" fill={lo} />
      </svg>
    ),

    // Social Caption Writer — three network nodes + connections
    thumb_violet: (
      <svg viewBox="0 0 120 90" fill="none" className="w-full h-full" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <circle cx="30"  cy="45" r="14" fill={mid} stroke={hi} strokeWidth="1" />
        <circle cx="90"  cy="22" r="10" fill={mid} stroke={hi} strokeWidth="1" />
        <circle cx="90"  cy="68" r="10" fill={mid} stroke={hi} strokeWidth="1" />
        <line x1="44" y1="42" x2="80" y2="26" stroke={hi} strokeWidth="1.2" strokeDasharray="4 3" />
        <line x1="44" y1="48" x2="80" y2="64" stroke={hi} strokeWidth="1.2" strokeDasharray="4 3" />
        <circle cx="30" cy="45" r="5"  fill={hi} />
        <circle cx="90" cy="22" r="4"  fill={hi} />
        <circle cx="90" cy="68" r="4"  fill={hi} />
      </svg>
    ),

    // Lead Qualifier — funnel / filter shape
    thumb_teal: (
      <svg viewBox="0 0 120 90" fill="none" className="w-full h-full" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        {/* Wide bar */}
        <rect x="18" y="16" width="84" height="12" rx="3" fill={mid} stroke={hi} strokeWidth="1" />
        {/* Mid bar */}
        <rect x="30" y="36" width="60" height="10" rx="3" fill={mid} stroke={hi} strokeWidth="1" />
        {/* Narrow bar */}
        <rect x="44" y="54" width="32" height="9"  rx="3" fill={hi} />
        {/* Stem */}
        <rect x="56" y="63" width="8"  height="12" rx="2" fill={mid} />
        {/* Small check */}
        <path d="M76 25 L80 29 L87 20" stroke={hi} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),

    // FAQ Chatbot — chat bubble + typing dots
    thumb_amber: (
      <svg viewBox="0 0 120 90" fill="none" className="w-full h-full" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        {/* Main bubble */}
        <rect x="14" y="12" width="72" height="44" rx="10" fill={mid} stroke={hi} strokeWidth="1" />
        <path d="M22 56 L14 72 L42 56Z" fill={mid} />
        {/* Reply bubble */}
        <rect x="40" y="60" width="52" height="24" rx="8" fill={lo} stroke={hi} strokeWidth="1" />
        {/* Typing dots */}
        <circle cx="31" cy="35" r="4.5" fill={hi} />
        <circle cx="44" cy="35" r="4.5" fill={hi} opacity="0.75" />
        <circle cx="57" cy="35" r="4.5" fill={hi} opacity="0.5" />
      </svg>
    ),

    // Untitled App — abstract grid of soft squares
    thumb_rose: (
      <svg viewBox="0 0 120 90" fill="none" className="w-full h-full" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        {[0, 1, 2].map((col) =>
          [0, 1, 2].map((row) => (
            <rect
              key={`${col}-${row}`}
              x={24 + col * 26}
              y={14 + row * 22}
              width="18" height="15" rx="4"
              fill={row === 0 && col === 1 ? hi : row === 1 && col === 0 ? hi : mid}
              opacity={1 - (col + row) * 0.08}
            />
          ))
        )}
      </svg>
    ),

    // Email Subject Line Generator — envelope with fold
    thumb_emerald: (
      <svg viewBox="0 0 120 90" fill="none" className="w-full h-full" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <rect x="16" y="22" width="88" height="54" rx="6" fill={mid} stroke={hi} strokeWidth="1" />
        {/* Envelope V-fold */}
        <path d="M16 22 L60 52 L104 22" stroke={hi} strokeWidth="1.2" strokeLinejoin="round" />
        {/* Bottom seams */}
        <line x1="16" y1="76" x2="48" y2="52" stroke={hi} strokeWidth="1" opacity="0.5" />
        <line x1="104" y1="76" x2="72" y2="52" stroke={hi} strokeWidth="1" opacity="0.5" />
        {/* Glow dot */}
        <circle cx="92" cy="29" r="6" fill={hi} />
      </svg>
    ),

    // Internal Wiki Assistant — stacked pages / open book
    thumb_sky: (
      <svg viewBox="0 0 120 90" fill="none" className="w-full h-full" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        {/* Back page */}
        <rect x="30" y="14" width="60" height="62" rx="5" fill={lo} stroke={hi} strokeWidth="1" />
        {/* Front left page */}
        <rect x="14" y="20" width="46" height="56" rx="5" fill={mid} stroke={hi} strokeWidth="1" />
        {/* Front right page */}
        <rect x="60" y="20" width="46" height="56" rx="5" fill={mid} stroke={hi} strokeWidth="1" />
        {/* Spine line */}
        <line x1="60" y1="22" x2="60" y2="74" stroke={hi} strokeWidth="1.2" />
        {/* Left text lines */}
        <rect x="20" y="32" width="30" height="3" rx="1.5" fill={hi} />
        <rect x="20" y="39" width="24" height="3" rx="1.5" fill={hi} opacity="0.6" />
        <rect x="20" y="46" width="28" height="3" rx="1.5" fill={hi} opacity="0.4" />
        {/* Right text lines */}
        <rect x="66" y="32" width="30" height="3" rx="1.5" fill={hi} />
        <rect x="66" y="39" width="24" height="3" rx="1.5" fill={hi} opacity="0.6" />
      </svg>
    ),

    // Job Description Writer — person silhouette + document
    thumb_indigo: (
      <svg viewBox="0 0 120 90" fill="none" className="w-full h-full" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        {/* Person */}
        <circle cx="38" cy="28" r="12" fill={mid} stroke={hi} strokeWidth="1" />
        <path d="M16 68 C16 52 60 52 60 68" fill={mid} stroke={hi} strokeWidth="1" />
        {/* Document */}
        <rect x="66" y="18" width="42" height="56" rx="5" fill={mid} stroke={hi} strokeWidth="1" />
        {/* Corner fold */}
        <path d="M96 18 L108 30 L96 30Z" fill={lo} />
        <path d="M96 18 L108 30 L96 30Z" stroke={hi} strokeWidth="0.8" />
        {/* Doc lines */}
        <rect x="72" y="38" width="24" height="3"  rx="1.5" fill={hi} />
        <rect x="72" y="45" width="18" height="3"  rx="1.5" fill={hi} opacity="0.6" />
        <rect x="72" y="52" width="22" height="3"  rx="1.5" fill={hi} opacity="0.4" />
      </svg>
    ),
  };

  return (
    <div className="w-full h-full flex items-center justify-center p-3">
      {art[thumbKey] ?? (
        // Fallback: simple two-circle abstract
        <svg viewBox="0 0 120 90" fill="none" className="w-full h-full" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
          <circle cx="45" cy="45" r="28" fill={mid} />
          <circle cx="80" cy="45" r="18" fill={lo} stroke={hi} strokeWidth="1" />
        </svg>
      )}
    </div>
  );
}

export default function AppCard({ app }: AppCardProps) {
  const color = THUMBNAIL_COLORS[app.thumbnail] ?? '#2a2a2a';
  const dateLabel = app.status === 'published' && app.publishedAt
    ? `Published ${formatDate(app.publishedAt)}`
    : `Edited ${formatDate(app.updatedAt)}`;

  return (
    <article className="group relative bg-[#161616] border border-[#2a2a2a] rounded-xl overflow-hidden hover:border-[#3a3a3a] transition-colors">
      {/* Thumbnail */}
      <div
        className="w-full aspect-[4/3]"
        style={{ backgroundColor: `${color}18` }}
        aria-hidden="true"
      >
        <ThumbnailArt thumbKey={app.thumbnail} color={color} />
      </div>

      {/* Info */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-medium text-[#f0f0f0] leading-snug line-clamp-1">
            {app.name}
          </h3>
          {/* Overflow menu button */}
          <button
            type="button"
            aria-label={`Options for ${app.name}`}
            className="shrink-0 w-6 h-6 flex items-center justify-center rounded-md text-[#6b7280] hover:text-[#f0f0f0] hover:bg-[#2a2a2a] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8]"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <circle cx="12" cy="5" r="1.5" />
              <circle cx="12" cy="12" r="1.5" />
              <circle cx="12" cy="19" r="1.5" />
            </svg>
          </button>
        </div>
        <p className="mt-1 text-xs text-[#6b7280]">{dateLabel}</p>
      </div>
    </article>
  );
}
