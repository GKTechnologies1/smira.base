import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

import AppLayout from './components/layout/AppLayout';
import Home from './pages/Home';
import Chat from './pages/Chat';
import Journal from './pages/Journal';
import Tasks from './pages/Tasks';
import Finance from './pages/Finance';
import Memories from './pages/Memories';
import Timeline from './pages/Timeline';
import FutureMessages from './pages/FutureMessages';
import Goals from './pages/Goals';
import Analytics from './pages/Analytics';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/Home" replace />} />
      <Route element={<AppLayout />}>
        <Route path="/Home" element={<Home />} />
        <Route path="/Chat" element={<Chat />} />
        <Route path="/Journal" element={<Journal />} />
        <Route path="/Tasks" element={<Tasks />} />
        <Route path="/Finance" element={<Finance />} />
        <Route path="/Memories" element={<Memories />} />
        <Route path="/Timeline" element={<Timeline />} />
        <Route path="/FutureMessages" element={<FutureMessages />} />
        <Route path="/Goals" element={<Goals />} />
        <Route path="/Analytics" element={<Analytics />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App