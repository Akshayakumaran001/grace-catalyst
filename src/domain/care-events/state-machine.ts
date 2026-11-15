import type { CareEventStatus } from '@/domain/types';

// ── Valid Transitions ──────────────────────────────────────────────────
//
// The care-event lifecycle follows this state machine:
//
//   pending  → reminded | taken | skipped | missed
//   reminded → taken | skipped | missed
//   missed   → taken  (late report — the original missed timestamp is preserved)
//
// All other transitions are INVALID.  Terminal states (taken, skipped,
// cancelled) have no outgoing edges except the missed→taken exception.

export const VALID_TRANSITIONS: Readonly<
  Record<CareEventStatus, readonly CareEventStatus[]>
> = {
  pending:   ['reminded', 'taken', 'skipped', 'missed'] as const,
  reminded:  ['taken', 'skipped', 'missed'] as const,
  missed:    ['taken'] as const,
  taken:     [] as const,
  skipped:   [] as const,
  cancelled: [] as const,
};

// ── Transition result ──────────────────────────────────────────────────

export interface TransitionResult {
  valid: boolean;
  error?: string;
}

/**
 * Pure function to determine whether a status transition is allowed.
 *
 * @param currentStatus  The event's current status.
 * @param targetStatus   The desired new status.
 * @returns `{ valid: true }` if allowed, or `{ valid: false, error }` if not.
 */
export function transitionEvent(
  currentStatus: CareEventStatus,
  targetStatus: CareEventStatus,
): TransitionResult {
  if (currentStatus === targetStatus) {
    return {
      valid: false,
      error: `Event is already in '${currentStatus}' status`,
    };
  }

  const allowed = VALID_TRANSITIONS[currentStatus];

  if (!allowed || allowed.length === 0) {
    return {
      valid: false,
      error: `Cannot transition from terminal status '${currentStatus}'`,
    };
  }

  if (!allowed.includes(targetStatus)) {
    return {
      valid: false,
      error: `Invalid transition: '${currentStatus}' → '${targetStatus}'. Allowed targets: ${allowed.join(', ')}`,
    };
  }

  return { valid: true };
}

/**
 * Returns the list of statuses an event can move to from the given status.
 */
export function getAvailableTransitions(
  status: CareEventStatus,
): readonly CareEventStatus[] {
  return VALID_TRANSITIONS[status] ?? [];
}
