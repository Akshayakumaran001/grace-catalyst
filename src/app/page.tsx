'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, KeyRound, UserCheck, ArrowRight, Sparkles, Heart, Users, Activity } from 'lucide-react';

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
    <div className="max-w-5xl mx-auto py-8 sm:py-14">
      {/* Hero section styled after Oasis reference */}
      <div className="text-center mb-14 relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-pill text-xs font-semibold text-neutral-800 mb-6 shadow-xs border border-white/80">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>Care-Circle Platform · PromptWars Catalyst 2026</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-neutral-900 tracking-tight leading-[1.1] max-w-3xl mx-auto">
          Continuous Care. <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-900 via-indigo-700 to-purple-800">
            Independent Ageing.
          </span>
        </h1>

        <p className="text-neutral-600 max-w-2xl mx-auto mt-6 text-base sm:text-lg leading-relaxed font-normal">
          An elder-first healthcare coordination platform that orchestrates daily medications,
          wellness routines, and appointments into a calm, dignified shared circle.
        </p>

        {/* Oasis style central dark pill action */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => handleQuickDemo('MEENA2026', 'Meena')}
            disabled={loading}
            className="px-8 py-3.5 rounded-full bg-neutral-900 hover:bg-black text-white text-base font-semibold shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
          >
            <span>Enter Demo as Meena (72)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-8 p-4 rounded-2xl bg-rose-50/90 border border-rose-200 text-rose-800 text-center font-medium text-sm glass-pill">
          {error}
        </div>
      )}

      {/* Floating Oasis Persona Cards across the Horizon */}
      <div id="demo-personas" className="mb-14 relative z-10">
        <div className="text-center mb-6">
          <span className="text-xs uppercase tracking-widest font-bold text-neutral-500">
            Select a Demo Persona
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {/* Card 1: Primary Elder (Meena) - Lilac Glass */}
          <div className="glass-card-pastel-lavender rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all hover:-translate-y-1 hover:shadow-glass-hover duration-300">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-100/80 border border-indigo-200 flex items-center justify-center text-indigo-700 mb-5 shadow-xs">
                <Heart className="w-6 h-6" />
              </div>
              <div className="inline-block px-2.5 py-0.5 rounded-full bg-indigo-100/90 text-indigo-800 text-[11px] font-bold uppercase tracking-wider mb-2">
                Primary Elder
              </div>
              <h3 className="text-2xl font-bold text-neutral-900">
                Meena, 72
              </h3>
              <p className="text-xs text-neutral-600 mt-2 leading-relaxed">
                Owner of care profile. Simplified high-contrast Today dashboard, 1-tap adherence, consent approval controls.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-indigo-100/70">
              <button
                onClick={() => handleQuickDemo('MEENA2026', 'Meena')}
                disabled={loading}
                className="w-full py-3 rounded-full bg-neutral-900 hover:bg-black text-white text-xs font-semibold flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] active:scale-95 shadow-sm"
              >
                <span>Enter as Meena</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Card 2: Family Member (Arun) - Mint Glass */}
          <div className="glass-card-pastel-mint rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all hover:-translate-y-1 hover:shadow-glass-hover duration-300">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-100/80 border border-emerald-200 flex items-center justify-center text-emerald-700 mb-5 shadow-xs">
                <Users className="w-6 h-6" />
              </div>
              <div className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-100/90 text-emerald-800 text-[11px] font-bold uppercase tracking-wider mb-2">
                Family Member
              </div>
              <h3 className="text-2xl font-bold text-neutral-900">
                Arun (Son)
              </h3>
              <p className="text-xs text-neutral-600 mt-2 leading-relaxed">
                Remote peace of mind. Full adherence history, upcoming doctor visits, and automated escalation email alerts.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-emerald-100/70">
              <button
                onClick={() => handleQuickDemo('FAMILY2026', 'Arun')}
                disabled={loading}
                className="w-full py-3 rounded-full bg-neutral-900 hover:bg-black text-white text-xs font-semibold flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] active:scale-95 shadow-sm"
              >
                <span>Enter as Arun</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Card 3: Caretaker (Lakshmi) - Warm Peach Glass */}
          <div className="glass-card-pastel-peach rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all hover:-translate-y-1 hover:shadow-glass-hover duration-300">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-100/80 border border-amber-200 flex items-center justify-center text-amber-700 mb-5 shadow-xs">
                <Activity className="w-6 h-6" />
              </div>
              <div className="inline-block px-2.5 py-0.5 rounded-full bg-amber-100/90 text-amber-800 text-[11px] font-bold uppercase tracking-wider mb-2">
                Caretaker
              </div>
              <h3 className="text-2xl font-bold text-neutral-900">
                Lakshmi
              </h3>
              <p className="text-xs text-neutral-600 mt-2 leading-relaxed">
                Daily caregiver helper. Records taken doses on Meena&apos;s behalf, assists with routines, and logs vital updates.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-amber-100/70">
              <button
                onClick={() => handleQuickDemo('CARE2026', 'Lakshmi')}
                disabled={loading}
                className="w-full py-3 rounded-full bg-neutral-900 hover:bg-black text-white text-xs font-semibold flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] active:scale-95 shadow-sm"
              >
                <span>Enter as Lakshmi</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Manual Passcode Join Card in Frosted Glass */}
      <div className="glass-surface rounded-3xl p-6 sm:p-8 max-w-2xl mx-auto shadow-glass relative z-10">
        <div className="flex items-center gap-2 text-neutral-900 font-bold text-lg mb-2">
          <KeyRound className="w-5 h-5 text-indigo-600" />
          <span>Have an Invitation Passcode?</span>
        </div>
        <p className="text-xs text-neutral-600 mb-6">
          Enter with an existing care circle code or test an invitation link.
        </p>

        <form onSubmit={handleCustomJoin} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5 uppercase tracking-wide">
                Your Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Ramesh"
                className="w-full px-4 py-3 rounded-full glass-input text-sm text-neutral-900 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5 uppercase tracking-wide">
                Passcode
              </label>
              <input
                type="text"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="e.g. MEENA2026"
                className="w-full px-4 py-3 rounded-full glass-input text-sm uppercase font-mono tracking-wider text-neutral-900 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1.5 uppercase tracking-wide">
              Your Email (for notifications)
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. user@example.com"
              className="w-full px-4 py-3 rounded-full glass-input text-sm text-neutral-900 outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-neutral-900 hover:bg-black text-white rounded-full font-semibold text-sm transition-transform hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-2 shadow-lg"
          >
            <span>{loading ? 'Joining Care Circle...' : 'Join Care Circle'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Medical disclaimer pill */}
      <div className="mt-8 text-center text-xs text-neutral-500 max-w-lg mx-auto">
        <Shield className="w-3.5 h-3.5 mx-auto mb-1 text-neutral-400" />
        GRACE is a coordination and reminder platform. It does not provide medical
        advice, diagnose conditions, or prescribe treatments.
      </div>
    </div>
  );
}
