'use client';

import { useState } from 'react';
import type { Widget } from '@/lib/types';

interface Props {
  widget: Widget;
  onChange: (id: string, patch: Partial<Widget>) => void;
  onBack: () => void;
  onDelete: (id: string) => void;
}

// ─── Field wrapper ─────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-wider">{label}</span>
      {children}
    </div>
  );
}

// ─── Shared input styles ───────────────────────────────────────────────────────

const INPUT  = 'w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-[#f0f0f0] placeholder-[#4b5563] focus:outline-none focus:border-[#3a3a3a] transition-colors';
const SELECT = `${INPUT} cursor-pointer`;

// ─── Section divider ───────────────────────────────────────────────────────────

function Section({ title }: { title: string }) {
  return (
    <div className="pt-2">
      <p className="text-[10px] font-semibold text-[#4b5563] uppercase tracking-widest mb-3">{title}</p>
    </div>
  );
}

// ─── Type label ───────────────────────────────────────────────────────────────

const TYPE_LABEL: Record<Widget['type'], string> = {
  static_text: 'Static Text',
  input:       'User Input',
  llm:         'Text Generator',
  image:       'Image Generator',
  chat:        'Chat Box',
};

// ─── Widget ID chip — shown for every selected widget ─────────────────────────

function WidgetIdChip({ id, isInput }: { id: string; isInput: boolean }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(id).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }).catch(() => {});
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-wider">Widget ID</span>
      <div className="flex items-center gap-1.5">
        <code className="flex-1 min-w-0 text-[10px] text-[#9ca3af] bg-[#0d0d0d] border border-[#2a2a2a] rounded px-2 py-1 font-mono truncate">
          {id}
        </code>
        <button
          type="button"
          onClick={copy}
          aria-label={copied ? 'Copied' : 'Copy widget ID'}
          className="shrink-0 text-[#6b7280] hover:text-[#f0f0f0] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#1a73e8] rounded"
        >
          {copied ? (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="9" y="9" width="13" height="13" rx="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          )}
        </button>
      </div>
      {isInput ? (
        <p className="text-[10px] text-[#6b7280] leading-snug">
          Reference this input in a generator prompt:{' '}
          <code className="text-[#9ca3af]">{`{{${id}.value}}`}</code>
        </p>
      ) : (
        <p className="text-[10px] text-[#4b5563] leading-snug">
          Use this ID in prompts like{' '}
          <code className="text-[#6b7280]">{`{{${id}.value}}`}</code>
        </p>
      )}
    </div>
  );
}

// ─── Reference syntax hint (for generator widgets) ────────────────────────────

function RefHint() {
  return (
    <p className="text-[10px] text-[#4b5563] leading-snug">
      Tip: use{' '}
      <code className="text-[#6b7280]">{'{{widgetId.value}}'}</code>{' '}
      to insert a live input value. Find a widget&apos;s ID in its properties panel.
    </p>
  );
}

// ─── PropertiesPanel ──────────────────────────────────────────────────────────

export default function PropertiesPanel({ widget, onChange, onBack, onDelete }: Props) {
  const update = (patch: Partial<Widget>) => onChange(widget.id, patch);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Panel header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2a2a] shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={onBack}
            aria-label="Back to widget palette"
            className="text-[#6b7280] hover:text-[#f0f0f0] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8] rounded shrink-0"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <span className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider truncate">
            {TYPE_LABEL[widget.type]}
          </span>
        </div>
        <button
          type="button"
          onClick={() => onDelete(widget.id)}
          aria-label="Delete widget"
          className="shrink-0 text-[#6b7280] hover:text-[#ef4444] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ef4444] rounded"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6M14 11v6" />
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
          </svg>
        </button>
      </div>

      {/* Scrollable fields */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

        {/* ── Common: title + widget ID ─────────────────────────────────── */}
        <Section title="General" />
        <Field label="Title">
          <input
            type="text"
            className={INPUT}
            value={widget.title}
            onChange={e => update({ title: e.target.value })}
            placeholder="Widget title"
          />
        </Field>
        <WidgetIdChip id={widget.id} isInput={widget.type === 'input'} />

        {/* ── Static Text ───────────────────────────────────────────────── */}
        {widget.type === 'static_text' && (
          <Field label="Content">
            <textarea
              className={`${INPUT} resize-none`}
              rows={5}
              value={widget.content ?? ''}
              onChange={e => update({ content: e.target.value })}
              placeholder="Enter the text to display…"
            />
          </Field>
        )}

        {/* ── Input Box ─────────────────────────────────────────────────── */}
        {widget.type === 'input' && (
          <Field label="Placeholder">
            <input
              type="text"
              className={INPUT}
              value={widget.placeholder ?? ''}
              onChange={e => update({ placeholder: e.target.value })}
              placeholder="Enter text…"
            />
          </Field>
        )}

        {/* ── LLM Box ───────────────────────────────────────────────────── */}
        {widget.type === 'llm' && <>
          <Field label="Output Placeholder">
            <input
              type="text"
              className={INPUT}
              value={widget.placeholder ?? ''}
              onChange={e => update({ placeholder: e.target.value })}
              placeholder="Output will appear here…"
            />
          </Field>

          <Section title="AI Settings" />

          <Field label="System Prompt">
            <textarea
              className={`${INPUT} resize-none`}
              rows={4}
              value={widget.prompt ?? ''}
              onChange={e => update({ prompt: e.target.value })}
              placeholder="You are a helpful assistant."
            />
          </Field>
          <RefHint />

          <Field label="Model">
            <select
              className={SELECT}
              value={widget.model ?? 'claude-sonnet-4-6'}
              onChange={e => update({ model: e.target.value })}
            >
              <option value="claude-haiku-4-5">Haiku 4.5 — Fast</option>
              <option value="claude-sonnet-4-6">Sonnet 4.6 — Balanced</option>
              <option value="claude-opus-4-8">Opus 4.8 — Powerful</option>
            </select>
          </Field>

          <Field label={`Temperature — ${(widget.temperature ?? 0.7).toFixed(1)}`}>
            <input
              type="range"
              min="0" max="1" step="0.1"
              value={widget.temperature ?? 0.7}
              onChange={e => update({ temperature: parseFloat(e.target.value) })}
              className="w-full accent-[#1a73e8] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#4b5563]">
              <span>Precise</span>
              <span>Creative</span>
            </div>
          </Field>
        </>}

        {/* ── Image Box ─────────────────────────────────────────────────── */}
        {widget.type === 'image' && <>
          <Field label="Image Prompt">
            <textarea
              className={`${INPUT} resize-none`}
              rows={4}
              value={widget.imagePrompt ?? ''}
              onChange={e => update({ imagePrompt: e.target.value })}
              placeholder="Describe the image you want to generate…"
            />
          </Field>
          <RefHint />

          <Field label="Style">
            <select
              className={SELECT}
              value={widget.imageStyle ?? 'photorealistic'}
              onChange={e => update({ imageStyle: e.target.value })}
            >
              <option value="photorealistic">Photorealistic</option>
              <option value="illustration">Illustration</option>
              <option value="sketch">Sketch</option>
              <option value="3d-render">3D Render</option>
              <option value="oil-painting">Oil Painting</option>
            </select>
          </Field>
        </>}

        {/* ── Chat Box ──────────────────────────────────────────────────── */}
        {widget.type === 'chat' && <>
          <Field label="Input Placeholder">
            <input
              type="text"
              className={INPUT}
              value={widget.placeholder ?? ''}
              onChange={e => update({ placeholder: e.target.value })}
              placeholder="Type a message…"
            />
          </Field>

          <Section title="AI Settings" />

          <Field label="Initial Prompt">
            <textarea
              className={`${INPUT} resize-none`}
              rows={4}
              value={widget.prompt ?? ''}
              onChange={e => update({ prompt: e.target.value })}
              placeholder="You are a helpful assistant."
            />
          </Field>
        </>}

        {/* ── Position (read-only info) ──────────────────────────────────── */}
        <Section title="Layout" />
        <div className="grid grid-cols-2 gap-2">
          <Field label="X">
            <input
              type="number"
              className={INPUT}
              value={Math.round(widget.x)}
              onChange={e => update({ x: Number(e.target.value) })}
            />
          </Field>
          <Field label="Y">
            <input
              type="number"
              className={INPUT}
              value={Math.round(widget.y)}
              onChange={e => update({ y: Number(e.target.value) })}
            />
          </Field>
          <Field label="Width">
            <input
              type="number"
              className={INPUT}
              value={widget.w}
              onChange={e => update({ w: Math.max(100, Number(e.target.value)) })}
            />
          </Field>
        </div>

      </div>
    </div>
  );
}
