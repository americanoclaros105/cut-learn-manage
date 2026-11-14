# Feature: Academy operations (enrollments, payments, attendance)

## Objective
Give the admin full control of the academy operation from the admin panel:
- Per-course roster ("llamado a lista") with enrollment status, agreed price, paid amount and balance.
- In-person class sessions per course with attendance roll call.
- Payments ledger (accounting): who paid, how much, how, when; with balance per enrollment.
- A student enrolled in a course has NO access until the enrollment is fully paid (automatic), and the admin can suspend or grant manually.

## Problem / Why
Today enrollment (`user_course_assignments`) grants access immediately, payments are not tracked anywhere,
there are no class sessions, and course content access is only enforced in the UI (RLS lets anyone read
published modules/lessons).

## Product decisions (from user, 2026-11-13)
- Roster + attendance: BOTH (roster with payment/access status AND attendance per in-person session).
- Payment model: agreed total price per enrollment, paid in installments (abonos); balance = agreed - paid.
- Access: automatic when the enrollment is fully paid (balance <= 0). Admin can still suspend or grant manually.
- UI copy in Spanish (existing project language); code identifiers in English.

## Scope
- DB migration: enrollment status/price fields, `payments` (voidable, never hard-deleted), `class_sessions`,
  `attendance`, access trigger, `has_course_access()` helper, RLS hardening for `modules`/`lessons`.
- Student side: only `active` enrollments within dates give access.
- Admin: course roster + attendance page, accounting page, register-payment flow, nav entries.

## Out of scope (flagged)
- Public storage buckets still expose file URLs to anyone with the link.
- Online payment gateway.

## Constraints
- Supabase project managed via Lovable; migrations live in `supabase/migrations/`. Applying them to the
  remote DB is a delivery step for the user (Lovable / Supabase SQL editor).
- Existing assignments must keep working: backfill them as `active` with `activated_by = 'legacy'`.

## TDD
- Mode: strict (global user config). Project had no runner; Vitest added in T1 for pure domain logic
  (balance, status derivation, attendance stats). DB/UI verified via `npm run build`, `npm run lint` and browser.

## Tasks
- [x] T1 Domain + DB: Vitest setup, pure domain module with tests, migration (enums, columns, payments,
      class_sessions, attendance, triggers, RLS, has_course_access), regenerate-equivalent types update.
- [x] T2 Access gating: student hooks/pages honor enrollment status + dates; StudentForm creates pending
      enrollments with agreed price; admin student list shows enrollment status.
- [x] T3 Roster + attendance UI: `/admin/cursos/:courseId/grupo` with tabs Inscritos / Asistencia.
- [ ] T4 Accounting UI: `/admin/contabilidad` with KPIs, ledger, filters, register/void payment, CSV export.
- [ ] T5 Verification: build, lint, tests, browser walkthrough.

## Acceptance criteria
- Enrolling a student creates a `pending` enrollment; student cannot open the course nor read its lessons (RLS).
- Registering payments that reach the agreed price flips the enrollment to `active` automatically.
- Voiding a payment that drops the balance above 0 reverts a payment-activated enrollment to `pending`.
- Admin can suspend / reactivate / grant manually any enrollment.
- Admin can create sessions and take roll call (present / absent / late / excused) quickly, including on mobile.
- Accounting page shows collected totals, outstanding balance and a filterable ledger with CSV export.

## Progress / evidence
- Branch: `feat/operacion-academia`
- Route T1+T2: delegated writer (2+ non-trivial files).
- T1: commits `8da78fe` (domain + Vitest, strict TDD: RED observed "Failed to load url ./operations", then
  19 tests GREEN) and `5157bac` (migration `20261113120000_academy_operations.sql`, hand-updated
  `types.ts`, landing counts via `course_outline_counts()` RPC).
- T2: strict TDD for `diffEnrollments` and `accessBlockedMessage` (RED then GREEN, 25 tests). `useUpdateStudent`
  now diffs enrollments (no delete/reinsert); StudentForm has "Valor acordado" + confirm before removing an
  enrollment with payments; `create-student` inserts `agreed_price` and rolls back the user on assignment failure;
  Dashboard/CourseViewer gate on `effectiveAccess === 'active'` with state cards + WhatsApp contact.
- Checks: `npm test` 25 passed; `npm run build` OK; `npm run lint` has only pre-existing errors in untouched lines.
- Pending for user: apply the migration to the remote DB (Lovable / SQL editor) and redeploy `create-student`.
  Until applied, landing lesson counts show 0 and the student/admin enrollment queries fail (new columns missing).
- Delivery decisions: payments have no DELETE policy (void only); `modules`/`lessons` SELECT now requires
  `has_course_access` (storage buckets still public, out of scope).

- T3: route delegated writer (2+ non-trivial files). Strict TDD for `src/lib/roster.ts` (rows, KPIs, filters, roll
  call draft helpers; RED "Cannot find module ./roster" then 17 tests GREEN) and `src/lib/money.ts` (COP input).
  Hooks `useEnrollments`, `usePayments`, `useClassSessions` (+ shared `operationsQueries` keys/invalidation);
  presentational components in `src/components/admin/operations/`; containers in `src/pages/admin/CourseGroup.tsx`
  and `src/pages/admin/course-group/`. Entry points: CoursesManager card button and CourseEditor header.
  `RegisterPaymentDialog` is reusable for T4 (targets list + combobox, or locked to one enrollment).
  Checks: `npm test` 50 passed; `npm run build` OK; eslint clean on new files (CoursesManager/CourseEditor keep
  their pre-existing errors). Not exercised in a browser: needs the migration applied on a DB first.

## Review findings (native review of T1+T2, fixed in `fix(db): harden enrollment access automation after review`)
Route: delegated writer (2+ non-trivial files). Migration edited in place (never applied anywhere yet).
1. Payment activation relabelled manual: `recompute_enrollment_access` sets the transaction-local flag
   `app.enrollment_auto = 'on'` around its UPDATE; `enrollment_track_status` labels a change to 'active' as
   'payment' when the flag is on, otherwise 'manual'. Leaving 'active' clears activated_by/activated_at.
2. Recompute on status change: new AFTER UPDATE OF status trigger (WHEN new status = 'pending') calls
   recompute; skipped when the flag is on (no recursion), so un-suspend of a fully paid enrollment activates it.
3. Stale snapshots: `payments_fill_snapshot` now runs BEFORE INSERT OR UPDATE OF enrollment_id; NULL
   enrollment_id (ON DELETE SET NULL) leaves snapshots untouched.
4. Profile status mismatch: `effectiveAccess(enrollment, now, profile?)` returns `account_inactive` when the
   profile is not active (TDD, RED then GREEN); message "Cuenta inactiva"; `useMyEnrollments` passes the
   profile. Profile enabled_from/expires_at are NOT checked on either side (server ignores them too, and the
   default expires_at is now()+1 year, so enforcing it would be a behaviour change).
5. Draft lesson counts: `course_outline_counts()` returns all courses for superadmins; `useCoursesWithStats`
   logs RPC errors and toasts when `notifyOnCountsError` is set (landing stays silent/resilient).
6. Non-atomic enrollment update: moved to SECURITY DEFINER RPC `apply_student_enrollments(_user_id, _items)`
   (superadmin only, one transaction: upsert then delete). `useUpdateStudent` calls it; `diffEnrollments`
   stays in the domain module (tested) but is no longer used by the hook.
7. Tests: `supabase/tests/academy_operations.test.sql` (BEGIN ... ROLLBACK, assertions T1-T10). Written by
   careful reading; NOT executed (no DB access from the writer).

## Next step
T3 Roster + attendance UI.
