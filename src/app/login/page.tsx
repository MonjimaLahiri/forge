'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { getPostAuthRedirect } from '@/lib/profile';
import Button from '@/components/ui/Button';
import PasswordInput from '@/components/ui/PasswordInput';

const INPUT_STYLE =
  'w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-[#f0f0f0] ' +
  'placeholder-[#4b5563] focus:outline-none focus:border-[#1a73e8] transition-colors';
const LABEL_STYLE = 'block text-xs font-medium text-[#9ca3af] mb-1.5';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        router.replace(await getPostAuthRedirect(data.user.id));
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
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    router.push(await getPostAuthRedirect(data.user.id));
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
          <h1 className="text-lg font-semibold text-[#f0f0f0]">Log in</h1>
          <p className="mt-1 text-sm text-[#6b7280]">Welcome back. Enter your details to continue.</p>

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
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="text-xs font-medium text-[#9ca3af]">Password</label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-[#1a73e8] hover:text-[#4a9ef8] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#1a73e8] rounded"
                >
                  Forgot password?
                </Link>
              </div>
              <PasswordInput
                id="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={setPassword}
              />
            </div>

            {error && (
              <div role="alert" className="rounded-lg bg-[#7f1d1d]/20 border border-[#7f1d1d]/40 px-3 py-2">
                <p className="text-xs text-[#fca5a5] leading-snug">{error}</p>
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Logging in…' : 'Log in'}
            </Button>
          </form>

          <p className="mt-6 text-sm text-[#6b7280] text-center">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-[#1a73e8] hover:text-[#4a9ef8] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8] rounded">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
