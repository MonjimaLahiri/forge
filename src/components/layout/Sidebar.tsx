'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

const NAV_ITEMS = [
  {
    href: '/builder/new',
    label: 'App Builder',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="8" height="8" rx="1.5" />
        <rect x="13" y="3" width="8" height="8" rx="1.5" />
        <rect x="3" y="13" width="8" height="8" rx="1.5" />
        <rect x="13" y="13" width="8" height="8" rx="1.5" />
      </svg>
    ),
  },
  {
    href: '/my-apps',
    label: 'My Apps',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 6h18M3 12h18M3 18h18" />
        <rect x="3" y="3" width="4" height="4" rx="0.75" fill="currentColor" stroke="none" />
        <rect x="3" y="10" width="4" height="4" rx="0.75" fill="currentColor" stroke="none" />
        <rect x="3" y="17" width="4" height="4" rx="0.75" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    href: '/discover',
    label: 'Discover Apps',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M14.5 9.5 10 12l2.5 4.5 4.5-2.5-2.5-4.5Z" />
      </svg>
    ),
  },
];

const BOTTOM_ITEMS = [
  {
    href: '/support',
    label: 'Support',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 17v.01M12 13a2 2 0 0 0 0-4 2 2 0 0 0-2 2" />
      </svg>
    ),
  },
  {
    href: '/settings',
    label: 'Settings',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
      </svg>
    ),
  },
];

const AUTH_ICON = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  }

  const isActive = (href: string) => {
    if (href === '/builder/new') return pathname.startsWith('/builder');
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <aside className="flex flex-col w-60 shrink-0 h-full bg-[#161616] border-r border-[#2a2a2a]">
      {/* Logo — h-[60px] matches AppShell header zone exactly */}
      <div className="h-[60px] flex items-center px-5 border-b border-[#2a2a2a]">
        <Link href="/dashboard" className="inline-flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8] rounded">
          <span className="text-[#f0f0f0] text-lg font-semibold tracking-tight">
            Forge<span className="text-[#1a73e8]">.</span>
          </span>
        </Link>
      </div>

      {/* Primary nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5" aria-label="Main navigation">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8]
                ${active
                  ? 'bg-[#1a73e8]/15 text-[#f0f0f0]'
                  : 'text-[#9ca3af] hover:bg-[#1f1f1f] hover:text-[#f0f0f0]'
                }
              `}
            >
              <span className={active ? 'text-[#1a73e8]' : 'text-current'}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom nav */}
      <div className="px-3 py-3 border-t border-[#2a2a2a] space-y-0.5">
        {BOTTOM_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[#6b7280] hover:bg-[#1f1f1f] hover:text-[#9ca3af] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8]"
          >
            {item.icon}
            {item.label}
          </Link>
        ))}

        {!authLoading && (
          user ? (
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-[#6b7280] hover:bg-[#1f1f1f] hover:text-[#9ca3af] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8]"
            >
              {AUTH_ICON}
              Log out
            </button>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[#6b7280] hover:bg-[#1f1f1f] hover:text-[#9ca3af] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8]"
            >
              {AUTH_ICON}
              Log in
            </Link>
          )
        )}
      </div>

      {/* User identity */}
      <div className="px-4 py-3 border-t border-[#2a2a2a]">
        {!authLoading && user ? (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#1a73e8]/20 flex items-center justify-center shrink-0">
              <span className="text-xs font-semibold text-[#1a73e8]">
                {(user.email ?? '?')[0].toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-[#f0f0f0] truncate">{user.email}</p>
              <p className="text-xs text-[#6b7280] truncate">Signed in</p>
            </div>
          </div>
        ) : !authLoading ? (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#1f1f1f] flex items-center justify-center shrink-0">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-[#9ca3af] truncate">Not signed in</p>
              <Link href="/login" className="text-xs text-[#1a73e8] hover:text-[#4a9ef8] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#1a73e8] rounded">
                Log in
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </aside>
  );
}
