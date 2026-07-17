import { useEffect } from 'react';
import { Printer } from 'lucide-react';

/**
 * Small header icon button that prints the dashboard.
 *
 * Print-mode theme handling: while printing, dark mode would ruin the
 * printout (dark background, light text). So on `beforeprint` we strip the
 * `dark` class from <html>, and on `afterprint` we restore it if it was
 * present. The button itself is hidden in print via the global
 * `header { display: none }` print rule in index.css.
 */
export function PrintButton() {
  useEffect(() => {
    let wasDark = false;

    const handleBeforePrint = () => {
      wasDark = document.documentElement.classList.contains('dark');
      if (wasDark) {
        document.documentElement.classList.remove('dark');
      }
    };

    const handleAfterPrint = () => {
      if (wasDark) {
        document.documentElement.classList.add('dark');
        wasDark = false;
      }
    };

    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleAfterPrint);

    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, []);

  return (
    <button
      type="button"
      onClick={() => window.print()}
      aria-label="Print dashboard"
      title="Print dashboard"
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 shadow-sm transition-colors hover:bg-gray-50 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/60 dark:hover:text-slate-100"
    >
      <Printer className="h-4 w-4" />
    </button>
  );
}
