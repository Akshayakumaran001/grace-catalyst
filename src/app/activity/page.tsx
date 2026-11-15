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
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-black text-gray-950">
          Adherence & Activity Feed
        </h1>
        <p className="text-base text-gray-600 mt-1">
          Transparent, append-only record of medication adherence and care circle events.
        </p>
      </div>

      {/* ── 1. ADHERENCE SUMMARY (FR-025, FR-026, FR-029) ──────────────── */}
      {adherence && (
        <div className="bg-white border-2 border-gray-200 rounded-3xl p-6 sm:p-8 shadow-sm mb-10">
          <div className="flex items-center gap-2 text-blue-900 font-extrabold text-sm uppercase tracking-wider mb-4">
            <TrendingUp className="w-4 h-4 text-blue-700" />
            <span>7-Day Adherence Metric</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100">
              <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">
                Adherence Rate
              </span>
              <div className="text-3xl sm:text-4xl font-black text-blue-950 mt-1">
                {adherence.adherenceRate !== null
                  ? `${Math.round(adherence.adherenceRate * 100)}%`
                  : 'N/A'}
              </div>
              <p className="text-xs text-blue-700 mt-1">
                {adherence.takenCount} of {adherence.eligibleCount} doses taken
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                Taken on time
              </span>
              <div className="text-3xl sm:text-4xl font-black text-emerald-950 mt-1">
                {adherence.takenCount}
              </div>
              <p className="text-xs text-emerald-700 mt-1">Confirmed taken</p>
            </div>

            <div className="p-4 rounded-2xl bg-red-50 border border-red-100">
              <span className="text-xs font-bold text-red-800 uppercase tracking-wider">
                Missed
              </span>
              <div className="text-3xl sm:text-4xl font-black text-red-950 mt-1">
                {adherence.missedCount}
              </div>
              <p className="text-xs text-red-700 mt-1">Required caregiver alert</p>
            </div>

            <div className="p-4 rounded-2xl bg-gray-100 border border-gray-200">
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Skipped
              </span>
              <div className="text-3xl sm:text-4xl font-black text-gray-900 mt-1">
                {adherence.skippedCount}
              </div>
              <p className="text-xs text-gray-600 mt-1">Explicitly skipped</p>
            </div>
          </div>
        </div>
      )}

      {/* ── 2. AUDIT TRAIL / ACTIVITY FEED (FR-027, FR-028) ─────────────── */}
      <div>
        <h3 className="text-2xl font-black text-gray-950 mb-4 flex items-center gap-2">
          <History className="w-6 h-6 text-gray-700" />
          <span>Chronological Activity Log</span>
        </h3>

        {loading ? (
          <div className="py-8 text-center text-gray-500 font-medium">
            Loading activity stream...
          </div>
        ) : auditLogs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-gray-500">
            No activity recorded yet.
          </div>
        ) : (
          <div className="bg-white border-2 border-gray-200 rounded-3xl p-4 sm:p-6 shadow-sm divide-y divide-gray-100">
            {auditLogs.map((log) => {
              const dateObj = new Date(log.createdAt);
              const isTaken = log.action.includes('TAKEN');
              const isMissed = log.action.includes('MISSED');
              const isSkip = log.action.includes('SKIPPED');

              return (
                <div key={log.id} className="py-4 first:pt-0 last:pb-0 flex items-start gap-4">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      isTaken
                        ? 'bg-emerald-100 text-emerald-700'
                        : isMissed
                        ? 'bg-red-100 text-red-700'
                        : isSkip
                        ? 'bg-gray-200 text-gray-700'
                        : 'bg-blue-100 text-blue-700'
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
                      <h4 className="text-base font-bold text-gray-950">
                        {log.action.replace(/_/g, ' ')}
                      </h4>
                      <span className="text-xs font-semibold text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {dateObj.toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })} · {dateObj.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>

                    <p className="text-xs text-gray-500 mt-0.5">
                      Target: {log.resourceType} · ID: {log.resourceId}
                    </p>

                    {log.after && (
                      <div className="mt-2 text-xs font-mono bg-gray-50 border border-gray-200 rounded-lg p-2 text-gray-700 overflow-x-auto">
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
