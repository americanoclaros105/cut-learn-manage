

# Actualizar Subtítulo de Sección de Cursos

## Cambio Solicitado

Cambiar el subtítulo de la sección de cursos a algo más genérico, no enfocado solo en barbería.

## Valor Actual

```
"Aprende de los mejores profesionales y domina el arte de la barbería"
```

## Nuevo Valor Propuesto

```
"Aprende de los mejores profesionales"
```

Este subtítulo es más versátil y aplica a cualquier tipo de curso que se ofrezca en la plataforma.

## Cambios a Implementar

### 1. Base de Datos

Actualizar el campo `courses_section.subtitle` en la tabla `landing_content`:

```sql
UPDATE landing_content 
SET courses_section = jsonb_set(
  courses_section, 
  '{subtitle}', 
  '"Aprende de los mejores profesionales"'
)
WHERE id = '802f7818-72fb-42e8-8bc0-49986cde0d5b'
```

### 2. Código - Valores por Defecto

Actualizar los valores por defecto en dos archivos para mantener consistencia:

| Archivo | Cambio |
|---------|--------|
| `src/pages/Index.tsx` | Línea 31: Cambiar subtítulo en `defaultContent.courses_section` |
| `src/pages/admin/LandingEditor.tsx` | Línea 38: Cambiar subtítulo en `defaultContent.courses_section` |

## Resumen de Cambios

| Ubicación | Antes | Después |
|-----------|-------|---------|
| Base de datos | "Aprende de los mejores profesionales y domina el arte de la barbería" | "Aprende de los mejores profesionales" |
| Index.tsx (default) | "Aprende de los mejores profesionales" | Sin cambio (ya está correcto) |
| LandingEditor.tsx (default) | "Aprende de los mejores profesionales" | Sin cambio (ya está correcto) |

Los valores por defecto en el código ya tienen el texto genérico. Solo necesitamos actualizar la base de datos.

