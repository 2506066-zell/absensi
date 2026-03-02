'use client';

import Image from 'next/image';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { showToast } from '@/components/Toast';
import { DEFAULT_USER_EMAIL } from '@/config';

export default function LoginPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState(DEFAULT_USER_EMAIL);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
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
          <div className="w-28 h-28 mx-auto mb-4 flex items-center justify-center">
            <Image
              src="/icons/logo_smk-removebg-preview.png"
              alt="Logo SMK Muhammadiyah Tarogong Kidul"
              width={112}
              height={112}
              className="w-28 h-28 object-contain"
              priority
            />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Absensi</h1>
          <p className="text-sm text-slate-500 mt-1">Sistem Absensi Siswa</p>
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
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
                aria-label="Nama panjang"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-slate-700 mb-1.5"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
                aria-label="Email"
              />
            </div>
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
