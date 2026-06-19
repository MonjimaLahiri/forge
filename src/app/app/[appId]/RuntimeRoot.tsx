'use client';

import { useEffect, useState, startTransition } from 'react';
import Link from 'next/link';
import type { App } from '@/lib/types';
import { getApp } from '@/lib/appStore';
import AppCanvas from '@/components/builder/AppCanvas';

// Public runtime view for a published app — no builder chrome, no properties
// panel, no widget palette. Just the app's widgets, live (Gemini-connected
// Text Generator, mocked Image/Chat). Reads from Supabase if the viewer is
// logged in, localStorage otherwise — see lib/appStore.ts. Note: this means
// a logged-out visitor still can't view someone else's published app from a
// different browser; that cross-device case isn't solved until a later step.
export default function RuntimeRoot({ appId }: { appId: string }) {
  const [app, setApp] = useState<App | null>(null);
  const [loaded, setLoaded] = useState(false);

  // setState is inside startTransition callback (not directly in effect body)
  // to satisfy the react-hooks/set-state-in-effect rule.
  useEffect(() => {
    let cancelled = false;
    getApp(appId).then((found) => {
      if (cancelled) return;
      startTransition(() => {
        setApp(found);
        setLoaded(true);
      });
    });
    return () => { cancelled = true; };
  }, [appId]);

  if (!loaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0d0d0d]">
        <p className="text-sm text-[#4b5563]">Loading…</p>
      </div>
    );
  }

  if (!app) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0d0d0d] gap-4">
        <p className="text-sm text-[#6b7280]">This app doesn&apos;t exist or has been removed.</p>
        <Link
          href="/dashboard"
          className="text-sm font-medium text-[#1a73e8] hover:text-[#4a9ef8] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8] rounded"
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  if (app.status !== 'published') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0d0d0d] gap-4">
        <p className="text-sm text-[#6b7280]">This app is not currently published.</p>
        <Link
          href={`/builder/${app.id}`}
          className="text-sm font-medium text-[#1a73e8] hover:text-[#4a9ef8] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8] rounded"
        >
          Edit app
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#0d0d0d]">
      <header className="h-[60px] shrink-0 flex items-center justify-between px-6 border-b border-[#2a2a2a] bg-[#161616]">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/dashboard"
            className="shrink-0 inline-flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8] rounded"
          >
            <span className="text-[#f0f0f0] text-base font-semibold tracking-tight">
              Forge<span className="text-[#1a73e8]">.</span>
            </span>
          </Link>
          <span className="text-[#3a3a3a] select-none">/</span>
          <span className="text-sm font-medium text-[#f0f0f0] truncate">{app.name}</span>
        </div>
        <Link
          href={`/builder/${app.id}`}
          className="shrink-0 text-sm font-medium text-[#9ca3af] hover:text-[#f0f0f0] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8] rounded px-2 py-1"
        >
          Edit app
        </Link>
      </header>
      <div className="flex-1 overflow-auto">
        <AppCanvas widgets={app.widgets} />
      </div>
    </div>
  );
}
