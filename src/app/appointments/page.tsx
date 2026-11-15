'use client';

import { useEffect, useState, useCallback } from 'react';
import { Calendar, Plus, MapPin, User, Clock, Trash2, X } from 'lucide-react';
import { Appointment } from '../../domain/types';

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const [title, setTitle] = useState('');
  const [provider, setProvider] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');

  const fetchAppointments = useCallback(async () => {
    try {
      const res = await fetch('/api/appointments');
      const json = await res.json();
      if (json.data) setAppointments(json.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          provider: provider || undefined,
          startsAtUtc: new Date(dateTime).toISOString(),
          location: location || undefined,
          notes: notes || undefined,
        }),
      });
      const json = await res.json();
      if (json.data) {
        setShowAdd(false);
        setTitle('');
        setProvider('');
        setLocation('');
        setNotes('');
        fetchAppointments();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Cancel this appointment?')) return;
    try {
      await fetch(`/api/appointments/${id}`, { method: 'DELETE' });
      fetchAppointments();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-4 sm:py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full glass-pill text-xs font-semibold text-neutral-700 mb-2">
            <Calendar className="w-3.5 h-3.5 text-sky-600" />
            <span>Consultations & Labs</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 tracking-tight">
            Medical Appointments
          </h1>
          <p className="text-sm text-neutral-600 mt-1">
            Doctor visits, lab tests, and hospital consultations.
          </p>
        </div>

        <button
          onClick={() => setShowAdd(true)}
          className="px-5 py-2.5 bg-neutral-900 hover:bg-black text-white rounded-full font-semibold text-sm flex items-center gap-2 shadow-sm transition-transform hover:scale-105 active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Appointment</span>
        </button>
      </div>

      {loading ? (
        <div className="py-16 text-center text-neutral-500 font-semibold">
          Loading appointments...
        </div>
      ) : appointments.length === 0 ? (
        <div className="glass-surface rounded-3xl p-12 text-center">
          <Calendar className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
          <h3 className="text-xl font-bold text-neutral-800">No scheduled appointments</h3>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((appt) => {
            const dateObj = new Date(appt.startsAtUtc);
            return (
              <div
                key={appt.id}
                className="glass-card-pastel-blue rounded-3xl p-6 transition-all hover:-translate-y-0.5 hover:shadow-glass-hover duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-sky-500/15 border border-sky-300/50 text-sky-800 flex flex-col items-center justify-center shrink-0 font-bold shadow-xs">
                    <span className="text-[10px] uppercase font-bold tracking-wider">
                      {dateObj.toLocaleDateString('en-IN', { month: 'short' })}
                    </span>
                    <span className="text-2xl font-black leading-none mt-0.5">
                      {dateObj.getDate()}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-2xl font-bold text-neutral-950 tracking-tight">
                      {appt.title}
                    </h3>
                    {appt.provider && (
                      <p className="text-xs font-semibold text-sky-800 flex items-center gap-1.5 mt-0.5">
                        <User className="w-3.5 h-3.5 text-sky-600" />
                        <span>{appt.provider}</span>
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-600 mt-2.5">
                      <span className="glass-pill px-2.5 py-0.5 rounded-full flex items-center gap-1 font-medium">
                        <Clock className="w-3 h-3 text-sky-600" />
                        {dateObj.toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {appt.location && (
                        <span className="glass-pill px-2.5 py-0.5 rounded-full flex items-center gap-1 font-medium">
                          <MapPin className="w-3 h-3 text-sky-600" />
                          {appt.location}
                        </span>
                      )}
                    </div>
                    {appt.notes && (
                      <p className="text-xs text-neutral-500 italic mt-2">
                        Notes: {appt.notes}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleCancel(appt.id)}
                  className="p-2 text-neutral-400 hover:text-rose-600 rounded-full hover:bg-white/80 transition self-end sm:self-center"
                  title="Cancel Appointment"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass-surface-elevated rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative border border-white/90">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-neutral-950 tracking-tight">
                Schedule Medical Appointment
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
                  Appointment Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Cardiology Review"
                  className="w-full px-4 py-2.5 rounded-full glass-input text-sm text-neutral-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5 uppercase tracking-wide">
                  Doctor / Clinic / Hospital
                </label>
                <input
                  type="text"
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  placeholder="e.g. Dr. Ramesh Rao (Cardiologist)"
                  className="w-full px-4 py-2.5 rounded-full glass-input text-sm text-neutral-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5 uppercase tracking-wide">
                  Date & Time *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={dateTime}
                  onChange={(e) => setDateTime(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-full glass-input text-sm text-neutral-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5 uppercase tracking-wide">
                  Location / Address
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Apollo Hospital, Greams Road"
                  className="w-full px-4 py-2.5 rounded-full glass-input text-sm text-neutral-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5 uppercase tracking-wide">
                  Preparation Notes
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Bring fasting blood report and recent BP diary"
                  className="w-full px-4 py-2.5 rounded-full glass-input text-sm text-neutral-900 outline-none"
                />
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
                  Schedule Appointment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
