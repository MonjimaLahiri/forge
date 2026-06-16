'use client';

import type { WidgetType } from '@/lib/types';

interface Props {
  onAdd: (type: WidgetType) => void;
}

const WIDGET_TYPES: Array<{ type: WidgetType; label: string; description: string; icon: React.ReactNode }> = [
  {
    type: 'static_text',
    label: 'Static Text',
    description: 'Display a fixed text block or heading.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M7 8h10M7 12h6" />
      </svg>
    ),
  },
  {
    type: 'input',
    label: 'User Input',
    description: 'Collect a text response from the user.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="6" width="18" height="12" rx="2" />
        <path d="M7 12h2" />
      </svg>
    ),
  },
  {
    type: 'llm',
    label: 'Text Generator',
    description: 'Generate text with an AI prompt.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 2l3 7h7l-5.5 4 2 7L12 16l-6.5 4 2-7L2 9h7z" />
      </svg>
    ),
  },
  {
    type: 'image',
    label: 'Image Generator',
    description: 'Generate images from a text prompt.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="M21 15l-5-5L5 21" />
      </svg>
    ),
  },
  {
    type: 'chat',
    label: 'Chat Box',
    description: 'Add a conversational AI chat interface.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
];

export default function WidgetPalette({ onAdd }: Props) {
  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-4 py-3 border-b border-[#2a2a2a] shrink-0">
        <p className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider">Widgets</p>
      </div>

      <div className="p-3 space-y-1.5 flex-1">
        {WIDGET_TYPES.map(({ type, label, description, icon }) => (
          <button
            key={type}
            type="button"
            onClick={() => onAdd(type)}
            className="w-full flex items-start gap-3 px-3 py-3 rounded-lg text-left bg-[#161616] border border-[#2a2a2a] hover:border-[#3a3a3a] hover:bg-[#1a1a1a] active:bg-[#1f1f1f] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8]"
          >
            <span className="mt-0.5 text-[#6b7280] shrink-0">{icon}</span>
            <div>
              <p className="text-sm font-medium text-[#f0f0f0]">{label}</p>
              <p className="text-xs text-[#6b7280] mt-0.5 leading-snug">{description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
