'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Pill,
  Plus,
  Sparkles,
  Archive,
  Clock,
  AlertCircle,
  Check,
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
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-950">
            Medications
          </h1>
          <p className="text-base text-gray-600 mt-1">
            Active medication schedules managed by the care circle.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-5 py-3 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-bold flex items-center gap-2 shadow transition self-start sm:self-auto"
        >
          <Plus className="w-5 h-5" />
          <span>Add Medicine</span>
        </button>
      </div>

      {/* Medication List */}
      {loading ? (
        <div className="py-12 text-center text-gray-500 font-semibold">
          Loading medications...
        </div>
      ) : medications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <Pill className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-xl font-bold text-gray-800">No active medicines</h3>
          <p className="text-sm text-gray-500 mt-1">
            Add a prescription or routine medicine to generate reminders.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {medications.map((med) => (
            <div
              key={med.id}
              className="bg-white border-2 border-gray-200 hover:border-blue-300 rounded-2xl p-6 shadow-sm transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                    <Pill className="w-5 h-5" />
                  </div>
                  <button
                    onClick={() => handleArchive(med.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                    title="Archive"
                  >
                    <Archive className="w-4 h-4" />
                  </button>
                </div>

                <h3 className="text-2xl font-black text-gray-950 mt-3">
                  {med.name}
                </h3>
                {med.brandOrGeneric && (
                  <span className="text-xs font-semibold text-gray-500">
                    {med.brandOrGeneric}
                  </span>
                )}

                <div className="mt-3 p-3 rounded-xl bg-blue-50/60 border border-blue-100 space-y-1">
                  <div className="text-sm font-bold text-blue-900">
                    Dose: {med.doseText}
                  </div>
                  {med.instructions && (
                    <div className="text-xs text-blue-800 font-medium">
                      Instructions: {med.instructions}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-400 font-medium">
                Started: {med.startDate}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── ADD MEDICATION MODAL WITH AI INTAKE ───────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl max-w-xl w-full p-6 sm:p-8 my-8">
            <h2 className="text-2xl font-black text-gray-950 mb-4">
              Add New Medication
            </h2>

            {/* Tab switch */}
            <div className="flex rounded-xl bg-gray-100 p-1 mb-6">
              <button
                type="button"
                onClick={() => setActiveTab('ai')}
                className={`flex-1 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition ${
                  activeTab === 'ai'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-950'
                }`}
              >
                <Sparkles className="w-4 h-4 text-blue-700" />
                <span>AI Prescription Intake</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('manual')}
                className={`flex-1 py-2 rounded-lg font-bold text-sm transition ${
                  activeTab === 'manual'
                    ? 'bg-white text-gray-950 shadow-sm'
                    : 'text-gray-600 hover:text-gray-950'
                }`}
              >
                <span>Manual Entry</span>
              </button>
            </div>

            {/* AI Intake Flow */}
            {activeTab === 'ai' && (
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Paste Doctor&apos;s Prescription or Type Natural Instructions
                  </label>
                  <textarea
                    rows={3}
                    value={aiText}
                    onChange={(e) => setAiText(e.target.value)}
                    placeholder='e.g. "Take 1 tablet of Metformin 500mg twice daily after meals, once in morning at 8:30 and once at night"'
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm focus:border-blue-700 focus:ring-1 focus:ring-blue-700 outline-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleAiExtract}
                  disabled={aiLoading || !aiText.trim()}
                  className="w-full py-3 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition shadow"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{aiLoading ? 'Gemini Extracting Schedule...' : 'Parse with Gemini AI'}</span>
                </button>

                {extractedCandidate && (
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 text-sm space-y-1">
                    <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>Extracted & Validated Candidate</span>
                    </div>
                    <div>Medicine: <strong>{extractedCandidate.name}</strong></div>
                    <div>Dose: <strong>{extractedCandidate.doseText}</strong></div>
                    <div>Times: <strong>{extractedCandidate.localTimes.join(', ')}</strong></div>
                    <div className="text-xs text-emerald-700 italic mt-2">
                      Please review and confirm the details below before saving.
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Review & Edit Form (Shared between AI output and Manual) */}
            <form onSubmit={handleSaveMedication} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Medicine Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Metformin"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:border-blue-700 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Dose Text *
                  </label>
                  <input
                    type="text"
                    required
                    value={doseText}
                    onChange={(e) => setDoseText(e.target.value)}
                    placeholder="e.g. 1 tablet (500mg)"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:border-blue-700 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Brand / Generic
                  </label>
                  <input
                    type="text"
                    value={brandOrGeneric}
                    onChange={(e) => setBrandOrGeneric(e.target.value)}
                    placeholder="e.g. Glycomet"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:border-blue-700 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Daily Times (HH:mm) *
                  </label>
                  <input
                    type="text"
                    required
                    value={localTimes}
                    onChange={(e) => setLocalTimes(e.target.value)}
                    placeholder="08:30, 20:00"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:border-blue-700 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Meal Context
                  </label>
                  <input
                    type="text"
                    value={mealContext}
                    onChange={(e) => setMealContext(e.target.value)}
                    placeholder="After breakfast"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:border-blue-700 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-gray-300 font-bold text-sm text-gray-700 hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-bold text-sm shadow transition"
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
