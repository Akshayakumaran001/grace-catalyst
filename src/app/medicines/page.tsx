'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Pill,
  Plus,
  Sparkles,
  Archive,
  Clock,
  Check,
  X,
} from 'lucide-react';
import { Medication } from '../../domain/types';

export default function MedicinesPage() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'ai' | 'manual'>('ai');

  // AI Intake Form state
  const [aiText, setAiText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [extractedCandidate, setExtractedCandidate] = useState<{
    name: string;
    doseText: string;
    frequency: 'daily' | 'specific_days';
    localTimes: string[];
    mealContext?: string;
    instructions?: string;
    uncertainFields: string[];
    confidence: number;
    notes?: string;
  } | null>(null);

  // Manual Form state
  const [name, setName] = useState('');
  const [brandOrGeneric, setBrandOrGeneric] = useState('');
  const [doseText, setDoseText] = useState('1 tablet (500mg)');
  const [mealContext, setMealContext] = useState('After breakfast');
  const [localTimes, setLocalTimes] = useState('08:30');
  const [instructions, setInstructions] = useState('');

  const fetchMedications = useCallback(async () => {
    try {
      const res = await fetch('/api/medications');
      const json = await res.json();
      if (json.data) {
        setMedications(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMedications();
  }, [fetchMedications]);

  const handleAiExtract = async () => {
    if (!aiText.trim()) return;
    setAiLoading(true);
    try {
      const res = await fetch('/api/ai/medication-intake/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: aiText }),
      });
      const json = await res.json();
      if (json.data?.candidate) {
        setExtractedCandidate(json.data.candidate);
        // Pre-fill manual fields so user can review and edit
        setName(json.data.candidate.name || '');
        setDoseText(json.data.candidate.doseText || '');
        setMealContext(json.data.candidate.mealContext || '');
        setLocalTimes((json.data.candidate.localTimes || ['09:00']).join(', '));
        setInstructions(json.data.candidate.instructions || '');
      }
    } catch (err) {
      console.error('AI Extract error:', err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSaveMedication = async (e: React.FormEvent) => {
    e.preventDefault();
    const times = localTimes
      .split(',')
      .map((t) => t.trim())
      .filter((t) => /^\d{2}:\d{2}$/.test(t));

    try {
      const res = await fetch('/api/medications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          brandOrGeneric: brandOrGeneric || undefined,
          doseText,
          instructions: instructions || undefined,
          startDate: new Date().toISOString().slice(0, 10),
          schedule: {
            frequency: 'daily',
            localTimes: times.length > 0 ? times : ['09:00'],
            mealContext: mealContext || undefined,
          },
        }),
      });

      const json = await res.json();
      if (json.data) {
        if (json.data.proposed) {
          alert('Note: Elder-Approval mode is ON. Your addition was submitted as a Change Proposal for elder approval.');
        }
        setShowAddModal(false);
        setExtractedCandidate(null);
        setAiText('');
        fetchMedications();
      }
    } catch (err) {
      console.error('Save error:', err);
    }
  };

  const handleArchive = async (id: string) => {
    if (!confirm('Archive this medication?')) return;
    try {
      await fetch(`/api/medications/${id}`, { method: 'DELETE' });
      fetchMedications();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-4 sm:py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full glass-pill text-xs font-semibold text-neutral-700 mb-2">
            <Pill className="w-3.5 h-3.5 text-indigo-600" />
            <span>Prescription Regimen</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 tracking-tight">
            Medications
          </h1>
          <p className="text-sm text-neutral-600 mt-1">
            Active medication schedules managed by the care circle.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-5 py-2.5 bg-neutral-900 hover:bg-black text-white rounded-full font-semibold text-sm flex items-center gap-2 shadow-sm transition-transform hover:scale-105 active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Medicine</span>
        </button>
      </div>

      {/* Medication List */}
      {loading ? (
        <div className="py-16 text-center text-neutral-500 font-semibold">
          Loading medications...
        </div>
      ) : medications.length === 0 ? (
        <div className="glass-surface rounded-3xl p-12 text-center">
          <Pill className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
          <h3 className="text-xl font-bold text-neutral-800">No active medicines</h3>
          <p className="text-sm text-neutral-500 mt-1">
            Add a prescription or routine medicine to generate reminders.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {medications.map((med) => (
            <div
              key={med.id}
              className="glass-card-pastel-lavender rounded-3xl p-6 transition-all hover:-translate-y-1 hover:shadow-glass-hover duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="w-11 h-11 rounded-2xl bg-indigo-500/15 border border-indigo-200/60 text-indigo-700 flex items-center justify-center font-bold shadow-xs">
                    <Pill className="w-5 h-5" />
                  </div>
                  <button
                    onClick={() => handleArchive(med.id)}
                    className="p-1.5 text-neutral-400 hover:text-rose-600 rounded-full hover:bg-white/80 transition"
                    title="Archive"
                  >
                    <Archive className="w-4 h-4" />
                  </button>
                </div>

                <h3 className="text-2xl font-bold text-neutral-950 mt-4 tracking-tight">
                  {med.name}
                </h3>
                {med.brandOrGeneric && (
                  <span className="text-xs font-semibold text-neutral-500 block">
                    {med.brandOrGeneric}
                  </span>
                )}

                <div className="mt-4 p-3.5 rounded-2xl bg-white/70 border border-white/80 space-y-1.5 shadow-xs">
                  <div className="text-sm font-bold text-neutral-900">
                    Dose: {med.doseText}
                  </div>
                  {med.instructions && (
                    <div className="text-xs text-neutral-700 font-medium">
                      Instructions: {med.instructions}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-indigo-100/60 text-xs text-neutral-400 font-medium flex items-center justify-between">
                <span>Started: {med.startDate}</span>
                <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold text-[10px] uppercase">
                  Active
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── ADD MEDICATION MODAL WITH AI INTAKE ───────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="glass-surface-elevated rounded-3xl max-w-xl w-full p-6 sm:p-8 my-8 shadow-2xl relative border border-white/90">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-2xl font-bold text-neutral-950 tracking-tight">
                Add New Medication
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-full text-neutral-400 hover:text-neutral-800 hover:bg-white/80 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Pill Tab Switch */}
            <div className="flex rounded-full glass-pill p-1 mb-6 border border-white/80">
              <button
                type="button"
                onClick={() => setActiveTab('ai')}
                className={`flex-1 py-2 rounded-full font-bold text-xs flex items-center justify-center gap-2 transition ${
                  activeTab === 'ai'
                    ? 'bg-neutral-900 text-white shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-950'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>AI Intake</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('manual')}
                className={`flex-1 py-2 rounded-full font-bold text-xs transition ${
                  activeTab === 'manual'
                    ? 'bg-neutral-900 text-white shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-950'
                }`}
              >
                <span>Manual Entry</span>
              </button>
            </div>

            {/* AI Intake Flow */}
            {activeTab === 'ai' && (
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1.5 uppercase tracking-wide">
                    Paste Doctor&apos;s Prescription or Natural Text
                  </label>
                  <textarea
                    rows={3}
                    value={aiText}
                    onChange={(e) => setAiText(e.target.value)}
                    placeholder='e.g. "Take 1 tablet of Metformin 500mg twice daily after meals, once at 08:30 and once at night"'
                    className="w-full px-4 py-3 rounded-2xl glass-input text-sm text-neutral-900 outline-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleAiExtract}
                  disabled={aiLoading || !aiText.trim()}
                  className="w-full py-3 bg-neutral-900 hover:bg-black text-white rounded-full font-semibold text-sm flex items-center justify-center gap-2 transition-transform hover:scale-[1.01] active:scale-95 shadow-md"
                >
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span>{aiLoading ? 'Extracting with Gemini AI...' : 'Parse with Gemini AI'}</span>
                </button>

                {extractedCandidate && (
                  <div className="p-4 rounded-2xl glass-card-pastel-mint text-emerald-950 text-xs space-y-1 border border-emerald-200">
                    <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>Extracted & Validated Candidate</span>
                    </div>
                    <div>Medicine: <strong>{extractedCandidate.name}</strong></div>
                    <div>Dose: <strong>{extractedCandidate.doseText}</strong></div>
                    <div>Times: <strong>{extractedCandidate.localTimes.join(', ')}</strong></div>
                    <div className="text-[11px] text-emerald-700 italic mt-2">
                      Please review the prefilled values below and confirm.
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Review & Edit Form */}
            <form onSubmit={handleSaveMedication} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5 uppercase tracking-wide">
                  Medicine Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Metformin"
                  className="w-full px-4 py-2.5 rounded-full glass-input text-sm text-neutral-900 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1.5 uppercase tracking-wide">
                    Dose Text *
                  </label>
                  <input
                    type="text"
                    required
                    value={doseText}
                    onChange={(e) => setDoseText(e.target.value)}
                    placeholder="e.g. 1 tablet (500mg)"
                    className="w-full px-4 py-2.5 rounded-full glass-input text-sm text-neutral-900 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1.5 uppercase tracking-wide">
                    Brand / Generic
                  </label>
                  <input
                    type="text"
                    value={brandOrGeneric}
                    onChange={(e) => setBrandOrGeneric(e.target.value)}
                    placeholder="e.g. Glycomet"
                    className="w-full px-4 py-2.5 rounded-full glass-input text-sm text-neutral-900 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1.5 uppercase tracking-wide">
                    Daily Times (HH:mm) *
                  </label>
                  <input
                    type="text"
                    required
                    value={localTimes}
                    onChange={(e) => setLocalTimes(e.target.value)}
                    placeholder="08:30, 20:00"
                    className="w-full px-4 py-2.5 rounded-full glass-input text-sm text-neutral-900 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1.5 uppercase tracking-wide">
                    Meal Context
                  </label>
                  <input
                    type="text"
                    value={mealContext}
                    onChange={(e) => setMealContext(e.target.value)}
                    placeholder="After breakfast"
                    className="w-full px-4 py-2.5 rounded-full glass-input text-sm text-neutral-900 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200/60">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 rounded-full glass-pill font-semibold text-xs text-neutral-700 hover:bg-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-neutral-900 hover:bg-black text-white rounded-full font-semibold text-xs shadow-md transition-transform hover:scale-105 active:scale-95"
                >
                  Confirm & Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
