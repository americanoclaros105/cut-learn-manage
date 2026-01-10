-- Insert default landing content
INSERT INTO public.landing_content (hero, about, courses_section, contact, social_links) VALUES (
  '{"title": "El Arte del Estilo Masculino", "subtitle": "Más de 10 años transformando estilos y creando experiencias únicas en barbería", "ctaText": "Reservar Cita", "ctaLink": "whatsapp", "backgroundImage": "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=1920"}'::jsonb,
  '{"title": "Quiénes Somos", "description": "Somos más que una barbería, somos un espacio donde el estilo se encuentra con la tradición. Nuestro equipo de barberos profesionales está dedicado a brindarte la mejor experiencia en cuidado masculino.", "mission": "Ofrecer servicios de barbería de la más alta calidad, combinando técnicas tradicionales con las últimas tendencias.", "vision": "Ser reconocidos como la barbería líder en formación y servicio, inspirando a la próxima generación de barberos.", "image": "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=800"}'::jsonb,
  '{"title": "Academia de Barbería", "subtitle": "Aprende de los mejores profesionales y domina el arte de la barbería"}'::jsonb,
  '{"phone": "+1 234 567 8900", "whatsapp": "+1234567890", "whatsappMessage": "Hola! Me gustaría reservar una cita.", "email": "info@barbershop.com", "address": "Calle Principal 123, Ciudad", "hours": "Lunes a Sábado: 9:00 AM - 8:00 PM"}'::jsonb,
  '{"instagram": "https://instagram.com", "facebook": "https://facebook.com", "tiktok": "https://tiktok.com"}'::jsonb
);

-- Insert default services
INSERT INTO public.services (name, description, price, duration, image, order_num) VALUES
  ('Corte Clásico', 'Corte tradicional con acabado profesional', 25, '30 min', 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=400', 1),
  ('Degradado Premium', 'Fade perfecto con detalles personalizados', 35, '45 min', 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400', 2),
  ('Barba Completa', 'Perfilado, afeitado y tratamiento de barba', 20, '25 min', 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=400', 3),
  ('Corte + Barba', 'Servicio completo de corte y arreglo de barba', 45, '60 min', 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=400', 4);

-- Insert default gallery items
INSERT INTO public.gallery_items (image, caption, order_num) VALUES
  ('https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600', 'Degradado perfecto', 1),
  ('https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=600', 'Estilo clásico', 2),
  ('https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=600', 'Diseño artístico', 3),
  ('https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=600', 'Barba impecable', 4),
  ('https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=600', 'Nuestro espacio', 5),
  ('https://images.unsplash.com/photo-1634302086887-13b5281d7431?w=600', 'Detalle profesional', 6);

-- Insert default testimonials
INSERT INTO public.testimonials (name, content, rating, order_num) VALUES
  ('Carlos Mendoza', 'El mejor corte que he tenido. El ambiente es increíble y los barberos son verdaderos profesionales.', 5, 1),
  ('Juan Pérez', 'Llevo años viniendo aquí y nunca me han decepcionado. Calidad y servicio de primera.', 5, 2),
  ('Miguel Ángel', 'Los cursos de la academia son excelentes. Aprendí técnicas que me han ayudado a crecer profesionalmente.', 5, 3);

-- Insert demo courses
INSERT INTO public.courses (title, description, cover_image, duration, level, price, status, category, tags) VALUES
  ('Fundamentos del Barbero', 'Aprende las técnicas básicas de corte, manejo de herramientas y atención al cliente.', 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800', '8 horas', 'beginner', 0, 'published', 'Básico', ARRAY['fundamentos', 'principiantes']),
  ('Técnicas Avanzadas de Degradado', 'Domina el arte del fade perfecto con técnicas profesionales.', 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800', '12 horas', 'intermediate', 99, 'published', 'Avanzado', ARRAY['fade', 'degradado', 'técnicas']),
  ('Diseños y Arte en Cabello', 'Aprende a crear diseños artísticos y patrones en el cabello.', 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=800', '6 horas', 'advanced', 149, 'published', 'Especialización', ARRAY['diseños', 'arte', 'creatividad']);