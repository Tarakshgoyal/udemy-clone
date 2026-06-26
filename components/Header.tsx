import Link from 'next/link';
import { Search, ShoppingCart, Bell, Globe, Video, ChevronDown } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth/guards';
import { logout } from '@/app/actions/auth';

export default async function Header() {
  const user = await getCurrentUser();

  return (
    <header className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200 text-sm shadow-sm z-50 relative">
      {/* Logo */}
      <Link href="/" className="font-bold text-2xl tracking-tighter text-black mr-4 flex-shrink-0">
        ûdemy
      </Link>

      {/* Categories */}
      <div className="hidden md:block group relative mr-4 flex-shrink-0">
        <button className="text-gray-700 hover:text-indigo-600 transition-colors py-2 flex items-center gap-1">
          Categories <ChevronDown className="w-3 h-3" />
        </button>
        <div className="absolute left-0 top-full mt-1 w-52 bg-white border border-gray-200 shadow-xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150">
          {[
            { name: 'Development', slug: 'development' },
            { name: 'Business', slug: 'business' },
            { name: 'Design', slug: 'design' },
            { name: 'IT & Software', slug: 'it-software' },
          ].map(cat => (
            <Link
              key={cat.slug}
              href={`/categories/${cat.slug}`}
              className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-indigo-600 transition-colors"
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex-grow hidden md:flex mx-2 max-w-3xl">
        <div className="w-full flex items-center bg-gray-100 border border-black rounded-full px-4 py-2 hover:bg-white transition-colors focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-600 focus-within:border-transparent">
          <Search className="w-4 h-4 text-gray-500 mr-2 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search for anything"
            className="bg-transparent w-full outline-none text-gray-700 text-sm"
          />
        </div>
      </div>

      {/* Right side navigation */}
      <nav className="flex items-center space-x-3 ml-4 flex-shrink-0">
        {user?.role === 'CREATOR' && (
          <Link
            href="/creator-studio"
            className="hidden lg:flex items-center gap-1.5 text-gray-700 hover:text-indigo-600 transition-colors py-2 font-medium"
          >
            <Video className="w-4 h-4" /> Creator Studio
          </Link>
        )}

        <Link href="#" className="hidden lg:block text-gray-700 hover:text-indigo-600 transition-colors py-2">
          Udemy Business
        </Link>

        {!user && (
          <Link href="/signup" className="hidden lg:block text-gray-700 hover:text-indigo-600 transition-colors py-2">
            Teach on Udemy
          </Link>
        )}

        {user && (
          <Link href="/my-courses/learning" className="hidden lg:block text-gray-700 hover:text-indigo-600 transition-colors py-2">
            My learning
          </Link>
        )}

        <div className="flex items-center space-x-1">
          <button className="text-gray-700 hover:text-indigo-600 transition-colors p-2">
            <ShoppingCart className="w-5 h-5" />
          </button>
          {user && (
            <button className="text-gray-700 hover:text-indigo-600 transition-colors p-2">
              <Bell className="w-5 h-5" />
            </button>
          )}
          <button className="text-gray-700 hover:text-indigo-600 transition-colors p-2">
            <Globe className="w-5 h-5" />
          </button>

          {user ? (
            /* User dropdown */
            <div className="relative group ml-1">
              <button className="w-9 h-9 rounded-full bg-[#5624d0] text-white flex items-center justify-center font-bold text-sm ring-2 ring-offset-1 ring-transparent group-hover:ring-[#5624d0] transition-all">
                {user.name.charAt(0).toUpperCase()}
              </button>
              <div className="absolute right-0 top-full mt-2 w-60 bg-white border border-gray-200 shadow-xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="font-bold text-gray-900 text-sm">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                  <span className={`mt-1 inline-block text-xs font-bold px-2 py-0.5 rounded ${user.role === 'CREATOR' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                    {user.role === 'CREATOR' ? 'Instructor' : 'Student'}
                  </span>
                </div>
                <div className="py-1">
                  <Link href="/my-courses/learning" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">My learning</Link>
                  {user.role === 'CREATOR' && (
                    <Link href="/creator-studio" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Creator Studio</Link>
                  )}
                  <Link href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Profile</Link>
                </div>
                <div className="border-t border-gray-100 py-1">
                  <form action={logout}>
                    <button type="submit" className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                      Log out
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 ml-2">
              <Link
                href="/login"
                className="border border-gray-900 px-4 py-2 text-sm font-bold text-gray-900 hover:bg-gray-50 transition-colors"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="bg-gray-900 px-4 py-2 text-sm font-bold text-white hover:bg-gray-700 transition-colors"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
