import React from 'react';
import { useLocation, Outlet } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ChatSupportIcon } from '@/components/ChatSupportIcon';

interface MainLayoutProps {
  children?: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({}) => {
  const location = useLocation();

  // Pages where footer is fixed to bottom
  const isSpecialPage = ['/church-assessment'].includes(location.pathname);

  return (
    <div className="flex flex-col min-h-screen bg-soft-light">
      <Header />

        <main className={`flex flex-col flex-grow overflow-hidden container mx-auto px-4 py-8 ${
          isSpecialPage ? 'pb-32' : ''
        }`}>
        <div className="bg-white rounded-xl shadow-sm p-6 md:p-8 border border-journey-pink/10 relative overflow-visible">
          {/* Decorative blobs */}
          <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-journey-pink/5 blur-3xl -z-10" />
          <div className="absolute -bottom-20 -left-20 w-40 h-40 rounded-full bg-journey-red/5 blur-2xl -z-10" />

          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </div>
      </main>

      {/* Footer */}
      <div className={isSpecialPage ? 'fixed bottom-0 left-0 right-0 z-10' : ''}>
        <Footer />
      </div>

      {/* Chat Support Icon - positioned relative to viewport */}
      <ChatSupportIcon />
    </div>
  );
};
