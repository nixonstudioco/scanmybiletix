import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Scanner from './pages/Scanner';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import { AppProvider } from './context/AppContext';
import { DeviceProvider } from './context/DeviceContext';
import PWAInstallPrompt from './components/Layout/PWAInstallPrompt';
import PWAUpdateNotification from './components/Layout/PWAUpdateNotification';
import { pwaService } from './services/pwaService';

function App() {
  useEffect(() => {
    // Initialize PWA service
    pwaService.initialize();
    
    // Request notification permission
    pwaService.requestNotificationPermission();
  }, []);

  return (
    <DeviceProvider>
      <Router>
        <AppProvider>
          <Routes>
            <Route path="/" element={
              <Layout>
                <Scanner />
              </Layout>
            } />
            <Route path="/scanner" element={
              <Layout>
                <Scanner />
              </Layout>
            } />
            <Route path="/settings" element={
              <Layout>
                <Settings />
              </Layout>
            } />
            <Route path="*" element={
              <Layout>
                <NotFound />
              </Layout>
            } />
          </Routes>
          <PWAInstallPrompt />
          <PWAUpdateNotification />
        </AppProvider>
      </Router>
    </DeviceProvider>
  );
}

export default App;