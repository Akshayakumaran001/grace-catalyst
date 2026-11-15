import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '../components/shared/Navbar';
import { DemoBar } from '../components/shared/DemoBar';

export const metadata: Metadata = {
  title: 'GRACE — Continuous care. Independent ageing.',
  description:
    'An elder-first care-circle platform that helps older adults manage medications, healthcare routines, and appointments with family and caregivers.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased flex flex-col min-h-screen relative selection:bg-indigo-500/20 selection:text-indigo-900">
        <div className="oasis-canvas flex flex-col min-h-screen relative">
          {/* Subtle curved background lines inspired by the Oasis reference */}
          <div className="oasis-curve-line hidden md:block" />
          <div className="oasis-horizon" />

          {/* Floating Accessory Header */}
          <header className="relative z-30 pt-3 px-4">
            <DemoBar />
            <Navbar />
          </header>

          {/* Main Content Area */}
          <main className="flex-1 relative z-10 pb-20 pt-4 px-4 sm:px-6 max-w-7xl mx-auto w-full">
            {children}
          </main>

          {/* Ethereal Frosted Footer */}
          <footer className="relative z-10 py-8 text-center text-sm">
            <div className="max-w-4xl mx-auto px-4">
              <div className="inline-flex items-center gap-2 glass-pill px-5 py-2 text-xs font-medium text-neutral-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>GRACE · Continuous care. Independent ageing.</span>
                <span className="text-neutral-400">|</span>
                <span className="text-neutral-500">Not intended for medical emergencies</span>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
