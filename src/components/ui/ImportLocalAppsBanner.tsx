'use client';

import { useState } from 'react';
import Button from './Button';
import { importLocalApps } from '@/lib/appStore';
import type { App } from '@/lib/types';

interface ImportLocalAppsBannerProps {
  apps: App[];
  onDismiss: () => void;
  onImported: () => void;
}

type Phase = 'idle' | 'importing' | 'done';

export default function ImportLocalAppsBanner({ apps, onDismiss, onImported }: ImportLocalAppsBannerProps) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [result, setResult] = useState<{ imported: number; failed: number } | null>(null);

  async function handleImport() {
    setPhase('importing');
    let importedCount = 0;
    let failedCount = apps.length;

    try {
      const { imported, failed } = await importLocalApps(apps);
      importedCount = imported.length;
      failedCount = failed.length;
    } catch {
      // Treat an unexpected throw as a full failure rather than leaving the
      // banner stuck on "Importing…" — apps stay untouched in localStorage
      // either way, so nothing is lost.
    }

    setResult({ imported: importedCount, failed: failedCount });
    setPhase('done');
    if (importedCount > 0) onImported();
  }

  if (phase === 'done' && result) {
    return (
      <div
        role="status"
        className="rounded-xl border border-[#2a2a2a] bg-[#161616] px-5 py-4 flex items-center justify-between gap-4"
      >
        <p className="text-sm text-[#d1d5db]">
          {result.failed === 0
            ? `Imported ${result.imported} app${result.imported !== 1 ? 's' : ''} to your account.`
            : `Imported ${result.imported} app${result.imported !== 1 ? 's' : ''}. ${result.failed} couldn't be imported — still saved on this device, you can try again.`}
        </p>
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 text-sm font-medium text-[#9ca3af] hover:text-[#f0f0f0] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8] rounded px-2 py-1"
        >
          Dismiss
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#2a2a2a] bg-[#161616] px-5 py-4 flex items-center justify-between gap-4">
      <p className="text-sm text-[#d1d5db]">
        You have {apps.length} app{apps.length !== 1 ? 's' : ''} saved on this device. Import {apps.length !== 1 ? 'them' : 'it'} to your account?
      </p>
      <div className="shrink-0 flex items-center gap-2">
        <button
          type="button"
          onClick={onDismiss}
          disabled={phase === 'importing'}
          className="text-sm font-medium text-[#9ca3af] hover:text-[#f0f0f0] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8] rounded px-2 py-1 disabled:opacity-50"
        >
          Not now
        </button>
        <Button size="sm" onClick={handleImport} disabled={phase === 'importing'}>
          {phase === 'importing' ? 'Importing…' : 'Import apps'}
        </Button>
      </div>
    </div>
  );
}
