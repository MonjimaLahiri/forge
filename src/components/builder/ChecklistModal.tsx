'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { ValidationIssue } from '@/lib/validateApp';

interface Props {
  mode: 'checklist' | 'publish';
  appName: string;
  widgetCount: number;
  issues: ValidationIssue[];
  onClose: () => void;
  appId?: string;
  onPublish?: () => void;
}

// ─── Issue row ─────────────────────────────────────────────────────────────────

function IssueRow({ issue }: { issue: ValidationIssue }) {
  const isError = issue.severity === 'error';
  return (
    <div className="flex gap-3 py-2.5 border-b border-[#1f1f1f] last:border-0">
      <div className="shrink-0 mt-0.5">
        {isError ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        )}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[#4b5563] mb-0.5">
          {issue.widgetTitle}
        </p>
        <p className="text-xs text-[#d1d5db] leading-snug">{issue.message}</p>
      </div>
    </div>
  );
}

// ─── ChecklistModal ────────────────────────────────────────────────────────────

export default function ChecklistModal({ mode, appName, widgetCount, issues, onClose, appId, onPublish }: Props) {
  const [published, setPublished] = useState(false);

  const errors   = issues.filter(i => i.severity === 'error');
  const warnings = issues.filter(i => i.severity === 'warning');

  function handleBackdrop(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  // ── Success state (publish mode only) ───────────────────────────────────

  if (published) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={handleBackdrop}>
        <div className="w-full max-w-sm bg-[#161616] border border-[#2a2a2a] rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-5 text-center">
          <div className="w-12 h-12 rounded-full bg-[#22c55e]/15 flex items-center justify-center">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          <div>
            <h2 className="text-base font-semibold text-[#f0f0f0]">Published locally</h2>
            <p className="text-sm text-[#6b7280] mt-2 leading-relaxed">
              Your app is now viewable in its own runtime page, read from this browser&apos;s local storage. Real hosting and a shareable public URL will be added in a later phase.
            </p>
          </div>

          {appId && (
            <Link
              href={`/app/${appId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2 rounded-full text-sm font-semibold bg-[#D7F237] text-[#171717] hover:bg-[#c9e422] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D7F237]/50 text-center"
            >
              Open published app
            </Link>
          )}

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 rounded-full text-sm font-semibold bg-[#1f1f1f] border border-[#3a3a3a] text-[#e5e5e5] hover:bg-[#2a2a2a] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8]"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  // ── Main modal ───────────────────────────────────────────────────────────

  const readinessLabel =
    errors.length > 0
      ? `${errors.length} error${errors.length !== 1 ? 's' : ''}`
      : warnings.length > 0
      ? `${warnings.length} warning${warnings.length !== 1 ? 's' : ''}`
      : 'Ready';

  const readinessColor =
    errors.length > 0 ? 'text-[#ef4444]' : warnings.length > 0 ? 'text-[#f59e0b]' : 'text-[#22c55e]';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={handleBackdrop}
    >
      <div className="w-full max-w-md bg-[#161616] border border-[#2a2a2a] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2a2a2a] shrink-0">
          <h2 className="text-sm font-semibold text-[#f0f0f0]">
            {mode === 'publish' ? 'Publish App' : 'App Checklist'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-[#6b7280] hover:text-[#f0f0f0] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8] rounded"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Publish: app summary strip */}
        {mode === 'publish' && (
          <div className="flex gap-6 px-5 py-3.5 border-b border-[#2a2a2a] bg-[#111111] shrink-0">
            <div>
              <p className="text-[10px] font-semibold text-[#4b5563] uppercase tracking-wider">App name</p>
              <p className="text-sm font-medium text-[#f0f0f0] mt-0.5 truncate max-w-[140px]">{appName}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-[#4b5563] uppercase tracking-wider">Widgets</p>
              <p className="text-sm font-medium text-[#f0f0f0] mt-0.5">{widgetCount}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-[#4b5563] uppercase tracking-wider">Status</p>
              <p className={`text-sm font-medium mt-0.5 ${readinessColor}`}>{readinessLabel}</p>
            </div>
          </div>
        )}

        {/* Issues list */}
        <div className="flex-1 overflow-y-auto px-5 py-3 min-h-0">
          {issues.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <p className="text-sm text-[#6b7280]">No issues found. Your app looks good and is ready to preview.</p>
            </div>
          ) : (
            <div className="space-y-0">
              {errors.length > 0 && (
                <>
                  <p className="text-[10px] font-semibold text-[#4b5563] uppercase tracking-wider py-2">
                    Errors — {errors.length}
                  </p>
                  {errors.map((issue, i) => <IssueRow key={`e-${i}`} issue={issue} />)}
                </>
              )}
              {warnings.length > 0 && (
                <>
                  <p className={`text-[10px] font-semibold text-[#4b5563] uppercase tracking-wider py-2 ${errors.length > 0 ? 'mt-3' : ''}`}>
                    Warnings — {warnings.length}
                  </p>
                  {warnings.map((issue, i) => <IssueRow key={`w-${i}`} issue={issue} />)}
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 px-5 py-4 border-t border-[#2a2a2a] flex items-center justify-end gap-3">
          {mode === 'publish' ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 h-8 rounded-full text-xs font-semibold text-[#9ca3af] hover:text-[#f0f0f0] hover:bg-[#1f1f1f] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => { onPublish?.(); setPublished(true); }}
                className="px-5 h-8 rounded-full text-xs font-semibold bg-[#D7F237] text-[#171717] hover:bg-[#c9e422] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D7F237]/50"
              >
                Publish mock app
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-5 h-8 rounded-full text-xs font-semibold bg-[#1f1f1f] border border-[#3a3a3a] text-[#e5e5e5] hover:bg-[#2a2a2a] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8]"
            >
              Close
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
