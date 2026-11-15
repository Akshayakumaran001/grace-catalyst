'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  History,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { AuditLogEntry } from '../../domain/types';

interface AdherenceSummary {
  eligibleCount: number;
  takenCount: number;
  missedCount: number;
  skippedCount: number;
  pendingCount: number;
  adherenceRate: number | null;
}

export default function ActivityPage() {
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [adherence, setAdherence] = useState<AdherenceSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [auditRes, adhRes] = await Promise.all([
        fetch('/api/audit'),
        fetch('/api/adherence?days=7'),
      ]);
      const [auditJson, adhJson] = await Promise.all([
        auditRes.json(),
        adhRes.json(),
      ]);
      if (auditJson.data) setAuditLogs(auditJson.data);
      if (adhJson.data) setAdherence(adhJson.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="max-w-4xl mx-auto py-4 sm:py-8">
      <div className="mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full glass-pill text-xs font-semibold text-neutral-700 mb-2">
          <History className="w-3.5 h-3.5 text-indigo-600" />
          <span>Care Circle Audit Trail</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 tracking-tight">
          Adherence & Activity Feed
        </h1>
        <p className="text-sm text-neutral-600 mt-1">
          Transparent, append-only record of medication adherence and care circle events.
        </p>
      </div>

      {/* ── 1. ADHERENCE SUMMARY (FR-025, FR-026, FR-029) ──────────────── */}
      {adherence && (
        <div className="glass-surface rounded-3xl p-6 sm:p-8 shadow-glass mb-10 border border-white/90">
          <div className="flex items-center gap-2 text-indigo-800 font-bold text-xs uppercase tracking-wider mb-5">
            <TrendingUp className="w-4 h-4 text-indigo-600" />
            <span>7-Day Adherence Overview</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="glass-card-pastel-lavender p-4 rounded-2xl border border-indigo-200/50 shadow-xs">
              <span className="text-[11px] font-bold text-indigo-800 uppercase tracking-wider">
                Adherence Rate
              </span>
              <div className="text-3xl sm:text-4xl font-extrabold text-neutral-900 mt-1">
                {adherence.adherenceRate !== null
                  ? `${Math.round(adherence.adherenceRate * 100)}%`
                  : 'N/A'}
              </div>
              <p className="text-[11px] text-neutral-600 mt-1">
                {adherence.takenCount} of {adherence.eligibleCount} doses taken
              </p>
            </div>

            <div className="glass-card-pastel-mint p-4 rounded-2xl border border-emerald-200/50 shadow-xs">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                Taken on time
              </span>
              <div className="text-3xl sm:text-4xl font-extrabold text-neutral-900 mt-1">
                {adherence.takenCount}
              </div>
              <p className="text-[11px] text-emerald-700 mt-1">Confirmed taken</p>
            </div>

            <div className="glass-card-pastel-peach p-4 rounded-2xl border border-rose-200/50 shadow-xs">
              <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">
                Missed
              </span>
              <div className="text-3xl sm:text-4xl font-extrabold text-neutral-900 mt-1">
                {adherence.missedCount}
              </div>
              <p className="text-[11px] text-rose-700 mt-1">Triggered alert</p>
            </div>

            <div className="glass-pill p-4 rounded-2xl border border-white/80 shadow-xs">
              <span className="text-[11px] font-bold text-neutral-700 uppercase tracking-wider">
                Skipped
              </span>
              <div className="text-3xl sm:text-4xl font-extrabold text-neutral-900 mt-1">
                {adherence.skippedCount}
              </div>
              <p className="text-[11px] text-neutral-500 mt-1">Explicitly skipped</p>
            </div>
          </div>
        </div>
      )}

      {/* ── 2. AUDIT TRAIL / ACTIVITY FEED (FR-027, FR-028) ─────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-neutral-900 tracking-tight flex items-center gap-2">
            <span>Chronological Activity Log</span>
            <span className="text-xs font-semibold text-neutral-500 glass-pill px-2.5 py-0.5 rounded-full">
              {auditLogs.length} events
            </span>
          </h3>
        </div>

        {loading ? (
          <div className="py-12 text-center text-neutral-500 font-medium">
            Loading activity stream...
          </div>
        ) : auditLogs.length === 0 ? (
          <div className="glass-surface rounded-2xl p-8 text-center text-neutral-500">
            No activity recorded yet.
          </div>
        ) : (
          <div className="glass-surface rounded-3xl p-4 sm:p-6 shadow-glass divide-y divide-neutral-200/50 border border-white/90">
            {auditLogs.map((log) => {
              const dateObj = new Date(log.createdAt);
              const isTaken = log.action.includes('TAKEN');
              const isMissed = log.action.includes('MISSED');
              const isSkip = log.action.includes('SKIPPED');

              return (
                <div key={log.id} className="py-4 first:pt-0 last:pb-0 flex items-start gap-4">
                  <div
                    className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 shadow-xs ${
                      isTaken
                        ? 'bg-emerald-500/15 text-emerald-700'
                        : isMissed
                        ? 'bg-rose-500/15 text-rose-700'
                        : isSkip
                        ? 'bg-neutral-200 text-neutral-700'
                        : 'bg-indigo-500/15 text-indigo-700'
                    }`}
                  >
                    {isTaken ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : isMissed ? (
                      <AlertCircle className="w-5 h-5" />
                    ) : isSkip ? (
                      <XCircle className="w-5 h-5" />
                    ) : (
                      <History className="w-5 h-5" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <h4 className="text-sm font-bold text-neutral-900">
                        {log.action.replace(/_/g, ' ')}
                      </h4>
                      <span className="text-xs font-medium text-neutral-500 flex items-center gap-1 glass-pill px-2 py-0.5 rounded-full self-start sm:self-auto">
                        <Clock className="w-3 h-3 text-indigo-500" />
                        {dateObj.toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })} · {dateObj.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>

                    <p className="text-xs text-neutral-500 mt-1">
                      Target: <span className="font-semibold text-neutral-700">{log.resourceType}</span> · ID: {log.resourceId}
                    </p>

                    {log.after && (
                      <div className="mt-2 text-[11px] font-mono bg-white/60 border border-white/80 rounded-xl p-2.5 text-neutral-700 overflow-x-auto shadow-xs">
                        {JSON.stringify(log.after)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
