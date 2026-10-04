# Heavyar legal policy gap closure report

Closure date: 2026-10-04. Original gap count: **18**. Current-release open gaps: **0**. This report distinguishes implemented current-release controls from capabilities that are explicitly disabled and make no current promise.

| # | Original topic | Classification | Closure evidence |
|---:|---|---|---|
| 1 | Legal-basis review | CLOSED | Owner decision register maps official Saudi sources to product facts, safer behavior and review triggers; no generic external-review blocker remains. |
| 2 | Refund execution | CLOSED | Public refund wording matches the Worker refund-case lifecycle; approved cases require manual execution and provider evidence before `executed`; no automated-refund claim. |
| 3 | Provider settlement / Split | FUTURE_DISABLED_DEPENDENCY | Tap Marketplace/Split and automated provider payout are disabled; no bank/IBAN collection and no payout promise. |
| 4 | Retention schedule | CLOSED | Data inventory, owner operational durations, holds, deletion/anonymization, backup implications and allowlisted temporary cleanup are documented and implemented. |
| 5 | Cross-border governance | CLOSED | Actual processor register classifies unproven locations as potential cross-border processing and references the official Saudi transfer framework without localization/DPA claims. |
| 6 | Insurance / accident workflow | CLOSED | Typed incident intake and audited Admin lifecycle preserve evidence and refer authority/insurer matters without Heavyar deciding legal fault. |
| 7 | Inspection/evidence | CLOSED | Incident, complaint, moderation and refund cases accept bounded evidence references; immutable audit and participant/RBAC authorization apply. |
| 8 | Driver credentials | FUTURE_DISABLED_DEPENDENCY | Scoped framework is capability-gated OFF for current iOS; no government-ID collection or verified-licence badge. |
| 9 | Regulated category catalogue | CLOSED | Versioned catalogue; Saudi truck-without-driver capability gate; unknown category/transaction fails closed. |
| 10 | Complaint/appeal SLAs | CLOSED | Explicit state machine with internal 2-business-day acknowledgement and 10-business-day review targets; targets do not auto-close cases. |
| 11 | Minors/legal capacity | CLOSED | Registration records legal-capacity representation and business authority without collecting date of birth or inventing a numeric age. |
| 12 | VAT/accounting | CLOSED | Tax/invoice decision documents actual transaction record, server totals and non-claims; no FATOORA/ZATCA-clearance claim. |
| 13 | Future fee governance | CLOSED | Active provider-paid commission is 10%; 20% remains DRAFT/NOT ACTIVE; historical commercial snapshots are immutable. |
| 14 | Privacy rights runbook | CLOSED | Authenticated rights cases, safe identity verification, RBAC lifecycle and narrow user export are implemented and documented. |
| 15 | Controller identity detail | CLOSED | Published policy/support/controller contact routes and internal business configuration identify the operating contact without exposing private evidence. |
| 16 | Consent/version evidence | CLOSED | Current exact versions, role policies, app/platform/locale and server time are append-only; direct client writes are denied; Admin can inspect. |
| 17 | Translation/legal equivalence | CLOSED | Arabic and English routes remain paired; Arabic is the governing language where the policies state it; version register controls material updates. |
| 18 | Verification roadmap | FUTURE_DISABLED_DEPENDENCY | Nafath/identity verification stays disabled, no unsupported promise or background collection; future activation has explicit prerequisites. |

## Current boundaries

- Government ID collection: **NO**
- IBAN/bank collection: **NO**
- Raw card/CVV storage: **NO**
- Nafath: **DISABLED**
- Tap: **TEST**, hosted checkout
- Tap Split: **DISABLED**
- Current commission: **10% provider-paid**
- 20% rule: **DRAFT / NOT ACTIVE**
- National register evidence wording: **“National Register for Personal Data Protection registration evidence”**, issued 2026-10-04; not a compliance certificate.

Official-source decisions and implementation evidence are maintained in the app repository documents `LEGAL_DECISION_REGISTER.md`, `CURRENT_RELEASE_COMPLIANCE.md`, `DATA_RETENTION_SCHEDULE.md`, `PDPL_RIGHTS_RUNBOOK.md`, `DATA_TRANSFER_REGISTER.md`, `TAX_AND_INVOICE_DECISION.md`, and `FUTURE_EXTERNAL_DEPENDENCIES.md`.
