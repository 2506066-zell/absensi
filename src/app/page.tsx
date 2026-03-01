'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { showToast } from '@/components/Toast';
import { DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_NAME, DEFAULT_USER_EMAIL } from '@/config';

type LoginMode = 'user' | 'admin';

export default function LoginPage() {
  const [mode, setMode] = useState<LoginMode>('user');
  const [name, setName] = useState('');
  const [email, setEmail] = useState(DEFAULT_ADMIN_EMAIL);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  function handleModeChange(nextMode: LoginMode) {
    setMode(nextMode);
    if (nextMode === 'admin') {
      setName(DEFAULT_ADMIN_NAME);
      setEmail(DEFAULT_ADMIN_EMAIL);
      return;
    }
    setName('');
    setEmail('');
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          name,
          email: mode === 'admin' ? email : '',
        }),
      });

      const data = await res.json();

      if (data.success) {
        showToast('Login berhasil!', 'success');
        router.push('/dashboard');
      } else {
        showToast(data.error || 'Login gagal', 'error');
      }
    } catch {
      showToast('Tidak dapat terhubung ke server', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-xl shadow-indigo-500/30">
            <svg
              className="w-10 h-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Absensi</h1>
          <p className="text-sm text-slate-500 mt-1">Sistem Absensi Siswa</p>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => handleModeChange('user')}
            className={`py-2 rounded-lg text-sm font-semibold transition-colors ${
              mode === 'user' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
            }`}
          >
            User
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('admin')}
            className={`py-2 rounded-lg text-sm font-semibold transition-colors ${
              mode === 'admin' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
            }`}
          >
            Admin
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-white rounded-2xl p-6 shadow-xl shadow-slate-200/50 border border-slate-100 space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-semibold text-slate-700 mb-1.5"
              >
                Nama Panjang
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Ahmad Maulana"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
                aria-label="Nama panjang"
              />
            </div>

            {mode === 'admin' ? (
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-slate-700 mb-1.5"
                >
                  Email Admin
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={DEFAULT_ADMIN_EMAIL}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
                  aria-label="Email admin"
                />
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                Email user otomatis: <span className="font-semibold">{DEFAULT_USER_EMAIL}</span>
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`
              w-full py-3.5 rounded-2xl font-semibold text-sm
              transition-all duration-200
              shadow-lg shadow-indigo-500/25
              ${loading
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:shadow-xl hover:shadow-indigo-500/30 active:scale-[0.98]'
              }
            `}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Masuk...
              </span>
            ) : (
              'Masuk'
            )}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-6">
          (c) 2026 Absensi App
        </p>
      </div>
    </div>
  );
}
