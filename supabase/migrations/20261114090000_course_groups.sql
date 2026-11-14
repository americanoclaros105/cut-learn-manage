-- Course groups (cohorts): a course keeps one content but runs in several
-- groups ("Grupo A/B/C"), each with its own students, dates and weekly class
-- schedule.
--
-- Builds on 20261113120000_academy_operations.sql (already applied; never edit
-- it). Safe to re-run and to run inside a single transaction: tables, columns
-- and indexes are guarded, policies/triggers are dropped before recreation and
-- nothing uses CONCURRENTLY.
--
-- Trigger ordering on user_course_assignments (BEFORE triggers fire in
-- alphabetical order of trigger name):
--   INSERT: enrollment_apply_group_trg  ->  enrollment_set_defaults_trg
--   UPDATE: enrollment_apply_group_trg  ->  enrollment_track_status_trg
-- 'enrollment_apply_group_trg' must sort before 'enrollment_set_defaults_trg'
-- so the group price is applied to agreed_price BEFORE the course price
-- fallback runs (that one only fills a still-NULL agreed_price).

-- ---------------------------------------------------------------------------
-- 1. course_groups
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.course_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  location TEXT,
  instructor TEXT,
  capacity INTEGER CHECK (capacity IS NULL OR capacity > 0),
  -- Overrides the course price as the default agreed price of its students.
  price NUMERIC(12,2) CHECK (price IS NULL OR price >= 0),
  color TEXT,
  notes TEXT,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT course_groups_dates_check CHECK (end_date >= start_date),
  CONSTRAINT course_groups_course_name_key UNIQUE (course_id, name)
);

CREATE INDEX IF NOT EXISTS idx_course_groups_course_id ON public.course_groups(course_id);

DROP TRIGGER IF EXISTS update_course_groups_updated_at ON public.course_groups;
CREATE TRIGGER update_course_groups_updated_at
  BEFORE UPDATE ON public.course_groups
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------------------------------------------------------------------
-- 2. course_group_schedules (weekly slots; several per group)
-- ---------------------------------------------------------------------------
-- weekday: 0 = Sunday ... 6 = Saturday (same as JavaScript Date.getDay and
-- Postgres EXTRACT(DOW)). Times are wall-clock times in America/Bogota.
CREATE TABLE IF NOT EXISTS public.course_group_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.course_groups(id) ON DELETE CASCADE,
  weekday SMALLINT NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  CONSTRAINT course_group_schedules_time_check CHECK (end_time > start_time)
);

CREATE INDEX IF NOT EXISTS idx_course_group_schedules_group_id
  ON public.course_group_schedules(group_id);

-- Several slots on the same weekday are allowed only when they do not overlap.
CREATE OR REPLACE FUNCTION public.course_group_schedules_check_overlap()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.course_group_schedules s
    WHERE s.group_id = NEW.group_id
      AND s.weekday = NEW.weekday
      AND s.id <> NEW.id
      AND s.start_time < NEW.end_time
      AND s.end_time > NEW.start_time
  ) THEN
    RAISE EXCEPTION 'Los horarios del mismo día no pueden superponerse'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS course_group_schedules_overlap_trg ON public.course_group_schedules;
CREATE TRIGGER course_group_schedules_overlap_trg
  BEFORE INSERT OR UPDATE ON public.course_group_schedules
  FOR EACH ROW EXECUTE FUNCTION public.course_group_schedules_check_overlap();

-- ---------------------------------------------------------------------------
-- 3. Enrollments: group_id + guards
-- ---------------------------------------------------------------------------
ALTER TABLE public.user_course_assignments
  ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES public.course_groups(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_user_course_assignments_group_id
  ON public.user_course_assignments(group_id);

-- BEFORE INSERT OR UPDATE OF group_id, course_id.
--  * the group must belong to the enrollment's course;
--  * on INSERT, an omitted agreed_price defaults to the group price (when set);
--  * entering a group (insert, or group_id changed) is refused when the group
--    already has `capacity` non-cancelled enrollments. The group row is locked
--    FOR UPDATE so concurrent enrollments cannot both take the last seat.
-- The count excludes the enrollment itself and, for inserts, the enrollment of
-- the same (user, course): INSERT ... ON CONFLICT DO UPDATE (used by
-- apply_student_enrollments) fires this trigger for the proposed row even
-- though it ends up updating the existing one.
CREATE OR REPLACE FUNCTION public.enrollment_apply_group()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _g public.course_groups%ROWTYPE;
  _taken INTEGER;
BEGIN
  IF NEW.group_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT * INTO _g FROM public.course_groups WHERE id = NEW.group_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'El grupo no existe' USING ERRCODE = '23503';
  END IF;

  IF _g.course_id <> NEW.course_id THEN
    RAISE EXCEPTION 'El grupo no pertenece al curso de la inscripción'
      USING ERRCODE = '23514';
  END IF;

  IF TG_OP = 'INSERT' AND NEW.agreed_price IS NULL AND _g.price IS NOT NULL THEN
    NEW.agreed_price := _g.price;
  END IF;

  IF (TG_OP = 'INSERT' OR NEW.group_id IS DISTINCT FROM OLD.group_id)
     AND NEW.status <> 'cancelled'
     AND _g.capacity IS NOT NULL THEN
    SELECT COUNT(*) INTO _taken
    FROM public.user_course_assignments a
    WHERE a.group_id = NEW.group_id
      AND a.status <> 'cancelled'
      AND a.id <> NEW.id
      AND NOT (a.user_id = NEW.user_id AND a.course_id = NEW.course_id);
    IF _taken >= _g.capacity THEN
      RAISE EXCEPTION 'El grupo está lleno' USING ERRCODE = 'P0001';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enrollment_apply_group_trg ON public.user_course_assignments;
CREATE TRIGGER enrollment_apply_group_trg
  BEFORE INSERT OR UPDATE OF group_id, course_id ON public.user_course_assignments
  FOR EACH ROW EXECUTE FUNCTION public.enrollment_apply_group();

-- ---------------------------------------------------------------------------
-- 4. Class sessions: group, cancellation, generated flag
-- ---------------------------------------------------------------------------
-- Existing sessions keep group_id NULL ("Sin grupo").
ALTER TABLE public.class_sessions
  ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES public.course_groups(id) ON DELETE CASCADE;
ALTER TABLE public.class_sessions
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'cancelled'));
ALTER TABLE public.class_sessions
  ADD COLUMN IF NOT EXISTS cancel_reason TEXT;
ALTER TABLE public.class_sessions
  ADD COLUMN IF NOT EXISTS generated BOOLEAN NOT NULL DEFAULT false;

-- Unique so generate_group_sessions is idempotent even under concurrency.
CREATE UNIQUE INDEX IF NOT EXISTS uq_class_sessions_group_starts
  ON public.class_sessions(group_id, starts_at)
  WHERE group_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.class_sessions_check_group()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.group_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.course_groups g
    WHERE g.id = NEW.group_id AND g.course_id = NEW.course_id
  ) THEN
    RAISE EXCEPTION 'El grupo no pertenece al curso de la sesión'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS class_sessions_check_group_trg ON public.class_sessions;
CREATE TRIGGER class_sessions_check_group_trg
  BEFORE INSERT OR UPDATE OF group_id, course_id ON public.class_sessions
  FOR EACH ROW EXECUTE FUNCTION public.class_sessions_check_group();

-- ---------------------------------------------------------------------------
-- 5. Helpers
-- ---------------------------------------------------------------------------
-- RLS-independent membership check (any enrollment status), used by policies.
CREATE OR REPLACE FUNCTION public.user_in_group(_user_id UUID, _group_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_course_assignments a
    WHERE a.user_id = _user_id AND a.group_id = _group_id
  );
$$;

REVOKE ALL ON FUNCTION public.user_in_group(UUID, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.user_in_group(UUID, UUID) TO authenticated;

-- Occupancy per group (non-cancelled enrollments). Readable by superadmins only:
-- the view runs with the caller's privileges (security_invoker) and filters
-- every row out for anyone else.
CREATE OR REPLACE VIEW public.group_occupancy
WITH (security_invoker = true) AS
SELECT
  g.id AS group_id,
  g.course_id,
  (COUNT(a.id) FILTER (WHERE a.status <> 'cancelled'))::INTEGER AS enrolled,
  g.capacity,
  CASE
    WHEN g.capacity IS NULL THEN NULL
    ELSE GREATEST(g.capacity - (COUNT(a.id) FILTER (WHERE a.status <> 'cancelled'))::INTEGER, 0)
  END AS seats_left
FROM public.course_groups g
LEFT JOIN public.user_course_assignments a ON a.group_id = g.id
WHERE public.has_role(auth.uid(), 'superadmin')
GROUP BY g.id;

REVOKE ALL ON public.group_occupancy FROM PUBLIC, anon;
GRANT SELECT ON public.group_occupancy TO authenticated;

-- ---------------------------------------------------------------------------
-- 6. RPCs (superadmin only)
-- ---------------------------------------------------------------------------
-- Builds the sessions of a group from its weekly schedule. Times are wall-clock
-- in America/Bogota (no DST), stored as timestamptz. Dates where the group
-- already has a session at the same instant (scheduled OR cancelled, generated
-- or manual) are skipped, so re-running inserts 0. With _replace_future, FUTURE
-- generated sessions that are still 'scheduled' and have NO attendance rows are
-- deleted first (cancelled sessions and sessions with attendance are kept).
-- Returns the number of inserted sessions.
CREATE OR REPLACE FUNCTION public.generate_group_sessions(
  _group_id UUID,
  _replace_future BOOLEAN DEFAULT false
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _g public.course_groups%ROWTYPE;
  _inserted INTEGER := 0;
BEGIN
  IF NOT public.has_role(auth.uid(), 'superadmin') THEN
    RAISE EXCEPTION 'Solo los administradores pueden generar el calendario'
      USING ERRCODE = '42501';
  END IF;

  SELECT * INTO _g FROM public.course_groups WHERE id = _group_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'El grupo no existe' USING ERRCODE = 'P0002';
  END IF;

  IF _replace_future THEN
    DELETE FROM public.class_sessions cs
    WHERE cs.group_id = _group_id
      AND cs.generated
      AND cs.status = 'scheduled'
      AND cs.starts_at > now()
      AND NOT EXISTS (SELECT 1 FROM public.attendance a WHERE a.session_id = cs.id);
  END IF;

  INSERT INTO public.class_sessions
    (course_id, group_id, starts_at, ends_at, location, generated)
  SELECT
    _g.course_id,
    _g.id,
    (d::DATE + s.start_time) AT TIME ZONE 'America/Bogota',
    (d::DATE + s.end_time) AT TIME ZONE 'America/Bogota',
    _g.location,
    true
  FROM generate_series(_g.start_date::TIMESTAMP, _g.end_date::TIMESTAMP, INTERVAL '1 day') AS d
  JOIN public.course_group_schedules s
    ON s.group_id = _g.id AND s.weekday = EXTRACT(DOW FROM d)::INTEGER
  ON CONFLICT (group_id, starts_at) WHERE group_id IS NOT NULL DO NOTHING;

  GET DIAGNOSTICS _inserted = ROW_COUNT;
  RETURN _inserted;
END;
$$;

REVOKE ALL ON FUNCTION public.generate_group_sessions(UUID, BOOLEAN) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.generate_group_sessions(UUID, BOOLEAN) TO authenticated;

-- Moves an enrollment to another group of the same course. Payments and status
-- are untouched; attendance history stays because it hangs from the sessions.
-- The enrollment trigger enforces course match and capacity.
CREATE OR REPLACE FUNCTION public.transfer_enrollment_group(_enrollment_id UUID, _group_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _e public.user_course_assignments%ROWTYPE;
  _g public.course_groups%ROWTYPE;
BEGIN
  IF NOT public.has_role(auth.uid(), 'superadmin') THEN
    RAISE EXCEPTION 'Solo los administradores pueden cambiar de grupo'
      USING ERRCODE = '42501';
  END IF;

  IF _group_id IS NULL THEN
    RAISE EXCEPTION 'Debes indicar el grupo de destino' USING ERRCODE = '22004';
  END IF;

  SELECT * INTO _e FROM public.user_course_assignments WHERE id = _enrollment_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'La inscripción no existe' USING ERRCODE = 'P0002';
  END IF;

  SELECT * INTO _g FROM public.course_groups WHERE id = _group_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'El grupo no existe' USING ERRCODE = 'P0002';
  END IF;

  IF _g.course_id <> _e.course_id THEN
    RAISE EXCEPTION 'El grupo no pertenece al curso de la inscripción'
      USING ERRCODE = '23514';
  END IF;

  IF _e.group_id IS NOT DISTINCT FROM _group_id THEN
    RETURN;
  END IF;

  UPDATE public.user_course_assignments
  SET group_id = _group_id
  WHERE id = _enrollment_id;
END;
$$;

REVOKE ALL ON FUNCTION public.transfer_enrollment_group(UUID, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.transfer_enrollment_group(UUID, UUID) TO authenticated;

-- Atomically replaces the weekly schedule of a group. _items is a jsonb array
-- of {weekday, start_time, end_time}. Generated sessions are not touched; call
-- generate_group_sessions(_group_id, true) afterwards to rebuild future ones.
CREATE OR REPLACE FUNCTION public.replace_group_schedules(_group_id UUID, _items JSONB)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _i JSONB;
BEGIN
  IF NOT public.has_role(auth.uid(), 'superadmin') THEN
    RAISE EXCEPTION 'Solo los administradores pueden cambiar el horario'
      USING ERRCODE = '42501';
  END IF;

  IF _items IS NULL OR jsonb_typeof(_items) <> 'array' THEN
    RAISE EXCEPTION '_items must be a JSON array';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.course_groups WHERE id = _group_id) THEN
    RAISE EXCEPTION 'El grupo no existe' USING ERRCODE = 'P0002';
  END IF;

  DELETE FROM public.course_group_schedules WHERE group_id = _group_id;

  -- One statement per slot so the overlap trigger sees the slots inserted before it.
  FOR _i IN SELECT * FROM jsonb_array_elements(_items) LOOP
    INSERT INTO public.course_group_schedules (group_id, weekday, start_time, end_time)
    VALUES (
      _group_id,
      (_i ->> 'weekday')::SMALLINT,
      (_i ->> 'start_time')::TIME,
      (_i ->> 'end_time')::TIME
    );
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.replace_group_schedules(UUID, JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.replace_group_schedules(UUID, JSONB) TO authenticated;

-- apply_student_enrollments, now with an optional group_id per item:
--   {course_id, enabled_from, expires_at, notes, agreed_price, group_id}
-- group_id semantics on an existing enrollment: key absent -> keep the current
-- group; key present with null/'' -> remove from the group; uuid -> move to it.
-- Moving goes through enrollment_apply_group (course match + capacity guard).
-- Everything else behaves exactly as before (including keeping the current
-- price when agreed_price is omitted).
CREATE OR REPLACE FUNCTION public.apply_student_enrollments(_user_id UUID, _items JSONB)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _item JSONB;
  _course UUID;
  _ids UUID[] := ARRAY[]::UUID[];
BEGIN
  IF NOT public.has_role(auth.uid(), 'superadmin') THEN
    RAISE EXCEPTION 'Only superadmins can manage enrollments' USING ERRCODE = '42501';
  END IF;

  IF _items IS NULL OR jsonb_typeof(_items) <> 'array' THEN
    RAISE EXCEPTION '_items must be a JSON array';
  END IF;

  FOR _item IN SELECT * FROM jsonb_array_elements(_items) LOOP
    _course := (_item ->> 'course_id')::UUID;
    _ids := _ids || _course;

    INSERT INTO public.user_course_assignments
      (user_id, course_id, enabled_from, expires_at, notes, agreed_price, group_id)
    VALUES (
      _user_id,
      _course,
      COALESCE(NULLIF(_item ->> 'enabled_from', '')::TIMESTAMPTZ, now()),
      NULLIF(_item ->> 'expires_at', '')::TIMESTAMPTZ,
      NULLIF(_item ->> 'notes', ''),
      NULLIF(_item ->> 'agreed_price', '')::NUMERIC,
      NULLIF(_item ->> 'group_id', '')::UUID
    )
    ON CONFLICT (user_id, course_id) DO UPDATE SET
      enabled_from = COALESCE(NULLIF(_item ->> 'enabled_from', '')::TIMESTAMPTZ, now()),
      expires_at   = NULLIF(_item ->> 'expires_at', '')::TIMESTAMPTZ,
      notes        = NULLIF(_item ->> 'notes', ''),
      -- keep the current price when the caller does not send one
      agreed_price = COALESCE(
        NULLIF(_item ->> 'agreed_price', '')::NUMERIC,
        public.user_course_assignments.agreed_price
      ),
      -- keep the current group when the key is absent
      group_id = CASE
        WHEN (_item -> 'group_id') IS NOT NULL THEN NULLIF(_item ->> 'group_id', '')::UUID
        ELSE public.user_course_assignments.group_id
      END;
  END LOOP;

  DELETE FROM public.user_course_assignments
  WHERE user_id = _user_id AND NOT (course_id = ANY (_ids));
END;
$$;

REVOKE ALL ON FUNCTION public.apply_student_enrollments(UUID, JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.apply_student_enrollments(UUID, JSONB) TO authenticated;

-- ---------------------------------------------------------------------------
-- 7. Row level security
-- ---------------------------------------------------------------------------
ALTER TABLE public.course_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_group_schedules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Superadmins can manage course groups" ON public.course_groups;
CREATE POLICY "Superadmins can manage course groups"
  ON public.course_groups FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin'))
  WITH CHECK (public.has_role(auth.uid(), 'superadmin'));

-- Students see the groups they are enrolled in (any status, so a pending
-- student can already see the schedule).
DROP POLICY IF EXISTS "Students can view own course groups" ON public.course_groups;
CREATE POLICY "Students can view own course groups"
  ON public.course_groups FOR SELECT TO authenticated
  USING (public.user_in_group(auth.uid(), id));

DROP POLICY IF EXISTS "Superadmins can manage group schedules" ON public.course_group_schedules;
CREATE POLICY "Superadmins can manage group schedules"
  ON public.course_group_schedules FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin'))
  WITH CHECK (public.has_role(auth.uid(), 'superadmin'));

DROP POLICY IF EXISTS "Students can view own group schedules" ON public.course_group_schedules;
CREATE POLICY "Students can view own group schedules"
  ON public.course_group_schedules FOR SELECT TO authenticated
  USING (public.user_in_group(auth.uid(), group_id));

-- Sessions: course access as before, and additionally only the student's own
-- group (or legacy sessions without group).
DROP POLICY IF EXISTS "Students can view sessions of accessible courses" ON public.class_sessions;
CREATE POLICY "Students can view sessions of accessible courses"
  ON public.class_sessions FOR SELECT TO authenticated
  USING (
    public.has_course_access(auth.uid(), course_id)
    AND (group_id IS NULL OR public.user_in_group(auth.uid(), group_id))
  );
