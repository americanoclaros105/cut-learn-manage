-- Tabla para trackear vistas de página
CREATE TABLE public.page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  page_path text NOT NULL DEFAULT '/',
  referrer text,
  user_agent text,
  device_type text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index para consultas por fecha
CREATE INDEX idx_page_views_created_at ON public.page_views(created_at DESC);

-- RLS
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert page views"
  ON public.page_views FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Superadmins can view page views"
  ON public.page_views FOR SELECT
  USING (public.has_role(auth.uid(), 'superadmin'::app_role));

-- Tabla para trackear clicks en secciones
CREATE TABLE public.section_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  section_name text NOT NULL,
  element_type text NOT NULL,
  element_label text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes para consultas
CREATE INDEX idx_section_clicks_created_at ON public.section_clicks(created_at DESC);
CREATE INDEX idx_section_clicks_section ON public.section_clicks(section_name);

-- RLS
ALTER TABLE public.section_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert section clicks"
  ON public.section_clicks FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Superadmins can view section clicks"
  ON public.section_clicks FOR SELECT
  USING (public.has_role(auth.uid(), 'superadmin'::app_role));