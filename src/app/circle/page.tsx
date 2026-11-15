'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Users,
  Shield,
  UserPlus,
  Trash2,
  Lock,
  Unlock,
  Check,
  X,
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
    <div className="max-w-4xl mx-auto py-4 sm:py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full glass-pill text-xs font-semibold text-neutral-700 mb-2">
            <Users className="w-3.5 h-3.5 text-indigo-600" />
            <span>Care Network</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 tracking-tight">
            Care Circle
          </h1>
          <p className="text-sm text-neutral-600 mt-1">
            Manage member permissions, collaboration modes, and elder consent controls.
          </p>
        </div>

        <button
          onClick={() => {
            setShowInviteModal(true);
            setCreatedPasscode(null);
          }}
          className="px-5 py-2.5 bg-neutral-900 hover:bg-black text-white rounded-full font-semibold text-sm flex items-center gap-2 shadow-sm transition-transform hover:scale-105 active:scale-95 self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Invite Member</span>
        </button>
      </div>

      {/* ── ELDER AGENCY & CONSENT MODE (FR-043) ───────────────────────── */}
      {profile && (
        <div className="glass-surface-elevated rounded-3xl p-6 sm:p-8 shadow-glass mb-10 border border-white/90">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-indigo-800 font-bold text-xs uppercase tracking-wider mb-1">
                <Shield className="w-4 h-4 text-indigo-600" />
                <span>Elder Agency & Consent Policy</span>
              </div>
              <h3 className="text-2xl font-bold text-neutral-950 tracking-tight">
                Mode:{' '}
                <span className="text-indigo-600">
                  {profile.collaborationMode === 'direct_edit'
                    ? 'Direct Collaboration'
                    : 'Elder Approval Required'}
                </span>
              </h3>
              <p className="text-xs text-neutral-600 mt-2 max-w-xl leading-relaxed">
                {profile.collaborationMode === 'direct_edit'
                  ? 'Authorized caregivers and family members can directly update medications and routines.'
                  : 'All edits submitted by caregivers or family become pending proposals that require the elder’s explicit approval before applying.'}
              </p>
            </div>

            <button
              onClick={toggleCollaborationMode}
              className={`px-5 py-3 rounded-full font-bold text-xs flex items-center gap-2 transition-transform hover:scale-105 active:scale-95 shrink-0 shadow-sm ${
                profile.collaborationMode === 'direct_edit'
                  ? 'bg-amber-100/90 hover:bg-amber-200/90 text-amber-900 border border-amber-300/80'
                  : 'bg-emerald-100/90 hover:bg-emerald-200/90 text-emerald-900 border border-emerald-300/80'
              }`}
            >
              {profile.collaborationMode === 'direct_edit' ? (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Switch to Approval-Required</span>
                </>
              ) : (
                <>
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Switch to Direct Edit</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Members List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-neutral-900 tracking-tight">
            Active Members ({members.length})
          </h3>
        </div>

        {loading ? (
          <div className="py-12 text-center text-neutral-500 font-medium">
            Loading members...
          </div>
        ) : (
          <div className="space-y-3">
            {members.map((member) => {
              const isElder = member.role === 'elderly';
              return (
                <div
                  key={member.id}
                  className="glass-surface rounded-2xl p-4 sm:p-5 shadow-xs flex items-center justify-between gap-4 transition-all hover:shadow-glass hover:-translate-y-0.5"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-white shadow-xs ${
                        isElder
                          ? 'bg-indigo-600'
                          : member.role === 'caretaker'
                          ? 'bg-purple-600'
                          : 'bg-emerald-600'
                      }`}
                    >
                      {member.displayName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-bold text-neutral-900">
                          {member.displayName}
                        </h4>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isElder
                              ? 'bg-indigo-100 text-indigo-800'
                              : member.role === 'caretaker'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {member.role.replace('_', ' ')}
                        </span>
                      </div>
                      {member.email && (
                        <p className="text-xs text-neutral-500 mt-0.5">
                          {member.email} · Email alerts enabled
                        </p>
                      )}
                    </div>
                  </div>

                  {!isElder && (
                    <button
                      onClick={() => handleRevoke(member.id)}
                      className="p-2 text-neutral-400 hover:text-rose-600 rounded-full hover:bg-white/80 transition"
                      title="Revoke Access"
                    >
                      <Trash2 className="w-4 h-4" />
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
        <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass-surface-elevated rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative border border-white/90">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-bold text-neutral-950 tracking-tight">
                Invite Circle Member
              </h2>
              <button
                onClick={() => setShowInviteModal(false)}
                className="p-1 rounded-full text-neutral-400 hover:text-neutral-800 hover:bg-white/80 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-neutral-600 mb-6">
              Create a secure passcode invitation for a new family member or caretaker.
            </p>

            {createdPasscode ? (
              <div className="p-6 glass-card-pastel-mint rounded-2xl text-center space-y-3 border border-emerald-200">
                <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto shadow-sm">
                  <Check className="w-6 h-6 stroke-[3]" />
                </div>
                <h4 className="text-base font-bold text-emerald-950">
                  Invitation Created!
                </h4>
                <div className="p-3 bg-white/90 border border-emerald-200 rounded-2xl font-mono text-2xl font-black tracking-widest text-emerald-900 shadow-xs">
                  {createdPasscode}
                </div>
                <p className="text-xs text-emerald-800">
                  Share this passcode with the recipient to join the care circle.
                </p>
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="w-full py-2.5 bg-neutral-900 hover:bg-black text-white font-semibold text-xs rounded-full transition-transform hover:scale-105 active:scale-95 shadow-sm"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateInvite} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1.5 uppercase tracking-wide">
                    Assign Role *
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as Role)}
                    className="w-full px-4 py-2.5 rounded-full glass-input text-sm text-neutral-900 outline-none bg-white/90 font-medium"
                  >
                    <option value="family_member">Family Member</option>
                    <option value="caretaker">Caretaker</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1.5 uppercase tracking-wide">
                    Passcode (min 8 characters) *
                  </label>
                  <input
                    type="text"
                    required
                    minLength={8}
                    value={invitePasscode}
                    onChange={(e) => setInvitePasscode(e.target.value.toUpperCase())}
                    placeholder="e.g. GRACE8899"
                    className="w-full px-4 py-2.5 rounded-full glass-input text-sm uppercase font-mono tracking-wider text-neutral-900 outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200/60">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="px-5 py-2.5 rounded-full glass-pill font-semibold text-xs text-neutral-700 hover:bg-white transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-neutral-900 hover:bg-black text-white rounded-full font-semibold text-xs shadow-md transition-transform hover:scale-105 active:scale-95"
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
