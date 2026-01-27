

# Admin Responsive: Sidebar con Menu Hamburguesa

## Resumen

Hacer que el panel de administracion sea completamente responsive, ocultando el sidebar en dispositivos pequenos y mostrando un boton hamburguesa que abre el menu como un drawer lateral (Sheet).

## Arquitectura Actual

```text
+------------------+---------------------+
|                  |                     |
|   AdminSidebar   |   <Outlet />        |
|   (w-64 fijo)    |   (contenido)       |
|                  |                     |
+------------------+---------------------+
```

El problema: el sidebar siempre es visible con `w-64`, ocupando espacio valioso en pantallas pequenas.

## Solucion Propuesta

```text
DESKTOP (md+):                       MOBILE (<md):
+----------+----------------+        +-------------------------+
|          |                |        | [=] Header con trigger  |
| Sidebar  |  Contenido     |        +-------------------------+
| visible  |                |        |                         |
|          |                |        |      Contenido          |
+----------+----------------+        |                         |
                                     +-------------------------+
                                     
                                     Al tocar [=]:
                                     +-------+------------------+
                                     |Sidebar|                  |
                                     |Sheet  |   (overlay)      |
                                     |       |                  |
                                     +-------+------------------+
```

## Cambios a Implementar

### 1. Crear `MobileAdminSidebar.tsx`

Nuevo componente que usa `Sheet` (ya existe en el proyecto) para mostrar el sidebar como drawer en mobile.

**Ubicacion:** `src/components/admin/MobileAdminSidebar.tsx`

**Contenido:**
- Boton trigger con icono Menu (hamburguesa)
- Sheet que abre desde la izquierda
- Reutiliza el contenido del AdminSidebar actual
- Cierra automaticamente al navegar a una ruta

### 2. Crear `AdminSidebarContent.tsx`

Componente que contiene el contenido compartido del sidebar (logo, menu items, usuario, botones).

**Ubicacion:** `src/components/admin/AdminSidebarContent.tsx`

**Beneficio:** Evitar duplicar codigo entre la version desktop y mobile.

### 3. Modificar `AdminSidebar.tsx`

Refactorizar para:
- Usar `AdminSidebarContent` internamente
- Agregar clase `hidden md:flex` para ocultarse en mobile

### 4. Modificar `AdminLayout.tsx`

- Agregar header sticky en mobile con el trigger del menu
- Importar `MobileAdminSidebar`
- Usar el hook `useIsMobile()` (ya existe) para logica condicional

### 5. Ajustar padding responsive en paginas admin

Actualizar las paginas que usan `p-8` fijo para usar `p-4 md:p-8` (ya hecho en LandingEditor, falta en otras).

## Archivos a Crear

| Archivo | Descripcion |
|---------|-------------|
| `src/components/admin/AdminSidebarContent.tsx` | Contenido reutilizable del sidebar |
| `src/components/admin/MobileAdminSidebar.tsx` | Wrapper con Sheet para mobile |

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/admin/AdminSidebar.tsx` | Usar AdminSidebarContent, agregar `hidden md:flex` |
| `src/layouts/AdminLayout.tsx` | Agregar header mobile con trigger, importar MobileAdminSidebar |
| `src/pages/admin/AdminDashboard.tsx` | Cambiar `p-8` por `p-4 md:p-8` |
| `src/pages/admin/CoursesManager.tsx` | Cambiar `p-8` por `p-4 md:p-8` |
| `src/pages/admin/StudentsManager.tsx` | Cambiar `p-8` por `p-4 md:p-8` |

## Detalles Tecnicos

### AdminSidebarContent.tsx

```typescript
// Props opcionales para manejar cierre en mobile
interface AdminSidebarContentProps {
  onNavigate?: () => void;
}

// Contenido:
// - Logo Claros Studio
// - Menu items (Dashboard, Landing, Cursos, Estudiantes)
// - Info usuario
// - Botones Ver Sitio y Cerrar Sesion
```

### MobileAdminSidebar.tsx

```typescript
// Usa Sheet de shadcn (ya instalado)
// Estado open/setOpen para controlar el drawer
// SheetTrigger con Button y icono Menu
// SheetContent side="left" con AdminSidebarContent
// onNavigate cierra el Sheet
```

### AdminLayout.tsx Estructura

```typescript
// Layout:
<div className="flex min-h-screen flex-col md:flex-row">
  {/* Header mobile - solo visible en <md */}
  <header className="md:hidden sticky top-0 z-40 bg-sidebar border-b p-4 flex items-center gap-4">
    <MobileAdminSidebar />
    <span className="font-semibold text-sidebar-foreground">Admin</span>
  </header>

  {/* Sidebar desktop - solo visible en md+ */}
  <AdminSidebar />

  {/* Contenido principal */}
  <main className="flex-1 overflow-auto">
    <Outlet />
  </main>
</div>
```

## Beneficios

1. **Mejor UX en mobile**: El contenido principal ocupa todo el ancho
2. **Consistencia**: Mismo patron que MobileCourseSidebar existente
3. **Codigo limpio**: Componente de contenido reutilizable
4. **Sin breaking changes**: Desktop sigue funcionando igual

## Siguiente Paso Opcional

Aplicar el mismo patron al StudentLayout para que tambien sea responsive.

