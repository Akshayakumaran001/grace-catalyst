'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Check,
  X,
  AlertCircle,
  Clock,
  Pill,
  HeartPulse,
  Sparkles,
  HelpCircle,
  CheckCircle2,
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
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="animate-spin w-10 h-10 border-4 border-blue-700 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-xl font-bold text-gray-700">Loading today&apos;s routine...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-10">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <span className="text-sm font-extrabold uppercase tracking-widest text-blue-800">
            Today&apos;s Care Schedule
          </span>
          <h1 className="text-3xl sm:text-5xl font-black text-gray-950 tracking-tight mt-1">
            Good day!
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 font-medium mt-1">
            {new Date().toLocaleDateString('en-IN', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>

        {/* Daily Progress Counter */}
        <div className="bg-white border-2 border-blue-200 rounded-2xl p-4 shadow-sm flex items-center gap-4 self-start sm:self-auto">
          <div className="w-12 h-12 rounded-xl bg-blue-700 flex items-center justify-center text-white">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div>
            <div className="text-2xl font-black text-gray-950">
              {takenCount} of {totalCount} Done
            </div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
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
          className="mb-8 p-4 bg-emerald-50 border-2 border-emerald-400 rounded-2xl flex items-center gap-3 text-emerald-950 text-lg font-bold shadow-md animate-fade-in"
        >
          <Sparkles className="w-6 h-6 text-emerald-600 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* ── 1. PROMINENT NEXT ACTION CARD (Elder-first centerpiece) ────── */}
      {nextAction ? (
        <div className="bg-white border-4 border-blue-700 rounded-3xl p-6 sm:p-10 shadow-2xl mb-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-blue-700 text-white text-xs sm:text-sm font-black px-4 py-1.5 rounded-bl-2xl uppercase tracking-wider">
            Up Next
          </div>

          <div className="flex items-center gap-2 text-blue-800 text-lg sm:text-xl font-bold mb-2">
            <Clock className="w-6 h-6 text-blue-700" />
            <span>Scheduled for {nextAction.localDueTime}</span>
            {nextAction.status === 'missed' && (
              <span className="ml-2 px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 text-xs font-black">
                Past Due
              </span>
            )}
          </div>

          <div className="flex items-start gap-4 mt-2">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-800 flex-shrink-0 mt-1">
              {nextAction.kind === 'medication' ? (
                <Pill className="w-8 h-8" />
              ) : (
                <HeartPulse className="w-8 h-8" />
              )}
            </div>

            <div className="flex-1">
              <h2 className="text-3xl sm:text-4xl font-black text-gray-950 tracking-tight leading-tight">
                {nextAction.titleSnapshot}
              </h2>
              {nextAction.instructionsSnapshot && (
                <p className="text-xl sm:text-2xl text-blue-900 font-semibold mt-2">
                  Instructions: {nextAction.instructionsSnapshot}
                </p>
              )}
            </div>
          </div>

          {/* Large Action Controls (Min 56px height for elder accessibility) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 pt-6 border-t-2 border-gray-100">
            <button
              onClick={() => handleTransition(nextAction.id, 'taken')}
              disabled={actionInProgress === nextAction.id}
              className="w-full min-h-[58px] py-4 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xl sm:text-2xl flex items-center justify-center gap-3 shadow-lg hover:shadow-xl active:scale-[0.98] transition-all"
            >
              <Check className="w-7 h-7 stroke-[3]" />
              <span>Mark as Taken</span>
            </button>

            <button
              onClick={() => handleTransition(nextAction.id, 'skipped')}
              disabled={actionInProgress === nextAction.id}
              className="w-full min-h-[58px] py-4 px-6 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-2xl font-bold text-lg sm:text-xl flex items-center justify-center gap-2 border border-gray-300 transition"
            >
              <X className="w-6 h-6 text-gray-600" />
              <span>Skip this time</span>
            </button>
          </div>

          <div className="text-center mt-4">
            <button
              onClick={() => alert('Need assistance? An alert can be sent to your primary caregiver.')}
              className="text-sm font-bold text-gray-500 hover:text-blue-700 inline-flex items-center gap-1.5 transition"
            >
              <HelpCircle className="w-4 h-4" />
              <span>Need help or feeling unwell?</span>
            </button>
          </div>
        </div>
      ) : (
        /* All caught up banner */
        <div className="bg-emerald-50 border-2 border-emerald-300 rounded-3xl p-8 sm:p-12 text-center mb-12 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto mb-4">
            <Check className="w-10 h-10 stroke-[3]" />
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-gray-950">
            You&apos;re completely up to date!
          </h2>
          <p className="text-lg text-emerald-900 font-medium mt-2 max-w-lg mx-auto">
            All scheduled medicines and routines for this period have been marked.
            Relax and have a wonderful day.
          </p>
        </div>
      )}

      {/* ── 2. FULL DAY CHRONOLOGICAL SCHEDULE ────────────────────────── */}
      <div>
        <h3 className="text-2xl font-black text-gray-950 mb-4 flex items-center gap-2">
          <span>Today&apos;s Timeline</span>
          <span className="text-sm font-semibold text-gray-500">
            ({events.length} items)
          </span>
        </h3>

        {events.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-gray-500">
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
                  className={`p-5 rounded-2xl border-2 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isTaken
                      ? 'bg-emerald-50/50 border-emerald-200'
                      : isMissed
                      ? 'bg-red-50/50 border-red-300'
                      : isSkipped
                      ? 'bg-gray-100/70 border-gray-200 opacity-75'
                      : 'bg-white border-gray-200 hover:border-blue-400 shadow-sm'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0 ${
                        isTaken
                          ? 'bg-emerald-600 text-white'
                          : isMissed
                          ? 'bg-red-600 text-white'
                          : isSkipped
                          ? 'bg-gray-300 text-gray-700'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {event.kind === 'medication' ? (
                        <Pill className="w-6 h-6" />
                      ) : (
                        <HeartPulse className="w-6 h-6" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-500 flex items-center gap-1">
                          <Clock className="w-4 h-4" /> {event.localDueTime}
                        </span>
                        {isTaken && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                            Taken
                          </span>
                        )}
                        {isMissed && (
                          <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 text-xs font-bold">
                            Missed
                          </span>
                        )}
                        {isSkipped && (
                          <span className="px-2 py-0.5 rounded-full bg-gray-200 text-gray-800 text-xs font-bold">
                            Skipped
                          </span>
                        )}
                      </div>

                      <h4
                        className={`text-xl font-bold mt-0.5 ${
                          isTaken
                            ? 'text-gray-700 line-through'
                            : 'text-gray-950'
                        }`}
                      >
                        {event.titleSnapshot}
                      </h4>

                      {event.instructionsSnapshot && (
                        <p className="text-sm text-gray-600">
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
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition flex items-center gap-1.5"
                      >
                        <Check className="w-4 h-4" />
                        <span>Taken</span>
                      </button>
                      <button
                        onClick={() => handleTransition(event.id, 'skipped')}
                        disabled={actionInProgress === event.id}
                        className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm rounded-xl transition"
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
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm rounded-xl transition self-end sm:self-auto flex items-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
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
