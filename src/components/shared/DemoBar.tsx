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
        setLastAction(
          `Advanced +${minutes}m (${sent} email${sent === 1 ? '' : 's'} triggered)`
        );
        window.location.reload();
      }
    } catch {
      setLastAction('Failed to advance time');
    } finally {
      setLoading(false);
    }
  };

  const resetDemo = async () => {
    if (!confirm('Reset all demo data back to clean initial state?')) return;
    setLoading(true);
    try {
      await fetch('/api/demo/reset', { method: 'POST' });
      setLastAction('Demo data reset to clean initial state');
      window.location.reload();
    } catch {
      setLastAction('Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-amber-50 border-b border-amber-200 py-1.5 px-4 text-xs sm:text-sm text-amber-950">
      <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 font-semibold">
          <Sparkles className="w-4 h-4 text-amber-600" />
          <span>Demo Controls:</span>
          {lastAction && (
            <span className="text-amber-800 font-normal italic ml-1">
              ({lastAction})
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-amber-700 hidden md:inline flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Virtual Clock:
          </span>
          <button
            onClick={() => advanceTime(30)}
            disabled={loading}
            className="px-2.5 py-1 bg-white hover:bg-amber-100 border border-amber-300 rounded font-semibold text-amber-900 transition flex items-center gap-1"
            title="Advance 30 minutes to trigger upcoming reminders"
          >
            <FastForward className="w-3 h-3" /> +30m
          </button>
          <button
            onClick={() => advanceTime(60)}
            disabled={loading}
            className="px-2.5 py-1 bg-white hover:bg-amber-100 border border-amber-300 rounded font-semibold text-amber-900 transition flex items-center gap-1"
            title="Advance 1 hour to trigger missed dose status"
          >
            <FastForward className="w-3 h-3" /> +1h
          </button>
          <button
            onClick={() => advanceTime(180)}
            disabled={loading}
            className="px-2.5 py-1 bg-white hover:bg-amber-100 border border-amber-300 rounded font-semibold text-amber-900 transition flex items-center gap-1"
            title="Advance 3 hours to trigger escalation email"
          >
            <FastForward className="w-3 h-3" /> +3h
          </button>
          <button
            onClick={resetDemo}
            disabled={loading}
            className="px-2.5 py-1 bg-white hover:bg-red-50 border border-red-300 rounded font-semibold text-red-700 transition flex items-center gap-1 ml-1"
            title="Reset demo data"
          >
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
        </div>
      </div>
    </div>
  );
}
