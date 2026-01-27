

# Rediseño Completo de Vista de Detalle de Curso

## Resumen del Rediseño

Transformar la vista actual de curso en una experiencia inmersiva, moderna y altamente funcional que priorice la usabilidad en todos los dispositivos.

## Problemas Actuales Identificados

| Problema | Impacto |
|----------|---------|
| Header muy grande que tapa contenido | Dificulta el scroll y navegacion |
| Sidebar fija que ocupa mucho espacio | Reduce area de contenido en pantallas pequenas |
| Navegacion entre lecciones poco intuitiva | Experiencia fragmentada |
| Falta de feedback visual de progreso | Usuario pierde contexto de avance |
| Diseno no aprovecha bien el espacio | Desperdicio de area util |

## Nueva Arquitectura de Componentes

```text
CourseViewer.tsx (Controlador principal)
|
+-- CoursePlayerHeader.tsx (Header minimalista sticky)
|   |-- Logo/Back button
|   |-- Course title (truncado)
|   |-- Progress ring circular
|   +-- Menu hamburger (mobile)
|
+-- CoursePlayerLayout.tsx (Layout responsivo)
    |
    +-- [Desktop] CourseContentPanel.tsx
    |   |-- LessonPlayer.tsx (Video/PDF/Content)
    |   |-- LessonInfo.tsx (Titulo, tipo, descripcion)
    |   |-- LessonActions.tsx (Completar, Anterior, Siguiente)
    |   +-- AttachmentsPanel.tsx
    |
    +-- [Desktop] CourseModulesPanel.tsx (Sidebar colapsable)
    |   |-- ProgressOverview.tsx
    |   +-- ModuleAccordion.tsx
    |
    +-- [Mobile] BottomNavigation.tsx
        |-- Prev/Next buttons
        |-- Progress indicator
        +-- Sheet trigger para modulos
```

## Diseno Visual Propuesto

### 1. Header Minimalista Sticky (56px altura)

- Fondo semi-transparente con blur (glassmorphism)
- Boton de retorno a la izquierda
- Titulo del curso truncado en el centro
- Anillo de progreso circular animado a la derecha
- En mobile: hamburger menu para modulos

### 2. Area de Contenido Principal

**Desktop (lg+):**
- Layout de 2 columnas: Contenido (70%) + Sidebar (30%)
- Sidebar colapsable con boton toggle
- Video/contenido ocupa maximo espacio disponible

**Tablet (md):**
- Contenido full-width
- Sidebar como overlay deslizable desde la derecha
- Bottom bar con navegacion

**Mobile (sm):**
- Contenido full-width inmersivo
- Bottom navigation fija con Prev/Progress/Next
- Modulos accesibles via Sheet desde bottom bar

### 3. Nuevo LessonPlayer

- Bordes redondeados con sombra sutil
- Controles overlay para videos (play, fullscreen)
- Skeleton loading animado durante carga
- Soporte para modo teatro (expandir video)

### 4. Sistema de Progreso Visual

- Anillo circular animado en header (progreso general)
- Barra de progreso en cada modulo del sidebar
- Indicadores de leccion: Pendiente (circulo), En curso (animado), Completada (checkmark verde)
- Confetti animation al completar curso

### 5. Panel de Modulos Mejorado

- Acordeon con animaciones suaves
- Preview de primera imagen/video de leccion
- Tiempo estimado por modulo
- Indicador visual de modulo activo
- Scroll automatico a leccion actual

## Detalles Tecnicos

### Archivos a Crear

| Archivo | Descripcion |
|---------|-------------|
| `src/components/student/course/CoursePlayerHeader.tsx` | Header minimalista con progress ring |
| `src/components/student/course/CoursePlayerLayout.tsx` | Layout responsivo principal |
| `src/components/student/course/LessonPlayer.tsx` | Componente de reproduccion de contenido |
| `src/components/student/course/BottomNavigation.tsx` | Navegacion inferior mobile |
| `src/components/student/course/ProgressRing.tsx` | Anillo de progreso circular SVG |
| `src/components/student/course/ModulesPanel.tsx` | Nuevo panel de modulos con acordeon |

### Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `src/pages/student/CourseViewer.tsx` | Refactorizar para usar nueva estructura |
| `src/components/student/course/CourseHeader.tsx` | Reemplazar por CoursePlayerHeader |
| `src/components/student/course/CourseSidebar.tsx` | Integrar en ModulesPanel |
| `src/components/student/course/LessonContent.tsx` | Simplificar, mover logica a LessonPlayer |
| `src/index.css` | Agregar nuevas utilidades CSS |

### Nuevos Estilos CSS

```css
/* Glassmorphism para header */
.glass-header {
  backdrop-filter: blur(12px);
  background: rgba(var(--background), 0.8);
}

/* Animacion de entrada para contenido */
.lesson-enter {
  animation: slideUp 0.3s ease-out;
}

/* Progress ring animation */
.progress-ring {
  transition: stroke-dashoffset 0.5s ease-out;
}
```

### Caracteristicas UX/UI Nuevas

1. **Keyboard Navigation**
   - Flechas izquierda/derecha para navegar lecciones
   - Espacio para play/pause videos
   - Escape para cerrar modales

2. **Gestos Touch (Mobile)**
   - Swipe left/right para cambiar leccion
   - Pull down para mostrar info del curso
   - Double tap para fullscreen en videos

3. **Feedback Visual**
   - Toast de celebracion al completar leccion
   - Confetti al completar modulo/curso
   - Shake animation si intenta avanzar sin completar

4. **Accesibilidad**
   - Labels ARIA completos
   - Focus management adecuado
   - Skip links para navegacion por teclado

## Responsive Breakpoints

| Breakpoint | Comportamiento |
|------------|----------------|
| < 640px (sm) | Full mobile: Bottom nav, sheet para modulos |
| 640-1024px (md-lg) | Tablet: Sidebar overlay, header compacto |
| > 1024px (lg+) | Desktop: Sidebar fija, header completo |

## Flujo de Navegacion Mejorado

1. Usuario entra al curso
2. Ve header minimalista con progreso circular
3. Contenido de leccion ocupa maximo espacio
4. En mobile: bottom bar siempre visible para navegacion
5. En desktop: sidebar con modulos colapsables
6. Al completar leccion: transicion suave a siguiente
7. Al completar curso: celebracion con confetti

## Animaciones con Framer Motion

- Transiciones entre lecciones (slide horizontal)
- Fade in del contenido
- Scale del progress ring al actualizar
- Bounce del boton "Completar"
- Stagger animation de lista de modulos

