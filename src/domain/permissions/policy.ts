import type { Role, CollaborationMode } from '@/domain/types';

// ── Actions ────────────────────────────────────────────────────────────

export type Action =
  | 'view_care_profile'
  | 'edit_care_profile'
  | 'view_medications'
  | 'manage_medications'
  | 'record_dose'
  | 'record_dose_on_behalf'
  | 'view_adherence'
  | 'manage_appointments'
  | 'manage_routines'
  | 'invite_members'
  | 'revoke_members'
  | 'change_consent_preferences'
  | 'propose_change'
  | 'approve_reject_proposal'
  | 'view_audit'
  | 'view_activity'
  | 'use_demo_controls';

// ── Context for contextual permission checks ──────────────────────────

export interface PermissionContext {
  collaborationMode?: CollaborationMode;
  isOwnDose?: boolean;
}

// ── Static permission matrix (no context needed) ──────────────────────
// Maps each role to the set of actions it can ALWAYS perform,
// regardless of collaboration mode.

const STATIC_PERMISSIONS: Record<Role, ReadonlySet<Action>> = {
  elderly: new Set<Action>([
    'view_care_profile',
    'edit_care_profile',
    'view_medications',
    'manage_medications',
    'record_dose',
    'view_adherence',
    'manage_appointments',
    'manage_routines',
    'invite_members',
    'revoke_members',
    'change_consent_preferences',
    'approve_reject_proposal',
    'view_audit',
    'view_activity',
    'use_demo_controls',
  ]),

  caretaker: new Set<Action>([
    'view_care_profile',
    'view_medications',
    'record_dose',
    'record_dose_on_behalf',
    'view_adherence',
    'view_activity',
    'use_demo_controls',
  ]),

  family_member: new Set<Action>([
    'view_care_profile',
    'view_medications',
    'view_adherence',
    'view_activity',
  ]),
};

// ── Actions that caretakers gain in `direct_edit` mode ────────────────

const CARETAKER_DIRECT_EDIT_EXTRAS: ReadonlySet<Action> = new Set<Action>([
  'edit_care_profile',
  'manage_medications',
  'manage_appointments',
  'manage_routines',
  'invite_members',
]);

// ── Actions that caretakers can propose in `elder_approval_required` ──

const CARETAKER_PROPOSAL_ACTIONS: ReadonlySet<Action> = new Set<Action>([
  'propose_change',
]);

/**
 * Pure permission check.
 *
 * Returns `true` if the given `role` may perform `action` under the
 * optional `context`.  This function has NO side effects — it only
 * reads the static matrix and the context.
 */
export function can(
  role: Role,
  action: Action,
  context?: PermissionContext,
): boolean {
  // 1. Check static matrix first
  if (STATIC_PERMISSIONS[role].has(action)) {
    // For record_dose by caretaker — if context tells us it's the elder's dose,
    // that's record_dose_on_behalf.  But the caretaker has both in the static
    // matrix, so static check suffices unless the action is context-gated.
    return true;
  }

  // 2. Context-dependent checks
  if (role === 'caretaker' && context?.collaborationMode) {
    if (context.collaborationMode === 'direct_edit') {
      if (CARETAKER_DIRECT_EDIT_EXTRAS.has(action)) {
        return true;
      }
    }

    if (context.collaborationMode === 'elder_approval_required') {
      if (CARETAKER_PROPOSAL_ACTIONS.has(action)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Return all actions a role can perform under a given context.
 */
export function allowedActions(
  role: Role,
  context?: PermissionContext,
): Action[] {
  const ALL_ACTIONS: Action[] = [
    'view_care_profile',
    'edit_care_profile',
    'view_medications',
    'manage_medications',
    'record_dose',
    'record_dose_on_behalf',
    'view_adherence',
    'manage_appointments',
    'manage_routines',
    'invite_members',
    'revoke_members',
    'change_consent_preferences',
    'propose_change',
    'approve_reject_proposal',
    'view_audit',
    'view_activity',
    'use_demo_controls',
  ];

  return ALL_ACTIONS.filter((action) => can(role, action, context));
}

export function requiresApproval(
  role: Role,
  action: Action,
  collaborationMode: CollaborationMode
): boolean {
  if (collaborationMode !== 'elder_approval_required') return false;
  if (role === 'elderly') return false;

  const editActions: Action[] = [
    'manage_medications',
    'manage_appointments',
    'manage_routines',
    'edit_care_profile',
  ];

  return editActions.includes(action);
}

