'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Check,
  X,
  Clock,
  Pill,
  HeartPulse,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { CareEvent } from '../../domain/types';

export default function TodayPage() {
  const [events, setEvents] = useState<CareEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const todayStr = new Date().toISOString().slice(0, 10);

  const fetchTodayEvents = useCallback(async () => {
    try {
      const res = await fetch(`/api/care-events?date=${todayStr}`);
      const json = await res.json();
      if (json.data) {
        setEvents(json.data);
      }
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setLoading(false);
    }
  }, [todayStr]);

  useEffect(() => {
    fetchTodayEvents();
  }, [fetchTodayEvents]);

  // Mark status (taken / skipped)
  const handleTransition = async (eventId: string, targetStatus: 'taken' | 'skipped') => {
    setActionInProgress(eventId);
    try {
      const res = await fetch(`/api/care-events/${eventId}/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetStatus }),
      });
      const json = await res.json();
      if (json.data) {
        setSuccessMessage(
          targetStatus === 'taken' ? 'Great job! Marked as completed.' : 'Item noted as skipped.'
        );
        setTimeout(() => setSuccessMessage(null), 4000);
        await fetchTodayEvents();
      }
    } catch (err) {
      console.error('Transition error:', err);
    } finally {
      setActionInProgress(null);
    }
  };

  // Find next pending or reminded event
  const pendingEvents = events.filter(
    (e) => e.status === 'pending' || e.status === 'reminded' || e.status === 'missed'
  );
  const nextAction = pendingEvents[0] || null;

  const takenCount = events.filter((e) => e.status === 'taken').length;
  const totalCount = events.length;

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="animate-spin w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-lg font-semibold text-neutral-700">Loading today&apos;s routine...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-4 sm:py-8">
      {/* Header Banner in Oasis Style */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full glass-pill text-xs font-semibold text-neutral-700 mb-2">
            <Calendar className="w-3.5 h-3.5 text-indigo-600" />
            <span>
              {new Date().toLocaleDateString('en-IN', {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-neutral-900 tracking-tight">
            Today&apos;s Care
          </h1>
          <p className="text-sm sm:text-base text-neutral-600 font-medium mt-1">
            Dignified, self-paced routines with your care circle.
          </p>
        </div>

        {/* Daily Progress Counter Pill */}
        <div className="glass-pill rounded-full px-5 py-3 shadow-glass flex items-center gap-3.5 self-start sm:self-auto border border-white/80">
          <div className="w-9 h-9 rounded-full bg-emerald-500/15 text-emerald-700 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-extrabold text-neutral-900 leading-tight">
              {takenCount} of {totalCount} Done
            </div>
            <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
              {totalCount > 0 && takenCount === totalCount
                ? 'All routines completed!'
                : `${totalCount - takenCount} remaining today`}
            </div>
          </div>
        </div>
      </div>

      {/* Success Notification Alert */}
      {successMessage && (
        <div
          role="status"
          aria-live="polite"
          className="mb-8 p-4 glass-card-pastel-mint rounded-2xl flex items-center gap-3 text-emerald-950 text-base font-bold shadow-md animate-fade-in"
        >
          <Sparkles className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* ── 1. PROMINENT NEXT ACTION CARD (Elevated Frosted Centerpiece) ────── */}
      {nextAction ? (
        <div className="glass-surface-elevated rounded-3xl p-6 sm:p-10 shadow-glass-hover mb-12 relative overflow-hidden transition-all">
          {/* Status pill badge */}
          <div className="flex items-center justify-between mb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50/80 border border-indigo-200/60 text-xs font-bold text-indigo-700">
              <Clock className="w-3.5 h-3.5" />
              <span>Scheduled for {nextAction.localDueTime}</span>
              {nextAction.status === 'missed' && (
                <span className="ml-1 px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-extrabold uppercase">
                  Past Due
                </span>
              )}
            </div>

            <span className="px-3 py-1 rounded-full bg-neutral-900 text-white text-[11px] font-bold uppercase tracking-wider shadow-xs">
              Up Next
            </span>
          </div>

          <div className="flex items-start gap-5">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-200/60 flex items-center justify-center text-indigo-700 shrink-0 mt-1 shadow-xs">
              {nextAction.kind === 'medication' ? (
                <Pill className="w-8 h-8" />
              ) : (
                <HeartPulse className="w-8 h-8" />
              )}
            </div>

            <div className="flex-1">
              <h2 className="text-2xl sm:text-4xl font-extrabold text-neutral-950 tracking-tight leading-snug">
                {nextAction.titleSnapshot}
              </h2>
              {nextAction.instructionsSnapshot && (
                <div className="mt-2 text-base sm:text-lg text-neutral-700 font-medium bg-white/60 rounded-2xl p-3 border border-white/70">
                  <span className="font-bold text-neutral-900">Instructions: </span>
                  {nextAction.instructionsSnapshot}
                </div>
              )}
            </div>
          </div>

          {/* Large Action Controls (Elder UX: Min 56px height, high contrast pill buttons) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 pt-6 border-t border-neutral-200/60">
            <button
              onClick={() => handleTransition(nextAction.id, 'taken')}
              disabled={actionInProgress === nextAction.id}
              className="w-full min-h-[58px] py-4 px-6 bg-neutral-900 hover:bg-black text-white rounded-full font-bold text-lg sm:text-xl flex items-center justify-center gap-3 shadow-xl hover:scale-[1.01] active:scale-95 transition-all"
            >
              <Check className="w-6 h-6 stroke-[3]" />
              <span>Mark as Taken</span>
            </button>

            <button
              onClick={() => handleTransition(nextAction.id, 'skipped')}
              disabled={actionInProgress === nextAction.id}
              className="w-full min-h-[58px] py-4 px-6 glass-pill hover:bg-white text-neutral-800 rounded-full font-bold text-base sm:text-lg flex items-center justify-center gap-2 border border-white/80 transition-all hover:scale-[1.01] active:scale-95"
            >
              <X className="w-5 h-5 text-neutral-500" />
              <span>Skip this time</span>
            </button>
          </div>

          <div className="text-center mt-5">
            <button
              onClick={() => alert('Need assistance? An alert can be sent to your primary caregiver.')}
              className="text-xs font-semibold text-neutral-500 hover:text-indigo-600 inline-flex items-center gap-1.5 transition"
            >
              <HelpCircle className="w-4 h-4" />
              <span>Need help or feeling unwell? Notify Care Circle</span>
            </button>
          </div>
        </div>
      ) : (
        /* All caught up banner */
        <div className="glass-card-pastel-mint rounded-3xl p-8 sm:p-12 text-center mb-12 shadow-glass border border-emerald-200/50">
          <div className="w-14 h-14 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Check className="w-8 h-8 stroke-[3]" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-950">
            You&apos;re completely up to date!
          </h2>
          <p className="text-sm sm:text-base text-neutral-600 font-medium mt-2 max-w-md mx-auto">
            All scheduled medicines and routines for this period have been marked. Relax and enjoy your day.
          </p>
        </div>
      )}

      {/* ── 2. FULL DAY CHRONOLOGICAL SCHEDULE ────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight flex items-center gap-2">
            <span>Today&apos;s Timeline</span>
            <span className="text-xs font-semibold text-neutral-500 glass-pill px-2.5 py-0.5 rounded-full">
              {events.length} routines
            </span>
          </h3>
        </div>

        {events.length === 0 ? (
          <div className="glass-surface rounded-2xl p-8 text-center text-neutral-500">
            No routines scheduled for today.
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((event) => {
              const isTaken = event.status === 'taken';
              const isSkipped = event.status === 'skipped';
              const isPending = event.status === 'pending' || event.status === 'reminded';
              const isMissed = event.status === 'missed';

              return (
                <div
                  key={event.id}
                  className={`p-4 sm:p-5 rounded-2xl transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isTaken
                      ? 'glass-card-pastel-mint opacity-85'
                      : isMissed
                      ? 'bg-rose-50/80 border border-rose-200/80 shadow-xs'
                      : isSkipped
                      ? 'glass-pill opacity-75'
                      : 'glass-surface shadow-xs hover:shadow-glass hover:-translate-y-0.5'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-base shrink-0 shadow-xs ${
                        isTaken
                          ? 'bg-emerald-600 text-white'
                          : isMissed
                          ? 'bg-rose-600 text-white'
                          : isSkipped
                          ? 'bg-neutral-300 text-neutral-700'
                          : 'bg-indigo-600 text-white'
                      }`}
                    >
                      {event.kind === 'medication' ? (
                        <Pill className="w-5 h-5" />
                      ) : (
                        <HeartPulse className="w-5 h-5" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-neutral-500 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> {event.localDueTime}
                        </span>
                        {isTaken && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase tracking-wide">
                            Taken
                          </span>
                        )}
                        {isMissed && (
                          <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-extrabold uppercase tracking-wide">
                            Missed
                          </span>
                        )}
                        {isSkipped && (
                          <span className="px-2 py-0.5 rounded-full bg-neutral-200 text-neutral-800 text-[10px] font-extrabold uppercase tracking-wide">
                            Skipped
                          </span>
                        )}
                      </div>

                      <h4
                        className={`text-lg font-bold mt-0.5 ${
                          isTaken
                            ? 'text-neutral-500 line-through'
                            : 'text-neutral-900'
                        }`}
                      >
                        {event.titleSnapshot}
                      </h4>

                      {event.instructionsSnapshot && (
                        <p className="text-xs text-neutral-600 mt-0.5">
                          {event.instructionsSnapshot}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Quick Action buttons if pending */}
                  {isPending && (
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        onClick={() => handleTransition(event.id, 'taken')}
                        disabled={actionInProgress === event.id}
                        className="px-4 py-1.5 bg-neutral-900 hover:bg-black text-white font-semibold text-xs rounded-full transition-transform hover:scale-105 active:scale-95 shadow-sm flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Taken</span>
                      </button>
                      <button
                        onClick={() => handleTransition(event.id, 'skipped')}
                        disabled={actionInProgress === event.id}
                        className="px-3 py-1.5 glass-pill hover:bg-white text-neutral-700 font-medium text-xs rounded-full transition"
                      >
                        Skip
                      </button>
                    </div>
                  )}

                  {/* Late report if missed */}
                  {isMissed && (
                    <button
                      onClick={() => handleTransition(event.id, 'taken')}
                      disabled={actionInProgress === event.id}
                      className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-full transition-transform hover:scale-105 active:scale-95 shadow-sm self-end sm:self-auto flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Took late</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
