'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { getPostAuthRedirect } from '@/lib/profile';
import Button from '@/components/ui/Button';
import PasswordInput from '@/components/ui/PasswordInput';

const LABEL_STYLE = 'block text-xs font-medium text-[#9ca3af] mb-1.5';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // The password-reset email link establishes a recovery session via the URL
  // fragment automatically (handled by the Supabase browser client) — by the
  // time this effect runs, getUser() should resolve to that session's user.
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setHasRecoverySession(!!data.user);
      setChecking(false);
    });
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSaving(true);
    const supabase = createClient();
    const { data, error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    const userId = data.user?.id;
    const destination = userId ? await getPostAuthRedirect(userId) : '/dashboard';
    router.push(destination);
  }

  if (checking) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d0d0d] px-4">
      <div className="w-full max-w-sm">
        <Link href="/dashboard" className="inline-flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8] rounded">
          <span className="text-[#f0f0f0] text-lg font-semibold tracking-tight">
            Forge<span className="text-[#1a73e8]">.</span>
          </span>
        </Link>

        <div className="mt-8 bg-[#161616] border border-[#2a2a2a] rounded-2xl p-8">
          {!hasRecoverySession ? (
            <div className="text-center">
              <h1 className="text-lg font-semibold text-[#f0f0f0]">Link expired</h1>
              <p className="mt-2 text-sm text-[#6b7280] leading-relaxed">
                This password reset link is invalid or has expired.
              </p>
              <Link
                href="/forgot-password"
                className="mt-4 inline-block text-sm font-medium text-[#1a73e8] hover:text-[#4a9ef8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8] rounded"
              >
                Request a new link
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-lg font-semibold text-[#f0f0f0]">Set a new password</h1>
              <p className="mt-1 text-sm text-[#6b7280]">Choose a new password for your account.</p>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div>
                  <label htmlFor="password" className={LABEL_STYLE}>New password</label>
                  <PasswordInput
                    id="password"
                    autoComplete="new-password"
                    required
                    minLength={6}
                    value={password}
                    onChange={setPassword}
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className={LABEL_STYLE}>Confirm password</label>
                  <PasswordInput
                    id="confirmPassword"
                    autoComplete="new-password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                  />
                </div>

                {error && (
                  <div role="alert" className="rounded-lg bg-[#7f1d1d]/20 border border-[#7f1d1d]/40 px-3 py-2">
                    <p className="text-xs text-[#fca5a5] leading-snug">{error}</p>
                  </div>
                )}

                <Button type="submit" disabled={saving} className="w-full">
                  {saving ? 'Saving…' : 'Set new password'}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
