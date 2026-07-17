import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Lock } from 'lucide-react';
import { verifyPassword } from '../../api/regimeApi';
import { Spinner } from '../ui/Spinner';

type GateStatus = 'checking' | 'unlocked' | 'locked';
type GateError = 'incorrect' | 'network' | null;

/**
 * Client side of the site-wide password gate.
 *
 * On mount the stored password (possibly an empty string when the
 * backend has SITE_PASSWORD unset, i.e. fully open) is checked against
 * POST /api/v1/auth/verify. While checking, a centered spinner is shown.
 * On success the children render; on failure a lock card asks for the
 * password. Unlocking stores the password and never reloads the page.
 * A 401 from any API call elsewhere clears the stored password and
 * reloads, which brings this gate back up.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<GateStatus>('checking');
  const [error, setError] = useState<GateError>(null);
  const [input, setInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const stored = localStorage.getItem('site_password') ?? '';
    verifyPassword(stored)
      .then((ok) => {
        if (cancelled) return;
        if (ok) {
          localStorage.setItem('site_password', stored);
          setStatus('unlocked');
        } else {
          setStatus('locked');
        }
      })
      .catch(() => {
        if (cancelled) return;
        setError('network');
        setStatus('locked');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const ok = await verifyPassword(input);
      if (ok) {
        localStorage.setItem('site_password', input);
        setStatus('unlocked');
      } else {
        setError('incorrect');
      }
    } catch {
      setError('network');
    } finally {
      setSubmitting(false);
    }
  };

  if (status === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-slate-950">
        <Spinner />
      </div>
    );
  }

  if (status === 'unlocked') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 text-gray-900 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-300">
      <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-slate-800 dark:text-blue-400">
            <Lock className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-slate-100">Macro Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">Enter password to continue</p>
        </div>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <input
            type="password"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            autoFocus
            placeholder="Password"
            aria-label="Password"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500"
          />
          {error === 'incorrect' && (
            <p className="text-sm text-red-600 dark:text-red-300">Incorrect password — try again</p>
          )}
          {error === 'network' && (
            <p className="text-sm text-red-600 dark:text-red-300">Cannot reach the server</p>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Checking…' : 'Unlock'}
          </button>
        </form>
      </div>
    </div>
  );
}
