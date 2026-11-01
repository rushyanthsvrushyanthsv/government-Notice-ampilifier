import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { AppLayout } from './components/layout/AppLayout';

// Lazy loading pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const UploadNotice = lazy(() => import('./pages/UploadNotice'));
const NoticeDetails = lazy(() => import('./pages/NoticeDetails'));
const History = lazy(() => import('./pages/History'));
const ActionChecklist = lazy(() => import('./pages/ActionChecklist'));
const Timeline = lazy(() => import('./pages/Timeline'));
const Notifications = lazy(() => import('./pages/Notifications'));
const LiveHub = lazy(() => import('./pages/LiveHub'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) return (
    <div className="flex h-screen w-screen items-center justify-center bg-white">
      <div className="w-12 h-12 border-4 border-[#1E3A8A] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
  
  if (!user) return <Navigate to="/login" replace />;
  
  return <AppLayout>{children}</AppLayout>;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, isAdmin, loginAsAdmin } = useAuth();

  React.useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      loginAsAdmin();
    }
  }, [loading, user, isAdmin, loginAsAdmin]);
  
  if (loading || !user || !isAdmin) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#FAF9F6]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-bold text-slate-700 uppercase tracking-widest">Opening Karnataka Admin Portal...</p>
        </div>
      </div>
    );
  }
  
  return <AppLayout>{children}</AppLayout>;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Suspense fallback={
          <div className="flex h-screen w-screen items-center justify-center bg-white">
            <div className="w-12 h-12 border-4 border-[#1E3A8A] border-t-transparent rounded-full animate-spin"></div>
          </div>
        }>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/upload" element={<ProtectedRoute><UploadNotice /></ProtectedRoute>} />
            <Route path="/notice/:id" element={<ProtectedRoute><NoticeDetails /></ProtectedRoute>} />
            <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
            <Route path="/actions" element={<ProtectedRoute><ActionChecklist /></ProtectedRoute>} />
            <Route path="/timeline" element={<ProtectedRoute><Timeline /></ProtectedRoute>} />
            <Route path="/alerts" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
            <Route path="/live" element={<ProtectedRoute><LiveHub /></ProtectedRoute>} />
            
            <Route path="/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
};

export default App;
