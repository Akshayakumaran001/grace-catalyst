'use client';

import { useEffect, useState, useCallback } from 'react';
import { HeartPulse, Plus, Check, Clock } from 'lucide-react';
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
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-950">
            Healthcare Routines
          </h1>
          <p className="text-base text-gray-600 mt-1">
            Daily health habits, vitals monitoring, and activity goals.
          </p>
        </div>

        <button
          onClick={() => setShowAdd(true)}
          className="px-5 py-3 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-bold flex items-center gap-2 shadow transition self-start sm:self-auto"
        >
          <Plus className="w-5 h-5" />
          <span>Add Routine</span>
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-gray-500 font-semibold">
          Loading routines...
        </div>
      ) : routines.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <HeartPulse className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-xl font-bold text-gray-800">No active routines</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {routines.map((routine) => (
            <div
              key={routine.id}
              className="bg-white border-2 border-gray-200 hover:border-blue-300 rounded-2xl p-6 shadow-sm transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-bold uppercase tracking-wider">
                    {routine.category || 'General'}
                  </span>
                  <span className="text-xs font-bold text-gray-500 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> {routine.localTimes.join(', ')}
                  </span>
                </div>

                <h3 className="text-2xl font-black text-gray-950 mt-3">
                  {routine.title}
                </h3>
                {routine.description && (
                  <p className="text-sm text-gray-600 mt-1">
                    {routine.description}
                  </p>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100">
                <button
                  onClick={() => handleComplete(routine.id)}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Check className="w-4 h-4" />
                  <span>Done Today</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl max-w-lg w-full p-6 sm:p-8">
            <h2 className="text-2xl font-black text-gray-950 mb-4">
              Add Healthcare Routine
            </h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Routine Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Check Blood Pressure"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:border-blue-700 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Description / Instructions
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Log morning sitting BP reading"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:border-blue-700 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:border-blue-700 outline-none bg-white"
                  >
                    <option value="Vitals">Vitals</option>
                    <option value="Hydration">Hydration</option>
                    <option value="Exercise">Exercise</option>
                    <option value="Nutrition">Nutrition</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Time (HH:mm)
                  </label>
                  <input
                    type="text"
                    required
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    placeholder="09:00"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:border-blue-700 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="px-5 py-2.5 rounded-xl border border-gray-300 font-bold text-sm text-gray-700 hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-bold text-sm shadow transition"
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
