UPDATE landing_content 
SET courses_section = jsonb_set(
  courses_section, 
  '{title}', 
  '"Cursos"'
)
WHERE id = '802f7818-72fb-42e8-8bc0-49986cde0d5b'