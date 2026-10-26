import { Routes, Route, Navigate } from 'react-router';
import { useAuth } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';
import AuthPage from './pages/AuthPage';
import ChatLayout from './components/ChatLayout';
import Spinner from './components/Spinner';

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 text-sm text-slate-400">
        <Spinner className="size-10" />
        Connecting… the free server may need up to a minute to wake up.
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/register" element={<AuthPage mode="register" />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <ChatProvider key={user._id}>
      <Routes>
        <Route path="*" element={<ChatLayout />} />
      </Routes>
    </ChatProvider>
  );
}
