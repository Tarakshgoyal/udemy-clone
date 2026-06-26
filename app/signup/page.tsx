'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { signup } from '@/app/actions/auth';
import { Eye, EyeOff, UserPlus, BookOpen, Video } from 'lucide-react';

export default function SignupPage() {
  const [state, action, pending] = useActionState(signup, undefined);
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<'USER' | 'CREATOR'>('USER');

  return (
    <div className="min-h-[calc(100vh-130px)] flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white border border-gray-200 shadow-sm p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold font-serif mb-2">Sign up and start learning</h1>
            <p className="text-gray-500 text-sm">Create your account below.</p>
          </div>

          {/* Role Toggle */}
          <div className="flex rounded-lg border border-gray-200 overflow-hidden mb-6">
            <button
              type="button"
              onClick={() => setRole('USER')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold transition-colors ${
                role === 'USER'
                  ? 'bg-[#5624d0] text-white'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <BookOpen className="w-4 h-4" /> Learn
            </button>
            <button
              type="button"
              onClick={() => setRole('CREATOR')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold transition-colors ${
                role === 'CREATOR'
                  ? 'bg-[#a435f0] text-white'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Video className="w-4 h-4" /> Teach
            </button>
          </div>

          <form action={action} className="space-y-5">
            {/* Hidden role field */}
            <input type="hidden" name="role" value={role} />

            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-bold text-gray-700 mb-1">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                placeholder="John Doe"
                className="w-full border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition"
              />
              {state?.errors?.name && (
                <p className="text-red-600 text-xs mt-1">{state.errors.name[0]}</p>
              )}
            </div>

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
                  autoComplete="new-password"
                  required
                  placeholder="Min. 8 characters"
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
                <ul className="text-red-600 text-xs mt-1 space-y-0.5">
                  {state.errors.password.map((e: string) => (
                    <li key={e}>• {e}</li>
                  ))}
                </ul>
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
              className={`w-full text-white font-bold py-3 flex items-center justify-center gap-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
                role === 'CREATOR' ? 'bg-[#a435f0] hover:bg-[#8710d8]' : 'bg-[#5624d0] hover:bg-[#401b9c]'
              }`}
            >
              {pending ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              {pending ? 'Creating account...' : `Sign up as ${role === 'CREATOR' ? 'Instructor' : 'Student'}`}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="text-[#5624d0] font-bold hover:underline">
              Log in
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-gray-500 mt-6">
          By signing up, you agree to our{' '}
          <Link href="#" className="underline">Terms of Service</Link> and{' '}
          <Link href="#" className="underline">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}
