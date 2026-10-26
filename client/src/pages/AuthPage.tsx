import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../context/AuthContext';

const inputClass =
  'w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-base text-slate-100 outline-none transition placeholder:text-slate-500 hover:border-white/20 focus:border-violet-400 focus:ring-4 focus:ring-violet-500/20';

const COPY = {
  login: { title: 'Welcome back', subtitle: 'Sign in to your account', button: 'Sign in', busy: 'Signing in…', other: "Don't have an account?", link: 'Sign up', to: '/register' },
  register: { title: 'Create account', subtitle: 'Join the conversation', button: 'Create account', busy: 'Creating…', other: 'Already have an account?', link: 'Sign in', to: '/login' },
};

export default function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const { login, register } = useAuth();
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const text = COPY[mode];

  const field = (name: keyof typeof form) => ({
    name,
    value: form[name],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [name]: e.target.value }),
  });

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (mode === 'login') await login(form.email, form.password);
      else await register(form.username, form.email, form.password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-full items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm animate-slide-up rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-2xl shadow-violet-950/50 backdrop-blur-xl sm:p-8">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 text-3xl shadow-lg shadow-violet-500/40">
            💬
          </div>
          <h1 className="bg-gradient-to-r from-violet-300 to-cyan-300 bg-clip-text text-2xl font-bold text-transparent">
            {text.title}
          </h1>
          <p className="mt-1 text-sm text-slate-400">{text.subtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          )}

          {mode === 'register' && (
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-300">Username</span>
              <input {...field('username')} required minLength={3} maxLength={30} autoComplete="username" className={inputClass} placeholder="anna" />
            </label>
          )}

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-300">Email</span>
            <input {...field('email')} type="email" required autoComplete="email" className={inputClass} placeholder="you@example.com" />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-300">Password</span>
            <span className="relative block">
              <input
                {...field('password')}
                type={showPassword ? 'text' : 'password'}
                required
                minLength={mode === 'register' ? 6 : 1}
                maxLength={72}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                className={`${inputClass} pr-12`}
                placeholder={mode === 'register' ? 'At least 6 characters' : '••••••••'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute inset-y-0 right-0 w-12 text-lg opacity-60 transition hover:opacity-100"
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </span>
          </label>

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-500 py-3 font-semibold text-white shadow-lg shadow-violet-600/30 transition hover:brightness-110 active:scale-[0.99] disabled:opacity-60"
          >
            {busy ? text.busy : text.button}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          {text.other}{' '}
          <Link to={text.to} className="font-semibold text-cyan-300 hover:text-cyan-200">
            {text.link}
          </Link>
        </p>
      </div>
    </main>
  );
}
