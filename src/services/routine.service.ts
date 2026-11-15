import { randomUUID } from 'crypto';
import { HealthcareRoutine, CareEvent, Membership } from '../domain/types';
import {
  routineRepo,
  careEventRepo,
  careProfileRepo,
  auditRepo,
} from '../repositories/firestore';
import { can } from '../domain/permissions/policy';
import { generateOccurrences, getDefaultWindow } from '../domain/schedules/generate-occurrences';
import { ForbiddenError, NotFoundError } from '../lib/errors/app-errors';
import { getClock } from '../adapters/clock';

export class RoutineService {
  async listRoutines(careProfileId: string): Promise<HealthcareRoutine[]> {
    return routineRepo.findByProfile(careProfileId);
  }

  async createRoutine(
    actor: Membership,
    data: {
      title: string;
      description?: string;
      category?: string;
      frequency: 'daily' | 'specific_days';
      weekdays?: number[];
      localTimes: string[];
      effectiveFrom: string;
      effectiveUntil?: string;
    }
  ): Promise<HealthcareRoutine> {
    if (!can(actor.role, 'manage_routines')) {
      throw new ForbiddenError('You do not have permission to manage healthcare routines.');
    }

    const profile = await careProfileRepo.findById(actor.careProfileId);
    if (!profile) throw new NotFoundError('CareProfile');

    const now = getClock().now();
    const id = randomUUID();
    const routine: HealthcareRoutine = {
      id,
      careProfileId: profile.id,
      title: data.title,
      description: data.description,
      category: data.category || 'General',
      frequency: data.frequency,
      weekdays: data.weekdays,
      localTimes: data.localTimes,
      timezone: profile.timezone,
      effectiveFrom: data.effectiveFrom,
      effectiveUntil: data.effectiveUntil,
      active: true,
      version: 1,
      createdBy: actor.id,
      updatedBy: actor.id,
      createdAt: now,
      updatedAt: now,
    };
    await routineRepo.create(routine);

    // Generate rolling CareEvents for routine
    const window = getDefaultWindow(now);
    const drafts = generateOccurrences(
      {
        sourceId: id,
        sourceVersion: 1,
        titleSnapshot: routine.title,
        instructionsSnapshot: routine.description,
        careProfileId: profile.id,
        frequency: routine.frequency,
        weekdays: routine.weekdays,
        localTimes: routine.localTimes,
        timezone: profile.timezone,
        effectiveFrom: routine.effectiveFrom,
        effectiveUntil: routine.effectiveUntil,
        kind: 'routine',
      },
      window.start,
      window.end
    );

    const eventsToCreate: CareEvent[] = drafts.map((d) => ({
      ...d,
      id: randomUUID(),
      createdAt: now,
      updatedAt: now,
    }));
    await careEventRepo.createMany(eventsToCreate);

    await auditRepo.create({
      id: randomUUID(),
      careProfileId: profile.id,
      actorMembershipId: actor.id,
      action: 'ROUTINE_CREATED',
      resourceType: 'HealthcareRoutine',
      resourceId: id,
      after: { title: routine.title },
      createdAt: now,
    });

    return routine;
  }

  async completeRoutineToday(
    actor: Membership,
    routineId: string,
    localDueDate: string
  ): Promise<CareEvent> {
    const routine = await routineRepo.findById(routineId);
    if (!routine || routine.careProfileId !== actor.careProfileId) {
      throw new NotFoundError('HealthcareRoutine');
    }

    const events = await careEventRepo.findByProfileAndDate(
      actor.careProfileId,
      localDueDate
    );
    const routineEvent = events.find(
      (e) => e.sourceId === routineId && e.kind === 'routine'
    );

    const now = getClock().now();

    if (routineEvent) {
      const updated = await careEventRepo.update(routineEvent.id, {
        status: 'taken',
        completedAt: now,
        completedBy: actor.id,
        completionMethod: actor.role === 'elderly' ? 'self' : 'caregiver',
      });
      return updated;
    }

    // If event wasn't generated for today yet, create an ad-hoc completed event
    const newEvent: CareEvent = {
      id: randomUUID(),
      careProfileId: actor.careProfileId,
      kind: 'routine',
      sourceId: routineId,
      sourceVersion: routine.version,
      titleSnapshot: routine.title,
      instructionsSnapshot: routine.description,
      dueAtUtc: now,
      timezone: routine.timezone,
      localDueDate,
      localDueTime: '09:00',
      status: 'taken',
      completedAt: now,
      completedBy: actor.id,
      completionMethod: actor.role === 'elderly' ? 'self' : 'caregiver',
      createdAt: now,
      updatedAt: now,
    };
    await careEventRepo.createMany([newEvent]);
    return newEvent;
  }
}

export const routineService = new RoutineService();
