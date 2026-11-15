# Security Policy & Hardening — GRACE

## 1. Threat Model & Boundaries

GRACE manages sensitive health schedules and care circle relationships. Security controls are enforced strictly on the server:

- **Server-Side Enforcement**: Client UI never dictates authorization. Every API handler verifies the caller's session and queries `can(role, action)` before mutating state.
- **Tenant Isolation**: Every database query is scoped by `careProfileId`. A user belonging to Profile A cannot view or mutate entities in Profile B.
- **Passcode Protection**: Passcodes are hashed using strong salted SHA-256 with cryptographically random salts. Plaintext passcodes are never stored or logged.
- **Session Management**: Sessions use HMAC-SHA256 signed JSON Web Tokens issued in `httpOnly`, `sameSite=lax`, and `secure` (in production) cookies via `jose`.
- **Rate Limiting & Lockout**: Repeated passcode entry failures trigger progressive backoff and temporary lockout.

---

## 2. AI Input & Prompt Injection Hardening

- Untrusted input (uploaded text, OCR prescriptions) is strictly treated as passive data.
- The Gemini system prompt enforces rigid boundary constraints:
  - Markdown code fences and prompt instructions are rejected.
  - JSON response schemas are strictly enforced with zero allowable hallucinations.
  - The AI is instructed never to infer doses or recommend medication adjustments.
- All AI extractions require human confirmation before persistence.

---

## 3. Data Protection & Audit

- **Data Minimization**: Personal identifiable information (PII) is kept to the absolute minimum necessary for notification delivery.
- **Audit Logging**: All care profile creations, membership changes, collaboration mode toggles, schedule updates, and dose actions generate append-only audit entries.
- **Secrets Management**: Secrets are stored exclusively in environment variables and runtime secrets managers. No API keys or credentials are committed to version control.
