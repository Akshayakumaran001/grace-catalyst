# GRACE — Continuous care. Independent ageing.

> **Product category:** Elderly Care & Medication Management Platform  
> **Hackathon:** PromptWars Catalyst  
> **Status:** Production-Ready MVP  
> **Hosting target:** Vercel with automated 5-minute cron scheduling  

---

## 🌟 1. Executive Summary

**GRACE** is an elder-first care-circle platform that helps an older adult manage everyday healthcare routines while keeping chosen family members and caretakers appropriately informed.

Unlike passive reminder apps that treat medication as an isolated checklist, GRACE places **the elder at the centre of decisions** — providing role-scoped shared care circles, transparent append-only activity feeds, consent-aware collaboration, configurable missed-dose escalation, and AI-assisted prescription intake with explicit human confirmation.

**The Product Promise:** *“A care circle around the elder, with the elder holding the keys.”*

---

## 🚀 2. Live Demo & Evaluator Quick Start

Evaluators can immediately test the platform using the seeded fictional care circle:

| Role | Persona | Invitation Passcode | Responsibilities |
|---|---|---|---|
| **Primary Elder** | **Meena, 72** | `MEENA2026` | Profile owner, Today 1-tap adherence, consent approval controls |
| **Family Member** | **Arun (Son)** | `FAMILY2026` | Remote visibility into adherence, appointments, activity feed, escalation alerts |
| **Caretaker** | **Lakshmi** | `CARE2026` | In-person assistance, recording doses on elder behalf, proposing schedule updates |

### Interactive Demo Controls (Top Banner)
When testing in any browser, the amber **Demo Controls** bar at the top of the screen provides:
- **`+30m`**: Advances the virtual clock by 30 minutes to trigger upcoming dose reminders.
- **`+1h`**: Advances the virtual clock by 1 hour to demonstrate missed-dose threshold transitions.
- **`+3h`**: Advances by 3 hours to demonstrate the automated caregiver escalation ladder.
- **`Reset`**: Instantly restores the database back to clean seeded fictional state.

---

## 💡 3. Why GRACE Goes Beyond a Basic Reminder App

| Basic Reminder App Pattern | GRACE Expected Behavior & Differentiators | Observable Evidence |
|---|---|---|
| Single-user reminder list | Shared care profile with role-scoped access (`elderly`, `caretaker`, `family_member`) | Care Circle dashboard, role permissions, scoped passcodes |
| Reminder sent with no context | Event-driven status tracking (`pending` → `reminded` → `taken` / `skipped` / `missed`) | Real-time Today timeline and adherence analytics |
| Caregiver edits override elder | Elder can enable **Approval-Required Mode**; non-elder edits become pending proposals | Consent toggle in Care Circle; proposals must be approved by elder |
| Missed reminder ends in silence | Automated multi-tier escalation ladder notifies primary caretaker and family | Resend emails triggered with provider message IDs |
| Tedious manual schedule typing | Google Gemini AI extracts structured schedules with human-in-the-loop review | Add Medicine → AI Prescription Intake tab with disclaimer |
| No accountability trail | Append-only chronological audit log of all material actions | Activity feed shows actor, action, timestamp, and metadata |

---

## 📬 4. Verified Transactional Email Delivery Evidence

In strict accordance with the P0 acceptance gate, GRACE implements live email delivery using **Resend**:

- **Upcoming Dose Reminder**: Delivered to elder with 1-click action link.
  - *Sample Verified Resend Message ID:* `01a1de31-6708-751c-842a-380a854affcd`
- **Escalated Missed Dose Alert**: Automatically delivered to elder, primary caretaker, and family member upon crossing escalation threshold.
  - *Elder Notification ID:* `01a1de32-49fc-7d2f-b841-ae2aac841400`
  - *Family Contact Notification ID:* `01a1de32-4b79-70b0-bd42-06941e511ba5`
  - *Caretaker Notification ID:* `01a1de32-4ca3-7a52-915a-84fb7a94bbcf`
- **Upcoming Medical Appointment Reminder**: Delivered with provider details, clinic location, and preparation notes.
  - *Verified Resend Message ID:* `01a1de30-0607-7467-a189-9a4adc69b82a`

---

## 🏛️ 5. System Architecture & Layering

GRACE is architected as a clean modular monolith adhering to strict domain-driven layering:

```
src/
├── app/                  # Next.js App Router (UI routes & REST API endpoints)
├── components/           # Elder-accessible & shared React components
│   ├── shared/Navbar.tsx # Accessible header navigation & user state
│   └── shared/DemoBar.tsx# Evaluator virtual clock & reset toolbar
├── domain/               # Pure business domain (Zero external dependencies)
│   ├── types.ts          # Core entities, roles, and status enums
│   ├── permissions/      # Pure can(role, action) permission policy matrix
│   ├── care-events/      # Deterministic event state machine
│   ├── schedules/        # Timezone-aware 14-day occurrence generator
│   └── adherence/        # Numerator/denominator adherence calculator
├── services/             # Application coordination & authorization enforcement
│   ├── care-profile.service.ts
│   ├── medication.service.ts
│   ├── care-event.service.ts
│   ├── routine.service.ts
│   ├── appointment.service.ts
│   └── reminder.service.ts
├── repositories/         # Storage interfaces & Firestore implementation
│   ├── interfaces/       # Repository contracts
│   └── firestore/        # Persistent store with automated seeded demo fallback
├── adapters/             # External boundaries & integrations
│   ├── email/            # Resend transactional email client
│   ├── gemini/           # Google Gemini Generative AI schedule intake
│   ├── clock/            # Injected SystemClock & VirtualClock
│   └── tokens/           # jose JWT sessions & crypto passcode hashing
└── lib/                  # Validation schemas, errors, env, and API envelopes
    ├── validation/       # Zod schemas for all API payloads
    ├── errors/           # Typed domain and HTTP errors
    └── config/           # Environment configuration
```

---

## 📊 6. Requirement Traceability Matrix

| Brief / Product Requirement | Requirement IDs | Implementation Area | Verification Evidence |
|---|---|---|---|
| Shared Care Profile | FR-001–009 | `src/services/care-profile.service.ts` | Passcode join, session cookie issuance, multi-member circle |
| Passcode-Based Access | FR-003–008 | `src/adapters/tokens/index.ts` | Strong salted SHA-256 hash, rate limiting, expiry |
| Role-Scoped Permissions | FR-002, FR-007 | `src/domain/permissions/policy.ts` | Server-enforced `can(role, action)` matrix |
| Medication Management | FR-010–014 | `src/services/medication.service.ts` | CRUD, schedule configuration, archive |
| Concrete Dose Event Generation | FR-015, FR-018 | `src/domain/schedules/generate-occurrences.ts` | Deterministic SHA-256 key deduplication, 14-day rolling window |
| Adherence & Event Transitions | FR-016–019 | `src/domain/care-events/state-machine.ts` | Validated state machine (`pending` → `taken`/`skipped`/`missed`) |
| Healthcare Routines | FR-020–023 | `src/services/routine.service.ts` | Shared `CareEvent` engine with `kind: 'routine'`, 1-tap completion |
| Medical Appointments | FR-030–033 | `src/services/appointment.service.ts` | Scheduled visits, lead times, reminder monitoring |
| Transactional Email Delivery | FR-034–037 | `src/adapters/email/index.ts` | Live Resend API delivery with verified message IDs |
| Missed Dose Escalation | FR-038–039 | `src/services/reminder.service.ts` | Multi-tier ladder notifying elder, then caretaker & family |
| Elder Consent & Agency | FR-043–047 | `src/services/care-profile.service.ts` | Toggle between direct edit and elder-approval mode |
| AI Schedule Intake | FR-048–056 | `src/adapters/gemini/index.ts` | Gemini AI JSON extraction with verification disclaimer |
| Virtual Clock & Time-Skip | FR-057–060 | `src/adapters/clock/index.ts` | `VirtualClock` triggers identical domain reminder pipeline |
| Healthcheck Endpoint | Section 4.4 | `src/app/api/healthz/route.ts` | Returns 200 OK with build, version, and integration health |

---

## 🛠️ 7. Environment Variables

Create `.env.local` based on `.env.example`:

```dotenv
NODE_ENV=development
PORT=3000
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Session Secret (HMAC-SHA256 for jose JWT)
SESSION_SECRET=your_secure_random_session_secret_min_32_chars

# Firebase / Firestore
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
FIREBASE_PRIVATE_KEY=your_firebase_private_key

# Resend Transactional Email
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=onboarding@resend.dev

# Google Gemini / GCP API
GEMINI_API_KEY=your_gemini_api_key
GCP_API_KEY=your_gcp_api_key
GEMINI_MODEL=gemini-1.5-flash

# Cron & Automation
CRON_SHARED_SECRET=your_cron_shared_secret
DEMO_MODE=true
```

---

## 💻 8. Local Development & Build Commands

```bash
# Install dependencies
npm install

# Run static typechecking
npm run typecheck

# Build optimized production bundle
npm run build

# Start production server
npm run start
```

---

## ⚠️ 9. Healthcare Safety & Regulatory Notice

- **Coordination Tool Only**: GRACE is an organizational and coordination aid, not a diagnostic medical device or emergency response system.
- **No Dosage Alterations**: GRACE never recommends modifying doses, diagnosing illnesses, or advising on late dose ingestion without clinician oversight.
- **Human-in-the-Loop**: All AI-parsed schedules require explicit user confirmation before being persisted.
