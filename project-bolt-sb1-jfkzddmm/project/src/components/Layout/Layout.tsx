import React, { ReactNode } from 'react';
import Header from './Header';
import { useAppContext } from '../../context/AppContext';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { appSettings, flashColor } = useAppContext();
  const clubName = appSettings?.clubName || 'Famous Summer Club';
  
  return (
    <div className={`min-h-screen gradient-dark relative overflow-hidden ${flashColor ? `flash-${flashColor}` : ''}`}>
      {/* Ambient background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-mauve-900/20 via-transparent to-transparent rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-shadow-900/20 via-transparent to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>
      
      <div className="relative z-10 min-h-screen flex flex-col text-gray-100">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-6">
          {children}
        </main>
        <footer className="glass-card border-t border-mauve-500/20 py-4">
          <div className="container mx-auto px-4 text-center text-gray-400 text-sm">
            &copy; {new Date().getFullYear()} {clubName} Scan
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Layout;