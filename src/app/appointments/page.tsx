'use client';

import { useEffect, useState, useCallback } from 'react';
import { Calendar, Plus, MapPin, User, Clock, Trash2 } from 'lucide-react';
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
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-950">
            Medical Appointments
          </h1>
          <p className="text-base text-gray-600 mt-1">
            Doctor visits, lab tests, and hospital consultations.
          </p>
        </div>

        <button
          onClick={() => setShowAdd(true)}
          className="px-5 py-3 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-bold flex items-center gap-2 shadow transition self-start sm:self-auto"
        >
          <Plus className="w-5 h-5" />
          <span>New Appointment</span>
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-gray-500 font-semibold">
          Loading appointments...
        </div>
      ) : appointments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-xl font-bold text-gray-800">No scheduled appointments</h3>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((appt) => {
            const dateObj = new Date(appt.startsAtUtc);
            return (
              <div
                key={appt.id}
                className="bg-white border-2 border-gray-200 hover:border-blue-300 rounded-2xl p-6 shadow-sm transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-700 border border-teal-200 flex flex-col items-center justify-center flex-shrink-0 font-bold">
                    <span className="text-xs uppercase">
                      {dateObj.toLocaleDateString('en-IN', { month: 'short' })}
                    </span>
                    <span className="text-xl leading-none">
                      {dateObj.getDate()}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-2xl font-black text-gray-950">
                      {appt.title}
                    </h3>
                    {appt.provider && (
                      <p className="text-sm font-semibold text-blue-900 flex items-center gap-1.5 mt-0.5">
                        <User className="w-4 h-4 text-blue-600" />
                        <span>{appt.provider}</span>
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mt-2">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-gray-400" />
                        {dateObj.toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {appt.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          {appt.location}
                        </span>
                      )}
                    </div>
                    {appt.notes && (
                      <p className="text-xs text-gray-500 italic mt-2">
                        Notes: {appt.notes}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleCancel(appt.id)}
                  className="p-2 text-gray-400 hover:text-red-600 rounded-xl hover:bg-red-50 transition self-end sm:self-center"
                  title="Cancel Appointment"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl max-w-lg w-full p-6 sm:p-8">
            <h2 className="text-2xl font-black text-gray-950 mb-4">
              Schedule Medical Appointment
            </h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Appointment Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Cardiology Review"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:border-blue-700 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Doctor / Clinic / Hospital
                </label>
                <input
                  type="text"
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  placeholder="e.g. Dr. Ramesh Rao (Cardiologist)"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:border-blue-700 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Date & Time *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={dateTime}
                  onChange={(e) => setDateTime(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:border-blue-700 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Location / Address
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Apollo Hospital, Greams Road"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:border-blue-700 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Preparation Notes
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Bring fasting blood report and recent BP diary"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:border-blue-700 outline-none"
                />
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
