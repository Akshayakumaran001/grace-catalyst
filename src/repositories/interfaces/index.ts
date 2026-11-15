import {
  CareProfile,
  Membership,
  Invitation,
  Medication,
  MedicationSchedule,
  CareEvent,
  HealthcareRoutine,
  Appointment,
  NotificationLog,
  ChangeProposal,
  AuditLogEntry,
  Role,
} from '../../domain/types';

export interface ICareProfileRepository {
  findById(id: string): Promise<CareProfile | null>;
  create(profile: CareProfile): Promise<CareProfile>;
  update(id: string, updates: Partial<CareProfile>): Promise<CareProfile>;
}

export interface IMembershipRepository {
  findById(id: string): Promise<Membership | null>;
  findByProfileAndRole(careProfileId: string, role: Role): Promise<Membership[]>;
  findByProfile(careProfileId: string): Promise<Membership[]>;
  create(membership: Membership): Promise<Membership>;
  update(id: string, updates: Partial<Membership>): Promise<Membership>;
}

export interface IInvitationRepository {
  findById(id: string): Promise<Invitation | null>;
  findByCareProfile(careProfileId: string): Promise<Invitation[]>;
  create(invitation: Invitation): Promise<Invitation>;
  update(id: string, updates: Partial<Invitation>): Promise<Invitation>;
}

export interface IMedicationRepository {
  findById(id: string): Promise<Medication | null>;
  findByProfile(careProfileId: string): Promise<Medication[]>;
  create(medication: Medication): Promise<Medication>;
  update(id: string, updates: Partial<Medication>): Promise<Medication>;
  delete(id: string): Promise<void>;
}

export interface IScheduleRepository {
  findById(id: string): Promise<MedicationSchedule | null>;
  findByMedication(medicationId: string): Promise<MedicationSchedule[]>;
  findByProfile(careProfileId: string): Promise<MedicationSchedule[]>;
  create(schedule: MedicationSchedule): Promise<MedicationSchedule>;
  update(id: string, updates: Partial<MedicationSchedule>): Promise<MedicationSchedule>;
  deactivate(id: string): Promise<void>;
}

export interface ICareEventRepository {
  findById(id: string): Promise<CareEvent | null>;
  findByProfileAndDate(careProfileId: string, localDueDate: string): Promise<CareEvent[]>;
  findByProfileRange(
    careProfileId: string,
    startDateUtc: Date,
    endDateUtc: Date
  ): Promise<CareEvent[]>;
  findPendingAndDue(cutoffTimeUtc: Date): Promise<CareEvent[]>;
  createMany(events: CareEvent[]): Promise<CareEvent[]>;
  update(id: string, updates: Partial<CareEvent>): Promise<CareEvent>;
  findByDeterministicKey(key: string): Promise<CareEvent | null>;
}

export interface IRoutineRepository {
  findById(id: string): Promise<HealthcareRoutine | null>;
  findByProfile(careProfileId: string): Promise<HealthcareRoutine[]>;
  create(routine: HealthcareRoutine): Promise<HealthcareRoutine>;
  update(id: string, updates: Partial<HealthcareRoutine>): Promise<HealthcareRoutine>;
  delete(id: string): Promise<void>;
}

export interface IAppointmentRepository {
  findById(id: string): Promise<Appointment | null>;
  findByProfile(careProfileId: string): Promise<Appointment[]>;
  findUpcoming(cutoffTimeUtc: Date): Promise<Appointment[]>;
  create(appointment: Appointment): Promise<Appointment>;
  update(id: string, updates: Partial<Appointment>): Promise<Appointment>;
  delete(id: string): Promise<void>;
}

export interface INotificationLogRepository {
  findById(id: string): Promise<NotificationLog | null>;
  findByIdempotencyKey(key: string): Promise<NotificationLog | null>;
  create(log: NotificationLog): Promise<NotificationLog>;
  update(id: string, updates: Partial<NotificationLog>): Promise<NotificationLog>;
}

export interface IProposalRepository {
  findById(id: string): Promise<ChangeProposal | null>;
  findByProfile(careProfileId: string): Promise<ChangeProposal[]>;
  create(proposal: ChangeProposal): Promise<ChangeProposal>;
  update(id: string, updates: Partial<ChangeProposal>): Promise<ChangeProposal>;
}

export interface IAuditRepository {
  create(entry: AuditLogEntry): Promise<AuditLogEntry>;
  findByProfile(careProfileId: string, limit?: number): Promise<AuditLogEntry[]>;
}
