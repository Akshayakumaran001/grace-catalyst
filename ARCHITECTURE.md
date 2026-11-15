# Architecture Documentation — GRACE

## 1. Architectural Philosophy

GRACE follows the **Clean Architecture / Ports & Adapters** paradigm organized as a lightweight, highly maintainable modular monolith:

1. **Domain Layer (`src/domain/`)**: Pure TypeScript models and business rules. Completely isolated from HTTP, Next.js, databases, or external third-party SDKs. Contains:
   - State machine transition logic (`state-machine.ts`)
   - Recurrence calculation & occurrence expansion (`generate-occurrences.ts`)
   - Adherence metrics formula (`calculator.ts`)
   - Role-action permission matrix (`policy.ts`)
2. **Services Layer (`src/services/`)**: Orchestrates domain operations, enforces authentication context, checks permissions via `can(role, action)`, handles transactions, and logs audit events.
3. **Repositories Layer (`src/repositories/`)**: Abstract interfaces decoupled from persistence technology. Backed by Cloud Firestore with an automated in-memory seeded demo store.
4. **Adapters Layer (`src/adapters/`)**: Wraps external boundaries (Resend email client, Google Gemini SDK, clock providers, and cryptographic token utilities).
5. **App / API Layer (`src/app/`)**: Thin Next.js App Router controllers that parse and validate incoming inputs with Zod and return consistent JSON envelopes.

---

## 2. Occurrence Expansion & Rolling Window

To prevent unbounded database growth, GRACE materializes occurrences for a rolling **14-day horizon**:
- When a medication or healthcare routine is created or updated, `generateOccurrences()` computes the exact dates and times within the 14-day window.
- Each event is assigned a deterministic SHA-256 identifier:
  $$\text{key} = \text{SHA256}(\text{sourceId} : \text{sourceVersion} : \text{localDate} : \text{localTime})$$
- This deterministic key guarantees strict idempotency: regenerating or rerunning schedule expansion will never create duplicate dose events.

---

## 3. Care Event State Machine

CareEvents follow a deterministic state machine:

```
[ pending ] ─── (due time reached) ───────────> [ reminded ]
     │                                               │
     ├──────────── (user action: took) ──────────────┼──────> [ taken ] (terminal)
     │                                               │
     ├──────────── (user action: skipped) ───────────┼──────> [ skipped ] (terminal)
     │                                               │
     └──────────── (grace period exceeded) ──────────┴──────> [ missed ]
                                                                 │
                                                      (late report)
                                                                 │
                                                                 ▼
                                                              [ taken ] (late report recorded)
```

- Administrative cancellations (`cancelled`) are terminal states for future occurrences only.
- Escalation stages (e.g. `missed_dose_escalated`) are recorded in `NotificationLog`, keeping event outcome cleanly separated from notification progress.

---

## 4. Idempotent Notification Engine

The background reminder worker executes on a periodic 5-minute tick (via Vercel Cron or external automation):
1. Evaluates events due within the bounded window $[T - 2\text{ hours}, T + 30\text{ minutes}]$.
2. Resolves member roles, notification policy, and preferences.
3. Builds an idempotency key:
   $$\text{idempotencyKey} = \text{eventId} : \text{stage} : \text{recipientMembershipId}$$
4. Checks `NotificationLog` before dispatching. If already sent, the delivery is skipped.
5. Emits the transactional email through Resend and captures the provider's `messageId`.
