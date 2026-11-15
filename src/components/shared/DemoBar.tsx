'use client';

import { useState } from 'react';
import { FastForward, RotateCcw, Clock, Sparkles } from 'lucide-react';

export function DemoBar() {
  const [loading, setLoading] = useState(false);
  const [lastAction, setLastAction] = useState<string | null>(null);

  const advanceTime = async (minutes: number) => {
    setLoading(true);
    try {
      const res = await fetch('/api/demo/advance-time', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ minutes }),
      });
      const data = await res.json();
      if (data.data) {
        const sent = data.data.reminderReport.emailsSent;
        setLastAction(`+${minutes}m (${sent} email${sent === 1 ? '' : 's'} sent)`);
        window.location.reload();
      }
    } catch {
      setLastAction('Failed to advance');
    } finally {
      setLoading(false);
    }
  };

  const resetDemo = async () => {
    if (!confirm('Reset all demo data back to clean initial state?')) return;
    setLoading(true);
    try {
      await fetch('/api/demo/reset', { method: 'POST' });
      setLastAction('Reset complete');
      window.location.reload();
    } catch {
      setLastAction('Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto mb-3">
      <div className="glass-pill px-4 py-1.5 rounded-full flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-700 shadow-sm">
        <div className="flex items-center gap-1.5 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping"></span>
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span className="font-semibold text-neutral-800">Virtual Clock:</span>
          {lastAction && (
            <span className="text-indigo-600 font-normal italic ml-1 bg-white/60 px-2 py-0.5 rounded-full">
              {lastAction}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => advanceTime(30)}
            disabled={loading}
            className="px-2.5 py-1 bg-white/80 hover:bg-white text-neutral-800 border border-white/80 rounded-full font-medium transition shadow-xs flex items-center gap-1 hover:scale-105 active:scale-95"
            title="Advance 30 minutes to trigger upcoming reminders"
          >
            <FastForward className="w-3 h-3 text-indigo-600" /> +30m
          </button>
          <button
            onClick={() => advanceTime(60)}
            disabled={loading}
            className="px-2.5 py-1 bg-white/80 hover:bg-white text-neutral-800 border border-white/80 rounded-full font-medium transition shadow-xs flex items-center gap-1 hover:scale-105 active:scale-95"
            title="Advance 1 hour to trigger missed dose status"
          >
            <FastForward className="w-3 h-3 text-indigo-600" /> +1h
          </button>
          <button
            onClick={() => advanceTime(180)}
            disabled={loading}
            className="px-2.5 py-1 bg-white/80 hover:bg-white text-neutral-800 border border-white/80 rounded-full font-medium transition shadow-xs flex items-center gap-1 hover:scale-105 active:scale-95"
            title="Advance 3 hours to trigger escalation email"
          >
            <FastForward className="w-3 h-3 text-indigo-600" /> +3h
          </button>
          <button
            onClick={resetDemo}
            disabled={loading}
            className="px-2.5 py-1 bg-rose-50/80 hover:bg-rose-100/90 text-rose-700 border border-rose-200/80 rounded-full font-medium transition shadow-xs flex items-center gap-1 ml-1 hover:scale-105 active:scale-95"
            title="Reset demo data"
          >
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
        </div>
      </div>
    </div>
  );
}
