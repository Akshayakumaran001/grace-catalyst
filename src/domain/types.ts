// ─── GRACE Domain Types ──────────────────────────────────────────────
// Pure type definitions — no runtime dependencies.

// ── Roles ──────────────────────────────────────────────────────────────
export type Role = 'elderly' | 'caretaker' | 'family_member';
export type CollaborationMode = 'direct_edit' | 'elder_approval_required';

// ── Notification Policy ────────────────────────────────────────────────
export interface RecipientConfig {
  elder: boolean;
  caretaker: boolean;
  familyMember: boolean;
}

export interface NotificationPolicy {
  upcomingDose: RecipientConfig;
  missedDoseFirstStage: RecipientConfig;
  escalatedMissedDose: RecipientConfig;
  upcomingAppointment: RecipientConfig;
  appointmentChanged: RecipientConfig;
}

// ── Care Profile ───────────────────────────────────────────────────────
export interface CareProfile {
  id: string;
  displayName: string;
  locale: string; // default 'en-IN'
  timezone: string; // IANA timezone e.g. 'Asia/Kolkata'
  collaborationMode: CollaborationMode;
  notificationPolicy: NotificationPolicy;
  isDemo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ── Membership ─────────────────────────────────────────────────────────
export type MembershipStatus = 'active' | 'revoked' | 'pending';

export interface NotificationPreferences {
  emailEnabled: boolean;
  quietHoursStart?: string; // HH:mm
  quietHoursEnd?: string;   // HH:mm
}

export interface Membership {
  id: string;
  careProfileId: string;
  displayName: string;
  role: Role;
  email?: string;
  status: MembershipStatus;
  notificationPreferences: NotificationPreferences;
  createdAt: Date;
  lastActiveAt: Date;
  revokedAt?: Date;
}

// ── Invitation ─────────────────────────────────────────────────────────
export interface Invitation {
  id: string;
  careProfileId: string;
  role: Role;
  passcodeHash: string;
  salt: string;
  expiresAt: Date;
  revokedAt?: Date;
  maxUses: number;
  uses: number;
  failedAttempts: number;
  lockedUntil?: Date;
  createdBy: string;
  createdAt: Date;
}

// ── Medication ─────────────────────────────────────────────────────────
export type MedicationStatus = 'active' | 'paused' | 'archived';

export interface Medication {
  id: string;
  careProfileId: string;
  name: string;
  brandOrGeneric?: string;
  doseText: string;
  form?: string;
  instructions?: string;
  startDate: string; // YYYY-MM-DD
  endDate?: string;
  status: MedicationStatus;
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// ── Medication Schedule ────────────────────────────────────────────────
export interface MedicationSchedule {
  id: string;
  careProfileId: string;
  medicationId: string;
  frequency: 'daily' | 'specific_days';
  weekdays?: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
  localTimes: string[]; // HH:mm format
  mealContext?: string;
  timezone: string;
  effectiveFrom: string; // YYYY-MM-DD
  effectiveUntil?: string;
  version: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ── Care Event ─────────────────────────────────────────────────────────
export type CareEventKind = 'medication' | 'routine';
export type CareEventStatus = 'pending' | 'reminded' | 'taken' | 'skipped' | 'missed' | 'cancelled';

export interface CareEvent {
  id: string;
  careProfileId: string;
  kind: CareEventKind;
  sourceId: string; // medication schedule ID or routine ID
  sourceVersion: number;
  titleSnapshot: string;
  instructionsSnapshot?: string;
  dueAtUtc: Date;
  timezone: string;
  localDueDate: string; // YYYY-MM-DD
  localDueTime: string; // HH:mm
  status: CareEventStatus;
  completedAt?: Date;
  completedBy?: string;
  completionMethod?: 'self' | 'caregiver' | 'magic_link';
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ── Healthcare Routine ─────────────────────────────────────────────────
export interface HealthcareRoutine {
  id: string;
  careProfileId: string;
  title: string;
  description?: string;
  category?: string;
  frequency: 'daily' | 'specific_days';
  weekdays?: number[];
  localTimes: string[];
  timezone: string;
  effectiveFrom: string;
  effectiveUntil?: string;
  active: boolean;
  version: number;
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// ── Appointment ────────────────────────────────────────────────────────
export type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled';

export interface Appointment {
  id: string;
  careProfileId: string;
  title: string;
  provider?: string;
  startsAtUtc: Date;
  timezone: string;
  location?: string;
  notes?: string;
  reminderOffsets: number[]; // minutes before appointment
  status: AppointmentStatus;
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// ── Notification Log ───────────────────────────────────────────────────
export type NotificationStatus = 'queued' | 'sent' | 'failed' | 'suppressed';
export type NotificationChannel = 'email';
export type NotificationStage =
  | 'upcoming_dose'
  | 'missed_dose_first'
  | 'missed_dose_escalated'
  | 'upcoming_appointment'
  | 'appointment_changed';

export interface NotificationLog {
  id: string;
  careProfileId: string;
  eventId: string;
  recipientMembershipId: string;
  stage: NotificationStage;
  channel: NotificationChannel;
  idempotencyKey: string; // `${eventId}:${stage}:${recipientMembershipId}`
  status: NotificationStatus;
  attemptCount: number;
  providerMessageId?: string;
  lastErrorCode?: string;
  createdAt: Date;
  sentAt?: Date;
  nextAttemptAt?: Date;
}

// ── Change Proposal ────────────────────────────────────────────────────
export type ProposalStatus = 'pending' | 'approved' | 'rejected' | 'expired';

export interface ChangeProposal {
  id: string;
  careProfileId: string;
  resourceType: string;
  resourceId: string;
  proposedPatch: Record<string, unknown>;
  reason?: string;
  createdBy: string;
  status: ProposalStatus;
  reviewedBy?: string;
  reviewedAt?: Date;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ── Audit Log ──────────────────────────────────────────────────────────
export interface AuditLogEntry {
  id: string;
  careProfileId: string;
  actorMembershipId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  requestId?: string;
  createdAt: Date;
}

// ── Magic Link Token ──────────────────────────────────────────────────
export interface MagicLinkToken {
  id: string;
  tokenHash: string;
  careProfileId: string;
  eventId: string;
  action: 'mark_taken' | 'need_help';
  recipientMembershipId: string;
  expiresAt: Date;
  consumedAt?: Date;
  createdAt: Date;
}

// ── Session ────────────────────────────────────────────────────────────
export interface Session {
  membershipId: string;
  careProfileId: string;
  role: Role;
  displayName: string;
  exp: number;
  iat: number;
}

export const DEFAULT_NOTIFICATION_POLICY: NotificationPolicy = {
  upcomingDose: { elder: true, caretaker: false, familyMember: false },
  missedDoseFirstStage: { elder: true, caretaker: false, familyMember: false },
  escalatedMissedDose: { elder: true, caretaker: true, familyMember: true },
  upcomingAppointment: { elder: true, caretaker: true, familyMember: true },
  appointmentChanged: { elder: true, caretaker: true, familyMember: true },
};

