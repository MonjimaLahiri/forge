'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Template } from '@/lib/types';
import Button from '@/components/ui/Button';

interface Props {
  templates: Template[];
}

// ─── Abstract SVG artwork per template ────────────────────────────────────────

const ARTWORK: Record<string, React.ReactNode> = {
  // FAQ Chatbot — chat bubbles, typing dots
  tmpl_001: (
    <svg viewBox="0 0 400 460" fill="none" className="w-full h-full" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <circle cx="380" cy="40"  r="220" fill="rgba(255,255,255,0.04)" />
      <circle cx="-20" cy="390" r="170" fill="rgba(255,255,255,0.04)" />
      {/* Main chat bubble */}
      <rect x="55" y="110" width="240" height="150" rx="22" fill="rgba(255,255,255,0.09)" />
      <path d="M78 260 L55 305 L130 260Z" fill="rgba(255,255,255,0.09)" />
      {/* Reply bubble */}
      <rect x="120" y="290" width="180" height="80" rx="16" fill="rgba(255,255,255,0.06)" />
      {/* Typing dots */}
      <circle cx="128" cy="190" r="13" fill="rgba(255,255,255,0.55)" />
      <circle cx="162" cy="190" r="13" fill="rgba(255,255,255,0.45)" />
      <circle cx="196" cy="190" r="13" fill="rgba(255,255,255,0.35)" />
      {/* Accent circles */}
      <circle cx="320" cy="130" r="36" fill="rgba(255,255,255,0.06)" />
      <circle cx="350" cy="300" r="55" fill="rgba(255,255,255,0.04)" />
    </svg>
  ),

  // Product Description Generator — document, text lines, sparkle
  tmpl_002: (
    <svg viewBox="0 0 400 220" fill="none" className="w-full h-full" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <circle cx="370" cy="-20" r="160" fill="rgba(255,255,255,0.05)" />
      <circle cx="-10" cy="200" r="100" fill="rgba(255,255,255,0.04)" />
      {/* Document */}
      <rect x="44" y="28" width="190" height="164" rx="14" fill="rgba(255,255,255,0.1)" />
      {/* Corner fold */}
      <path d="M204 28 L234 58 L204 58Z" fill="rgba(0,0,0,0.15)" />
      <path d="M204 28 L234 58 L204 58Z" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
      {/* Text lines */}
      <rect x="68" y="72"  width="130" height="7" rx="3.5" fill="rgba(255,255,255,0.38)" />
      <rect x="68" y="88"  width="100" height="7" rx="3.5" fill="rgba(255,255,255,0.24)" />
      <rect x="68" y="104" width="118" height="7" rx="3.5" fill="rgba(255,255,255,0.24)" />
      <rect x="68" y="120" width="80"  height="7" rx="3.5" fill="rgba(255,255,255,0.18)" />
      <rect x="68" y="136" width="105" height="7" rx="3.5" fill="rgba(255,255,255,0.14)" />
      {/* Sparkle */}
      <path d="M298 58 L304 36 L310 58 L332 64 L310 70 L304 92 L298 70 L276 64Z" fill="rgba(255,255,255,0.75)" />
      <circle cx="342" cy="150" r="26" fill="rgba(255,255,255,0.07)" />
    </svg>
  ),

  // Social Caption Writer — network nodes, dashed connections
  tmpl_003: (
    <svg viewBox="0 0 400 220" fill="none" className="w-full h-full" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <circle cx="370" cy="230" r="180" fill="rgba(255,255,255,0.04)" />
      {/* Three network nodes */}
      <circle cx="110" cy="90"  r="36" fill="rgba(255,255,255,0.11)" stroke="rgba(255,255,255,0.28)" strokeWidth="1.5" />
      <circle cx="288" cy="62"  r="27" fill="rgba(255,255,255,0.09)" stroke="rgba(255,255,255,0.22)" strokeWidth="1.5" />
      <circle cx="278" cy="168" r="27" fill="rgba(255,255,255,0.09)" stroke="rgba(255,255,255,0.22)" strokeWidth="1.5" />
      {/* Dashed connections */}
      <line x1="146" y1="87"  x2="261" y2="66"  stroke="rgba(255,255,255,0.22)" strokeWidth="1.5" strokeDasharray="5 4" />
      <line x1="144" y1="106" x2="252" y2="158" stroke="rgba(255,255,255,0.22)" strokeWidth="1.5" strokeDasharray="5 4" />
      {/* Node centers */}
      <circle cx="110" cy="90"  r="11" fill="rgba(255,255,255,0.55)" />
      <circle cx="288" cy="62"  r="8"  fill="rgba(255,255,255,0.5)" />
      <circle cx="278" cy="168" r="8"  fill="rgba(255,255,255,0.5)" />
      {/* Small satellites */}
      <circle cx="200" cy="130" r="5" fill="rgba(255,255,255,0.3)" />
      <circle cx="170" cy="50"  r="4" fill="rgba(255,255,255,0.2)" />
    </svg>
  ),
};

// ─── Small colored avatar ──────────────────────────────────────────────────────

function AuthorDot({ color, label }: { color: string; label: string }) {
  return (
    <div
      className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white shrink-0"
      style={{ backgroundColor: color }}
      aria-label={label}
    >
      {label[0]}
    </div>
  );
}

// ─── Featured card (full-bleed color + artwork + gradient text overlay) ────────

interface FeaturedCardProps {
  template: Template;
  tall?: boolean;
}

function FeaturedCard({ template, tall = false }: FeaturedCardProps) {
  const art = ARTWORK[template.id];

  return (
    <article
      className={`relative rounded-2xl overflow-hidden group cursor-pointer ${tall ? 'row-span-2' : ''}`}
      style={{ backgroundColor: template.accentColor }}
    >
      {/* Abstract SVG artwork */}
      <div className="absolute inset-0 overflow-hidden">
        {art ?? (
          <svg viewBox="0 0 400 300" fill="none" className="w-full h-full" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            <circle cx="320" cy="40"  r="180" fill="rgba(255,255,255,0.05)" />
            <circle cx="80"  cy="260" r="120" fill="rgba(255,255,255,0.04)" />
          </svg>
        )}
      </div>

      {/* Bottom gradient for text legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />

      {/* Content pinned to bottom */}
      <div className="relative z-10 flex flex-col h-full p-5">
        <div className="flex-1 min-h-[120px]" />

        <div>
          <span className="inline-block text-[10px] font-semibold uppercase tracking-widest text-white/60 mb-1.5">
            {template.category}
          </span>
          <h3 className="text-base font-bold text-white leading-snug mb-1">
            {template.name}
          </h3>
          <p className="text-xs text-white/65 line-clamp-2 leading-relaxed mb-3">
            {template.description}
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <AuthorDot color="rgba(255,255,255,0.3)" label={template.author} />
              <span className="text-xs text-white/55">{template.author}</span>
            </div>
            <Link
              href={`/builder/new?template=${template.id}`}
              className="h-8 px-4 text-xs rounded-full font-semibold bg-[#D7F237] text-[#171717] hover:bg-[#c9e422] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D7F237]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d0d0d] inline-flex items-center"
            >
              Use template
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

// ─── All-apps compact card ─────────────────────────────────────────────────────

function AllAppCard({ template }: { template: Template }) {
  return (
    <article className="bg-[#141414] border border-[#242424] rounded-xl p-4 flex flex-col gap-3 hover:border-[#333] transition-colors group">
      {/* Color accent strip + category */}
      <div className="flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: template.accentColor }} />
        <span className="text-[10px] font-semibold uppercase tracking-widest text-[#6b7280]">
          {template.category}
        </span>
      </div>

      {/* Title + description */}
      <div>
        <h3 className="text-sm font-semibold text-[#f0f0f0] leading-snug line-clamp-1 group-hover:text-white transition-colors">
          {template.name}
        </h3>
        <p className="mt-1 text-xs text-[#6b7280] line-clamp-2 leading-relaxed">
          {template.description}
        </p>
      </div>

      {/* Footer: author + rating + CTA */}
      <div className="mt-auto pt-1 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <AuthorDot color={template.accentColor} label={template.author} />
          <span className="text-xs text-[#4b5563] truncate">{template.author}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] text-[#4b5563]">
            ★ {template.rating}
          </span>
          <Link
            href={`/builder/new?template=${template.id}`}
            className="h-7 px-3 text-[11px] rounded-full font-semibold border border-[#333] text-[#9ca3af] hover:border-[#D7F237] hover:text-[#D7F237] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#D7F237]/50 inline-flex items-center"
          >
            Use
          </Link>
        </div>
      </div>
    </article>
  );
}

// ─── Main client component ─────────────────────────────────────────────────────

const PlusIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export default function DiscoverClient({ templates }: Props) {
  const [query, setQuery] = useState('');

  const filtered = query.trim()
    ? templates.filter(
        (t) =>
          t.name.toLowerCase().includes(query.toLowerCase()) ||
          t.description.toLowerCase().includes(query.toLowerCase()) ||
          t.category.toLowerCase().includes(query.toLowerCase()),
      )
    : templates;

  const featured = filtered.filter((t) => t.featured);
  const all      = filtered;

  // Destructure featured for bento layout
  const [f0, f1, f2] = featured;

  return (
    <div className="px-8 py-8 space-y-12">

      {/* Search */}
      <div className="relative max-w-sm">
        <label htmlFor="discover-search" className="sr-only">Search apps</label>
        <svg
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#4b5563] pointer-events-none"
          width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          id="discover-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search an app..."
          className="w-full pl-9 pr-4 py-2.5 bg-[#141414] border border-[#2a2a2a] rounded-lg text-sm text-[#f0f0f0] placeholder-[#4b5563] focus:outline-none focus:border-[#3a3a3a] transition-colors"
        />
      </div>

      {/* Empty search state */}
      {filtered.length === 0 && (
        <p className="text-sm text-[#6b7280] py-16 text-center">
          No templates match &ldquo;{query}&rdquo;
        </p>
      )}

      {/* ── Featured bento grid ── */}
      {featured.length > 0 && (
        <section aria-labelledby="featured-heading">
          <h2 id="featured-heading" className="text-sm font-semibold text-[#f0f0f0] mb-4">
            Featured
          </h2>

          {/* Asymmetric bento: tall left card (3fr) + 2 stacked right cards (2fr) */}
          <div
            className="grid gap-3"
            style={{
              gridTemplateColumns: '3fr 2fr',
              gridTemplateRows: '220px 220px',
            }}
          >
            {f0 && <FeaturedCard template={f0} tall />}
            {f1 && <FeaturedCard template={f1} />}
            {f2 && <FeaturedCard template={f2} />}
          </div>
        </section>
      )}

      {/* ── All apps grid ── */}
      {all.length > 0 && (
        <section aria-labelledby="all-apps-heading">
          <div className="flex items-center justify-between mb-4">
            <h2 id="all-apps-heading" className="text-sm font-semibold text-[#f0f0f0]">
              All apps
            </h2>
            <span className="text-xs text-[#4b5563]">{all.length} templates</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {all.map((t) => (
              <AllAppCard key={t.id} template={t} />
            ))}
          </div>

          {/* Bottom CTA */}
          <div className="mt-10 flex flex-col items-center gap-3 py-8 border border-dashed border-[#2a2a2a] rounded-2xl">
            <p className="text-sm text-[#6b7280]">Don&apos;t see what you need?</p>
            <Button href="/builder/new" size="md">
              <PlusIcon />
              Create New
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
