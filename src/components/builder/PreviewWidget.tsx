'use client';

import { useState, useRef, useEffect } from 'react';
import type { Widget } from '@/lib/types';
import { resolvePrompt } from '@/lib/resolvePrompt';

// ─── Shared props ─────────────────────────────────────────────────────────────

interface SharedProps {
  widget: Widget;
  runtimeValues: Record<string, string>;
  widgetTitles: Record<string, string>;
  onValueChange: (id: string, value: string) => void;
}

// ─── Mock content generators ──────────────────────────────────────────────────

function generateChatReply(userMsg: string, systemPrompt: string): string {
  const lower = userMsg.toLowerCase();

  if (/\b(hi|hello|hey)\b/.test(lower)) {
    return "Hello! I'm here to help. What can I assist you with today? (Mock response — connect a real AI model for actual conversation.)";
  }
  if (/\bthank/.test(lower)) {
    return 'You\'re welcome! Feel free to ask if there\'s anything else I can help with. (Mock response)';
  }

  const isProductCtx = /product|shop|item|order|buy/i.test(systemPrompt);
  const isHelpCtx    = /help|support|assist|service/i.test(systemPrompt);
  const isFAQCtx     = /faq|question|answer|know/i.test(systemPrompt);
  const snippet      = userMsg.length > 50 ? userMsg.slice(0, 50) + '…' : userMsg;

  if (isProductCtx) {
    return `Great question! For "${snippet}", our team would be happy to provide more details. (Mock response — connect a real AI for actual answers.)`;
  }
  if (isHelpCtx) {
    return `I'd be happy to help with "${snippet}". Let me look into that for you right away. (Mock response — connect a real AI for actual support.)`;
  }
  if (isFAQCtx) {
    return `That's a common question! The answer to "${snippet}" depends on the specifics. (Mock response — connect a real AI for actual answers.)`;
  }

  return `Thanks for your message about "${snippet}". I've noted your question and will do my best to help. (Mock response — connect a real AI model for actual conversation.)`;
}

function promptToGradient(prompt: string): string {
  const hash = prompt.split('').reduce((a, c) => (a + c.charCodeAt(0)) | 0, 0);
  const gradients = [
    'linear-gradient(135deg, #1a1a2e 0%, #16213e 55%, #0f3460 100%)',
    'linear-gradient(135deg, #0d1b2a 0%, #1b2838 55%, #1a3a5c 100%)',
    'linear-gradient(135deg, #1a2e1a 0%, #1e3a1e 55%, #0a4a1a 100%)',
    'linear-gradient(135deg, #2e1a0a 0%, #3d2810 55%, #5c3a1a 100%)',
    'linear-gradient(135deg, #2a0a2e 0%, #3d1040 55%, #5c0a6a 100%)',
  ];
  return gradients[Math.abs(hash) % gradients.length];
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const CARD = 'h-full rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] overflow-hidden flex flex-col';
const CARD_HEADER = 'px-4 py-3 border-b border-[#242424] shrink-0';
const CARD_TITLE = 'text-xs font-semibold text-[#9ca3af] uppercase tracking-wider';
const INPUT_STYLE =
  'w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-[#f0f0f0] ' +
  'placeholder-[#4b5563] focus:outline-none focus:border-[#1a73e8] transition-colors';
const BTN_PRIMARY =
  'w-full py-2 rounded-lg text-sm font-semibold bg-[#1a73e8] text-white ' +
  'hover:bg-[#1557b0] disabled:opacity-50 disabled:cursor-not-allowed ' +
  'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8]';

// ─── Warning list ─────────────────────────────────────────────────────────────

function WarningList({ warnings }: { warnings: string[] }) {
  if (warnings.length === 0) return null;
  return (
    <div className="rounded-lg bg-[#854d0e]/20 border border-[#854d0e]/40 px-3 py-2 space-y-1">
      {warnings.map((w, i) => (
        <p key={i} className="text-xs text-[#fbbf24] leading-snug">{w}</p>
      ))}
    </div>
  );
}

// ─── Static Text ──────────────────────────────────────────────────────────────

function StaticTextPreview({ widget }: SharedProps) {
  return (
    <div className={CARD}>
      <div className={CARD_HEADER}>
        <p className={CARD_TITLE}>{widget.title}</p>
      </div>
      <div className="flex-1 px-4 py-3">
        <p className="text-sm text-[#d1d5db] leading-relaxed whitespace-pre-wrap">
          {widget.content ?? ''}
        </p>
      </div>
    </div>
  );
}

// ─── Input Box ────────────────────────────────────────────────────────────────

function InputPreview({ widget, onValueChange }: SharedProps) {
  const [value, setValue] = useState('');

  function handleChange(next: string) {
    setValue(next);
    onValueChange(widget.id, next);
  }

  return (
    <div className={CARD}>
      <div className={CARD_HEADER}>
        <label htmlFor={`input-${widget.id}`} className={CARD_TITLE}>
          {widget.title}
        </label>
      </div>
      <div className="flex-1 px-4 py-3">
        <input
          id={`input-${widget.id}`}
          type="text"
          className={INPUT_STYLE}
          placeholder={widget.placeholder}
          value={value}
          onChange={e => handleChange(e.target.value)}
        />
      </div>
    </div>
  );
}

// ─── Text Generator (LLM) ─────────────────────────────────────────────────────

type GenerateSource = 'ai' | 'mock' | null;
type GenerateReason = 'no-key' | 'fallback' | null;

function LLMPreview({ widget, runtimeValues, widgetTitles }: SharedProps) {
  const [output, setOutput]     = useState('');
  const [warnings, setWarnings] = useState<string[]>([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [source, setSource]     = useState<GenerateSource>(null);
  const [reason, setReason]     = useState<GenerateReason>(null);

  async function handleGenerate() {
    if (loading) return;
    const template = widget.prompt ?? '';
    const { resolved, warnings: w } = resolvePrompt(template, runtimeValues, widgetTitles);
    setWarnings(w);
    setLoading(true);
    setOutput('');
    setError('');
    setSource(null);
    setReason(null);

    try {
      const res = await fetch('/api/generate-text', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          prompt: resolved,
          model: widget.model,
          temperature: widget.temperature,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(typeof data?.error === 'string' ? data.error : 'Something went wrong. Please try again.');
        return;
      }

      setOutput(data.text);
      setSource(data.source === 'ai' ? 'ai' : 'mock');
      setReason(data.reason === 'no-key' || data.reason === 'fallback' ? data.reason : null);
    } catch {
      setError('Could not reach the server. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={CARD}>
      <div className={CARD_HEADER}>
        <p className={CARD_TITLE}>{widget.title}</p>
      </div>
      <div className="flex-1 px-4 py-3 flex flex-col gap-3 overflow-y-auto">
        <WarningList warnings={warnings} />

        <button onClick={handleGenerate} disabled={loading} className={BTN_PRIMARY}>
          {loading ? 'Generating…' : 'Generate'}
        </button>

        {loading && (
          <p className="text-xs text-[#6b7280] text-center animate-pulse">Generating with Gemini…</p>
        )}

        {error && !loading && (
          <div className="rounded-lg bg-[#7f1d1d]/20 border border-[#7f1d1d]/40 px-3 py-2 flex items-start justify-between gap-2">
            <p className="text-xs text-[#fca5a5] leading-snug">{error}</p>
            <button
              onClick={handleGenerate}
              className="shrink-0 text-xs font-semibold text-[#fca5a5] hover:text-[#fecaca] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#ef4444] rounded px-1"
            >
              Retry
            </button>
          </div>
        )}

        {output && !error && reason === 'fallback' && (
          <div className="rounded-lg bg-[#854d0e]/20 border border-[#854d0e]/40 px-3 py-2">
            <p className="text-xs text-[#fbbf24] leading-snug">
              Gemini is temporarily unavailable — showing mock output instead.
            </p>
          </div>
        )}

        {output && !error && (
          <div className="rounded-lg bg-[#0d0d0d] border border-[#2a2a2a] px-3 py-2.5 text-sm text-[#d1d5db] leading-relaxed">
            {output}
          </div>
        )}

        {output && !error && (
          <p className="text-[10px] text-[#4b5563] text-center">
            {source === 'ai' ? 'Generated with Gemini' : 'Mock output'}
          </p>
        )}

        {!output && !loading && !error && (
          <p className="text-xs text-[#4b5563] text-center">{widget.placeholder}</p>
        )}
      </div>
    </div>
  );
}

// ─── Image Generator ──────────────────────────────────────────────────────────

function ImagePreview({ widget, runtimeValues, widgetTitles }: SharedProps) {
  const [generated, setGenerated]   = useState(false);
  const [loading, setLoading]       = useState(false);
  const [warnings, setWarnings]     = useState<string[]>([]);
  const [displayPrompt, setDisplayPrompt] = useState(widget.imagePrompt ?? '');
  const [gradient, setGradient]     = useState('');

  function handleGenerate() {
    if (loading) return;
    const template = widget.imagePrompt ?? '';
    const { resolved, warnings: w } = resolvePrompt(template, runtimeValues, widgetTitles);
    setWarnings(w);
    setDisplayPrompt(resolved || template);
    setGradient(promptToGradient(resolved || template));
    setLoading(true);
    // 800–1100 ms mock delay
    const delay = 800 + Math.floor(Math.random() * 300);
    setTimeout(() => {
      setGenerated(true);
      setLoading(false);
    }, delay);
  }

  const bgStyle = generated
    ? gradient || promptToGradient(widget.imagePrompt ?? '')
    : '#0d0d0d';

  return (
    <div className={CARD}>
      <div className={CARD_HEADER}>
        <p className={CARD_TITLE}>{widget.title}</p>
        <p className="text-[10px] text-[#4b5563] mt-0.5">Image generation mock — no real images are created yet.</p>
      </div>
      <div className="flex-1 px-4 py-3 flex flex-col gap-3">
        <WarningList warnings={warnings} />

        <div
          className="flex-1 rounded-lg border border-[#2a2a2a] flex flex-col items-center justify-center gap-2 p-4"
          style={{ minHeight: 80, background: bgStyle, transition: 'background 0.4s ease' }}
        >
          {loading ? (
            <p className="text-xs text-[#6b7280] animate-pulse">Generating mock image…</p>
          ) : generated ? (
            <>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6a8fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
              <p className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-wider">Mock image preview</p>
              {displayPrompt && (
                <p className="text-[10px] text-[#9ca3af] text-center max-w-[180px] leading-relaxed italic">
                  {displayPrompt}
                </p>
              )}
            </>
          ) : (
            <>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3a3a3a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
              {displayPrompt && (
                <p className="text-xs text-[#4b5563] text-center leading-relaxed">{displayPrompt}</p>
              )}
            </>
          )}
        </div>

        <button onClick={handleGenerate} disabled={loading} className={BTN_PRIMARY}>
          {loading ? 'Generating…' : generated ? 'Regenerate Mock Image' : 'Generate Mock Image'}
        </button>
      </div>
    </div>
  );
}

// ─── Chat Box ─────────────────────────────────────────────────────────────────

interface Message {
  role: 'user' | 'ai';
  text: string;
}

function ChatPreview({ widget }: SharedProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput]       = useState('');
  const [thinking, setThinking] = useState(false);
  const bottomRef               = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);

  function handleSend() {
    const text = input.trim();
    if (!text || thinking) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text }]);
    setThinking(true);
    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        { role: 'ai', text: generateChatReply(text, widget.prompt ?? '') },
      ]);
      setThinking(false);
    }, 700 + Math.floor(Math.random() * 300));
  }

  return (
    <div className={CARD}>
      <div className={CARD_HEADER}>
        <p className={CARD_TITLE}>{widget.title}</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 min-h-0">
        {messages.length === 0 && (
          <p className="text-xs text-[#4b5563] text-center mt-3">
            Send a message to start the conversation
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`rounded-xl px-3 py-2 text-sm max-w-[80%] leading-relaxed ${
                m.role === 'user'
                  ? 'bg-[#1a73e8] text-white rounded-tr-sm'
                  : 'bg-[#1f1f1f] border border-[#2a2a2a] text-[#d1d5db] rounded-tl-sm'
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
        {thinking && (
          <div className="flex justify-start">
            <div className="rounded-xl rounded-tl-sm bg-[#1f1f1f] border border-[#2a2a2a] px-3 py-2.5">
              <span className="flex gap-1 items-center">
                {[0, 150, 300].map(delay => (
                  <span
                    key={delay}
                    className="w-1.5 h-1.5 bg-[#4b5563] rounded-full animate-bounce"
                    style={{ animationDelay: `${delay}ms` }}
                  />
                ))}
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="shrink-0 px-4 py-3 border-t border-[#242424] flex gap-2">
        <input
          type="text"
          className={`${INPUT_STYLE} flex-1`}
          placeholder={widget.placeholder ?? 'Type a message…'}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
          }}
        />
        <button
          onClick={handleSend}
          disabled={thinking || !input.trim()}
          aria-label="Send message"
          className="shrink-0 w-9 h-9 flex items-center justify-center rounded-lg bg-[#1a73e8] text-white hover:bg-[#1557b0] disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8]"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function PreviewWidget(props: SharedProps) {
  switch (props.widget.type) {
    case 'static_text': return <StaticTextPreview {...props} />;
    case 'input':       return <InputPreview {...props} />;
    case 'llm':         return <LLMPreview {...props} />;
    case 'image':       return <ImagePreview {...props} />;
    case 'chat':        return <ChatPreview {...props} />;
  }
}
