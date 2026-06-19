'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';

const INPUT_STYLE =
  'w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-[#f0f0f0] ' +
  'placeholder-[#4b5563] focus:outline-none focus:border-[#1a73e8] transition-colors';
const LABEL_STYLE = 'block text-xs font-medium text-[#9ca3af] mb-1.5';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [confirmationSent, setConfirmationSent] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        router.replace('/dashboard');
      } else {
        setCheckingSession(false);
      }
    });
  }, [router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({ email, password });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (data.session) {
      // Email confirmation is off for this project — the account is active immediately.
      router.push('/dashboard');
      return;
    }

    // Email confirmation is on — there's no session yet until the user clicks the link.
    setConfirmationSent(true);
    setLoading(false);
  }

  if (checkingSession) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d0d0d] px-4">
      <div className="w-full max-w-sm">
        <Link href="/dashboard" className="inline-flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8] rounded">
          <span className="text-[#f0f0f0] text-lg font-semibold tracking-tight">
            Forge<span className="text-[#1a73e8]">.</span>
          </span>
        </Link>

        <div className="mt-8 bg-[#161616] border border-[#2a2a2a] rounded-2xl p-8">
          {confirmationSent ? (
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="w-12 h-12 rounded-full bg-[#22c55e]/15 flex items-center justify-center">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2Z" />
                  <polyline points="22 6 12 13 2 6" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-[#f0f0f0]">Check your email</h1>
                <p className="mt-2 text-sm text-[#6b7280] leading-relaxed">
                  We sent a confirmation link to <span className="text-[#d1d5db]">{email}</span>. Click it to activate your account, then log in.
                </p>
              </div>
              <Link
                href="/login"
                className="text-sm font-medium text-[#1a73e8] hover:text-[#4a9ef8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8] rounded"
              >
                Back to log in
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-lg font-semibold text-[#f0f0f0]">Create an account</h1>
              <p className="mt-1 text-sm text-[#6b7280]">Save your apps to the cloud and access them anywhere.</p>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div>
                  <label htmlFor="email" className={LABEL_STYLE}>Email</label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className={INPUT_STYLE}
                  />
                </div>

                <div>
                  <label htmlFor="password" className={LABEL_STYLE}>Password</label>
                  <input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={6}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className={INPUT_STYLE}
                  />
                  <p className="mt-1.5 text-xs text-[#4b5563]">At least 6 characters.</p>
                </div>

                {error && (
                  <div role="alert" className="rounded-lg bg-[#7f1d1d]/20 border border-[#7f1d1d]/40 px-3 py-2">
                    <p className="text-xs text-[#fca5a5] leading-snug">{error}</p>
                  </div>
                )}

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? 'Creating account…' : 'Create account'}
                </Button>
              </form>

              <p className="mt-6 text-sm text-[#6b7280] text-center">
                Already have an account?{' '}
                <Link href="/login" className="text-[#1a73e8] hover:text-[#4a9ef8] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8] rounded">
                  Log in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
