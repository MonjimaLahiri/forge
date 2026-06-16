'use client';

import type { Widget } from '@/lib/types';

// ─── Type label ───────────────────────────────────────────────────────────────

const TYPE_LABEL: Record<Widget['type'], string> = {
  static_text: 'Text',
  input:       'Input',
  llm:         'AI Generator',
  image:       'Image',
  chat:        'Chat',
};

// ─── Drag handle icon (6-dot grip) ───────────────────────────────────────────

function DragHandle() {
  return (
    <svg
      width="10" height="14" viewBox="0 0 10 14" fill="currentColor"
      className="text-[#3a3a3a] group-hover:text-[#5a5a5a] transition-colors shrink-0 cursor-grab"
      aria-hidden="true"
    >
      <circle cx="2" cy="2"  r="1.5" />
      <circle cx="8" cy="2"  r="1.5" />
      <circle cx="2" cy="7"  r="1.5" />
      <circle cx="8" cy="7"  r="1.5" />
      <circle cx="2" cy="12" r="1.5" />
      <circle cx="8" cy="12" r="1.5" />
    </svg>
  );
}

// ─── Type-specific canvas preview ────────────────────────────────────────────

function WidgetPreview({ widget }: { widget: Widget }) {
  const base = 'text-xs text-[#6b7280]';

  if (widget.type === 'static_text') {
    return (
      <p className={`${base} leading-relaxed whitespace-pre-wrap break-words line-clamp-4`}>
        {widget.content || 'No content yet'}
      </p>
    );
  }

  if (widget.type === 'input') {
    return (
      <div className="rounded-lg bg-[#0d0d0d] border border-[#2a2a2a] px-3 py-2 text-xs text-[#4b5563] truncate pointer-events-none">
        {widget.placeholder || 'Enter text…'}
      </div>
    );
  }

  if (widget.type === 'llm') {
    return (
      <div className="space-y-2">
        <p className={`${base} line-clamp-2 italic`}>{widget.prompt}</p>
        <div className="rounded-lg bg-[#0d0d0d] border border-[#2a2a2a] px-3 py-2 text-xs text-[#4b5563] truncate pointer-events-none">
          {widget.placeholder}
        </div>
      </div>
    );
  }

  if (widget.type === 'image') {
    return (
      <div className="rounded-lg bg-[#0d0d0d] border border-[#2a2a2a] flex items-center justify-center gap-2 px-3 py-4 pointer-events-none">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3a3a3a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="M21 15l-5-5L5 21" />
        </svg>
        <span className={`${base} truncate`}>{widget.imagePrompt}</span>
      </div>
    );
  }

  if (widget.type === 'chat') {
    return (
      <div className="space-y-2">
        {/* Fake message bubbles */}
        <div className="flex justify-end">
          <div className="rounded-xl rounded-tr-sm bg-[#1a73e8]/20 px-2.5 py-1.5 text-xs text-[#9ca3af] max-w-[75%]">
            Hello
          </div>
        </div>
        <div className="flex justify-start">
          <div className="rounded-xl rounded-tl-sm bg-[#1f1f1f] border border-[#2a2a2a] px-2.5 py-1.5 text-xs text-[#9ca3af] max-w-[75%]">
            Hi! How can I help?
          </div>
        </div>
        <div className="rounded-lg bg-[#0d0d0d] border border-[#2a2a2a] px-3 py-1.5 text-xs text-[#4b5563] truncate pointer-events-none">
          {widget.placeholder}
        </div>
      </div>
    );
  }

  return null;
}

// ─── WidgetCard ───────────────────────────────────────────────────────────────

interface Props {
  widget: Widget;
  selected: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onClick: (e: React.MouseEvent) => void;
}

export default function WidgetCard({ widget, selected, onMouseDown, onClick }: Props) {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      aria-label={`${TYPE_LABEL[widget.type]}: ${widget.title}`}
      className={`group absolute rounded-xl border bg-[#1a1a1a] shadow-lg transition-colors cursor-pointer
        ${selected
          ? 'border-[#1a73e8] shadow-[0_0_0_1px_#1a73e8]'
          : 'border-[#2a2a2a] hover:border-[#3a3a3a]'
        }`}
      style={{
        left: widget.x,
        top: widget.y,
        width: widget.w,
        minHeight: widget.h,
      }}
      onMouseDown={onMouseDown}
      onClick={onClick}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onClick(e as unknown as React.MouseEvent); }}
    >
      {/* Card header — drag target */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[#242424]">
        <DragHandle />
        <span className="flex-1 text-xs font-medium text-[#e0e0e0] truncate">{widget.title}</span>
        <span className="text-[10px] font-medium text-[#4b5563] shrink-0">{TYPE_LABEL[widget.type]}</span>
      </div>

      {/* Widget preview */}
      <div className="p-3">
        <WidgetPreview widget={widget} />
      </div>
    </div>
  );
}
