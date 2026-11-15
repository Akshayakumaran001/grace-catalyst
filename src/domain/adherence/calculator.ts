import { CareEvent } from '../types';

export interface AdherenceSummary {
  eligibleCount: number;
  takenCount: number;
  missedCount: number;
  skippedCount: number;
  pendingCount: number;
  adherenceRate: number | null; // 0.0 - 1.0, null if denominator is 0
}

/**
 * Calculate adherence for a set of care events in a date range.
 *
 * Rules (FR-025, FR-026):
 * - Excludes future events (dueAtUtc > rangeEnd or now)
 * - Excludes cancelled events
 * - Denominator = eligibleCount
 * - Numerator = takenCount
 * - adherenceRate = takenCount / eligibleCount (null if eligibleCount === 0)
 */
export function calculateAdherence(
  events: CareEvent[],
  rangeStart: Date,
  rangeEnd: Date,
  evaluationTime: Date = new Date()
): AdherenceSummary {
  const cutoff = rangeEnd < evaluationTime ? rangeEnd : evaluationTime;

  let takenCount = 0;
  let missedCount = 0;
  let skippedCount = 0;
  let pendingCount = 0;

  for (const event of events) {
    const dueTime = new Date(event.dueAtUtc);

    // Skip events outside the range
    if (dueTime < rangeStart || dueTime > cutoff) {
      continue;
    }

    // Cancelled events do not count
    if (event.status === 'cancelled') {
      continue;
    }

    switch (event.status) {
      case 'taken':
        takenCount++;
        break;
      case 'missed':
        missedCount++;
        break;
      case 'skipped':
        skippedCount++;
        break;
      case 'pending':
      case 'reminded':
        pendingCount++;
        break;
    }
  }

  const eligibleCount = takenCount + missedCount + skippedCount;
  const adherenceRate = eligibleCount > 0 ? takenCount / eligibleCount : null;

  return {
    eligibleCount,
    takenCount,
    missedCount,
    skippedCount,
    pendingCount,
    adherenceRate,
  };
}
