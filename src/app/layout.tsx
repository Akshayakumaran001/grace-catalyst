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
      <body className="bg-gray-50 text-gray-900 antialiased flex flex-col min-h-screen">
        <DemoBar />
        <Navbar />
        <main className="flex-1 pb-16">{children}</main>
        <footer className="bg-white border-t border-gray-200 py-6 text-center text-sm text-gray-500">
          <div className="max-w-6xl mx-auto px-4">
            <p className="font-semibold text-gray-700">GRACE</p>
            <p className="text-xs text-gray-500 mt-1">
              Continuous care. Independent ageing. · Not intended for medical emergencies.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
