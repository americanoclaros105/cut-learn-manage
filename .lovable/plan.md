

# Cambiar Título de Sección de Cursos

## Cambio Solicitado
Cambiar el título de la sección de cursos de "Academia de Barbería" a "Cursos".

## Ubicación del Cambio

El título se puede configurar de dos formas:

1. **Valor por defecto en código** (cuando no hay datos en BD)
2. **Valor en base de datos** (configurado desde Editor de Landing)

## Cambios a Implementar

### Archivo: `src/pages/Index.tsx`

Cambiar el valor por defecto del título de la sección de cursos:

```typescript
// Antes
courses_section: {
  title: "Academia",
  subtitle: "Aprende de los mejores profesionales",
},

// Después
courses_section: {
  title: "Cursos",
  subtitle: "Aprende de los mejores profesionales",
},
```

### Archivo: `src/pages/admin/LandingEditor.tsx`

Actualizar también el valor por defecto para consistencia:

```typescript
// Antes
courses_section: {
  title: 'Academia',
  subtitle: 'Aprende de los mejores profesionales',
},

// Después
courses_section: {
  title: 'Cursos',
  subtitle: 'Aprende de los mejores profesionales',
},
```

## Nota Importante

Si el valor "Academia de Barbería" está guardado en tu base de datos, deberás:

1. Ir al panel de administración (`/admin`)
2. Entrar al Editor de Landing
3. Buscar la sección de configuración de cursos (si existe) y cambiar el título manualmente

O bien, puedo actualizar directamente el valor en la base de datos si lo prefieres.

## Resumen

| Archivo | Cambio |
|---------|--------|
| `src/pages/Index.tsx` | Cambiar `title: "Academia"` → `title: "Cursos"` |
| `src/pages/admin/LandingEditor.tsx` | Cambiar `title: 'Academia'` → `title: 'Cursos'` |

