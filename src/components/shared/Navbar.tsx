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
  Sparkles,
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

  return (
    <nav className="max-w-5xl mx-auto glass-pill-nav rounded-full px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 shadow-glass transition-all">
      {/* Brand Logo in Oasis Style */}
      <Link href={session ? '/today' : '/'} className="flex items-center gap-2.5 group shrink-0">
        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z" opacity="0.3"/>
            <path d="M12 4c4.41 0 8 3.59 8 8 0 1.83-.62 3.52-1.67 4.88L6.88 5.43C8.24 4.53 9.93 4 12 4m0 16c-4.41 0-8-3.59-8-8 0-1.83.62-3.52 1.67-4.88l11.45 11.45C13.76 19.47 12.07 20 12 20"/>
          </svg>
        </div>
        <div className="flex flex-col">
          <span className="text-xl font-bold tracking-tight text-neutral-900 leading-none">
            GRACE
          </span>
          <span className="text-[10px] tracking-wide text-neutral-500 font-medium hidden md:inline">
            Care Circle
          </span>
        </div>
      </Link>

      {/* Navigation Links for Authenticated Users */}
      {session ? (
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-1 scrollbar-none">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-neutral-900 text-white shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-950 hover:bg-white/60'
                }`}
              >
                <span>{item.label}</span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-white ml-0.5 sm:inline-block hidden"></span>
                )}
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-neutral-600">
          <span className="glass-pill px-3 py-1 rounded-full text-indigo-700 bg-indigo-50/70 border-indigo-200/50">
            Hackathon Live Demo
          </span>
          <span className="text-neutral-400">·</span>
          <span>Elder-first care circle</span>
        </div>
      )}

      {/* User Info / Leave Button */}
      {session ? (
        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden lg:flex flex-col text-right">
            <span className="text-xs font-semibold text-neutral-900 leading-tight">
              {session.displayName}
            </span>
            <span className="text-[10px] uppercase font-bold text-indigo-600 tracking-wider">
              {session.role.replace('_', ' ')}
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="px-3.5 sm:px-4 py-1.5 rounded-full bg-neutral-900 hover:bg-black text-white text-xs sm:text-sm font-semibold transition-transform hover:scale-105 active:scale-95 shadow-sm flex items-center gap-1.5"
            title="Leave / Switch Persona"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Switch</span>
          </button>
        </div>
      ) : (
        <Link
          href="#demo-personas"
          className="px-4 py-1.5 rounded-full bg-neutral-900 hover:bg-black text-white text-xs sm:text-sm font-semibold transition-transform hover:scale-105 active:scale-95 shadow-sm"
        >
          Sign In
        </Link>
      )}
    </nav>
  );
}
