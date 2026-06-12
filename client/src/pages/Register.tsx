import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(username, email, password);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="h-screen flex items-center justify-center bg-dark-900 px-4 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-[128px]" />
      <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-cyan-500/8 rounded-full blur-[100px]" />

      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4 drop-shadow-lg">💬</div>
          <h1 className="text-2xl font-bold">
            <span className="gradient-text">Create account</span>
          </h1>
          <p className="text-slate-400 mt-1.5">Join the conversation</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-xl animate-fade-in">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm text-slate-400 mb-1.5 ml-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              maxLength={30}
              autoComplete="username"
              className="w-full bg-surface border border-surface-lighter text-slate-100 rounded-xl px-4 py-3 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all placeholder:text-slate-500"
              placeholder="cool_user"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1.5 ml-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full bg-surface border border-surface-lighter text-slate-100 rounded-xl px-4 py-3 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all placeholder:text-slate-500"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1.5 ml-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
                className="w-full bg-surface border border-surface-lighter text-slate-100 rounded-xl px-4 py-3 pr-11 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all placeholder:text-slate-500"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-violet-400 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-500 hover:to-violet-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 rounded-xl transition-all shadow-lg shadow-violet-500/20"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-slate-400 text-sm mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
