'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, KeyRound, UserCheck, ArrowRight, Sparkles } from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const [passcode, setPasscode] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Quick 1-click evaluator login
  const handleQuickDemo = async (demoPasscode: string, name: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passcode: demoPasscode,
          displayName: name,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || 'Login failed');
      }
      router.push('/today');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode || !displayName) {
      setError('Please provide your name and the invitation passcode.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passcode,
          displayName,
          email: email || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || 'Invalid passcode or join failed.');
      }
      router.push('/today');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Join failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 sm:py-16">
      {/* Hero section */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-100 text-blue-900 text-sm font-semibold mb-6">
          <Sparkles className="w-4 h-4 text-blue-700" />
          PromptWars Catalyst Hackathon Entry
        </div>
        <h1 className="text-4xl sm:text-6xl font-black text-gray-950 tracking-tight leading-tight">
          GRACE
        </h1>
        <p className="text-xl sm:text-2xl font-semibold text-blue-700 mt-2">
          Continuous care. Independent ageing.
        </p>
        <p className="text-gray-600 max-w-2xl mx-auto mt-4 text-base sm:text-lg">
          An elder-first care-circle platform that turns daily medications,
          healthcare routines, and appointments into a shared family workflow —
          with the elder always in control.
        </p>
      </div>

      {error && (
        <div className="mb-8 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-center font-medium">
          {error}
        </div>
      )}

      {/* Evaluator Quick Access Cards */}
      <div className="bg-white rounded-2xl border-2 border-blue-100 shadow-xl p-6 sm:p-8 mb-10">
        <div className="flex items-center gap-2 text-blue-900 font-extrabold text-lg sm:text-xl mb-4">
          <UserCheck className="w-6 h-6 text-blue-700" />
          <span>One-Click Evaluator Roles (Pre-seeded Demo)</span>
        </div>
        <p className="text-sm text-gray-600 mb-6">
          Click any persona to immediately enter the care circle with their role permissions:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Elder */}
          <button
            onClick={() => handleQuickDemo('MEENA2026', 'Meena')}
            disabled={loading}
            className="p-5 rounded-xl border-2 border-blue-600 bg-blue-50/50 hover:bg-blue-100/70 text-left transition flex flex-col justify-between group shadow-sm hover:shadow"
          >
            <div>
              <span className="px-2.5 py-1 rounded-md bg-blue-700 text-white text-xs font-bold uppercase tracking-wider">
                Primary Elder
              </span>
              <h3 className="text-xl font-bold text-gray-950 mt-3 group-hover:text-blue-700">
                Meena, 72
              </h3>
              <p className="text-xs text-gray-600 mt-1">
                Owner of profile. Today dashboard, 1-tap adherence, consent approval controls.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-blue-200 flex items-center justify-between text-blue-700 font-bold text-sm">
              <span>Enter as Elder</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Family Member */}
          <button
            onClick={() => handleQuickDemo('FAMILY2026', 'Arun')}
            disabled={loading}
            className="p-5 rounded-xl border-2 border-emerald-600 bg-emerald-50/50 hover:bg-emerald-100/70 text-left transition flex flex-col justify-between group shadow-sm hover:shadow"
          >
            <div>
              <span className="px-2.5 py-1 rounded-md bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider">
                Family Member
              </span>
              <h3 className="text-xl font-bold text-gray-950 mt-3 group-hover:text-emerald-700">
                Arun (Son)
              </h3>
              <p className="text-xs text-gray-600 mt-1">
                Remote visibility into adherence, appointments, activity feed, and escalation alerts.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-emerald-200 flex items-center justify-between text-emerald-700 font-bold text-sm">
              <span>Enter as Family</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Caretaker */}
          <button
            onClick={() => handleQuickDemo('CARE2026', 'Lakshmi')}
            disabled={loading}
            className="p-5 rounded-xl border-2 border-purple-600 bg-purple-50/50 hover:bg-purple-100/70 text-left transition flex flex-col justify-between group shadow-sm hover:shadow"
          >
            <div>
              <span className="px-2.5 py-1 rounded-md bg-purple-700 text-white text-xs font-bold uppercase tracking-wider">
                Caretaker
              </span>
              <h3 className="text-xl font-bold text-gray-950 mt-3 group-hover:text-purple-700">
                Lakshmi
              </h3>
              <p className="text-xs text-gray-600 mt-1">
                Records doses on elder behalf, manages routine care, and proposes updates.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-purple-200 flex items-center justify-between text-purple-700 font-bold text-sm">
              <span>Enter as Caretaker</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>
      </div>

      {/* Manual Passcode Join Form */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
        <div className="flex items-center gap-2 text-gray-900 font-bold text-lg mb-4">
          <KeyRound className="w-5 h-5 text-gray-600" />
          <span>Have an Invitation Passcode?</span>
        </div>

        <form onSubmit={handleCustomJoin} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Your Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Ramesh"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 text-base focus:border-blue-700 focus:ring-1 focus:ring-blue-700 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Invitation Passcode
              </label>
              <input
                type="text"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="e.g. MEENA2026"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 text-base uppercase font-mono tracking-wider focus:border-blue-700 focus:ring-1 focus:ring-blue-700 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Your Email (for notifications)
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. user@example.com"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 text-base focus:border-blue-700 focus:ring-1 focus:ring-blue-700 outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-bold text-lg transition flex items-center justify-center gap-2 shadow"
          >
            <span>{loading ? 'Joining Care Circle...' : 'Join Care Circle'}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>
      </div>

      {/* Safety & Compliance notice */}
      <div className="mt-8 text-center text-xs text-gray-500 max-w-xl mx-auto">
        <Shield className="w-4 h-4 mx-auto mb-1 text-gray-400" />
        GRACE is a coordination and reminder platform. It does not provide medical
        advice, diagnose conditions, or prescribe treatments.
      </div>
    </div>
  );
}
