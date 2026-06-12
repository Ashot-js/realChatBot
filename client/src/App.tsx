import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import ChatLayout from './components/ChatLayout';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-dark-900">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-3 border-surface-lighter border-t-violet-500 animate-spin" />
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-violet-500/20 to-cyan-500/20 blur-xl" />
          </div>
          <p className="text-slate-400 text-sm animate-pulse">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />
      <Route path="/*" element={user ? <ChatLayout /> : <Navigate to="/login" />} />
    </Routes>
  );
}

export default App;
