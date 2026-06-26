'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { login } from '@/app/actions/auth';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { useState } from 'react';

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, undefined);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-[calc(100vh-130px)] flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white border border-gray-200 shadow-sm p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold font-serif mb-2">Log in to Udemy</h1>
            <p className="text-gray-500 text-sm">Welcome back! Please enter your credentials.</p>
          </div>

          <form action={action} className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-bold text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="you@example.com"
                className="w-full border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition"
              />
              {state?.errors?.email && (
                <p className="text-red-600 text-xs mt-1">{state.errors.email[0]}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-bold text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  className="w-full border border-gray-300 px-4 py-3 pr-12 text-sm focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {state?.errors?.password && (
                <p className="text-red-600 text-xs mt-1">{state.errors.password[0]}</p>
              )}
            </div>

            {state?.message && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
                {state.message}
              </div>
            )}

            <button
              type="submit"
              disabled={pending}
              className="w-full bg-[#a435f0] hover:bg-[#8710d8] text-white font-bold py-3 flex items-center justify-center gap-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {pending ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <LogIn className="w-4 h-4" />
              )}
              {pending ? 'Logging in...' : 'Log in'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-[#5624d0] font-bold hover:underline">
              Sign up
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-gray-500 mt-6">
          By logging in, you agree to our{' '}
          <Link href="#" className="underline">Terms of Service</Link> and{' '}
          <Link href="#" className="underline">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}
