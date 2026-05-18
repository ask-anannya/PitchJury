import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import IntersectObserver from '@/components/common/IntersectObserver';
import ThemeToggle from '@/components/common/ThemeToggle';
import { Toaster } from '@/components/ui/sonner';
import { SessionProvider } from '@/contexts/SessionContext';

import { routes } from './routes';

const App: React.FC = () => {
  return (
    <Router>
      <SessionProvider>
        <IntersectObserver />
        <div className="flex flex-col min-h-screen bg-background text-foreground">
          {/* Floating theme toggle */}
          <div className="fixed top-4 right-4 z-50">
            <ThemeToggle />
          </div>
          <main className="flex-grow">
            <Routes>
              {routes.map((route, index) => (
                <Route
                  key={index}
                  path={route.path}
                  element={route.element}
                />
              ))}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
        <Toaster />
      </SessionProvider>
    </Router>
  );
};

export default App;
