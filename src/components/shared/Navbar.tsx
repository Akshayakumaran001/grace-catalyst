'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Calendar,
  Pill,
  HeartPulse,
  Users,
  History,
  CheckCircle2,
  LogOut,
  Shield,
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface SessionData {
  displayName: string;
  role: string;
}

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<SessionData | null>(null);

  useEffect(() => {
    fetch('/api/session')
      .then((res) => res.json())
      .then((json) => {
        if (json.data?.membership) {
          setSession({
            displayName: json.data.membership.displayName,
            role: json.data.membership.role,
          });
        }
      })
      .catch(() => {});
  }, [pathname]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setSession(null);
    router.push('/');
  };

  const navItems = [
    { href: '/today', label: 'Today', icon: CheckCircle2 },
    { href: '/medicines', label: 'Medicines', icon: Pill },
    { href: '/routines', label: 'Routines', icon: HeartPulse },
    { href: '/appointments', label: 'Appointments', icon: Calendar },
    { href: '/circle', label: 'Care Circle', icon: Users },
    { href: '/activity', label: 'Activity', icon: History },
  ];

  // Don't render full nav on landing page if not logged in
  if (pathname === '/' && !session) return null;

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & Tagline */}
          <Link href="/today" className="flex items-center gap-3 group">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-700 flex items-center justify-center text-white font-bold text-xl sm:text-2xl shadow-md group-hover:bg-blue-800 transition">
              G
            </div>
            <div>
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-950 block leading-tight">
                GRACE
              </span>
              <span className="text-xs sm:text-sm text-gray-500 font-medium hidden sm:block">
                Continuous care. Independent ageing.
              </span>
            </div>
          </Link>

          {/* User info & quick logout */}
          {session && (
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-semibold text-gray-900">
                  {session.displayName}
                </div>
                <div className="text-xs font-medium text-blue-700 uppercase tracking-wider flex items-center gap-1 justify-end">
                  <Shield className="w-3 h-3" />
                  {session.role.replace('_', ' ')}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 sm:px-3 sm:py-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-600 text-sm font-medium flex items-center gap-1.5 transition"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Leave</span>
              </button>
            </div>
          )}
        </div>

        {/* Primary Accessible Navigation Bar */}
        <nav className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto py-2 -mx-2 px-2 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-base sm:text-lg font-bold transition whitespace-nowrap min-h-[48px] ${
                  isActive
                    ? 'bg-blue-700 text-white shadow-sm'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-950'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
