
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Lock } from 'lucide-react';
import { ThemeProvider } from './context/ThemeContext';
import { ThemeToggle } from './components/ui/ThemeToggle';
import { PrintButton } from './components/ui/PrintButton';
import { AuthGate } from './components/auth/AuthGate';
import { Home } from './pages/Home';
import { HistoryPage } from './pages/History';
import { MethodologyPage } from './pages/Methodology';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function lockDashboard() {
  localStorage.removeItem('site_password');
  window.location.reload();
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthGate>
          <BrowserRouter>
            <div className="min-h-screen flex flex-col bg-gray-100 text-gray-900 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-300">
              <header className="bg-white shadow-sm border-b border-gray-200 dark:bg-slate-900 dark:border-slate-800 py-4 px-6 mb-4">
                <nav className="max-w-6xl mx-auto flex justify-between items-center">
                  <div className="font-bold text-xl text-blue-600 dark:text-blue-400">Macro Dashboard</div>
                  <div className="flex items-center gap-4">
                    <a href="/" className="text-gray-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 font-medium">Home</a>
                    <a href="/history" className="text-gray-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 font-medium">History</a>
                    <a href="/methodology" className="text-gray-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 font-medium">Methodology</a>
                    <PrintButton />
                    <ThemeToggle />
                    <button
                      type="button"
                      onClick={lockDashboard}
                      aria-label="Lock dashboard"
                      title="Lock dashboard"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 shadow-sm transition-colors hover:bg-gray-50 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/60 dark:hover:text-slate-100"
                    >
                      <Lock className="h-4 w-4" />
                    </button>
                  </div>
                </nav>
              </header>
              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/history" element={<HistoryPage />} />
                  <Route path="/methodology" element={<MethodologyPage />} />
                </Routes>
              </main>
            </div>
          </BrowserRouter>
        </AuthGate>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
