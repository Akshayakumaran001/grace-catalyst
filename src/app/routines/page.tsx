'use client';

import { useEffect, useState, useCallback } from 'react';
import { HeartPulse, Plus, Check, Clock, X } from 'lucide-react';
import { HealthcareRoutine } from '../../domain/types';

export default function RoutinesPage() {
  const [routines, setRoutines] = useState<HealthcareRoutine[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Vitals');
  const [time, setTime] = useState('09:00');

  const fetchRoutines = useCallback(async () => {
    try {
      const res = await fetch('/api/routines');
      const json = await res.json();
      if (json.data) setRoutines(json.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoutines();
  }, [fetchRoutines]);

  const handleComplete = async (routineId: string) => {
    try {
      const res = await fetch(`/api/routines/${routineId}/complete`, {
        method: 'POST',
      });
      const json = await res.json();
      if (json.data) {
        alert('Routine marked complete for today!');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/routines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description: description || undefined,
          category,
          frequency: 'daily',
          localTimes: [time],
          effectiveFrom: new Date().toISOString().slice(0, 10),
        }),
      });
      const json = await res.json();
      if (json.data) {
        setShowAdd(false);
        setTitle('');
        setDescription('');
        fetchRoutines();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-4 sm:py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full glass-pill text-xs font-semibold text-neutral-700 mb-2">
            <HeartPulse className="w-3.5 h-3.5 text-rose-500" />
            <span>Wellness Habits</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 tracking-tight">
            Healthcare Routines
          </h1>
          <p className="text-sm text-neutral-600 mt-1">
            Daily health habits, vitals monitoring, and activity goals.
          </p>
        </div>

        <button
          onClick={() => setShowAdd(true)}
          className="px-5 py-2.5 bg-neutral-900 hover:bg-black text-white rounded-full font-semibold text-sm flex items-center gap-2 shadow-sm transition-transform hover:scale-105 active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Routine</span>
        </button>
      </div>

      {loading ? (
        <div className="py-16 text-center text-neutral-500 font-semibold">
          Loading routines...
        </div>
      ) : routines.length === 0 ? (
        <div className="glass-surface rounded-3xl p-12 text-center">
          <HeartPulse className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
          <h3 className="text-xl font-bold text-neutral-800">No active routines</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {routines.map((routine) => (
            <div
              key={routine.id}
              className="glass-card-pastel-peach rounded-3xl p-6 transition-all hover:-translate-y-1 hover:shadow-glass-hover duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="px-3 py-1 rounded-full bg-rose-100/80 text-rose-800 text-[11px] font-bold uppercase tracking-wider">
                    {routine.category || 'General'}
                  </span>
                  <span className="text-xs font-bold text-neutral-500 flex items-center gap-1 glass-pill px-2.5 py-0.5 rounded-full">
                    <Clock className="w-3.5 h-3.5 text-rose-500" /> {routine.localTimes.join(', ')}
                  </span>
                </div>

                <h3 className="text-2xl font-bold text-neutral-950 mt-4 tracking-tight">
                  {routine.title}
                </h3>
                {routine.description && (
                  <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
                    {routine.description}
                  </p>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-rose-100/60">
                <button
                  onClick={() => handleComplete(routine.id)}
                  className="w-full py-2.5 px-4 bg-neutral-900 hover:bg-black text-white font-semibold text-xs rounded-full transition-transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Done Today</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass-surface-elevated rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative border border-white/90">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-neutral-950 tracking-tight">
                Add Healthcare Routine
              </h2>
              <button
                onClick={() => setShowAdd(false)}
                className="p-1 rounded-full text-neutral-400 hover:text-neutral-800 hover:bg-white/80 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5 uppercase tracking-wide">
                  Routine Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Check Blood Pressure"
                  className="w-full px-4 py-2.5 rounded-full glass-input text-sm text-neutral-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5 uppercase tracking-wide">
                  Description / Instructions
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Log morning sitting BP reading"
                  className="w-full px-4 py-2.5 rounded-full glass-input text-sm text-neutral-900 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1.5 uppercase tracking-wide">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-full glass-input text-sm text-neutral-900 outline-none bg-white/90"
                  >
                    <option value="Vitals">Vitals</option>
                    <option value="Hydration">Hydration</option>
                    <option value="Exercise">Exercise</option>
                    <option value="Nutrition">Nutrition</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1.5 uppercase tracking-wide">
                    Time (HH:mm)
                  </label>
                  <input
                    type="text"
                    required
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    placeholder="09:00"
                    className="w-full px-4 py-2.5 rounded-full glass-input text-sm text-neutral-900 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200/60">
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="px-5 py-2.5 rounded-full glass-pill font-semibold text-xs text-neutral-700 hover:bg-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-neutral-900 hover:bg-black text-white rounded-full font-semibold text-xs shadow-md transition-transform hover:scale-105 active:scale-95"
                >
                  Save Routine
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
