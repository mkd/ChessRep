import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Editor from './pages/Editor';
import Practice from './pages/Practice';

import { AuthProvider } from './components/AuthProvider';

import SyncManager from './components/SyncManager';

import RequireAuth from './components/RequireAuth';

function App() {
  return (
    <AuthProvider>
      <SyncManager />
      <Router basename={import.meta.env.PROD ? "/chessrep" : "/"}>
        <div className="app-container" style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/editor" element={
              <RequireAuth>
                <Editor />
              </RequireAuth>
            } />
            <Route path="/practice" element={
              <RequireAuth>
                <Practice />
              </RequireAuth>
            } />
            {/* Login is now on Home, but keeping this redirect just in case old links exist */}
            <Route path="/login" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
