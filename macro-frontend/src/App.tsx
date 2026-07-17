
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './context/ThemeContext';
import { ThemeToggle } from './components/ui/ThemeToggle';
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

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BrowserRouter>
          <div className="min-h-screen flex flex-col bg-gray-100 text-gray-900 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-300">
            <header className="bg-white shadow-sm border-b border-gray-200 dark:bg-slate-900 dark:border-slate-800 py-4 px-6 mb-4">
              <nav className="max-w-6xl mx-auto flex justify-between items-center">
                <div className="font-bold text-xl text-blue-600 dark:text-blue-400">Macro Dashboard</div>
                <div className="flex items-center gap-4">
                  <a href="/" className="text-gray-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 font-medium">Home</a>
                  <a href="/history" className="text-gray-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 font-medium">History</a>
                  <a href="/methodology" className="text-gray-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 font-medium">Methodology</a>
                  <ThemeToggle />
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
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
