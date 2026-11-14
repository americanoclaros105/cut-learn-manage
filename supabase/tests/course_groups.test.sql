-- Tests for the course groups migration (20261114090000_course_groups.sql).
--
-- Run against a database where BOTH migrations are applied, e.g. in the
-- Supabase SQL editor or with `psql -f supabase/tests/course_groups.test.sql`.
-- Everything runs inside a transaction that is rolled back, so no data is left
-- behind. Any failed assertion raises an exception and aborts the script.
--
-- Fixtures: auth.users rows are inserted directly; handle_new_user creates the
-- profiles. A superadmin is simulated with a user_roles row plus
-- request.jwt.claims (same technique as academy_operations.test.sql, T11).
-- Group dates are in 2030 so "future" sessions stay future for years.
-- 2030-01-07 is a Monday.

BEGIN;

DO $$
DECLARE
  u1 UUID := gen_random_uuid();
  u2 UUID := gen_random_uuid();
  u3 UUID := gen_random_uuid();
  u4 UUID := gen_random_uuid(); -- superadmin
  u5 UUID := gen_random_uuid();
  c1 UUID;
  c2 UUID;
  gp UUID;      -- group with its own price
  gn UUID;      -- group without price
  gcap UUID;    -- capacity 2
  gother UUID;  -- group of another course
  gsch UUID;    -- group used for schedule generation
  e1 UUID;
  e2 UUID;
  e3 UUID;
  e5 UUID;
  s_mon UUID;
  s_wed UUID;
  r public.user_course_assignments%ROWTYPE;
  n INTEGER;
  occ RECORD;
  msg TEXT;
BEGIN
  -- -------------------------------------------------------------------------
  -- Fixtures
  -- -------------------------------------------------------------------------
  INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES
    (u1, 'groups-test-1-' || u1 || '@example.test', '{"name":"Grupo Uno"}'::jsonb),
    (u2, 'groups-test-2-' || u2 || '@example.test', '{"name":"Grupo Dos"}'::jsonb),
    (u3, 'groups-test-3-' || u3 || '@example.test', '{"name":"Grupo Tres"}'::jsonb),
    (u4, 'groups-test-4-' || u4 || '@example.test', '{"name":"Grupo Admin"}'::jsonb),
    (u5, 'groups-test-5-' || u5 || '@example.test', '{"name":"Grupo Cinco"}'::jsonb);

  INSERT INTO public.courses (title, price) VALUES ('Curso Grupos A', 100000) RETURNING id INTO c1;
  INSERT INTO public.courses (title, price) VALUES ('Curso Grupos B', 50000) RETURNING id INTO c2;

  INSERT INTO public.course_groups (course_id, name, start_date, end_date, price, location)
  VALUES (c1, 'Grupo con precio', '2030-01-07', '2030-03-01', 80000, 'Sede Norte') RETURNING id INTO gp;
  INSERT INTO public.course_groups (course_id, name, start_date, end_date)
  VALUES (c1, 'Grupo sin precio', '2030-01-07', '2030-03-01') RETURNING id INTO gn;
  INSERT INTO public.course_groups (course_id, name, start_date, end_date, capacity)
  VALUES (c1, 'Grupo cupo 2', '2030-01-07', '2030-03-01', 2) RETURNING id INTO gcap;
  INSERT INTO public.course_groups (course_id, name, start_date, end_date)
  VALUES (c2, 'Grupo otro curso', '2030-01-07', '2030-03-01') RETURNING id INTO gother;
  INSERT INTO public.course_groups (course_id, name, start_date, end_date, location)
  VALUES (c1, 'Grupo calendario', '2030-01-07', '2030-01-20', 'Sede Centro') RETURNING id INTO gsch;

  INSERT INTO public.user_roles (user_id, role) VALUES (u4, 'superadmin');

  -- -------------------------------------------------------------------------
  -- G1. The group price is the default agreed price; without group price the
  --     course price applies; an explicit price always wins.
  -- -------------------------------------------------------------------------
  INSERT INTO public.user_course_assignments (user_id, course_id, group_id)
  VALUES (u1, c1, gp) RETURNING id INTO e1;
  SELECT * INTO r FROM public.user_course_assignments WHERE id = e1;
  IF r.agreed_price <> 80000 OR r.group_id IS DISTINCT FROM gp OR r.status <> 'pending' THEN
    RAISE EXCEPTION 'G1: group price should default agreed_price, got %/%/%',
      r.agreed_price, r.group_id, r.status;
  END IF;

  INSERT INTO public.user_course_assignments (user_id, course_id, group_id)
  VALUES (u2, c1, gn) RETURNING id INTO e2;
  SELECT * INTO r FROM public.user_course_assignments WHERE id = e2;
  IF r.agreed_price <> 100000 THEN
    RAISE EXCEPTION 'G1: group without price should fall back to the course price, got %', r.agreed_price;
  END IF;

  INSERT INTO public.user_course_assignments (user_id, course_id, group_id, agreed_price)
  VALUES (u3, c1, gp, 0) RETURNING id INTO e3;
  SELECT * INTO r FROM public.user_course_assignments WHERE id = e3;
  IF r.agreed_price <> 0 OR r.status <> 'active' THEN
    RAISE EXCEPTION 'G1: explicit price 0 must win over the group price and activate, got %/%',
      r.agreed_price, r.status;
  END IF;

  -- -------------------------------------------------------------------------
  -- G2. The group must belong to the enrollment's course (insert and update);
  --     same for sessions.
  -- -------------------------------------------------------------------------
  BEGIN
    INSERT INTO public.user_course_assignments (user_id, course_id, group_id)
    VALUES (u4, c1, gother);
    RAISE EXCEPTION 'G2: inserting an enrollment into a group of another course must fail';
  EXCEPTION
    WHEN check_violation THEN NULL;
  END;

  BEGIN
    UPDATE public.user_course_assignments SET group_id = gother WHERE id = e2;
    RAISE EXCEPTION 'G2: moving an enrollment to a group of another course must fail';
  EXCEPTION
    WHEN check_violation THEN NULL;
  END;

  BEGIN
    INSERT INTO public.class_sessions (course_id, group_id, starts_at)
    VALUES (c1, gother, '2030-02-01 10:00-05');
    RAISE EXCEPTION 'G2: a session with a group of another course must fail';
  EXCEPTION
    WHEN check_violation THEN NULL;
  END;

  -- -------------------------------------------------------------------------
  -- G3. Capacity: a full group rejects inserts and moves; cancelled
  --     enrollments do not take a seat.
  -- -------------------------------------------------------------------------
  INSERT INTO public.user_course_assignments (user_id, course_id, group_id)
  VALUES (u5, c1, gcap) RETURNING id INTO e5;
  -- e1 moves into gcap (second seat).
  UPDATE public.user_course_assignments SET group_id = gcap WHERE id = e1;

  BEGIN
    UPDATE public.user_course_assignments SET group_id = gcap WHERE id = e2;
    RAISE EXCEPTION 'G3: moving into a full group must fail';
  EXCEPTION
    WHEN raise_exception THEN
      GET STACKED DIAGNOSTICS msg = MESSAGE_TEXT;
      IF msg <> 'El grupo está lleno' THEN
        RAISE EXCEPTION 'G3: unexpected error on move: %', msg;
      END IF;
  END;

  -- A new student cannot join the full group either (u4 is only a fixture user).
  BEGIN
    INSERT INTO public.user_course_assignments (user_id, course_id, group_id)
    VALUES (u4, c1, gcap);
    RAISE EXCEPTION 'G3: inserting into a full group must fail';
  EXCEPTION
    WHEN raise_exception THEN
      GET STACKED DIAGNOSTICS msg = MESSAGE_TEXT;
      IF msg <> 'El grupo está lleno' THEN
        RAISE EXCEPTION 'G3: unexpected error on insert: %', msg;
      END IF;
  END;

  -- Cancelling an enrollment frees its seat.
  UPDATE public.user_course_assignments SET status = 'cancelled' WHERE id = e5;
  UPDATE public.user_course_assignments SET group_id = gcap WHERE id = e2;
  SELECT * INTO r FROM public.user_course_assignments WHERE id = e2;
  IF r.group_id IS DISTINCT FROM gcap THEN
    RAISE EXCEPTION 'G3: a cancelled enrollment must free its seat';
  END IF;

  -- -------------------------------------------------------------------------
  -- G4. generate_group_sessions: superadmin only.
  -- -------------------------------------------------------------------------
  PERFORM set_config('request.jwt.claims', json_build_object('sub', u1, 'role', 'authenticated')::text, true);
  BEGIN
    PERFORM public.generate_group_sessions(gsch);
    RAISE EXCEPTION 'G4: generate_group_sessions must reject non-superadmins';
  EXCEPTION
    WHEN insufficient_privilege THEN NULL;
  END;
  BEGIN
    PERFORM public.transfer_enrollment_group(e2, gp);
    RAISE EXCEPTION 'G4: transfer_enrollment_group must reject non-superadmins';
  EXCEPTION
    WHEN insufficient_privilege THEN NULL;
  END;
  BEGIN
    PERFORM public.replace_group_schedules(gsch, '[]'::jsonb);
    RAISE EXCEPTION 'G4: replace_group_schedules must reject non-superadmins';
  EXCEPTION
    WHEN insufficient_privilege THEN NULL;
  END;
  -- group_occupancy shows nothing to non-superadmins.
  SELECT COUNT(*) INTO n FROM public.group_occupancy;
  IF n <> 0 THEN
    RAISE EXCEPTION 'G4: group_occupancy must be empty for non-superadmins, got % rows', n;
  END IF;

  -- From here on the caller is the superadmin u4.
  PERFORM set_config('request.jwt.claims', json_build_object('sub', u4, 'role', 'authenticated')::text, true);

  -- -------------------------------------------------------------------------
  -- G5. Schedules: overlap on the same weekday is rejected; replace is atomic.
  -- -------------------------------------------------------------------------
  PERFORM public.replace_group_schedules(gsch, jsonb_build_array(
    jsonb_build_object('weekday', 1, 'start_time', '18:00', 'end_time', '20:00'),
    jsonb_build_object('weekday', 3, 'start_time', '18:00', 'end_time', '20:00')
  ));
  SELECT COUNT(*) INTO n FROM public.course_group_schedules WHERE group_id = gsch;
  IF n <> 2 THEN
    RAISE EXCEPTION 'G5: expected 2 schedule rows, got %', n;
  END IF;

  BEGIN
    PERFORM public.replace_group_schedules(gsch, jsonb_build_array(
      jsonb_build_object('weekday', 2, 'start_time', '08:00', 'end_time', '10:00'),
      jsonb_build_object('weekday', 2, 'start_time', '09:00', 'end_time', '11:00')
    ));
    RAISE EXCEPTION 'G5: overlapping slots on the same weekday must fail';
  EXCEPTION
    WHEN check_violation THEN NULL;
  END;
  -- The failed replace rolled back: the previous schedule is intact.
  SELECT COUNT(*) INTO n FROM public.course_group_schedules WHERE group_id = gsch AND weekday IN (1, 3);
  IF n <> 2 THEN
    RAISE EXCEPTION 'G5: a failed replace must keep the previous schedule, got % rows', n;
  END IF;

  -- Two non-overlapping slots on the same day are fine.
  INSERT INTO public.course_group_schedules (group_id, weekday, start_time, end_time)
  VALUES (gsch, 1, '20:00', '21:00');
  DELETE FROM public.course_group_schedules
  WHERE group_id = gsch AND weekday = 1 AND start_time = '20:00';

  -- -------------------------------------------------------------------------
  -- G6. Generating 2030-01-07 .. 2030-01-20 (Mon + Wed) gives 4 sessions with
  --     Bogota wall-clock times (UTC-5), location from the group, generated.
  -- -------------------------------------------------------------------------
  n := public.generate_group_sessions(gsch);
  IF n <> 4 THEN
    RAISE EXCEPTION 'G6: expected 4 generated sessions, got %', n;
  END IF;

  SELECT COUNT(*) INTO n
  FROM public.class_sessions
  WHERE group_id = gsch
    AND generated
    AND status = 'scheduled'
    AND course_id = c1
    AND location = 'Sede Centro'
    AND (starts_at, ends_at) IN (
      (timestamptz '2030-01-07 18:00-05', timestamptz '2030-01-07 20:00-05'),
      (timestamptz '2030-01-09 18:00-05', timestamptz '2030-01-09 20:00-05'),
      (timestamptz '2030-01-14 18:00-05', timestamptz '2030-01-14 20:00-05'),
      (timestamptz '2030-01-16 18:00-05', timestamptz '2030-01-16 20:00-05')
    );
  IF n <> 4 THEN
    RAISE EXCEPTION 'G6: generated sessions have the wrong times/flags (% of 4 match)', n;
  END IF;

  -- Idempotent: a second run inserts nothing.
  n := public.generate_group_sessions(gsch);
  IF n <> 0 THEN
    RAISE EXCEPTION 'G6: second run must insert 0, got %', n;
  END IF;

  -- A new Friday slot adds only the Fridays (2030-01-11 and 2030-01-18).
  PERFORM public.replace_group_schedules(gsch, jsonb_build_array(
    jsonb_build_object('weekday', 1, 'start_time', '18:00', 'end_time', '20:00'),
    jsonb_build_object('weekday', 3, 'start_time', '18:00', 'end_time', '20:00'),
    jsonb_build_object('weekday', 5, 'start_time', '09:00', 'end_time', '12:00')
  ));
  n := public.generate_group_sessions(gsch);
  IF n <> 2 THEN
    RAISE EXCEPTION 'G6: adding Fridays should insert 2 sessions, got %', n;
  END IF;

  -- -------------------------------------------------------------------------
  -- G7. _replace_future keeps sessions with attendance and cancelled ones.
  --     State now: Mon 7,14  Wed 9,16  Fri 11,18  (6 sessions).
  -- -------------------------------------------------------------------------
  SELECT id INTO s_mon FROM public.class_sessions
  WHERE group_id = gsch AND starts_at = timestamptz '2030-01-07 18:00-05';
  SELECT id INTO s_wed FROM public.class_sessions
  WHERE group_id = gsch AND starts_at = timestamptz '2030-01-09 18:00-05';

  INSERT INTO public.attendance (session_id, user_id, status) VALUES (s_mon, u1, 'present');
  UPDATE public.class_sessions SET status = 'cancelled', cancel_reason = 'Festivo' WHERE id = s_wed;

  -- Drop Mondays from the schedule and rebuild the future.
  PERFORM public.replace_group_schedules(gsch, jsonb_build_array(
    jsonb_build_object('weekday', 3, 'start_time', '18:00', 'end_time', '20:00'),
    jsonb_build_object('weekday', 5, 'start_time', '09:00', 'end_time', '12:00')
  ));
  n := public.generate_group_sessions(gsch, true);
  -- Deleted (scheduled, no attendance): Mon 14, Wed 16, Fri 11, Fri 18.
  -- Re-inserted: Wed 16, Fri 11, Fri 18 (Wed 9 is cancelled and kept).
  IF n <> 3 THEN
    RAISE EXCEPTION 'G7: expected 3 re-inserted sessions, got %', n;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.class_sessions WHERE id = s_mon) THEN
    RAISE EXCEPTION 'G7: a session with attendance must survive _replace_future';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.class_sessions
    WHERE id = s_wed AND status = 'cancelled' AND cancel_reason = 'Festivo'
  ) THEN
    RAISE EXCEPTION 'G7: a cancelled session must survive _replace_future untouched';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.class_sessions
    WHERE group_id = gsch AND starts_at = timestamptz '2030-01-14 18:00-05'
  ) THEN
    RAISE EXCEPTION 'G7: the dropped Monday without attendance must be gone';
  END IF;
  SELECT COUNT(*) INTO n FROM public.class_sessions WHERE group_id = gsch;
  IF n <> 5 THEN
    RAISE EXCEPTION 'G7: expected 5 sessions after the rebuild, got %', n;
  END IF;

  -- Legacy / manual sessions of the course are never touched.
  INSERT INTO public.class_sessions (course_id, starts_at) VALUES (c1, '2030-02-04 10:00-05');
  -- Rebuilding with an unchanged schedule re-inserts the 3 deletable sessions.
  n := public.generate_group_sessions(gsch, true);
  IF n <> 3 THEN
    RAISE EXCEPTION 'G7: rebuilding with an unchanged schedule must re-insert 3, got %', n;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.class_sessions
    WHERE course_id = c1 AND group_id IS NULL AND starts_at = timestamptz '2030-02-04 10:00-05'
  ) THEN
    RAISE EXCEPTION 'G7: sessions without group must not be touched';
  END IF;

  -- -------------------------------------------------------------------------
  -- G8. transfer_enrollment_group keeps payments and status; validates course
  --     and capacity.
  -- -------------------------------------------------------------------------
  INSERT INTO public.payments (enrollment_id, amount, method) VALUES (e1, 80000, 'cash');
  SELECT * INTO r FROM public.user_course_assignments WHERE id = e1;
  IF r.status <> 'active' THEN
    RAISE EXCEPTION 'G8: precondition failed, e1 should be active after paying 80000, got %', r.status;
  END IF;

  -- e1 is in gcap (full with e1+e2); move it to gp.
  PERFORM public.transfer_enrollment_group(e1, gp);
  SELECT * INTO r FROM public.user_course_assignments WHERE id = e1;
  IF r.group_id IS DISTINCT FROM gp OR r.status <> 'active' OR r.activated_by IS DISTINCT FROM 'payment' THEN
    RAISE EXCEPTION 'G8: transfer must move the group and keep status, got %/%/%',
      r.group_id, r.status, r.activated_by;
  END IF;
  SELECT COUNT(*) INTO n FROM public.payments WHERE enrollment_id = e1 AND voided_at IS NULL AND amount = 80000;
  IF n <> 1 THEN
    RAISE EXCEPTION 'G8: payments must be untouched by a transfer, got % rows', n;
  END IF;

  -- Different course: rejected.
  BEGIN
    PERFORM public.transfer_enrollment_group(e1, gother);
    RAISE EXCEPTION 'G8: transfer to a group of another course must fail';
  EXCEPTION
    WHEN check_violation THEN NULL;
  END;

  -- gcap now holds only e2 (e5 is cancelled): e1 takes the second seat.
  PERFORM public.transfer_enrollment_group(e1, gcap);
  BEGIN
    PERFORM public.transfer_enrollment_group(e3, gcap); -- would be the third
    RAISE EXCEPTION 'G8: transfer into a full group must fail';
  EXCEPTION
    WHEN raise_exception THEN
      GET STACKED DIAGNOSTICS msg = MESSAGE_TEXT;
      IF msg <> 'El grupo está lleno' THEN
        RAISE EXCEPTION 'G8: unexpected error on transfer: %', msg;
      END IF;
  END;

  -- Transferring to the current group is a no-op.
  PERFORM public.transfer_enrollment_group(e1, gcap);

  -- -------------------------------------------------------------------------
  -- G9. group_occupancy: enrolled excludes cancelled; seats_left never < 0.
  -- -------------------------------------------------------------------------
  SELECT * INTO occ FROM public.group_occupancy WHERE group_id = gcap;
  IF occ.enrolled <> 2 OR occ.capacity <> 2 OR occ.seats_left <> 0 OR occ.course_id <> c1 THEN
    RAISE EXCEPTION 'G9: occupancy of gcap wrong (%/%/%)', occ.enrolled, occ.capacity, occ.seats_left;
  END IF;
  SELECT * INTO occ FROM public.group_occupancy WHERE group_id = gn;
  IF occ.enrolled <> 0 OR occ.capacity IS NOT NULL OR occ.seats_left IS NOT NULL THEN
    RAISE EXCEPTION 'G9: occupancy of a group without capacity wrong (%/%/%)',
      occ.enrolled, occ.capacity, occ.seats_left;
  END IF;

  -- -------------------------------------------------------------------------
  -- G10. apply_student_enrollments persists group_id; absent key keeps it; null
  --      clears it; the capacity guard still applies; price rules unchanged.
  --      u2's enrollment is dropped through the RPC first so it is re-created.
  -- -------------------------------------------------------------------------
  PERFORM public.apply_student_enrollments(u2, '[]'::jsonb);
  PERFORM public.apply_student_enrollments(u2, jsonb_build_array(
    jsonb_build_object('course_id', c1, 'group_id', gp)
  ));
  SELECT * INTO r FROM public.user_course_assignments WHERE user_id = u2 AND course_id = c1;
  IF r.group_id IS DISTINCT FROM gp OR r.agreed_price <> 80000 THEN
    RAISE EXCEPTION 'G10: apply must persist group_id and default the group price, got %/%',
      r.group_id, r.agreed_price;
  END IF;

  -- Key absent: the group stays.
  PERFORM public.apply_student_enrollments(u2, jsonb_build_array(
    jsonb_build_object('course_id', c1, 'notes', 'sin tocar grupo')
  ));
  SELECT * INTO r FROM public.user_course_assignments WHERE user_id = u2 AND course_id = c1;
  IF r.group_id IS DISTINCT FROM gp OR r.agreed_price <> 80000 THEN
    RAISE EXCEPTION 'G10: omitted group_id must keep the group and the price, got %/%',
      r.group_id, r.agreed_price;
  END IF;

  -- Explicit null: the student leaves the group.
  PERFORM public.apply_student_enrollments(u2, jsonb_build_array(
    jsonb_build_object('course_id', c1, 'group_id', NULL)
  ));
  SELECT * INTO r FROM public.user_course_assignments WHERE user_id = u2 AND course_id = c1;
  IF r.group_id IS NOT NULL THEN
    RAISE EXCEPTION 'G10: group_id null must clear the group, got %', r.group_id;
  END IF;

  -- Fill gcap again (e1 + e3) so it is full; u2 moving in must be refused.
  PERFORM public.transfer_enrollment_group(e3, gcap);
  BEGIN
    PERFORM public.apply_student_enrollments(u2, jsonb_build_array(
      jsonb_build_object('course_id', c1, 'group_id', gcap)
    ));
    RAISE EXCEPTION 'G10: apply into a full group must fail';
  EXCEPTION
    WHEN raise_exception THEN
      GET STACKED DIAGNOSTICS msg = MESSAGE_TEXT;
      IF msg <> 'El grupo está lleno' THEN
        RAISE EXCEPTION 'G10: unexpected error on apply: %', msg;
      END IF;
  END;

  -- A student already inside a full group can be re-applied to it (the proposed
  -- insert row must not count the existing enrollment as a second seat).
  PERFORM public.apply_student_enrollments(u1, jsonb_build_array(
    jsonb_build_object('course_id', c1, 'group_id', gcap)
  ));

  PERFORM set_config('request.jwt.claims', '', true);

  RAISE NOTICE 'course_groups tests passed';
END;
$$;

ROLLBACK;
