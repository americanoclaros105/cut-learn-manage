-- Tests for the academy operations migration (20261113120000_academy_operations.sql).
--
-- Run against a database where the migration is already applied, e.g. in the
-- Supabase SQL editor or with `psql -f supabase/tests/academy_operations.test.sql`.
-- Everything runs inside a transaction that is rolled back, so no data is left
-- behind. Any failed assertion raises an exception and aborts the script.
--
-- Fixtures: auth.users rows are inserted directly; the existing
-- handle_new_user trigger creates the matching profile (status 'active') and
-- the 'student' role.

BEGIN;

DO $$
DECLARE
  u1 UUID := gen_random_uuid();
  u2 UUID := gen_random_uuid();
  u3 UUID := gen_random_uuid();
  c1 UUID;
  c2 UUID;
  c_free UUID;
  e1 UUID;
  e2 UUID;
  e3 UUID;
  e_other UUID;
  e_free UUID;
  p1 UUID;
  p2 UUID;
  p3 UUID;
  p_moved UUID;
  r public.user_course_assignments%ROWTYPE;
  pay public.payments%ROWTYPE;
BEGIN
  -- -------------------------------------------------------------------------
  -- Fixtures
  -- -------------------------------------------------------------------------
  INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES
    (u1, 'academy-test-1-' || u1 || '@example.test', '{"name":"Test Uno"}'::jsonb),
    (u2, 'academy-test-2-' || u2 || '@example.test', '{"name":"Test Dos"}'::jsonb),
    (u3, 'academy-test-3-' || u3 || '@example.test', '{"name":"Test Tres"}'::jsonb);

  IF (SELECT COUNT(*) FROM public.profiles WHERE id IN (u1, u2, u3)) <> 3 THEN
    RAISE EXCEPTION 'fixture: handle_new_user did not create the profiles';
  END IF;

  INSERT INTO public.courses (title, price) VALUES ('Curso Test A', 100000) RETURNING id INTO c1;
  INSERT INTO public.courses (title, price) VALUES ('Curso Test B', 50000) RETURNING id INTO c2;
  INSERT INTO public.courses (title, price) VALUES ('Curso Test Gratis', 0) RETURNING id INTO c_free;

  -- -------------------------------------------------------------------------
  -- 1. New enrollment with price > 0 is pending, defaults the course price,
  --    and gives no access.
  -- -------------------------------------------------------------------------
  INSERT INTO public.user_course_assignments (user_id, course_id)
  VALUES (u1, c1) RETURNING id INTO e1;

  SELECT * INTO r FROM public.user_course_assignments WHERE id = e1;
  IF r.status <> 'pending' THEN
    RAISE EXCEPTION 'T1: expected pending on insert, got %', r.status;
  END IF;
  IF r.agreed_price <> 100000 THEN
    RAISE EXCEPTION 'T1: agreed_price should default to the course price, got %', r.agreed_price;
  END IF;
  IF r.activated_by IS NOT NULL THEN
    RAISE EXCEPTION 'T1: activated_by should be NULL, got %', r.activated_by;
  END IF;
  IF public.has_course_access(u1, c1) THEN
    RAISE EXCEPTION 'T1: pending enrollment must not give access';
  END IF;

  -- -------------------------------------------------------------------------
  -- 2. A partial payment keeps it pending; reaching the agreed price activates
  --    it with activated_by = 'payment'.
  -- -------------------------------------------------------------------------
  INSERT INTO public.payments (enrollment_id, amount, method)
  VALUES (e1, 40000, 'cash') RETURNING id INTO p1;

  SELECT * INTO r FROM public.user_course_assignments WHERE id = e1;
  IF r.status <> 'pending' THEN
    RAISE EXCEPTION 'T2: partial payment must keep pending, got %', r.status;
  END IF;

  INSERT INTO public.payments (enrollment_id, amount, method)
  VALUES (e1, 60000, 'transfer') RETURNING id INTO p2;

  SELECT * INTO r FROM public.user_course_assignments WHERE id = e1;
  IF r.status <> 'active' OR r.activated_by IS DISTINCT FROM 'payment' THEN
    RAISE EXCEPTION 'T2: expected active/payment, got %/%', r.status, r.activated_by;
  END IF;
  IF NOT public.has_course_access(u1, c1) THEN
    RAISE EXCEPTION 'T2: fully paid enrollment must give access';
  END IF;

  -- Payment snapshots were filled from the enrollment.
  SELECT * INTO pay FROM public.payments WHERE id = p2;
  IF pay.user_id <> u1 OR pay.course_id <> c1
     OR pay.student_name <> 'Test Uno' OR pay.course_title <> 'Curso Test A' THEN
    RAISE EXCEPTION 'T2: payment snapshots not filled (%, %, %, %)',
      pay.user_id, pay.course_id, pay.student_name, pay.course_title;
  END IF;

  -- -------------------------------------------------------------------------
  -- 3. Voiding a payment that drops the balance reverts a payment activation.
  -- -------------------------------------------------------------------------
  UPDATE public.payments
  SET voided_at = now(), void_reason = 'test void'
  WHERE id = p2;

  SELECT * INTO r FROM public.user_course_assignments WHERE id = e1;
  IF r.status <> 'pending' OR r.activated_by IS NOT NULL OR r.activated_at IS NOT NULL THEN
    RAISE EXCEPTION 'T3: expected pending with cleared activation, got %/%/%',
      r.status, r.activated_by, r.activated_at;
  END IF;
  IF public.has_course_access(u1, c1) THEN
    RAISE EXCEPTION 'T3: voided payment must remove access';
  END IF;

  -- -------------------------------------------------------------------------
  -- 4. Re-paying after a void activates again as 'payment' (not 'manual'),
  --    and the flag set by the automation does not leak.
  -- -------------------------------------------------------------------------
  INSERT INTO public.payments (enrollment_id, amount, method)
  VALUES (e1, 60000, 'nequi') RETURNING id INTO p3;

  SELECT * INTO r FROM public.user_course_assignments WHERE id = e1;
  IF r.status <> 'active' OR r.activated_by IS DISTINCT FROM 'payment' THEN
    RAISE EXCEPTION 'T4: expected active/payment after re-paying, got %/%', r.status, r.activated_by;
  END IF;

  -- Suspend: access is removed and the activation source is cleared.
  UPDATE public.user_course_assignments SET status = 'suspended' WHERE id = e1;
  SELECT * INTO r FROM public.user_course_assignments WHERE id = e1;
  IF r.status <> 'suspended' OR r.activated_by IS NOT NULL THEN
    RAISE EXCEPTION 'T4: expected suspended with no activation source, got %/%', r.status, r.activated_by;
  END IF;
  IF public.has_course_access(u1, c1) THEN
    RAISE EXCEPTION 'T4: suspended enrollment must not give access';
  END IF;

  -- Un-suspend to pending: fully paid, so the automation activates it at once
  -- and labels it 'payment' (this is the relabelled-as-manual regression).
  UPDATE public.user_course_assignments SET status = 'pending' WHERE id = e1;
  SELECT * INTO r FROM public.user_course_assignments WHERE id = e1;
  IF r.status <> 'active' OR r.activated_by IS DISTINCT FROM 'payment' THEN
    RAISE EXCEPTION 'T4: suspend -> pending with full payment should be active/payment, got %/%',
      r.status, r.activated_by;
  END IF;
  IF NOT public.has_course_access(u1, c1) THEN
    RAISE EXCEPTION 'T4: reactivated enrollment must give access';
  END IF;

  -- And voiding afterwards still reverts it (it was not mislabelled manual).
  UPDATE public.payments SET voided_at = now(), void_reason = 'test void 2' WHERE id = p3;
  SELECT * INTO r FROM public.user_course_assignments WHERE id = e1;
  IF r.status <> 'pending' THEN
    RAISE EXCEPTION 'T4: void after re-activation should revert to pending, got %', r.status;
  END IF;

  -- -------------------------------------------------------------------------
  -- 5. Manual activation survives voiding payments.
  -- -------------------------------------------------------------------------
  INSERT INTO public.user_course_assignments (user_id, course_id)
  VALUES (u2, c1) RETURNING id INTO e2;

  UPDATE public.user_course_assignments SET status = 'active' WHERE id = e2;
  SELECT * INTO r FROM public.user_course_assignments WHERE id = e2;
  IF r.status <> 'active' OR r.activated_by IS DISTINCT FROM 'manual' THEN
    RAISE EXCEPTION 'T5: expected active/manual, got %/%', r.status, r.activated_by;
  END IF;
  IF NOT public.has_course_access(u2, c1) THEN
    RAISE EXCEPTION 'T5: manual activation must give access';
  END IF;

  INSERT INTO public.payments (enrollment_id, amount, method)
  VALUES (e2, 100000, 'card') RETURNING id INTO p1;
  UPDATE public.payments SET voided_at = now(), void_reason = 'manual survives' WHERE id = p1;

  SELECT * INTO r FROM public.user_course_assignments WHERE id = e2;
  IF r.status <> 'active' OR r.activated_by IS DISTINCT FROM 'manual' THEN
    RAISE EXCEPTION 'T5: manual activation must survive a void, got %/%', r.status, r.activated_by;
  END IF;

  -- -------------------------------------------------------------------------
  -- 6. agreed_price = 0 activates on insert (explicit 0 and free course).
  -- -------------------------------------------------------------------------
  INSERT INTO public.user_course_assignments (user_id, course_id, agreed_price)
  VALUES (u3, c1, 0) RETURNING id INTO e3;
  SELECT * INTO r FROM public.user_course_assignments WHERE id = e3;
  IF r.status <> 'active' OR r.activated_by IS DISTINCT FROM 'payment' OR r.agreed_price <> 0 THEN
    RAISE EXCEPTION 'T6: explicit price 0 should activate on insert, got %/%/%',
      r.status, r.activated_by, r.agreed_price;
  END IF;
  IF NOT public.has_course_access(u3, c1) THEN
    RAISE EXCEPTION 'T6: free enrollment must give access';
  END IF;

  INSERT INTO public.user_course_assignments (user_id, course_id)
  VALUES (u1, c_free) RETURNING id INTO e_free;
  SELECT * INTO r FROM public.user_course_assignments WHERE id = e_free;
  IF r.status <> 'active' THEN
    RAISE EXCEPTION 'T6: free course enrollment should activate on insert, got %', r.status;
  END IF;

  -- -------------------------------------------------------------------------
  -- 7. Changing the agreed price re-evaluates access.
  -- -------------------------------------------------------------------------
  UPDATE public.user_course_assignments SET agreed_price = 250000 WHERE id = e3;
  SELECT * INTO r FROM public.user_course_assignments WHERE id = e3;
  IF r.status <> 'pending' THEN
    RAISE EXCEPTION 'T7: raising the price above paid should revert to pending, got %', r.status;
  END IF;
  UPDATE public.user_course_assignments SET agreed_price = 0 WHERE id = e3;
  SELECT * INTO r FROM public.user_course_assignments WHERE id = e3;
  IF r.status <> 'active' OR r.activated_by IS DISTINCT FROM 'payment' THEN
    RAISE EXCEPTION 'T7: lowering the price to 0 should activate as payment, got %/%',
      r.status, r.activated_by;
  END IF;

  -- -------------------------------------------------------------------------
  -- 8. Snapshots are refreshed when a payment is moved to another enrollment.
  -- -------------------------------------------------------------------------
  INSERT INTO public.user_course_assignments (user_id, course_id)
  VALUES (u3, c2) RETURNING id INTO e_other;

  INSERT INTO public.payments (enrollment_id, amount, method)
  VALUES (e1, 10000, 'cash') RETURNING id INTO p_moved;

  UPDATE public.payments SET enrollment_id = e_other WHERE id = p_moved;
  SELECT * INTO pay FROM public.payments WHERE id = p_moved;
  IF pay.user_id <> u3 OR pay.course_id <> c2
     OR pay.student_name <> 'Test Tres' OR pay.course_title <> 'Curso Test B' THEN
    RAISE EXCEPTION 'T8: snapshots not refreshed on reassign (%, %, %, %)',
      pay.user_id, pay.course_id, pay.student_name, pay.course_title;
  END IF;

  -- Deleting the enrollment keeps the payment and its snapshots (SET NULL).
  DELETE FROM public.user_course_assignments WHERE id = e_other;
  SELECT * INTO pay FROM public.payments WHERE id = p_moved;
  IF pay.enrollment_id IS NOT NULL OR pay.student_name <> 'Test Tres' OR pay.course_title <> 'Curso Test B' THEN
    RAISE EXCEPTION 'T8: payment/snapshots must survive enrollment deletion (%, %, %)',
      pay.enrollment_id, pay.student_name, pay.course_title;
  END IF;

  -- -------------------------------------------------------------------------
  -- 9. has_course_access also requires an active profile and valid dates.
  -- -------------------------------------------------------------------------
  IF NOT public.has_course_access(u3, c1) THEN
    RAISE EXCEPTION 'T9: precondition failed, u3 should have access to c1';
  END IF;

  UPDATE public.profiles SET status = 'inactive' WHERE id = u3;
  IF public.has_course_access(u3, c1) THEN
    RAISE EXCEPTION 'T9: inactive profile must not have access';
  END IF;
  UPDATE public.profiles SET status = 'active' WHERE id = u3;
  IF NOT public.has_course_access(u3, c1) THEN
    RAISE EXCEPTION 'T9: reactivated profile should have access again';
  END IF;

  UPDATE public.user_course_assignments SET enabled_from = now() + interval '1 day' WHERE id = e3;
  IF public.has_course_access(u3, c1) THEN
    RAISE EXCEPTION 'T9: enrollment not started yet must not give access';
  END IF;
  UPDATE public.user_course_assignments
  SET enabled_from = now() - interval '2 days', expires_at = now() - interval '1 day'
  WHERE id = e3;
  IF public.has_course_access(u3, c1) THEN
    RAISE EXCEPTION 'T9: expired enrollment must not give access';
  END IF;

  -- No access to a course the user is not enrolled in.
  IF public.has_course_access(u2, c2) THEN
    RAISE EXCEPTION 'T9: no enrollment must mean no access';
  END IF;

  -- -------------------------------------------------------------------------
  -- 10. apply_student_enrollments rejects non-superadmins (auth.uid() is NULL
  --     in this script, so it is not a superadmin).
  -- -------------------------------------------------------------------------
  BEGIN
    PERFORM public.apply_student_enrollments(u1, '[]'::jsonb);
    RAISE EXCEPTION 'T10: apply_student_enrollments must reject callers that are not superadmin';
  EXCEPTION
    WHEN insufficient_privilege THEN NULL;
  END;

  -- -------------------------------------------------------------------------
  -- 11. apply_student_enrollments as superadmin: the upsert keeps id, status
  --     and price when omitted; new items get their agreed price; courses
  --     missing from the list are unenrolled and payments keep snapshots.
  -- -------------------------------------------------------------------------
  INSERT INTO public.user_roles (user_id, role) VALUES (u2, 'superadmin');
  PERFORM set_config('request.jwt.claims', json_build_object('sub', u2, 'role', 'authenticated')::text, true);

  SELECT * INTO r FROM public.user_course_assignments WHERE id = e1;

  PERFORM public.apply_student_enrollments(
    u1,
    jsonb_build_array(
      jsonb_build_object('course_id', c1),
      jsonb_build_object('course_id', c2, 'agreed_price', 70000)
    )
  );

  IF NOT EXISTS (
    SELECT 1 FROM public.user_course_assignments
    WHERE id = e1 AND status = r.status AND agreed_price = r.agreed_price
  ) THEN
    RAISE EXCEPTION 'T11: upsert must keep the existing enrollment id, status and agreed price';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.user_course_assignments
    WHERE user_id = u1 AND course_id = c2 AND agreed_price = 70000 AND status = 'pending'
  ) THEN
    RAISE EXCEPTION 'T11: new enrollment must be pending with the given agreed price';
  END IF;
  IF EXISTS (SELECT 1 FROM public.user_course_assignments WHERE id = e_free) THEN
    RAISE EXCEPTION 'T11: enrollment missing from the list must be removed';
  END IF;

  PERFORM public.apply_student_enrollments(u1, jsonb_build_array(jsonb_build_object('course_id', c2)));

  IF EXISTS (SELECT 1 FROM public.user_course_assignments WHERE id = e1) THEN
    RAISE EXCEPTION 'T11: course missing from the list must be unenrolled';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.payments
    WHERE id IN (p2, p3)
      AND (enrollment_id IS NOT NULL OR user_id IS DISTINCT FROM u1 OR student_name IS DISTINCT FROM 'Test Uno')
  ) THEN
    RAISE EXCEPTION 'T11: payments of a removed enrollment must be kept with their snapshots';
  END IF;

  PERFORM set_config('request.jwt.claims', '', true);

  RAISE NOTICE 'academy_operations tests passed';
END;
$$;

ROLLBACK;
