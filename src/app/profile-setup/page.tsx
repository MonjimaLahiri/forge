'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getProfile, saveProfile } from '@/lib/profile';
import { AVATAR_PRESETS } from '@/lib/avatars';
import Button from '@/components/ui/Button';

const INPUT_STYLE =
  'w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-[#f0f0f0] ' +
  'placeholder-[#4b5563] focus:outline-none focus:border-[#1a73e8] transition-colors';
const LABEL_STYLE = 'block text-xs font-semibold text-[#d7f237] uppercase tracking-wide mb-2 text-center';

export default function ProfileSetupPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [emailPrefix, setEmailPrefix] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [avatarIndex, setAvatarIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      const user = data.user;
      if (!user) {
        router.replace('/login');
        return;
      }

      setUserId(user.id);
      setEmailPrefix(user.email?.split('@')[0] ?? 'there');

      const profile = await getProfile(user.id);
      if (profile?.displayName) setDisplayName(profile.displayName);
      if (profile?.avatarIndex !== undefined) setAvatarIndex(profile.avatarIndex);

      setLoading(false);
    });
  }, [router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!userId) return;
    const trimmed = displayName.trim();
    if (!trimmed) {
      setError('Please enter a username.');
      return;
    }

    setError('');
    setSaving(true);
    try {
      await saveProfile(userId, { displayName: trimmed, avatarIndex });
      router.push('/dashboard');
    } catch {
      setError('Could not save your profile. Please try again.');
      setSaving(false);
    }
  }

  if (loading) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d0d0d] px-4">
      <div className="w-full max-w-sm">
        {/* Not a link, unlike every other auth page's logo — this page is reached
            specifically because profile setup isn't complete yet, so it shouldn't
            offer an easy way to bail out before saving. */}
        <div className="flex justify-center">
          <span className="text-[#f0f0f0] text-lg font-semibold tracking-tight">
            Forge<span className="text-[#1a73e8]">.</span>
          </span>
        </div>

        <div className="mt-8 bg-[#161616] border border-[#2a2a2a] rounded-2xl p-8">
          <h1 className="text-lg font-semibold text-[#f0f0f0] text-center">Welcome, {emailPrefix}!</h1>
          <p className="mt-1 text-sm text-[#6b7280] text-center">Set up your profile to get started.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-8">
            <div>
              <label htmlFor="displayName" className={LABEL_STYLE}>Set your username</label>
              <input
                id="displayName"
                type="text"
                required
                placeholder="Write a username for yourself…"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className={`${INPUT_STYLE} text-center`}
              />
            </div>

            <div>
              <p className={LABEL_STYLE}>Choose an avatar</p>
              <div className="flex flex-wrap justify-center gap-3">
                {AVATAR_PRESETS.map((avatar, index) => {
                  const selected = index === avatarIndex;
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setAvatarIndex(index)}
                      aria-label={`Avatar ${index + 1}`}
                      aria-pressed={selected}
                      className={`w-11 h-11 rounded-full flex items-center justify-center text-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8] ${
                        selected ? 'ring-2 ring-[#d7f237] ring-offset-2 ring-offset-[#161616]' : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: avatar.bg }}
                    >
                      {avatar.emoji}
                    </button>
                  );
                })}
              </div>
            </div>

            {error && (
              <div role="alert" className="rounded-lg bg-[#7f1d1d]/20 border border-[#7f1d1d]/40 px-3 py-2">
                <p className="text-xs text-[#fca5a5] leading-snug text-center">{error}</p>
              </div>
            )}

            <Button type="submit" disabled={saving} className="w-full">
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
