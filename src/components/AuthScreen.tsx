import React, { useState } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { loginUser, registerUser } from '../services/api';
import { UserProfile, UserRole } from '../types';
import {
  validateEmail,
  validateName,
  validatePassword,
} from '../utils/validation';

interface AuthScreenProps {
  onLoginSuccess: (user: UserProfile) => void;
}

export default function AuthScreen({ onLoginSuccess }: AuthScreenProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('patient');
  const [doctorEmail, setDoctorEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === 'register') {
      const nameErr = validateName(name);
      if (nameErr) {
        setError(nameErr);
        return;
      }
      const emailErr = validateEmail(email);
      if (emailErr) {
        setError(emailErr);
        return;
      }
      const passErr = validatePassword(password);
      if (passErr) {
        setError(passErr);
        return;
      }
    } else {
      if (!email.trim() || !password) {
        setError('Please enter both email and password.');
        return;
      }
    }

    setSubmitting(true);
    try {
      const response =
        mode === 'register'
          ? await registerUser({
              name: name.trim(),
              email: email.trim(),
              password,
              role,
              doctorEmail:
                role === 'patient' && doctorEmail.trim()
                  ? doctorEmail.trim()
                  : undefined,
            })
          : await loginUser({
              email: email.trim(),
              password,
            });

      onLoginSuccess({ ...response.user, token: response.token });
    } catch (err: any) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string, demoPassword: string) => {
    setError(null);
    setSubmitting(true);
    try {
      const response = await loginUser({
        email: demoEmail,
        password: demoPassword,
      });
      onLoginSuccess({ ...response.user, token: response.token });
    } catch (err: any) {
      setError(err.message || 'Unable to sign in with demo account.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-8">
          <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              className="text-teal-700"
            >
              <path
                d="M12 2.75C12 2.75 5.5 9.9 5.5 14.25C5.5 17.84 8.41 20.75 12 20.75C15.59 20.75 18.5 17.84 18.5 14.25C18.5 9.9 12 2.75 12 2.75Z"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M8.5 14.5H10.5L11.75 12L13.25 16.5L14.5 14.5H16"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="text-lg font-bold tracking-tight text-slate-900">
              Sweety
            </span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login');
                setError(null);
              }}
              className="text-sm font-medium text-teal-700 hover:text-teal-800 whitespace-nowrap shrink-0"
            >
              {mode === 'login' ? 'Create account' : 'Sign in instead'}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-12 lg:py-16 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <section className="lg:col-span-6 space-y-6">
          <p className="text-sm font-medium text-teal-700">
            Daily blood glucose logbook
          </p>
          <h1
            className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 leading-tight"
            style={{ textWrap: 'balance' }}
          >
            Track your daily glucose readings with clear monthly insights.
          </h1>
          <p className="text-base text-slate-600 leading-relaxed max-w-lg">
            Record up to four structured readings each day — Morning (fasting),
            After breakfast, After lunch, and After dinner — and review daily,
            month-to-date, and prior-month averages at a glance.
          </p>

          <div className="pt-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <p className="text-sm font-semibold text-slate-900">4 daily slots</p>
              <p className="text-xs text-slate-500 mt-1">
                Fasting and post-meal tracking with built-in range checks.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                3 summary reports
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Daily, month-to-date, and full previous-month statistics.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Private &amp; doctor-ready
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Your readings stay private, with optional sharing to your doctor.
              </p>
            </div>
          </div>
        </section>

        <section className="lg:col-span-6 w-full max-w-md lg:ml-auto">
          <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg mb-6">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                }}
                className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                  mode === 'login'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setError(null);
                }}
                className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                  mode === 'register'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Create account
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {mode === 'register' && (
                <div>
                  <label
                    htmlFor="auth-name"
                    className="block text-sm font-medium text-slate-700 mb-1.5"
                  >
                    Full name
                  </label>
                  <input
                    id="auth-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Rivera"
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-700"
                    autoComplete="name"
                  />
                </div>
              )}

              <div>
                <label
                  htmlFor="auth-email"
                  className="block text-sm font-medium text-slate-700 mb-1.5"
                >
                  Email address
                </label>
                <input
                  id="auth-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-700"
                  autoComplete="email"
                />
              </div>

              <div>
                <label
                  htmlFor="auth-password"
                  className="block text-sm font-medium text-slate-700 mb-1.5"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="auth-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={
                      mode === 'register' ? 'At least 6 characters' : 'Enter password'
                    }
                    className="w-full px-3.5 py-2.5 pr-10 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-700"
                    autoComplete={
                      mode === 'register' ? 'new-password' : 'current-password'
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {mode === 'register' && (
                <>
                  <div>
                    <label
                      htmlFor="auth-role"
                      className="block text-sm font-medium text-slate-700 mb-1.5"
                    >
                      Account type
                    </label>
                    <select
                      id="auth-role"
                      value={role}
                      onChange={(e) => setRole(e.target.value as UserRole)}
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-700"
                    >
                      <option value="patient">Patient (track my readings)</option>
                      <option value="doctor">Doctor (review assigned patients)</option>
                    </select>
                  </div>

                  {role === 'patient' && (
                    <div>
                      <label
                        htmlFor="auth-doctor-email"
                        className="block text-sm font-medium text-slate-700 mb-1.5"
                      >
                        Doctor email <span className="text-slate-400 font-normal">(optional)</span>
                      </label>
                      <input
                        id="auth-doctor-email"
                        type="email"
                        value={doctorEmail}
                        onChange={(e) => setDoctorEmail(e.target.value)}
                        placeholder="dr.chen@sweety.health"
                        className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-700"
                      />
                    </div>
                  )}
                </>
              )}

              {error && (
                <div
                  role="alert"
                  className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3.5 py-2.5"
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {mode === 'login' ? 'Sign in' : 'Create account'}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-200 space-y-2.5">
              <p className="text-xs font-medium text-slate-500">
                Quick demo access
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleDemoLogin('alex@sweety.health', 'Patient123!')}
                  className="py-2 px-3 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors text-left"
                >
                  <span className="block font-semibold text-slate-900">
                    Demo Patient
                  </span>
                  <span className="text-slate-500">alex@sweety.health</span>
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() =>
                    handleDemoLogin('dr.chen@sweety.health', 'Doctor123!')
                  }
                  className="py-2 px-3 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors text-left"
                >
                  <span className="block font-semibold text-slate-900">
                    Demo Doctor
                  </span>
                  <span className="text-slate-500">dr.chen@sweety.health</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
