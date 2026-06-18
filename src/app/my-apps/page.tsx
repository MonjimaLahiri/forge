'use client';

import { useEffect, useState, startTransition } from 'react';
import AppShell from '@/components/layout/AppShell';
import AppCard from '@/components/ui/AppCard';
import EmptyState from '@/components/ui/EmptyState';
import Button from '@/components/ui/Button';
import { listApps } from '@/lib/storage';
import type { App } from '@/lib/types';

const PlusIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const GridIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="8" height="8" rx="1.5" />
    <rect x="13" y="3" width="8" height="8" rx="1.5" />
    <rect x="3" y="13" width="8" height="8" rx="1.5" />
    <rect x="13" y="13" width="8" height="8" rx="1.5" />
  </svg>
);

function byMostRecentlyUpdated(a: App, b: App): number {
  return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
}

export default function MyAppsPage() {
  const [apps, setApps] = useState<App[]>([]);

  // setState is inside startTransition callback (not directly in effect body)
  // to satisfy the react-hooks/set-state-in-effect rule.
  useEffect(() => {
    const loaded = listApps();
    startTransition(() => {
      setApps(loaded);
    });
  }, []);

  const drafts = apps.filter(a => a.status === 'draft').sort(byMostRecentlyUpdated);
  const published = apps.filter(a => a.status === 'published').sort(byMostRecentlyUpdated);

  const topBar = (
    <>
      <h1 className="text-xl font-semibold text-[#f0f0f0]">Hello, Alex!</h1>
      <Button href="/builder/new"><PlusIcon />Create New</Button>
    </>
  );

  return (
    <AppShell topBar={topBar}>
      <div className="px-8 py-8 space-y-10">
        {/* Drafts section */}
        <section aria-labelledby="drafts-heading">
          <div className="flex items-center justify-between mb-4">
            <h2 id="drafts-heading" className="text-base font-semibold text-[#f0f0f0]">Drafts</h2>
            {drafts.length > 0 && (
              <button
                type="button"
                aria-label="See all drafts"
                className="w-7 h-7 flex items-center justify-center rounded-full border border-[#2a2a2a] text-[#6b7280] hover:text-[#f0f0f0] hover:border-[#3a3a3a] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8]"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>

          {drafts.length === 0 ? (
            <EmptyState
              icon={<GridIcon />}
              heading="No drafts yet"
              subtext="Create your first app to get started."
              action={<Button href="/builder/new" size="sm"><PlusIcon />Create New</Button>}
            />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {drafts.map((app) => (
                <AppCard key={app.id} app={app} />
              ))}
            </div>
          )}
        </section>

        {/* Published section */}
        <section aria-labelledby="published-heading">
          <div className="flex items-center justify-between mb-4">
            <h2 id="published-heading" className="text-base font-semibold text-[#f0f0f0]">Published</h2>
            {published.length > 0 && (
              <button
                type="button"
                className="text-sm font-medium text-[#1a73e8] hover:text-[#4a9ef8] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8] rounded"
              >
                View All
              </button>
            )}
          </div>

          {published.length === 0 ? (
            <EmptyState
              icon={<GridIcon />}
              heading="Nothing published yet"
              subtext="Finish a draft and publish it to see it here."
            />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {published.map((app) => (
                <AppCard key={app.id} app={app} />
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
