-- Academy operations: enrollment status + agreed price, payments ledger,
-- class sessions, attendance, automatic access activation and server-side
-- course access enforcement (RLS on modules/lessons).
--
-- Safe to re-run: enums/columns/tables/indexes are guarded, policies and
-- triggers are dropped before being recreated.

-- ---------------------------------------------------------------------------
-- 1. Enums
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.enrollment_status AS ENUM ('pending', 'active', 'suspended', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.payment_method AS ENUM ('cash', 'transfer', 'card', 'nequi', 'daviplata', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.attendance_status AS ENUM ('present', 'absent', 'late', 'excused');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------------
-- 2. Enrollment columns (user_course_assignments is the enrollment table)
-- ---------------------------------------------------------------------------
-- Existing rows are legacy enrollments that already had access, so the column
-- is added with DEFAULT 'active' (backfilling them) and the default is then
-- switched to 'pending' for every new enrollment.
ALTER TABLE public.user_course_assignments
  ADD COLUMN IF NOT EXISTS status public.enrollment_status NOT NULL DEFAULT 'active';
ALTER TABLE public.user_course_assignments
  ALTER COLUMN status SET DEFAULT 'pending';

-- agreed_price is added nullable and NOT NULL is enforced after the backfill.
-- There is intentionally no column default: a BEFORE INSERT trigger fills it
-- from courses.price when the caller omits it (NULL), while an explicit 0
-- (free enrollment) is preserved. NOT NULL is checked after BEFORE triggers.
ALTER TABLE public.user_course_assignments
  ADD COLUMN IF NOT EXISTS agreed_price NUMERIC(12,2);

ALTER TABLE public.user_course_assignments
  ADD COLUMN IF NOT EXISTS activated_by TEXT;
ALTER TABLE public.user_course_assignments
  ADD COLUMN IF NOT EXISTS activated_at TIMESTAMPTZ;
ALTER TABLE public.user_course_assignments
  ADD COLUMN IF NOT EXISTS status_changed_at TIMESTAMPTZ DEFAULT now();

DO $$ BEGIN
  ALTER TABLE public.user_course_assignments
    ADD CONSTRAINT user_course_assignments_activated_by_check
    CHECK (activated_by IS NULL OR activated_by IN ('payment', 'manual', 'legacy'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Backfill existing enrollments.
UPDATE public.user_course_assignments a
SET agreed_price = COALESCE(c.price, 0)
FROM public.courses c
WHERE a.course_id = c.id AND a.agreed_price IS NULL;

UPDATE public.user_course_assignments
SET agreed_price = 0
WHERE agreed_price IS NULL;

UPDATE public.user_course_assignments
SET activated_by = 'legacy',
    activated_at = COALESCE(activated_at, assigned_at)
WHERE status = 'active' AND activated_by IS NULL;

ALTER TABLE public.user_course_assignments
  ALTER COLUMN agreed_price SET NOT NULL;

-- ---------------------------------------------------------------------------
-- 3. Payments
-- ---------------------------------------------------------------------------
-- Payments are never hard-deleted by the app: they are voided. Snapshot
-- columns keep the ledger readable even if the student/course/enrollment is
-- removed later (FKs use ON DELETE SET NULL).
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID REFERENCES public.user_course_assignments(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  student_name TEXT,
  course_title TEXT,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  method public.payment_method NOT NULL,
  paid_at DATE NOT NULL DEFAULT current_date,
  reference TEXT,
  notes TEXT,
  created_by UUID DEFAULT auth.uid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  voided_at TIMESTAMPTZ,
  voided_by UUID,
  void_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_payments_enrollment_id ON public.payments(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_payments_paid_at ON public.payments(paid_at);
CREATE INDEX IF NOT EXISTS idx_payments_course_id ON public.payments(course_id);

-- ---------------------------------------------------------------------------
-- 4. Class sessions and attendance
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.class_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  topic TEXT,
  location TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_class_sessions_course_starts
  ON public.class_sessions(course_id, starts_at);

CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.class_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.attendance_status NOT NULL,
  notes TEXT,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  recorded_by UUID DEFAULT auth.uid(),
  UNIQUE (session_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_attendance_user_id ON public.attendance(user_id);

-- ---------------------------------------------------------------------------
-- 5. Enrollment triggers
-- ---------------------------------------------------------------------------
-- BEFORE INSERT: default the agreed price to the course price when omitted.
CREATE OR REPLACE FUNCTION public.enrollment_set_defaults()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.agreed_price IS NULL THEN
    SELECT COALESCE(price, 0) INTO NEW.agreed_price
    FROM public.courses WHERE id = NEW.course_id;
    NEW.agreed_price := COALESCE(NEW.agreed_price, 0);
  END IF;
  NEW.status_changed_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enrollment_set_defaults_trg ON public.user_course_assignments;
CREATE TRIGGER enrollment_set_defaults_trg
  BEFORE INSERT ON public.user_course_assignments
  FOR EACH ROW EXECUTE FUNCTION public.enrollment_set_defaults();

-- BEFORE UPDATE: track status changes. The payment automation
-- (recompute_enrollment_access) marks its own UPDATE by setting the
-- transaction-local flag app.enrollment_auto = 'on'. Any other change to
-- 'active' is a manual grant by an admin. Leaving 'active' clears the
-- activation source so a later re-activation is labelled correctly.
CREATE OR REPLACE FUNCTION public.enrollment_track_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    NEW.status_changed_at := now();
    IF NEW.status = 'active' THEN
      IF current_setting('app.enrollment_auto', true) = 'on' THEN
        NEW.activated_by := 'payment';
      ELSE
        NEW.activated_by := 'manual';
      END IF;
      NEW.activated_at := now();
    ELSE
      NEW.activated_by := NULL;
      NEW.activated_at := NULL;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enrollment_track_status_trg ON public.user_course_assignments;
CREATE TRIGGER enrollment_track_status_trg
  BEFORE UPDATE ON public.user_course_assignments
  FOR EACH ROW EXECUTE FUNCTION public.enrollment_track_status();

-- ---------------------------------------------------------------------------
-- 6. Access automation
-- ---------------------------------------------------------------------------
-- pending + fully paid            -> active (activated_by = 'payment')
-- active by payment + not paid    -> pending (e.g. a payment was voided)
-- Never touches manual / legacy activations, suspended or cancelled rows.
CREATE OR REPLACE FUNCTION public.recompute_enrollment_access(_enrollment_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _enrollment public.user_course_assignments%ROWTYPE;
  _paid NUMERIC;
BEGIN
  IF _enrollment_id IS NULL THEN
    RETURN;
  END IF;

  SELECT * INTO _enrollment
  FROM public.user_course_assignments
  WHERE id = _enrollment_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  SELECT COALESCE(SUM(amount), 0) INTO _paid
  FROM public.payments
  WHERE enrollment_id = _enrollment_id AND voided_at IS NULL;

  IF _enrollment.status = 'pending' AND _paid >= _enrollment.agreed_price THEN
    -- Transaction-local flag read by enrollment_track_status(): this UPDATE is
    -- the automation, not a manual grant.
    PERFORM set_config('app.enrollment_auto', 'on', true);
    UPDATE public.user_course_assignments
    SET status = 'active'
    WHERE id = _enrollment_id;
    PERFORM set_config('app.enrollment_auto', 'off', true);
  ELSIF _enrollment.status = 'active'
        AND _enrollment.activated_by = 'payment'
        AND _paid < _enrollment.agreed_price THEN
    PERFORM set_config('app.enrollment_auto', 'on', true);
    UPDATE public.user_course_assignments
    SET status = 'pending'
    WHERE id = _enrollment_id;
    PERFORM set_config('app.enrollment_auto', 'off', true);
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.recompute_enrollment_access(UUID) FROM PUBLIC, anon, authenticated;

-- Payments: fill snapshots (BEFORE INSERT, and when the payment is moved to
-- another enrollment). Setting enrollment_id to NULL (ON DELETE SET NULL on
-- the enrollment) keeps the existing snapshots untouched.
CREATE OR REPLACE FUNCTION public.payments_fill_snapshot()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _enrollment public.user_course_assignments%ROWTYPE;
BEGIN
  IF NEW.enrollment_id IS NOT NULL THEN
    SELECT * INTO _enrollment
    FROM public.user_course_assignments WHERE id = NEW.enrollment_id;
    IF FOUND THEN
      NEW.user_id := _enrollment.user_id;
      NEW.course_id := _enrollment.course_id;
      SELECT name INTO NEW.student_name FROM public.profiles WHERE id = _enrollment.user_id;
      SELECT title INTO NEW.course_title FROM public.courses WHERE id = _enrollment.course_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS payments_fill_snapshot_trg ON public.payments;
CREATE TRIGGER payments_fill_snapshot_trg
  BEFORE INSERT OR UPDATE OF enrollment_id ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.payments_fill_snapshot();

-- Payments: recompute access after any relevant change (AFTER INSERT/UPDATE).
CREATE OR REPLACE FUNCTION public.payments_recompute_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.recompute_enrollment_access(NEW.enrollment_id);
  IF TG_OP = 'UPDATE' AND OLD.enrollment_id IS DISTINCT FROM NEW.enrollment_id THEN
    PERFORM public.recompute_enrollment_access(OLD.enrollment_id);
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS payments_recompute_access_trg ON public.payments;
CREATE TRIGGER payments_recompute_access_trg
  AFTER INSERT OR UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.payments_recompute_access();

-- Enrollments: recompute after insert (agreed_price = 0 activates at once) and
-- when the agreed price changes. recompute only updates status/activated_*, so
-- the UPDATE OF agreed_price trigger cannot re-fire itself.
CREATE OR REPLACE FUNCTION public.enrollment_recompute_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.recompute_enrollment_access(NEW.id);
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS enrollment_recompute_after_insert_trg ON public.user_course_assignments;
CREATE TRIGGER enrollment_recompute_after_insert_trg
  AFTER INSERT ON public.user_course_assignments
  FOR EACH ROW EXECUTE FUNCTION public.enrollment_recompute_access();

DROP TRIGGER IF EXISTS enrollment_recompute_after_price_trg ON public.user_course_assignments;
CREATE TRIGGER enrollment_recompute_after_price_trg
  AFTER UPDATE OF agreed_price ON public.user_course_assignments
  FOR EACH ROW
  WHEN (NEW.agreed_price IS DISTINCT FROM OLD.agreed_price)
  EXECUTE FUNCTION public.enrollment_recompute_access();

-- When an enrollment returns to 'pending' by hand (e.g. un-suspended), a fully
-- paid enrollment must become active at once. The automation's own UPDATEs set
-- app.enrollment_auto = 'on', which stops this trigger from recursing.
CREATE OR REPLACE FUNCTION public.enrollment_recompute_on_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF current_setting('app.enrollment_auto', true) IS DISTINCT FROM 'on' THEN
    PERFORM public.recompute_enrollment_access(NEW.id);
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS enrollment_recompute_after_status_trg ON public.user_course_assignments;
CREATE TRIGGER enrollment_recompute_after_status_trg
  AFTER UPDATE OF status ON public.user_course_assignments
  FOR EACH ROW
  WHEN (NEW.status = 'pending' AND OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.enrollment_recompute_on_status();

-- ---------------------------------------------------------------------------
-- 7. Course access helper (used by RLS)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.has_course_access(_user_id UUID, _course_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.has_role(_user_id, 'superadmin')
    OR EXISTS (
      SELECT 1
      FROM public.user_course_assignments a
      JOIN public.profiles p ON p.id = a.user_id
      WHERE a.user_id = _user_id
        AND a.course_id = _course_id
        AND a.status = 'active'
        AND (a.enabled_from IS NULL OR a.enabled_from <= now())
        AND (a.expires_at IS NULL OR a.expires_at > now())
        AND p.status = 'active'
    );
$$;

GRANT EXECUTE ON FUNCTION public.has_course_access(UUID, UUID) TO anon, authenticated;

-- Public, content-free outline counts for the landing page. Modules/lessons are
-- no longer readable by anonymous users, so the landing reads counts through
-- this function instead. Anonymous users and students only see published
-- courses; superadmins see every course (drafts and archived included).
CREATE OR REPLACE FUNCTION public.course_outline_counts()
RETURNS TABLE (course_id UUID, module_count INTEGER, lesson_count INTEGER)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    c.id,
    (SELECT COUNT(*)::INTEGER FROM public.modules m WHERE m.course_id = c.id),
    (SELECT COUNT(*)::INTEGER
       FROM public.lessons l JOIN public.modules m ON m.id = l.module_id
       WHERE m.course_id = c.id)
  FROM public.courses c
  WHERE c.status = 'published' OR public.has_role(auth.uid(), 'superadmin');
$$;

GRANT EXECUTE ON FUNCTION public.course_outline_counts() TO anon, authenticated;

-- Atomic apply of a student's desired enrollments (used by the admin student
-- form). _items is a jsonb array of
--   {course_id, enabled_from, expires_at, notes, agreed_price}
-- Courses missing from the list are unenrolled, new ones inserted (pending),
-- existing ones updated. Everything runs in a single transaction, so a failure
-- leaves the student's enrollments untouched.
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
      (user_id, course_id, enabled_from, expires_at, notes, agreed_price)
    VALUES (
      _user_id,
      _course,
      COALESCE(NULLIF(_item ->> 'enabled_from', '')::TIMESTAMPTZ, now()),
      NULLIF(_item ->> 'expires_at', '')::TIMESTAMPTZ,
      NULLIF(_item ->> 'notes', ''),
      NULLIF(_item ->> 'agreed_price', '')::NUMERIC
    )
    ON CONFLICT (user_id, course_id) DO UPDATE SET
      enabled_from = COALESCE(NULLIF(_item ->> 'enabled_from', '')::TIMESTAMPTZ, now()),
      expires_at   = NULLIF(_item ->> 'expires_at', '')::TIMESTAMPTZ,
      notes        = NULLIF(_item ->> 'notes', ''),
      -- keep the current price when the caller does not send one
      agreed_price = COALESCE(
        NULLIF(_item ->> 'agreed_price', '')::NUMERIC,
        public.user_course_assignments.agreed_price
      );
  END LOOP;

  DELETE FROM public.user_course_assignments
  WHERE user_id = _user_id AND NOT (course_id = ANY (_ids));
END;
$$;

REVOKE ALL ON FUNCTION public.apply_student_enrollments(UUID, JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.apply_student_enrollments(UUID, JSONB) TO authenticated;

-- ---------------------------------------------------------------------------
-- 8. Row level security
-- ---------------------------------------------------------------------------
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- payments: superadmin can read/insert/update (void); nobody deletes.
DROP POLICY IF EXISTS "Superadmins can view payments" ON public.payments;
CREATE POLICY "Superadmins can view payments"
  ON public.payments FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin'));

DROP POLICY IF EXISTS "Superadmins can insert payments" ON public.payments;
CREATE POLICY "Superadmins can insert payments"
  ON public.payments FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'superadmin'));

DROP POLICY IF EXISTS "Superadmins can update payments" ON public.payments;
CREATE POLICY "Superadmins can update payments"
  ON public.payments FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin'))
  WITH CHECK (public.has_role(auth.uid(), 'superadmin'));

DROP POLICY IF EXISTS "Students can view own payments" ON public.payments;
CREATE POLICY "Students can view own payments"
  ON public.payments FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- class_sessions
DROP POLICY IF EXISTS "Superadmins can manage class sessions" ON public.class_sessions;
CREATE POLICY "Superadmins can manage class sessions"
  ON public.class_sessions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin'))
  WITH CHECK (public.has_role(auth.uid(), 'superadmin'));

DROP POLICY IF EXISTS "Students can view sessions of accessible courses" ON public.class_sessions;
CREATE POLICY "Students can view sessions of accessible courses"
  ON public.class_sessions FOR SELECT TO authenticated
  USING (public.has_course_access(auth.uid(), course_id));

-- attendance
DROP POLICY IF EXISTS "Superadmins can manage attendance" ON public.attendance;
CREATE POLICY "Superadmins can manage attendance"
  ON public.attendance FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin'))
  WITH CHECK (public.has_role(auth.uid(), 'superadmin'));

DROP POLICY IF EXISTS "Students can view own attendance" ON public.attendance;
CREATE POLICY "Students can view own attendance"
  ON public.attendance FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- modules / lessons: content is readable only with course access (or by
-- superadmins), not by anyone. Courses themselves stay publicly readable.
DROP POLICY IF EXISTS "Anyone can view modules of published courses" ON public.modules;
DROP POLICY IF EXISTS "Course access can view modules" ON public.modules;
CREATE POLICY "Course access can view modules"
  ON public.modules FOR SELECT
  USING (
    public.has_role(auth.uid(), 'superadmin')
    OR (
      EXISTS (
        SELECT 1 FROM public.courses c
        WHERE c.id = modules.course_id AND c.status = 'published'
      )
      AND public.has_course_access(auth.uid(), modules.course_id)
    )
  );

DROP POLICY IF EXISTS "Anyone can view lessons of published courses" ON public.lessons;
DROP POLICY IF EXISTS "Course access can view lessons" ON public.lessons;
CREATE POLICY "Course access can view lessons"
  ON public.lessons FOR SELECT
  USING (
    public.has_role(auth.uid(), 'superadmin')
    OR EXISTS (
      SELECT 1
      FROM public.modules m
      JOIN public.courses c ON c.id = m.course_id
      WHERE m.id = lessons.module_id
        AND c.status = 'published'
        AND public.has_course_access(auth.uid(), m.course_id)
    )
  );
