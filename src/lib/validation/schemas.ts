import { z } from 'zod';

// ── Reusable primitives ──────────────────────────────────────────────

const dateStringSchema = z.string().regex(
  /^\d{4}-\d{2}-\d{2}$/,
  'Must be a valid YYYY-MM-DD date'
);

const timeStringSchema = z.string().regex(
  /^\d{2}:\d{2}$/,
  'Must be a valid HH:mm time'
);

const ianaTimezoneSchema = z.string().min(1, 'Timezone is required').max(64);

const weekdaysSchema = z
  .array(z.number().int().min(0).max(6))
  .min(1, 'At least one weekday is required')
  .max(7);

const localTimesSchema = z
  .array(timeStringSchema)
  .min(1, 'At least one time slot is required')
  .max(24);

const frequencySchema = z.enum(['daily', 'specific_days']);

const roleSchema = z.enum(['elderly', 'caretaker', 'family_member']);

const collaborationModeSchema = z.enum(['direct_edit', 'elder_approval_required']);

const recipientConfigSchema = z.object({
  elder: z.boolean(),
  caretaker: z.boolean(),
  familyMember: z.boolean(),
});

const notificationPolicySchema = z.object({
  upcomingDose: recipientConfigSchema,
  missedDoseFirstStage: recipientConfigSchema,
  escalatedMissedDose: recipientConfigSchema,
  upcomingAppointment: recipientConfigSchema,
  appointmentChanged: recipientConfigSchema,
});

// ── Care Profile ────────────────────────────────────────────────────

export const createCareProfileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, 'Display name is required')
    .max(100, 'Display name must be 100 characters or fewer'),
  elderDisplayName: z.string().trim().min(1).max(100).optional(),
  elderEmail: z.string().email().optional(),
  locale: z.string().default('en-IN'),
  timezone: ianaTimezoneSchema.default('Asia/Kolkata'),
  collaborationMode: collaborationModeSchema.default('direct_edit'),
  notificationPolicy: notificationPolicySchema.optional(),
  isDemo: z.boolean().default(false),
});
export type CreateCareProfileInput = z.infer<typeof createCareProfileSchema>;

// ── Join / Invitation Redemption ───────────────────────────────────

export const joinCareProfileSchema = z.object({
  invitationId: z.string().optional(),
  passcode: z
    .string()
    .min(4, 'Passcode must be at least 4 characters')
    .max(64, 'Passcode must be 64 characters or fewer'),
  displayName: z
    .string()
    .trim()
    .min(1, 'Display name is required')
    .max(100, 'Display name must be 100 characters or fewer'),
  email: z.string().email('Invalid email address').optional(),
});
export type JoinCareProfileInput = z.infer<typeof joinCareProfileSchema>;

// ── Medication ──────────────────────────────────────────────────────

export const createMedicationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Medication name is required')
    .max(200, 'Medication name must be 200 characters or fewer'),
  brandOrGeneric: z.string().trim().max(200).optional(),
  doseText: z
    .string()
    .trim()
    .min(1, 'Dose text is required')
    .max(200, 'Dose text must be 200 characters or fewer'),
  form: z.string().trim().max(100).optional(),
  instructions: z.string().trim().max(500).optional(),
  startDate: dateStringSchema,
  endDate: dateStringSchema.optional(),
  status: z.enum(['active', 'paused', 'archived']).default('active'),
  schedule: z
    .object({
      frequency: z.enum(['daily', 'specific_days']).default('daily'),
      weekdays: z.array(z.number().min(0).max(6)).optional(),
      localTimes: z.array(timeStringSchema).min(1),
      mealContext: z.string().trim().max(200).optional(),
    })
    .default({
      frequency: 'daily',
      localTimes: ['09:00'],
    }),
});
export type CreateMedicationInput = z.infer<typeof createMedicationSchema>;

export const updateMedicationSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  brandOrGeneric: z.string().trim().max(200).optional().nullable(),
  doseText: z.string().trim().min(1).max(200).optional(),
  form: z.string().trim().max(100).optional().nullable(),
  instructions: z.string().trim().max(500).optional().nullable(),
  startDate: dateStringSchema.optional(),
  endDate: dateStringSchema.optional().nullable(),
  status: z.enum(['active', 'paused', 'archived']).optional(),
});
export type UpdateMedicationInput = z.infer<typeof updateMedicationSchema>;

// ── Medication Schedule ─────────────────────────────────────────────

export const createScheduleSchema = z
  .object({
    medicationId: z.string().min(1, 'Medication ID is required'),
    frequency: frequencySchema,
    weekdays: weekdaysSchema.optional(),
    localTimes: localTimesSchema,
    mealContext: z.string().trim().max(100).optional(),
    timezone: ianaTimezoneSchema,
    effectiveFrom: dateStringSchema,
    effectiveUntil: dateStringSchema.optional(),
  })
  .refine(
    (data) =>
      data.frequency !== 'specific_days' ||
      (data.weekdays !== undefined && data.weekdays.length > 0),
    { message: 'Weekdays are required when frequency is specific_days', path: ['weekdays'] }
  );
export type CreateScheduleInput = z.infer<typeof createScheduleSchema>;

export const updateScheduleSchema = z
  .object({
    frequency: frequencySchema.optional(),
    weekdays: weekdaysSchema.optional().nullable(),
    localTimes: localTimesSchema.optional(),
    mealContext: z.string().trim().max(100).optional().nullable(),
    timezone: ianaTimezoneSchema.optional(),
    effectiveFrom: dateStringSchema.optional(),
    effectiveUntil: dateStringSchema.optional().nullable(),
    active: z.boolean().optional(),
  })
  .refine(
    (data) => {
      if (data.frequency === 'specific_days' && data.weekdays === null) {
        return false;
      }
      return true;
    },
    { message: 'Cannot clear weekdays when frequency is specific_days', path: ['weekdays'] }
  );
export type UpdateScheduleInput = z.infer<typeof updateScheduleSchema>;

// ── Routine ─────────────────────────────────────────────────────────

export const createRoutineSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, 'Title is required')
      .max(200, 'Title must be 200 characters or fewer'),
    description: z.string().trim().max(1000).optional(),
    category: z.string().trim().max(100).optional(),
    frequency: frequencySchema,
    weekdays: weekdaysSchema.optional(),
    localTimes: localTimesSchema,
    timezone: ianaTimezoneSchema,
    effectiveFrom: dateStringSchema,
    effectiveUntil: dateStringSchema.optional(),
  })
  .refine(
    (data) =>
      data.frequency !== 'specific_days' ||
      (data.weekdays !== undefined && data.weekdays.length > 0),
    { message: 'Weekdays are required when frequency is specific_days', path: ['weekdays'] }
  );
export type CreateRoutineInput = z.infer<typeof createRoutineSchema>;

export const updateRoutineSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    description: z.string().trim().max(1000).optional().nullable(),
    category: z.string().trim().max(100).optional().nullable(),
    frequency: frequencySchema.optional(),
    weekdays: weekdaysSchema.optional().nullable(),
    localTimes: localTimesSchema.optional(),
    timezone: ianaTimezoneSchema.optional(),
    effectiveFrom: dateStringSchema.optional(),
    effectiveUntil: dateStringSchema.optional().nullable(),
    active: z.boolean().optional(),
  })
  .refine(
    (data) => {
      if (data.frequency === 'specific_days' && data.weekdays === null) {
        return false;
      }
      return true;
    },
    { message: 'Cannot clear weekdays when frequency is specific_days', path: ['weekdays'] }
  );
export type UpdateRoutineInput = z.infer<typeof updateRoutineSchema>;

// ── Appointment ─────────────────────────────────────────────────────

export const createAppointmentSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title is required')
    .max(200, 'Title must be 200 characters or fewer'),
  provider: z.string().trim().max(200).optional(),
  startsAtUtc: z.coerce.date({ required_error: 'Start time is required' }),
  timezone: ianaTimezoneSchema,
  location: z.string().trim().max(500).optional(),
  notes: z.string().trim().max(2000).optional(),
  reminderOffsets: z
    .array(z.number().int().min(0).max(10080)) // max 7 days in minutes
    .max(5)
    .default([60, 1440]),
  status: z.enum(['scheduled', 'completed', 'cancelled']).default('scheduled'),
});
export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;

export const updateAppointmentSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  provider: z.string().trim().max(200).optional().nullable(),
  startsAtUtc: z.coerce.date().optional(),
  timezone: ianaTimezoneSchema.optional(),
  location: z.string().trim().max(500).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
  reminderOffsets: z
    .array(z.number().int().min(0).max(10080))
    .max(5)
    .optional(),
  status: z.enum(['scheduled', 'completed', 'cancelled']).optional(),
});
export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>;

// ── Care Event Transition ───────────────────────────────────────────

export const careEventTransitionSchema = z.object({
  targetStatus: z.enum(['taken', 'skipped', 'missed', 'reminded', 'cancelled']),
  completionMethod: z.enum(['self', 'caregiver', 'magic_link']).optional(),
  note: z.string().trim().max(500).optional(),
});
export type CareEventTransitionInput = z.infer<typeof careEventTransitionSchema>;

// ── Invitation ──────────────────────────────────────────────────────

export const createInvitationSchema = z.object({
  role: roleSchema.refine(
    (val) => val !== 'elderly',
    { message: 'Cannot create invitation for elderly role' }
  ),
  passcode: z
    .string()
    .min(4, 'Passcode must be at least 4 characters')
    .max(64, 'Passcode must be 64 characters or fewer'),
  maxUses: z.number().int().min(1).max(100).default(1),
  expiresInHours: z.number().min(1).max(720).optional(),
  expiresInDays: z.number().min(1).max(365).optional(),
});
export type CreateInvitationInput = z.infer<typeof createInvitationSchema>;

// ── Notification Preferences ────────────────────────────────────────

export const updateNotificationPreferencesSchema = z
  .object({
    emailEnabled: z.boolean(),
    quietHoursStart: timeStringSchema.optional().nullable(),
    quietHoursEnd: timeStringSchema.optional().nullable(),
  })
  .refine(
    (data) => {
      // Both must be set or both must be null/undefined
      const hasStart = data.quietHoursStart != null;
      const hasEnd = data.quietHoursEnd != null;
      return hasStart === hasEnd;
    },
    { message: 'Both quietHoursStart and quietHoursEnd must be set or both cleared' }
  );
export type UpdateNotificationPreferencesInput = z.infer<typeof updateNotificationPreferencesSchema>;

// ── Change Proposal ─────────────────────────────────────────────────

export const createProposalSchema = z.object({
  resourceType: z
    .string()
    .min(1, 'Resource type is required')
    .max(50),
  resourceId: z
    .string()
    .min(1, 'Resource ID is required'),
  proposedPatch: z.record(z.unknown()).refine(
    (obj) => Object.keys(obj).length > 0,
    { message: 'Proposed patch must not be empty' }
  ),
  reason: z.string().trim().max(500).optional(),
});
export type CreateProposalInput = z.infer<typeof createProposalSchema>;

// ── AI Medication Intake Text ───────────────────────────────────────

export const aiMedicationIntakeTextSchema = z.object({
  text: z
    .string()
    .trim()
    .min(5, 'Text must be at least 5 characters')
    .max(5000, 'Text must be 5000 characters or fewer'),
  locale: z.string().default('en-IN'),
});
export type AiMedicationIntakeTextInput = z.infer<typeof aiMedicationIntakeTextSchema>;

// ── Demo: Advance Time ──────────────────────────────────────────────

export const demoAdvanceTimeSchema = z.object({
  minutes: z
    .number()
    .int()
    .min(1, 'Must advance by at least 1 minute')
    .max(10080, 'Cannot advance more than 7 days at once'),
});
export type DemoAdvanceTimeInput = z.infer<typeof demoAdvanceTimeSchema>;
