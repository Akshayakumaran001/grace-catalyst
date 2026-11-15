import { randomUUID } from 'crypto';
import { CareEvent, CareEventStatus, Membership } from '../domain/types';
import {
  careEventRepo,
  auditRepo,
} from '../repositories/firestore';
import { transitionEvent } from '../domain/care-events/state-machine';
import { can } from '../domain/permissions/policy';
import { calculateAdherence, AdherenceSummary } from '../domain/adherence/calculator';
import { ConflictError, ForbiddenError, NotFoundError } from '../lib/errors/app-errors';
import { getClock } from '../adapters/clock';

export class CareEventService {
  async getTodayEvents(
    careProfileId: string,
    localDueDate: string
  ): Promise<CareEvent[]> {
    return careEventRepo.findByProfileAndDate(careProfileId, localDueDate);
  }

  async getNextDueEvent(
    careProfileId: string,
    localDueDate: string
  ): Promise<CareEvent | null> {
    const events = await this.getTodayEvents(careProfileId, localDueDate);
    const pendingEvents = events.filter(
      (e) => e.status === 'pending' || e.status === 'reminded'
    );
    return pendingEvents[0] || null;
  }

  async transitionEventStatus(
    actor: Membership,
    eventId: string,
    targetStatus: CareEventStatus,
    note?: string
  ): Promise<CareEvent> {
    const isOwnDose = actor.role === 'elderly';
    const action = isOwnDose ? 'record_dose' : 'record_dose_on_behalf';

    if (!can(actor.role, action, { isOwnDose })) {
      throw new ForbiddenError('You do not have permission to record doses.');
    }

    const event = await careEventRepo.findById(eventId);
    if (!event || event.careProfileId !== actor.careProfileId) {
      throw new NotFoundError('CareEvent');
    }

    const transitionResult = transitionEvent(event.status, targetStatus);
    if (!transitionResult.valid) {
      throw new ConflictError(
        transitionResult.error || `Cannot transition to ${targetStatus}`
      );
    }

    const now = getClock().now();
    const isCompleted = targetStatus === 'taken' || targetStatus === 'skipped';

    const updated = await careEventRepo.update(eventId, {
      status: targetStatus,
      completedAt: isCompleted ? now : event.completedAt,
      completedBy: isCompleted ? actor.id : event.completedBy,
      completionMethod: isCompleted
        ? actor.role === 'elderly'
          ? 'self'
          : 'caregiver'
        : undefined,
      note: note || event.note,
    });

    await auditRepo.create({
      id: randomUUID(),
      careProfileId: actor.careProfileId,
      actorMembershipId: actor.id,
      action: `CARE_EVENT_${targetStatus.toUpperCase()}`,
      resourceType: 'CareEvent',
      resourceId: eventId,
      before: { status: event.status },
      after: {
        status: targetStatus,
        actorRole: actor.role,
        actorName: actor.displayName,
      },
      createdAt: now,
    });

    return updated;
  }

  async getAdherenceSummary(
    careProfileId: string,
    rangeDays: number = 7
  ): Promise<AdherenceSummary> {
    const now = getClock().now();
    const startDate = new Date(now.getTime() - rangeDays * 24 * 3600 * 1000);
    const events = await careEventRepo.findByProfileRange(
      careProfileId,
      startDate,
      now
    );
    return calculateAdherence(events, startDate, now, now);
  }
}

export const careEventService = new CareEventService();
