'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import type { Widget, WidgetType } from '@/lib/types';
import Button from '@/components/ui/Button';
import WidgetPalette from '@/components/builder/WidgetPalette';
import WidgetCard from '@/components/builder/WidgetCard';
import PropertiesPanel from '@/components/builder/PropertiesPanel';

// ─── Default props for each widget type ──────────────────────────────────────

export type WidgetDefaults = Omit<Widget, 'id' | 'x' | 'y'>;

export const WIDGET_DEFAULTS: Record<WidgetType, WidgetDefaults> = {
  static_text: {
    type: 'static_text', w: 280, h: 90,
    title: 'Text Box',
    content: 'Your text here',
  },
  input: {
    type: 'input', w: 280, h: 80,
    title: 'Input',
    placeholder: 'Enter text…',
  },
  llm: {
    type: 'llm', w: 300, h: 140,
    title: 'AI Generator',
    placeholder: 'Output will appear here…',
    prompt: 'You are a helpful assistant.',
    model: 'claude-sonnet-4-6',
    temperature: 0.7,
  },
  image: {
    type: 'image', w: 300, h: 160,
    title: 'Image Generator',
    imagePrompt: 'Describe the image you want to generate',
    imageStyle: 'photorealistic',
  },
  chat: {
    type: 'chat', w: 320, h: 260,
    title: 'Chat',
    placeholder: 'Type a message…',
    prompt: 'You are a helpful assistant.',
  },
};

// ─── Drag state (stored in ref — no extra re-renders during drag) ─────────────

interface DragState {
  widgetId: string;
  startX: number;
  startY: number;
  origX: number;
  origY: number;
}

// ─── ID generator ─────────────────────────────────────────────────────────────

let _counter = 0;
function genId() { return `w_${++_counter}`; }

// ─── Empty canvas placeholder ─────────────────────────────────────────────────

function EmptyCanvas() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
      <div className="flex flex-col items-center gap-4 text-center">
        <svg width="48" height="48" viewBox="0 0 56 56" fill="none" aria-hidden="true" className="text-[#2a2a2a]">
          <path d="M28 4L31.5 24.5L52 28L31.5 31.5L28 52L24.5 31.5L4 28L24.5 24.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M44 8L45.5 15.5L53 17L45.5 18.5L44 26L42.5 18.5L35 17L42.5 15.5Z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" />
        </svg>
        <p className="text-sm text-[#4b5563] max-w-[200px] leading-relaxed">
          Click a widget in the panel on the right to add it to your canvas
        </p>
      </div>
    </div>
  );
}

// ─── BuilderRoot ──────────────────────────────────────────────────────────────

export default function BuilderRoot() {
  const [widgets, setWidgets]       = useState<Widget[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [appName, setAppName]       = useState('Untitled App');
  const [editingName, setEditingName] = useState(false);
  const dragging = useRef<DragState | null>(null);

  const selectedWidget = widgets.find(w => w.id === selectedId) ?? null;

  // ── Widget operations ──────────────────────────────────────────────────────

  function addWidget(type: WidgetType) {
    const stagger = (widgets.length % 8) * 20;
    const w: Widget = {
      ...WIDGET_DEFAULTS[type],
      id: genId(),
      x: 48 + stagger,
      y: 48 + stagger,
    };
    setWidgets(prev => [...prev, w]);
    setSelectedId(w.id);
  }

  function updateWidget(id: string, patch: Partial<Widget>) {
    setWidgets(prev => prev.map(w => w.id === id ? { ...w, ...patch } : w));
  }

  function deleteWidget(id: string) {
    setWidgets(prev => prev.filter(w => w.id !== id));
    setSelectedId(null);
  }

  // ── Drag ──────────────────────────────────────────────────────────────────

  function onWidgetMouseDown(e: React.MouseEvent, widget: Widget) {
    e.preventDefault();
    e.stopPropagation();
    setSelectedId(widget.id);
    dragging.current = {
      widgetId: widget.id,
      startX: e.clientX,
      startY: e.clientY,
      origX: widget.x,
      origY: widget.y,
    };
  }

  function onMouseMove(e: React.MouseEvent) {
    if (!dragging.current) return;
    const { widgetId, startX, startY, origX, origY } = dragging.current;
    updateWidget(widgetId, {
      x: Math.max(0, origX + e.clientX - startX),
      y: Math.max(0, origY + e.clientY - startY),
    });
  }

  function onMouseUp() {
    dragging.current = null;
  }

  // ── Rename app (inline) ────────────────────────────────────────────────────

  function commitName(value: string) {
    setAppName(value.trim() || appName);
    setEditingName(false);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    // Mouse handlers on outermost div so drag tracks even if cursor leaves the canvas
    <div
      className="flex h-full min-h-screen bg-[#0d0d0d] select-none"
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
    >
      {/* ── Left sidebar ── */}
      <aside className="flex flex-col w-60 shrink-0 h-full bg-[#161616] border-r border-[#2a2a2a]">
        <div className="h-[60px] flex items-center px-5 border-b border-[#2a2a2a]">
          <Link
            href="/dashboard"
            className="inline-flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8] rounded"
          >
            <span className="text-[#f0f0f0] text-lg font-semibold tracking-tight">
              Forge<span className="text-[#1a73e8]">.</span>
            </span>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5" aria-label="Builder navigation">
          {[
            { href: '/builder/new', label: 'App Builder', active: true },
            { href: '/my-apps',    label: 'My Apps',      active: false },
            { href: '/discover',   label: 'Discover Apps', active: false },
          ].map(item => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={item.active ? 'page' : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8] ${
                item.active
                  ? 'bg-[#1a73e8]/15 text-[#f0f0f0]'
                  : 'text-[#9ca3af] hover:bg-[#1f1f1f] hover:text-[#f0f0f0]'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-[#2a2a2a]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#1a73e8]/20 flex items-center justify-center shrink-0">
              <span className="text-xs font-semibold text-[#1a73e8]">A</span>
            </div>
            <p className="text-sm font-medium text-[#f0f0f0] truncate">Alex</p>
          </div>
        </div>
      </aside>

      {/* ── Main column ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header */}
        <header className="h-[60px] flex items-center justify-between px-6 border-b border-[#2a2a2a] bg-[#161616] shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            {editingName ? (
              <input
                autoFocus
                defaultValue={appName}
                className="bg-transparent text-sm font-medium text-[#f0f0f0] border-b border-[#1a73e8] outline-none w-44"
                onBlur={e => commitName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter')  commitName(e.currentTarget.value);
                  if (e.key === 'Escape') setEditingName(false);
                }}
              />
            ) : (
              <span className="text-sm font-medium text-[#f0f0f0] truncate">{appName}</span>
            )}
            <button
              type="button"
              aria-label="Rename app"
              onClick={() => setEditingName(true)}
              className="shrink-0 text-[#6b7280] hover:text-[#f0f0f0] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8] rounded"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
          </div>

          <Button size="sm">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" y1="2" x2="12" y2="15" />
            </svg>
            Publish
          </Button>
        </header>

        {/* Canvas + right panel */}
        <div className="flex-1 flex min-h-0">

          {/* Canvas scroll container */}
          <div
            className="flex-1 overflow-auto"
            style={{
              backgroundImage: 'radial-gradient(circle, #242424 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
            onClick={() => setSelectedId(null)}
          >
            {/* Absolute coordinate space — widgets are placed within this */}
            <div className="relative" style={{ minWidth: 1000, minHeight: 720 }}>
              {widgets.length === 0 && <EmptyCanvas />}
              {widgets.map(w => (
                <WidgetCard
                  key={w.id}
                  widget={w}
                  selected={w.id === selectedId}
                  onMouseDown={e => onWidgetMouseDown(e, w)}
                  onClick={e => { e.stopPropagation(); setSelectedId(w.id); }}
                />
              ))}
            </div>
          </div>

          {/* Right panel — palette or properties */}
          <aside
            className="w-64 shrink-0 border-l border-[#2a2a2a] bg-[#161616] flex flex-col overflow-hidden"
            aria-label={selectedWidget ? 'Widget properties' : 'Widget palette'}
          >
            {selectedWidget ? (
              <PropertiesPanel
                widget={selectedWidget}
                onChange={updateWidget}
                onBack={() => setSelectedId(null)}
                onDelete={deleteWidget}
              />
            ) : (
              <WidgetPalette onAdd={addWidget} />
            )}
          </aside>

        </div>
      </div>
    </div>
  );
}
