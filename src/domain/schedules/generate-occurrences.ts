import { createHash } from 'crypto';
import { CareEventKind, CareEventStatus, CareEvent } from '../types';

export interface OccurrenceSource {
  sourceId: string;
  sourceVersion: number;
  titleSnapshot: string;
  instructionsSnapshot?: string;
  careProfileId: string;
  frequency: 'daily' | 'specific_days';
  weekdays?: number[];
  localTimes: string[];
  timezone: string;
  effectiveFrom: string;   // YYYY-MM-DD
  effectiveUntil?: string;  // YYYY-MM-DD
  kind: CareEventKind;
}

export type CareEventDraft = Omit<CareEvent, 'id' | 'createdAt' | 'updatedAt'> & {
  deterministicKey: string;
};

function generateDeterministicKey(
  sourceId: string,
  sourceVersion: number,
  localDate: string,
  localTime: string
): string {
  const raw = `${sourceId}:${sourceVersion}:${localDate}:${localTime}`;
  return createHash('sha256').update(raw).digest('hex').slice(0, 16);
}

function parseTime(time: string): { hours: number; minutes: number } {
  const [h, m] = time.split(':').map(Number);
  return { hours: h, minutes: m };
}

function parseDate(dateStr: string): { year: number; month: number; day: number } {
  const [y, m, d] = dateStr.split('-').map(Number);
  return { year: y, month: m - 1, day: d };
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function localToUtc(
  localDate: string,
  localTime: string,
  timezone: string
): Date {
  const { year, month, day } = parseDate(localDate);
  const { hours, minutes } = parseTime(localTime);

  const utcGuess = new Date(Date.UTC(year, month, day, hours, minutes, 0, 0));

  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

    const parts = formatter.formatToParts(utcGuess);
    const getPart = (type: string) => parts.find((p) => p.type === type)?.value ?? '0';

    const tzHour = parseInt(getPart('hour'), 10);
    const tzMinute = parseInt(getPart('minute'), 10);
    const tzDay = parseInt(getPart('day'), 10);
    const tzMonth = parseInt(getPart('month'), 10);

    const guessMinutes = utcGuess.getUTCHours() * 60 + utcGuess.getUTCMinutes();
    let tzMinutes = tzHour * 60 + tzMinute;

    const utcDay = utcGuess.getUTCDate();
    const utcMonth = utcGuess.getUTCMonth() + 1;

    if (tzDay !== utcDay || tzMonth !== utcMonth) {
      if (tzDay > utcDay || tzMonth > utcMonth) {
        tzMinutes += 24 * 60;
      } else {
        tzMinutes -= 24 * 60;
      }
    }

    const offsetMinutes = tzMinutes - guessMinutes;
    const actualUtc = new Date(Date.UTC(year, month, day, hours, minutes, 0, 0));
    actualUtc.setUTCMinutes(actualUtc.getUTCMinutes() - offsetMinutes);
    return actualUtc;
  } catch {
    // Fallback if timezone string is invalid
    return utcGuess;
  }
}

export function generateOccurrences(
  source: OccurrenceSource,
  windowStart: Date,
  windowEnd: Date
): CareEventDraft[] {
  const drafts: CareEventDraft[] = [];

  const effectiveStart = parseDate(source.effectiveFrom);
  const effectiveStartDate = new Date(
    effectiveStart.year,
    effectiveStart.month,
    effectiveStart.day
  );

  const effectiveEndDate = source.effectiveUntil
    ? (() => {
        const d = parseDate(source.effectiveUntil);
        return new Date(d.year, d.month, d.day, 23, 59, 59);
      })()
    : null;

  const current = new Date(windowStart);
  current.setUTCHours(0, 0, 0, 0);

  const endDate = new Date(windowEnd);

  while (current <= endDate) {
    const currentDateStr = formatDate(current);
    const currentDate = new Date(current);

    if (currentDate < effectiveStartDate) {
      current.setUTCDate(current.getUTCDate() + 1);
      continue;
    }

    if (effectiveEndDate && currentDate > effectiveEndDate) {
      break;
    }

    const dayOfWeek = current.getDay();
    if (source.frequency === 'specific_days' && source.weekdays) {
      if (!source.weekdays.includes(dayOfWeek)) {
        current.setUTCDate(current.getUTCDate() + 1);
        continue;
      }
    }

    for (const localTime of source.localTimes) {
      const dueAtUtc = localToUtc(currentDateStr, localTime, source.timezone);

      if (dueAtUtc < windowStart || dueAtUtc > windowEnd) {
        continue;
      }

      const deterministicKey = generateDeterministicKey(
        source.sourceId,
        source.sourceVersion,
        currentDateStr,
        localTime
      );

      const draft: CareEventDraft = {
        careProfileId: source.careProfileId,
        kind: source.kind,
        sourceId: source.sourceId,
        sourceVersion: source.sourceVersion,
        titleSnapshot: source.titleSnapshot,
        instructionsSnapshot: source.instructionsSnapshot,
        dueAtUtc,
        timezone: source.timezone,
        localDueDate: currentDateStr,
        localDueTime: localTime,
        status: 'pending' as CareEventStatus,
        deterministicKey,
      };

      drafts.push(draft);
    }

    current.setUTCDate(current.getUTCDate() + 1);
  }

  return drafts;
}

export function getDefaultWindow(now: Date): { start: Date; end: Date } {
  const start = new Date(now);
  const end = new Date(now);
  end.setUTCDate(end.getUTCDate() + 14);
  return { start, end };
}
