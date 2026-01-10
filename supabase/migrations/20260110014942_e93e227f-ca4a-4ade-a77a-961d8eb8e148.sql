-- Crear bucket para contenido de cursos
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('course-content', 'course-content', true, 104857600)
ON CONFLICT (id) DO NOTHING;

-- Políticas de acceso para el bucket
CREATE POLICY "Contenido público de cursos"
ON storage.objects FOR SELECT
USING (bucket_id = 'course-content');

CREATE POLICY "Solo superadmins pueden subir contenido de cursos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'course-content' AND
  auth.role() = 'authenticated' AND
  public.has_role(auth.uid(), 'superadmin')
);

CREATE POLICY "Solo superadmins pueden actualizar contenido de cursos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'course-content' AND
  auth.role() = 'authenticated' AND
  public.has_role(auth.uid(), 'superadmin')
);

CREATE POLICY "Solo superadmins pueden eliminar contenido de cursos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'course-content' AND
  auth.role() = 'authenticated' AND
  public.has_role(auth.uid(), 'superadmin')
);

-- Agregar personalización de tema a cursos
ALTER TABLE courses ADD COLUMN IF NOT EXISTS theme_colors jsonb DEFAULT '{
  "primary": "0 72% 51%",
  "accent": "0 0% 10%",
  "background": "0 0% 100%"
}'::jsonb;

-- Agregar campo de thumbnail para lecciones
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS thumbnail text;

-- Agregar campo de attachments (archivos adjuntos) para lecciones
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS attachments jsonb DEFAULT '[]'::jsonb;

-- Agregar campo de descripción para módulos
ALTER TABLE modules ADD COLUMN IF NOT EXISTS description text;