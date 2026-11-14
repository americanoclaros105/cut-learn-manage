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
- [x] T4 Accounting UI: `/admin/contabilidad` with KPIs, ledger, filters, register/void payment, CSV export.
- [ ] T5 Verification: build, lint, tests, browser walkthrough.
- [x] T6 Student full page (user request 2026-11-13): replace the StudentForm modal with
      `/admin/estudiantes/nuevo` and `/admin/estudiantes/:studentId` — profile, account access, enrollments
      with payments/balance/status actions, payment history, attendance, course progress, password, delete.
      Migration applied to production by the user (dry run passed 11/11).
- [x] T7a Course groups (cohorts) — DB + domain: new migration `course_groups` (name, dates, location,
      instructor, capacity, optional price, notes, color, archived), `course_group_schedules` (weekday,
      start/end time, multiple per group), `user_course_assignments.group_id`, `class_sessions.group_id` +
      status (scheduled/cancelled), RPCs to generate sessions from the schedule, transfer a student between
      groups, capacity guard; RLS; SQL tests; pure schedule/status logic with Vitest.
- [x] T7b Groups admin UI: course → groups list, group detail (students, calendar + attendance, finances),
      roster/attendance scoped by group, "Generar calendario", transfer student.
- [ ] T7c Groups everywhere else: group picker in student page/enrollment dialogs and create page,
      weekly agenda `/admin/agenda` across all groups, student side shows group, schedule and next classes.

Group decisions (user gave freedom, 2026-11-13): a student is in at most one group per course
(UNIQUE(user_id, course_id) kept; moving = transfer, payments untouched); content access stays per course;
group dates prefill enrollment access dates; existing enrollments/sessions stay with group_id NULL ("Sin grupo").

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

- T4: route delegated writer (2+ non-trivial files). Strict TDD for `src/lib/accounting.ts` (period ranges, ledger
  filter/sort, KPIs by method/course, receivables, WhatsApp reminder text, CSV with BOM + `;` + formula
  neutralization; RED "Cannot find module ./accounting" then 68 tests GREEN). `/admin/contabilidad`
  (`src/pages/admin/Accounting.tsx`) with period selector, KPI cards, filterable ledger with "cargar mas",
  void dialog (reason required), receivables tab and CSV export; sidebar entry "Contabilidad". Register-payment
  dialog is the same component as in the roster (enrollment picked from a searchable student/course list).
  The ledger is loaded in full (paged 1000 at a time) and filtered client side; fine for an academy-sized dataset.
  Checks: `npm test` 68 passed; `npm run build` OK; eslint clean on new/touched files. Not exercised in a browser
  (needs the migration applied).

- T6: route delegated writer (2+ non-trivial files). Strict TDD for `src/lib/studentDetail.ts` (tabs, per-enrollment
  summary, KPIs, delete impact + typed confirmation, password generator, initials; RED "Failed to load url
  ./studentDetail" then GREEN) and `src/lib/studentSchemas.ts` (zod schemas + day<->ISO; RED then GREEN, 95 tests).
  Commits `86bacc7` (domain + hooks) and `3f6d4ad` (pages). Routes `/admin/estudiantes/nuevo` and
  `/admin/estudiantes/:studentId?tab=resumen|datos|acceso|pagos|asistencia`; containers in `src/pages/admin/student/`,
  presentational pieces in `src/components/admin/students/detail/`. StudentForm modal and DeleteDialog removed;
  StudentsManager and StudentCard navigate to the pages. Status-action copy shared via
  `operations/enrollmentStatusActions.tsx` (RosterTab now imports it); `LedgerTable` got `hideStudent`.
  Limits: the student email is not stored in `profiles` and no edge function reads/changes it, so the page does not
  show it (create form sets it once). No route blocker with BrowserRouter: unsaved edits are guarded on the back link
  and `beforeunload`; sidebar links are not guarded (forms stay mounted across tabs). Not exercised in a browser.
  Checks: `npm test` 95 passed; `npm run build` OK; `npx tsc --noEmit -p tsconfig.app.json` clean; eslint clean on all
  new/touched files.

- T7a: route delegated writer (2+ non-trivial files). Commits `4d0b3b0` (migration `20261114090000_course_groups.sql` +
  `supabase/tests/course_groups.test.sql`) and `d70376e` (domain, types, hooks). Strict TDD for `src/lib/groups.ts`
  (expandSchedule, groupPhase, formatSchedule, seatsLeft/isGroupFull, labels, defaultAccessDates, groupErrorMessage;
  RED "Failed to load url ./groups" then 119 tests GREEN). DB objects: `course_groups`, `course_group_schedules`
  (overlap trigger), `user_course_assignments.group_id`, `class_sessions.group_id/status/cancel_reason/generated`
  (+ unique partial index on (group_id, starts_at)), view `group_occupancy` (security_invoker, superadmin only),
  RPCs `generate_group_sessions`, `transfer_enrollment_group`, `replace_group_schedules` (atomic schedule swap),
  helper `user_in_group`, `apply_student_enrollments` with optional `group_id` (key absent keeps the group, null clears it).
  Trigger ordering: BEFORE triggers fire alphabetically, so `enrollment_apply_group_trg` (group price + course match +
  capacity) runs before `enrollment_set_defaults_trg` (course price fallback) and `enrollment_track_status_trg`.
  Capacity counts non-cancelled enrollments, locks the group row FOR UPDATE, and excludes the same (user, course) pair so
  INSERT ... ON CONFLICT in apply_student_enrollments is not double counted. Session times use
  `(date + time) AT TIME ZONE 'America/Bogota'`. Hooks: `useCourseGroups` (list/one/save/archive/delete/generate/transfer),
  `useCourseSessions(courseId, groupId?)` filter (undefined = all, null = Sin grupo), `useSetSessionCancelled`,
  `useEnrollStudent` accepts `groupId`. Dry-run bundles (gitignored) in `supabase/manual/3_grupos_prueba_en_seco.sql` and
  `4_grupos_aplicar.sql`. The SQL was written by careful reading and NOT executed: run the dry run before applying.
  Checks: `npm test` 119 passed; `npm run build` OK; `npx tsc --noEmit -p tsconfig.app.json` clean; eslint clean on touched files.

- T7b: route delegated writer (2+ non-trivial files). Commits `b5d4f40` (pure helpers, strict TDD: RED "Failed to load url
  ./groupViews" / "Cannot find module ./groupForm", then GREEN; later RED for `filterByGroup`, bulk `transferOptions` and
  `monthsBetween`) and `ce39329` (UI). New pure modules `src/lib/groupForm.ts` (next group name/color, schedule builder
  rows + validation + overlap, rows<->slots, live preview text, month grid) and `src/lib/groupViews.ts` (sort/filter groups,
  occupancy, rows by group, today/next session, session summary, transfer options, balances, reminders, ledger filter);
  175 tests. Routes: `/admin/cursos/:courseId/grupos` (hub, canonical; `/grupo` redirects), `.../grupos/nuevo`,
  `.../grupos/:groupId` (`?tab=estudiantes|calendario|finanzas&clase=<sessionId>`), `.../grupos/:groupId/editar`.
  Containers in `src/pages/admin/groups/` (`GroupsHub`, `GroupFormPage`, `GroupDetail`, `GroupFinanceTab`), presentational
  pieces in `src/components/admin/groups/`, shared hook `useCourseOperations`. Reused and parametrized by group:
  `RosterTab` (group column/filter, selection + bulk transfer/WhatsApp reminders, scoped enroll with group price and
  `defaultAccessDates`), `RosterTable`, `AttendanceTab` (calendar/list/matrix, generate calendar, extra class, cancel/restore),
  `SessionsList`, `EnrollStudentDialog`, `NewSessionDialog`, `RegisterPaymentDialog`, `VoidPaymentDialog`, `LedgerTable`,
  `buildLedgerCsv`. Old `CourseGroup.tsx` removed; legacy classes without group stay reachable in the hub tab "Clases sin grupo".
  Checks: `npm test` 175 passed; `npm run build` OK; `npx tsc --noEmit -p tsconfig.app.json` clean; eslint clean on all
  touched/new files except pre-existing errors in untouched lines of `CourseEditor.tsx`. Not exercised in a browser (groups
  migration not applied anywhere yet).

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
T7c (groups everywhere else). T5: browser walkthrough once migrations are applied.
