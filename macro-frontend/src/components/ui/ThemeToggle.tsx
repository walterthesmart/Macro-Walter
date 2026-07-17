import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

/**
 * Small header icon button that toggles the class-based dark mode
 * (`dark` class on <html>, handled by ThemeContext).
 * Sun is shown while dark mode is active; Moon while light mode is active.
 */
export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle dark mode"
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 shadow-sm transition-colors hover:bg-gray-50 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/60 dark:hover:text-slate-100"
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
