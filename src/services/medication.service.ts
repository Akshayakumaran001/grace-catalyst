import { randomUUID } from 'crypto';
import {
  Medication,
  MedicationSchedule,
  CareEvent,
  Membership,
} from '../domain/types';
import {
  medicationRepo,
  scheduleRepo,
  careEventRepo,
  careProfileRepo,
  auditRepo,
  proposalRepo,
} from '../repositories/firestore';
import { can, requiresApproval } from '../domain/permissions/policy';
import { generateOccurrences, getDefaultWindow } from '../domain/schedules/generate-occurrences';
import { ForbiddenError, NotFoundError } from '../lib/errors/app-errors';

export class MedicationService {
  async listMedications(careProfileId: string): Promise<Medication[]> {
    return medicationRepo.findByProfile(careProfileId);
  }

  async getMedication(id: string): Promise<Medication | null> {
    return medicationRepo.findById(id);
  }

  async createMedication(
    actor: Membership,
    data: {
      name: string;
      brandOrGeneric?: string;
      doseText: string;
      form?: string;
      instructions?: string;
      startDate: string;
      endDate?: string;
      schedule: {
        frequency: 'daily' | 'specific_days';
        weekdays?: number[];
        localTimes: string[];
        mealContext?: string;
      };
    }
  ): Promise<{ medication: Medication; schedule?: MedicationSchedule; proposed?: boolean }> {
    if (!can(actor.role, 'manage_medications')) {
      throw new ForbiddenError('You do not have permission to add medications.');
    }

    const profile = await careProfileRepo.findById(actor.careProfileId);
    if (!profile) throw new NotFoundError('CareProfile');

    // Check if proposal required
    if (requiresApproval(actor.role, 'manage_medications', profile.collaborationMode)) {
      const proposal = await proposalRepo.create({
        id: randomUUID(),
        careProfileId: profile.id,
        resourceType: 'Medication',
        resourceId: 'new',
        proposedPatch: data,
        reason: `Added by ${actor.displayName} (${actor.role})`,
        createdBy: actor.id,
        status: 'pending',
        expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await auditRepo.create({
        id: randomUUID(),
        careProfileId: profile.id,
        actorMembershipId: actor.id,
        action: 'CHANGE_PROPOSAL_CREATED',
        resourceType: 'ChangeProposal',
        resourceId: proposal.id,
        after: { resourceType: 'Medication', name: data.name },
        createdAt: new Date(),
      });

      // Return synthetic preview
      const previewMed: Medication = {
        id: `prop-${proposal.id}`,
        careProfileId: profile.id,
        name: data.name,
        brandOrGeneric: data.brandOrGeneric,
        doseText: data.doseText,
        form: data.form,
        instructions: data.instructions,
        startDate: data.startDate,
        endDate: data.endDate,
        status: 'active',
        createdBy: actor.id,
        updatedBy: actor.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      return { medication: previewMed, proposed: true };
    }

    // Direct creation
    const now = new Date();
    const medId = randomUUID();
    const medication: Medication = {
      id: medId,
      careProfileId: profile.id,
      name: data.name,
      brandOrGeneric: data.brandOrGeneric,
      doseText: data.doseText,
      form: data.form,
      instructions: data.instructions,
      startDate: data.startDate,
      endDate: data.endDate,
      status: 'active',
      createdBy: actor.id,
      updatedBy: actor.id,
      createdAt: now,
      updatedAt: now,
    };
    await medicationRepo.create(medication);

    // Create schedule
    const schedId = randomUUID();
    const schedule: MedicationSchedule = {
      id: schedId,
      careProfileId: profile.id,
      medicationId: medId,
      frequency: data.schedule.frequency,
      weekdays: data.schedule.weekdays,
      localTimes: data.schedule.localTimes,
      mealContext: data.schedule.mealContext,
      timezone: profile.timezone,
      effectiveFrom: data.startDate,
      effectiveUntil: data.endDate,
      version: 1,
      active: true,
      createdAt: now,
      updatedAt: now,
    };
    await scheduleRepo.create(schedule);

    // Generate rolling 14-day CareEvents
    const window = getDefaultWindow(now);
    const drafts = generateOccurrences(
      {
        sourceId: schedId,
        sourceVersion: 1,
        titleSnapshot: `${medication.name} (${medication.doseText})`,
        instructionsSnapshot: schedule.mealContext || medication.instructions,
        careProfileId: profile.id,
        frequency: schedule.frequency,
        weekdays: schedule.weekdays,
        localTimes: schedule.localTimes,
        timezone: profile.timezone,
        effectiveFrom: schedule.effectiveFrom,
        effectiveUntil: schedule.effectiveUntil,
        kind: 'medication',
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
      action: 'MEDICATION_CREATED',
      resourceType: 'Medication',
      resourceId: medId,
      after: { name: medication.name, doseText: medication.doseText },
      createdAt: now,
    });

    return { medication, schedule, proposed: false };
  }

  async archiveMedication(actor: Membership, id: string): Promise<void> {
    if (!can(actor.role, 'manage_medications')) {
      throw new ForbiddenError('You do not have permission to archive medications.');
    }

    const med = await medicationRepo.findById(id);
    if (!med || med.careProfileId !== actor.careProfileId) {
      throw new NotFoundError('Medication');
    }

    await medicationRepo.delete(id);

    await auditRepo.create({
      id: randomUUID(),
      careProfileId: actor.careProfileId,
      actorMembershipId: actor.id,
      action: 'MEDICATION_ARCHIVED',
      resourceType: 'Medication',
      resourceId: id,
      createdAt: new Date(),
    });
  }
}

export const medicationService = new MedicationService();
