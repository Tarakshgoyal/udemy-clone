import { requireCreator } from '@/lib/auth/guards';
import Link from 'next/link';
import { Video, LayoutDashboard, BookOpen, BarChart2, LogOut } from 'lucide-react';
import { logout } from '@/app/actions/auth';

export default async function CreatorStudioLayout({ children }: { children: React.ReactNode }) {
  await requireCreator();

  const navItems = [
    { href: '/creator-studio', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/creator-studio/courses', icon: BookOpen, label: 'Courses' },
    { href: '/creator-studio/analytics', icon: BarChart2, label: 'Analytics' },
  ];

  return (
    <div className="flex min-h-[calc(100vh-65px)]">
      {/* Sidebar */}
      <aside className="w-64 bg-[#1c1d1f] text-white flex flex-col flex-shrink-0">
        <div className="px-6 py-5 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <Video className="w-5 h-5 text-[#a435f0]" />
            <span className="font-bold text-lg">Creator Studio</span>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors text-sm font-medium"
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-gray-700">
          <Link href="/" className="flex items-center gap-3 px-3 py-2.5 text-gray-300 hover:text-white text-sm">
            ← Back to Udemy
          </Link>
          <form action={logout}>
            <button type="submit" className="w-full flex items-center gap-3 px-3 py-2.5 text-gray-300 hover:text-red-400 transition-colors text-sm text-left">
              <LogOut className="w-4 h-4" /> Log out
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 bg-gray-50 overflow-auto">
        {children}
      </main>
    </div>
  );
}
