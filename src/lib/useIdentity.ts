'use client';

import { useEffect, useState } from 'react';
import { createClient } from './supabase/client';
import { getProfile, type Profile } from './profile';

export interface Identity {
  loading: boolean;
  loggedIn: boolean;
  email: string | null;
  profile: Profile | null;
}

const INITIAL: Identity = { loading: true, loggedIn: false, email: null, profile: null };

// Single shared subscription pattern (auth state + profile lookup), used by
// Sidebar and the topbar Greeting so this logic exists in exactly one place.
export function useIdentity(): Identity {
  const [identity, setIdentity] = useState<Identity>(INITIAL);

  useEffect(() => {
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;

      if (!user) {
        setIdentity({ loading: false, loggedIn: false, email: null, profile: null });
        return;
      }

      setIdentity({ loading: false, loggedIn: true, email: user.email ?? null, profile: null });
      getProfile(user.id)
        .then((profile) => {
          setIdentity((prev) => (prev.loggedIn ? { ...prev, profile } : prev));
        })
        .catch(() => {
          // Profile fetch failed (e.g. transient network error) — keep showing
          // the email-derived fallback rather than an error state here.
        });
    });

    return () => subscription.unsubscribe();
  }, []);

  return identity;
}

// Shared "what name do we show" rule: display name, then email prefix, then
// a generic fallback — used by both Sidebar and Greeting so they never drift.
export function displayNameFor(identity: Identity): string {
  if (!identity.loggedIn) return 'Guest';
  const fromProfile = identity.profile?.displayName?.trim();
  if (fromProfile) return fromProfile;
  return identity.email?.split('@')[0] ?? 'there';
}
