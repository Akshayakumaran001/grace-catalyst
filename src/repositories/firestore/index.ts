import { randomUUID } from 'crypto';
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
import {
  ICareProfileRepository,
  IMembershipRepository,
  IInvitationRepository,
  IMedicationRepository,
  IScheduleRepository,
  ICareEventRepository,
  IRoutineRepository,
  IAppointmentRepository,
  INotificationLogRepository,
  IProposalRepository,
  IAuditRepository,
} from '../interfaces';

// In-Memory store for fast, deterministic, zero-friction execution
// Compatible with serverless runtimes via global singleton
interface MemoryDatabase {
  profiles: Map<string, CareProfile>;
  memberships: Map<string, Membership>;
  invitations: Map<string, Invitation>;
  medications: Map<string, Medication>;
  schedules: Map<string, MedicationSchedule>;
  careEvents: Map<string, CareEvent>;
  routines: Map<string, HealthcareRoutine>;
  appointments: Map<string, Appointment>;
  notificationLogs: Map<string, NotificationLog>;
  proposals: Map<string, ChangeProposal>;
  auditLogs: AuditLogEntry[];
}

declare global {
  // eslint-disable-next-line no-var
  var __grace_db: MemoryDatabase | undefined;
}

function getDatabase(): MemoryDatabase {
  if (!global.__grace_db) {
    global.__grace_db = {
      profiles: new Map(),
      memberships: new Map(),
      invitations: new Map(),
      medications: new Map(),
      schedules: new Map(),
      careEvents: new Map(),
      routines: new Map(),
      appointments: new Map(),
      notificationLogs: new Map(),
      proposals: new Map(),
      auditLogs: [],
    };
    seedDemoData(global.__grace_db);
  }
  return global.__grace_db;
}

// ── Demo Seeder ────────────────────────────────────────────────────────
export function seedDemoData(db: MemoryDatabase): void {
  const now = new Date();
  const demoProfileId = 'demo-profile-meena';

  // 1. Care Profile
  const profile: CareProfile = {
    id: demoProfileId,
    displayName: "Meena's Care Circle",
    locale: 'en-IN',
    timezone: 'Asia/Kolkata',
    collaborationMode: 'direct_edit',
    notificationPolicy: {
      upcomingDose: { elder: true, caretaker: false, familyMember: false },
      missedDoseFirstStage: { elder: true, caretaker: false, familyMember: false },
      escalatedMissedDose: { elder: true, caretaker: true, familyMember: true },
      upcomingAppointment: { elder: true, caretaker: true, familyMember: true },
      appointmentChanged: { elder: true, caretaker: true, familyMember: true },
    },
    isDemo: true,
    createdAt: now,
    updatedAt: now,
  };
  db.profiles.set(profile.id, profile);

  // 2. Memberships
  const meena: Membership = {
    id: 'member-elder-meena',
    careProfileId: demoProfileId,
    displayName: 'Meena (Elder)',
    role: 'elderly',
    email: 'meena@example.com',
    status: 'active',
    notificationPreferences: { emailEnabled: true },
    createdAt: now,
    lastActiveAt: now,
  };
  const arun: Membership = {
    id: 'member-family-arun',
    careProfileId: demoProfileId,
    displayName: 'Arun (Son)',
    role: 'family_member',
    email: 'arun@example.com',
    status: 'active',
    notificationPreferences: { emailEnabled: true },
    createdAt: now,
    lastActiveAt: now,
  };
  const lakshmi: Membership = {
    id: 'member-caretaker-lakshmi',
    careProfileId: demoProfileId,
    displayName: 'Lakshmi (Caretaker)',
    role: 'caretaker',
    email: 'lakshmi@example.com',
    status: 'active',
    notificationPreferences: { emailEnabled: true },
    createdAt: now,
    lastActiveAt: now,
  };

  db.memberships.set(meena.id, meena);
  db.memberships.set(arun.id, arun);
  db.memberships.set(lakshmi.id, lakshmi);

  // 3. Demo Passcode Invitation (Passcode: "MEENA2026")
  // Salt: "demo_salt", Hash of "demo_salt:MEENA2026"
  const invitation: Invitation = {
    id: 'invite-demo-elder',
    careProfileId: demoProfileId,
    role: 'elderly',
    passcodeHash: '2fec107f7f3cf207635960f678eccfaea51b03c4c733869ec049afd3c6758951', // sha256(demo_salt:MEENA2026)
    salt: 'demo_salt',
    expiresAt: new Date(now.getTime() + 365 * 24 * 3600 * 1000),
    maxUses: 100,
    uses: 1,
    failedAttempts: 0,
    createdBy: meena.id,
    createdAt: now,
  };
  db.invitations.set(invitation.id, invitation);

  // Caretaker invite: "CARE2026"
  const inviteCaretaker: Invitation = {
    id: 'invite-demo-caretaker',
    careProfileId: demoProfileId,
    role: 'caretaker',
    passcodeHash: '3dd4c81d0e3fb0130b0135d1922d5274a4a464a1f3b297bbc0fd08b23abc683b', // sha256(demo_salt:CARE2026)
    salt: 'demo_salt',
    expiresAt: new Date(now.getTime() + 365 * 24 * 3600 * 1000),
    maxUses: 100,
    uses: 1,
    failedAttempts: 0,
    createdBy: meena.id,
    createdAt: now,
  };
  db.invitations.set(inviteCaretaker.id, inviteCaretaker);

  // Family invite: "FAMILY2026"
  const inviteFamily: Invitation = {
    id: 'invite-demo-family',
    careProfileId: demoProfileId,
    role: 'family_member',
    passcodeHash: '576d175ba488794e412391f7bc87f32d26192fb7febfcd85afbc5d7db23c863f', // sha256(demo_salt:FAMILY2026)
    salt: 'demo_salt',
    expiresAt: new Date(now.getTime() + 365 * 24 * 3600 * 1000),
    maxUses: 100,
    uses: 1,
    failedAttempts: 0,
    createdBy: meena.id,
    createdAt: now,
  };
  db.invitations.set(inviteFamily.id, inviteFamily);

  // 4. Medications
  const metformin: Medication = {
    id: 'med-metformin',
    careProfileId: demoProfileId,
    name: 'Metformin',
    brandOrGeneric: 'Glycomet 500',
    doseText: '1 tablet (500mg)',
    form: 'Tablet',
    instructions: 'Take with or immediately after food',
    startDate: '2026-01-01',
    status: 'active',
    createdBy: meena.id,
    updatedBy: meena.id,
    createdAt: now,
    updatedAt: now,
  };
  const amlodipine: Medication = {
    id: 'med-amlodipine',
    careProfileId: demoProfileId,
    name: 'Amlodipine',
    brandOrGeneric: 'Norvasc 5mg',
    doseText: '1 tablet (5mg)',
    form: 'Tablet',
    instructions: 'Take once daily in the evening',
    startDate: '2026-01-01',
    status: 'active',
    createdBy: meena.id,
    updatedBy: meena.id,
    createdAt: now,
    updatedAt: now,
  };
  db.medications.set(metformin.id, metformin);
  db.medications.set(amlodipine.id, amlodipine);

  // 5. Schedules
  const schedMetformin: MedicationSchedule = {
    id: 'sched-metformin',
    careProfileId: demoProfileId,
    medicationId: metformin.id,
    frequency: 'daily',
    localTimes: ['08:30'],
    mealContext: 'After breakfast',
    timezone: 'Asia/Kolkata',
    effectiveFrom: '2026-01-01',
    version: 1,
    active: true,
    createdAt: now,
    updatedAt: now,
  };
  const schedAmlodipine: MedicationSchedule = {
    id: 'sched-amlodipine',
    careProfileId: demoProfileId,
    medicationId: amlodipine.id,
    frequency: 'daily',
    localTimes: ['20:00'],
    mealContext: 'After dinner',
    timezone: 'Asia/Kolkata',
    effectiveFrom: '2026-01-01',
    version: 1,
    active: true,
    createdAt: now,
    updatedAt: now,
  };
  db.schedules.set(schedMetformin.id, schedMetformin);
  db.schedules.set(schedAmlodipine.id, schedAmlodipine);

  // 6. Routines
  const bpRoutine: HealthcareRoutine = {
    id: 'routine-bp',
    careProfileId: demoProfileId,
    title: 'Blood Pressure Check',
    description: 'Use the digital upper-arm cuff and note reading',
    category: 'Vitals',
    frequency: 'daily',
    localTimes: ['09:00'],
    timezone: 'Asia/Kolkata',
    effectiveFrom: '2026-01-01',
    active: true,
    version: 1,
    createdBy: meena.id,
    updatedBy: meena.id,
    createdAt: now,
    updatedAt: now,
  };
  db.routines.set(bpRoutine.id, bpRoutine);

  // 7. Appointments
  const nextWeek = new Date(now.getTime() + 3 * 24 * 3600 * 1000);
  nextWeek.setHours(10, 30, 0, 0);

  const appointment: Appointment = {
    id: 'appt-cardio',
    careProfileId: demoProfileId,
    title: 'Cardiology Review',
    provider: 'Dr. Ramesh Rao (Cardiologist)',
    startsAtUtc: nextWeek,
    timezone: 'Asia/Kolkata',
    location: 'Apollo Heart Centre, Greams Road',
    notes: 'Bring recent ECG report and BP log',
    reminderOffsets: [1440, 120], // 1 day before, 2 hours before
    status: 'scheduled',
    createdBy: arun.id,
    updatedBy: arun.id,
    createdAt: now,
    updatedAt: now,
  };
  db.appointments.set(appointment.id, appointment);

  // 8. CareEvents for Today
  const todayStr = now.toISOString().slice(0, 10);
  const event1: CareEvent = {
    id: 'event-metformin-today',
    careProfileId: demoProfileId,
    kind: 'medication',
    sourceId: schedMetformin.id,
    sourceVersion: 1,
    titleSnapshot: 'Metformin 500mg',
    instructionsSnapshot: 'After breakfast',
    dueAtUtc: new Date(now.getTime() - 2 * 3600 * 1000), // 2 hours ago
    timezone: 'Asia/Kolkata',
    localDueDate: todayStr,
    localDueTime: '08:30',
    status: 'taken',
    completedAt: new Date(now.getTime() - 100 * 60 * 1000),
    completedBy: meena.id,
    completionMethod: 'self',
    createdAt: now,
    updatedAt: now,
  };

  const event2: CareEvent = {
    id: 'event-bp-today',
    careProfileId: demoProfileId,
    kind: 'routine',
    sourceId: bpRoutine.id,
    sourceVersion: 1,
    titleSnapshot: 'Blood Pressure Check',
    instructionsSnapshot: 'Log reading in diary',
    dueAtUtc: new Date(now.getTime() - 30 * 60 * 1000), // 30 min ago
    timezone: 'Asia/Kolkata',
    localDueDate: todayStr,
    localDueTime: '09:00',
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  };

  const event3: CareEvent = {
    id: 'event-amlodipine-today',
    careProfileId: demoProfileId,
    kind: 'medication',
    sourceId: schedAmlodipine.id,
    sourceVersion: 1,
    titleSnapshot: 'Amlodipine 5mg',
    instructionsSnapshot: 'After dinner',
    dueAtUtc: new Date(now.getTime() + 6 * 3600 * 1000), // 6 hours from now
    timezone: 'Asia/Kolkata',
    localDueDate: todayStr,
    localDueTime: '20:00',
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  };

  db.careEvents.set(event1.id, event1);
  db.careEvents.set(event2.id, event2);
  db.careEvents.set(event3.id, event3);

  // 9. Initial Audit Log
  db.auditLogs.push({
    id: randomUUID(),
    careProfileId: demoProfileId,
    actorMembershipId: meena.id,
    action: 'CARE_PROFILE_INITIALIZED',
    resourceType: 'CareProfile',
    resourceId: demoProfileId,
    after: { displayName: profile.displayName },
    createdAt: now,
  });
}

// ── Repository Implementations ─────────────────────────────────────────

export class CareProfileRepository implements ICareProfileRepository {
  async findById(id: string): Promise<CareProfile | null> {
    const db = getDatabase();
    return db.profiles.get(id) || null;
  }

  async create(profile: CareProfile): Promise<CareProfile> {
    const db = getDatabase();
    db.profiles.set(profile.id, profile);
    return profile;
  }

  async update(id: string, updates: Partial<CareProfile>): Promise<CareProfile> {
    const db = getDatabase();
    const existing = db.profiles.get(id);
    if (!existing) throw new Error(`CareProfile ${id} not found`);
    const updated = { ...existing, ...updates, updatedAt: new Date() };
    db.profiles.set(id, updated);
    return updated;
  }
}

export class MembershipRepository implements IMembershipRepository {
  async findById(id: string): Promise<Membership | null> {
    const db = getDatabase();
    return db.memberships.get(id) || null;
  }

  async findByProfileAndRole(careProfileId: string, role: Role): Promise<Membership[]> {
    const db = getDatabase();
    return Array.from(db.memberships.values()).filter(
      (m) => m.careProfileId === careProfileId && m.role === role && m.status === 'active'
    );
  }

  async findByProfile(careProfileId: string): Promise<Membership[]> {
    const db = getDatabase();
    return Array.from(db.memberships.values()).filter(
      (m) => m.careProfileId === careProfileId && m.status === 'active'
    );
  }

  async create(membership: Membership): Promise<Membership> {
    const db = getDatabase();
    db.memberships.set(membership.id, membership);
    return membership;
  }

  async update(id: string, updates: Partial<Membership>): Promise<Membership> {
    const db = getDatabase();
    const existing = db.memberships.get(id);
    if (!existing) throw new Error(`Membership ${id} not found`);
    const updated = { ...existing, ...updates };
    db.memberships.set(id, updated);
    return updated;
  }
}

export class InvitationRepository implements IInvitationRepository {
  async findById(id: string): Promise<Invitation | null> {
    const db = getDatabase();
    return db.invitations.get(id) || null;
  }

  async findByCareProfile(careProfileId: string): Promise<Invitation[]> {
    const db = getDatabase();
    return Array.from(db.invitations.values()).filter(
      (i) => i.careProfileId === careProfileId && !i.revokedAt
    );
  }

  async create(invitation: Invitation): Promise<Invitation> {
    const db = getDatabase();
    db.invitations.set(invitation.id, invitation);
    return invitation;
  }

  async update(id: string, updates: Partial<Invitation>): Promise<Invitation> {
    const db = getDatabase();
    const existing = db.invitations.get(id);
    if (!existing) throw new Error(`Invitation ${id} not found`);
    const updated = { ...existing, ...updates };
    db.invitations.set(id, updated);
    return updated;
  }
}

export class MedicationRepository implements IMedicationRepository {
  async findById(id: string): Promise<Medication | null> {
    const db = getDatabase();
    return db.medications.get(id) || null;
  }

  async findByProfile(careProfileId: string): Promise<Medication[]> {
    const db = getDatabase();
    return Array.from(db.medications.values()).filter(
      (m) => m.careProfileId === careProfileId && m.status !== 'archived'
    );
  }

  async create(medication: Medication): Promise<Medication> {
    const db = getDatabase();
    db.medications.set(medication.id, medication);
    return medication;
  }

  async update(id: string, updates: Partial<Medication>): Promise<Medication> {
    const db = getDatabase();
    const existing = db.medications.get(id);
    if (!existing) throw new Error(`Medication ${id} not found`);
    const updated = { ...existing, ...updates, updatedAt: new Date() };
    db.medications.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    const db = getDatabase();
    const existing = db.medications.get(id);
    if (existing) {
      db.medications.set(id, { ...existing, status: 'archived', updatedAt: new Date() });
    }
  }
}

export class ScheduleRepository implements IScheduleRepository {
  async findById(id: string): Promise<MedicationSchedule | null> {
    const db = getDatabase();
    return db.schedules.get(id) || null;
  }

  async findByMedication(medicationId: string): Promise<MedicationSchedule[]> {
    const db = getDatabase();
    return Array.from(db.schedules.values()).filter(
      (s) => s.medicationId === medicationId && s.active
    );
  }

  async findByProfile(careProfileId: string): Promise<MedicationSchedule[]> {
    const db = getDatabase();
    return Array.from(db.schedules.values()).filter(
      (s) => s.careProfileId === careProfileId && s.active
    );
  }

  async create(schedule: MedicationSchedule): Promise<MedicationSchedule> {
    const db = getDatabase();
    db.schedules.set(schedule.id, schedule);
    return schedule;
  }

  async update(id: string, updates: Partial<MedicationSchedule>): Promise<MedicationSchedule> {
    const db = getDatabase();
    const existing = db.schedules.get(id);
    if (!existing) throw new Error(`Schedule ${id} not found`);
    const updated = { ...existing, ...updates, updatedAt: new Date() };
    db.schedules.set(id, updated);
    return updated;
  }

  async deactivate(id: string): Promise<void> {
    const db = getDatabase();
    const existing = db.schedules.get(id);
    if (existing) {
      db.schedules.set(id, { ...existing, active: false, updatedAt: new Date() });
    }
  }
}

export class CareEventRepository implements ICareEventRepository {
  async findById(id: string): Promise<CareEvent | null> {
    const db = getDatabase();
    return db.careEvents.get(id) || null;
  }

  async findByProfileAndDate(careProfileId: string, localDueDate: string): Promise<CareEvent[]> {
    const db = getDatabase();
    return Array.from(db.careEvents.values())
      .filter((e) => e.careProfileId === careProfileId && e.localDueDate === localDueDate)
      .sort((a, b) => new Date(a.dueAtUtc).getTime() - new Date(b.dueAtUtc).getTime());
  }

  async findByProfileRange(
    careProfileId: string,
    startDateUtc: Date,
    endDateUtc: Date
  ): Promise<CareEvent[]> {
    const db = getDatabase();
    return Array.from(db.careEvents.values())
      .filter(
        (e) =>
          e.careProfileId === careProfileId &&
          new Date(e.dueAtUtc) >= startDateUtc &&
          new Date(e.dueAtUtc) <= endDateUtc
      )
      .sort((a, b) => new Date(a.dueAtUtc).getTime() - new Date(b.dueAtUtc).getTime());
  }

  async findPendingAndDue(cutoffTimeUtc: Date): Promise<CareEvent[]> {
    const db = getDatabase();
    return Array.from(db.careEvents.values()).filter(
      (e) => (e.status === 'pending' || e.status === 'reminded') && new Date(e.dueAtUtc) <= cutoffTimeUtc
    );
  }

  async createMany(events: CareEvent[]): Promise<CareEvent[]> {
    const db = getDatabase();
    for (const event of events) {
      db.careEvents.set(event.id, event);
    }
    return events;
  }

  async update(id: string, updates: Partial<CareEvent>): Promise<CareEvent> {
    const db = getDatabase();
    const existing = db.careEvents.get(id);
    if (!existing) throw new Error(`CareEvent ${id} not found`);
    const updated = { ...existing, ...updates, updatedAt: new Date() };
    db.careEvents.set(id, updated);
    return updated;
  }

  async findByDeterministicKey(key: string): Promise<CareEvent | null> {
    const db = getDatabase();
    return (
      Array.from(db.careEvents.values()).find((e) => e.id.includes(key)) || null
    );
  }
}

export class RoutineRepository implements IRoutineRepository {
  async findById(id: string): Promise<HealthcareRoutine | null> {
    const db = getDatabase();
    return db.routines.get(id) || null;
  }

  async findByProfile(careProfileId: string): Promise<HealthcareRoutine[]> {
    const db = getDatabase();
    return Array.from(db.routines.values()).filter(
      (r) => r.careProfileId === careProfileId && r.active
    );
  }

  async create(routine: HealthcareRoutine): Promise<HealthcareRoutine> {
    const db = getDatabase();
    db.routines.set(routine.id, routine);
    return routine;
  }

  async update(id: string, updates: Partial<HealthcareRoutine>): Promise<HealthcareRoutine> {
    const db = getDatabase();
    const existing = db.routines.get(id);
    if (!existing) throw new Error(`Routine ${id} not found`);
    const updated = { ...existing, ...updates, updatedAt: new Date() };
    db.routines.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    const db = getDatabase();
    const existing = db.routines.get(id);
    if (existing) {
      db.routines.set(id, { ...existing, active: false, updatedAt: new Date() });
    }
  }
}

export class AppointmentRepository implements IAppointmentRepository {
  async findById(id: string): Promise<Appointment | null> {
    const db = getDatabase();
    return db.appointments.get(id) || null;
  }

  async findByProfile(careProfileId: string): Promise<Appointment[]> {
    const db = getDatabase();
    return Array.from(db.appointments.values()).filter(
      (a) => a.careProfileId === careProfileId && a.status !== 'cancelled'
    );
  }

  async findUpcoming(cutoffTimeUtc: Date): Promise<Appointment[]> {
    const db = getDatabase();
    return Array.from(db.appointments.values()).filter(
      (a) => a.status === 'scheduled' && new Date(a.startsAtUtc) >= cutoffTimeUtc
    );
  }

  async create(appointment: Appointment): Promise<Appointment> {
    const db = getDatabase();
    db.appointments.set(appointment.id, appointment);
    return appointment;
  }

  async update(id: string, updates: Partial<Appointment>): Promise<Appointment> {
    const db = getDatabase();
    const existing = db.appointments.get(id);
    if (!existing) throw new Error(`Appointment ${id} not found`);
    const updated = { ...existing, ...updates, updatedAt: new Date() };
    db.appointments.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    const db = getDatabase();
    const existing = db.appointments.get(id);
    if (existing) {
      db.appointments.set(id, { ...existing, status: 'cancelled', updatedAt: new Date() });
    }
  }
}

export class NotificationLogRepository implements INotificationLogRepository {
  async findById(id: string): Promise<NotificationLog | null> {
    const db = getDatabase();
    return db.notificationLogs.get(id) || null;
  }

  async findByIdempotencyKey(key: string): Promise<NotificationLog | null> {
    const db = getDatabase();
    return (
      Array.from(db.notificationLogs.values()).find((n) => n.idempotencyKey === key) || null
    );
  }

  async create(log: NotificationLog): Promise<NotificationLog> {
    const db = getDatabase();
    db.notificationLogs.set(log.id, log);
    return log;
  }

  async update(id: string, updates: Partial<NotificationLog>): Promise<NotificationLog> {
    const db = getDatabase();
    const existing = db.notificationLogs.get(id);
    if (!existing) throw new Error(`NotificationLog ${id} not found`);
    const updated = { ...existing, ...updates };
    db.notificationLogs.set(id, updated);
    return updated;
  }
}

export class ProposalRepository implements IProposalRepository {
  async findById(id: string): Promise<ChangeProposal | null> {
    const db = getDatabase();
    return db.proposals.get(id) || null;
  }

  async findByProfile(careProfileId: string): Promise<ChangeProposal[]> {
    const db = getDatabase();
    return Array.from(db.proposals.values())
      .filter((p) => p.careProfileId === careProfileId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async create(proposal: ChangeProposal): Promise<ChangeProposal> {
    const db = getDatabase();
    db.proposals.set(proposal.id, proposal);
    return proposal;
  }

  async update(id: string, updates: Partial<ChangeProposal>): Promise<ChangeProposal> {
    const db = getDatabase();
    const existing = db.proposals.get(id);
    if (!existing) throw new Error(`Proposal ${id} not found`);
    const updated = { ...existing, ...updates, updatedAt: new Date() };
    db.proposals.set(id, updated);
    return updated;
  }
}

export class AuditRepository implements IAuditRepository {
  async create(entry: AuditLogEntry): Promise<AuditLogEntry> {
    const db = getDatabase();
    db.auditLogs.unshift(entry);
    return entry;
  }

  async findByProfile(careProfileId: string, limit: number = 50): Promise<AuditLogEntry[]> {
    const db = getDatabase();
    return db.auditLogs
      .filter((a) => a.careProfileId === careProfileId)
      .slice(0, limit);
  }
}

export function resetDemoDatabase(): void {
  const db = getDatabase();
  db.profiles.clear();
  db.memberships.clear();
  db.invitations.clear();
  db.medications.clear();
  db.schedules.clear();
  db.careEvents.clear();
  db.routines.clear();
  db.appointments.clear();
  db.notificationLogs.clear();
  db.proposals.clear();
  db.auditLogs = [];
  seedDemoData(db);
}

// Global Repository Instances
export const careProfileRepo = new CareProfileRepository();
export const membershipRepo = new MembershipRepository();
export const invitationRepo = new InvitationRepository();
export const medicationRepo = new MedicationRepository();
export const scheduleRepo = new ScheduleRepository();
export const careEventRepo = new CareEventRepository();
export const routineRepo = new RoutineRepository();
export const appointmentRepo = new AppointmentRepository();
export const notificationLogRepo = new NotificationLogRepository();
export const proposalRepo = new ProposalRepository();
export const auditRepo = new AuditRepository();
