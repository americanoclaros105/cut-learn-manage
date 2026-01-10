-- Crear bucket público para imágenes del landing (2MB límite)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('landing-images', 'landing-images', true, 2097152);

-- Política para permitir lectura pública
CREATE POLICY "Imágenes públicas"
ON storage.objects FOR SELECT
USING (bucket_id = 'landing-images');

-- Política para permitir upload solo a superadmins
CREATE POLICY "Solo superadmins pueden subir"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'landing-images' AND
  auth.role() = 'authenticated' AND
  public.has_role(auth.uid(), 'superadmin')
);

-- Política para permitir update solo a superadmins
CREATE POLICY "Solo superadmins pueden actualizar imagenes"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'landing-images' AND
  public.has_role(auth.uid(), 'superadmin')
);

-- Política para permitir delete solo a superadmins
CREATE POLICY "Solo superadmins pueden eliminar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'landing-images' AND
  public.has_role(auth.uid(), 'superadmin')
);

-- Agregar columna de colores del tema a landing_content
ALTER TABLE public.landing_content 
ADD COLUMN IF NOT EXISTS theme_colors jsonb DEFAULT '{
  "primary": "0 72% 51%",
  "primaryForeground": "0 0% 100%",
  "accent": "0 0% 10%",
  "background": "0 0% 100%",
  "foreground": "0 0% 5%",
  "muted": "0 0% 96%",
  "mutedForeground": "0 0% 45%"
}'::jsonb;