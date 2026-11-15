'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Users,
  Shield,
  KeyRound,
  UserPlus,
  Trash2,
  Lock,
  Unlock,
  Check,
} from 'lucide-react';
import { Membership, CareProfile, Role } from '../../domain/types';

export default function CareCirclePage() {
  const [profile, setProfile] = useState<CareProfile | null>(null);
  const [members, setMembers] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Invite state
  const [inviteRole, setInviteRole] = useState<Role>('family_member');
  const [invitePasscode, setInvitePasscode] = useState('');
  const [createdPasscode, setCreatedPasscode] = useState<string | null>(null);

  const fetchCircleData = useCallback(async () => {
    try {
      const [pRes, mRes] = await Promise.all([
        fetch('/api/care-profile'),
        fetch('/api/members'),
      ]);
      const [pJson, mJson] = await pRes.json();
      if (pJson.data) setProfile(pJson.data);
      if (mJson.data) setMembers(mJson.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCircleData();
  }, [fetchCircleData]);

  const toggleCollaborationMode = async () => {
    if (!profile) return;
    const newMode =
      profile.collaborationMode === 'direct_edit'
        ? 'elder_approval_required'
        : 'direct_edit';

    try {
      const res = await fetch('/api/care-profile/collaboration', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collaborationMode: newMode }),
      });
      const json = await res.json();
      if (json.data) {
        setProfile(json.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: inviteRole,
          passcode: invitePasscode,
          expiresInDays: 30,
        }),
      });
      const json = await res.json();
      if (json.data) {
        setCreatedPasscode(json.data.rawPasscode);
        setInvitePasscode('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRevoke = async (memberId: string) => {
    if (!confirm('Revoke access for this care circle member?')) return;
    try {
      await fetch(`/api/members/${memberId}`, { method: 'DELETE' });
      fetchCircleData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-950">
            Care Circle
          </h1>
          <p className="text-base text-gray-600 mt-1">
            Manage who has access, member permissions, and elder consent controls.
          </p>
        </div>

        <button
          onClick={() => {
            setShowInviteModal(true);
            setCreatedPasscode(null);
          }}
          className="px-5 py-3 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-bold flex items-center gap-2 shadow transition self-start sm:self-auto"
        >
          <UserPlus className="w-5 h-5" />
          <span>Invite Member</span>
        </button>
      </div>

      {/* ── ELDER AGENCY & CONSENT MODE (FR-043) ───────────────────────── */}
      {profile && (
        <div className="bg-white border-2 border-blue-200 rounded-3xl p-6 sm:p-8 shadow-sm mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-blue-900 font-extrabold text-sm uppercase tracking-wider mb-1">
                <Shield className="w-4 h-4 text-blue-700" />
                <span>Elder Agency & Consent Policy</span>
              </div>
              <h3 className="text-2xl font-black text-gray-950">
                Collaboration Mode:{' '}
                <span className="text-blue-700">
                  {profile.collaborationMode === 'direct_edit'
                    ? 'Direct Collaboration'
                    : 'Elder Approval Required'}
                </span>
              </h3>
              <p className="text-sm text-gray-600 mt-2 max-w-xl">
                {profile.collaborationMode === 'direct_edit'
                  ? 'Authorized caregivers and family members can directly update medications and routines.'
                  : 'All edits submitted by caregivers or family become pending proposals that require the elder’s explicit approval before applying.'}
              </p>
            </div>

            <button
              onClick={toggleCollaborationMode}
              className={`px-6 py-3.5 rounded-2xl font-black text-sm flex items-center gap-2 transition flex-shrink-0 shadow ${
                profile.collaborationMode === 'direct_edit'
                  ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
                  : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300'
              }`}
            >
              {profile.collaborationMode === 'direct_edit' ? (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Switch to Approval-Required</span>
                </>
              ) : (
                <>
                  <Unlock className="w-4 h-4" />
                  <span>Switch to Direct Edit</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Members List */}
      <div>
        <h3 className="text-2xl font-black text-gray-950 mb-4">
          Active Members ({members.length})
        </h3>

        {loading ? (
          <div className="py-8 text-center text-gray-500 font-medium">
            Loading members...
          </div>
        ) : (
          <div className="space-y-3">
            {members.map((member) => {
              const isElder = member.role === 'elderly';
              return (
                <div
                  key={member.id}
                  className="bg-white border-2 border-gray-200 rounded-2xl p-5 shadow-sm flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white ${
                        isElder
                          ? 'bg-blue-700'
                          : member.role === 'caretaker'
                          ? 'bg-purple-700'
                          : 'bg-emerald-700'
                      }`}
                    >
                      {member.displayName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-lg font-bold text-gray-950">
                          {member.displayName}
                        </h4>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                            isElder
                              ? 'bg-blue-100 text-blue-800'
                              : member.role === 'caretaker'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {member.role.replace('_', ' ')}
                        </span>
                      </div>
                      {member.email && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {member.email} · Email alerts enabled
                        </p>
                      )}
                    </div>
                  </div>

                  {!isElder && (
                    <button
                      onClick={() => handleRevoke(member.id)}
                      className="p-2 text-gray-400 hover:text-red-600 rounded-xl hover:bg-red-50 transition"
                      title="Revoke Access"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl max-w-md w-full p-6 sm:p-8">
            <h2 className="text-2xl font-black text-gray-950 mb-2">
              Generate Scoped Invitation
            </h2>
            <p className="text-xs text-gray-500 mb-6">
              Create a secure passcode invitation for a new family member or caretaker.
            </p>

            {createdPasscode ? (
              <div className="p-6 bg-emerald-50 border-2 border-emerald-300 rounded-2xl text-center space-y-3">
                <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6 stroke-[3]" />
                </div>
                <h4 className="text-lg font-bold text-emerald-950">
                  Invitation Created!
                </h4>
                <div className="p-3 bg-white border border-emerald-200 rounded-xl font-mono text-2xl font-black tracking-widest text-emerald-900">
                  {createdPasscode}
                </div>
                <p className="text-xs text-emerald-800">
                  Share this passcode with the recipient to join the care circle.
                </p>
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm rounded-xl transition"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateInvite} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Assign Role *
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as Role)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:border-blue-700 outline-none bg-white font-medium"
                  >
                    <option value="family_member">Family Member</option>
                    <option value="caretaker">Caretaker</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Passcode (min 8 characters) *
                  </label>
                  <input
                    type="text"
                    required
                    minLength={8}
                    value={invitePasscode}
                    onChange={(e) => setInvitePasscode(e.target.value.toUpperCase())}
                    placeholder="e.g. GRACE8899"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm uppercase font-mono tracking-wider focus:border-blue-700 outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="px-5 py-2.5 rounded-xl border border-gray-300 font-bold text-sm text-gray-700 hover:bg-gray-100 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-bold text-sm shadow transition"
                  >
                    Generate Passcode
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
