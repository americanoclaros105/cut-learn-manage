
## Objetivo
Arreglar el Dashboard de Analytics que se queda cargando infinito y no muestra métricas.

## Qué está pasando (causa real)
En `useAnalyticsData.ts` la función `getDateRange()` crea un `now = new Date()` en cada render.

Como el `queryKey` de React Query incluye `end.toISOString()`, y `end` es “ahora”, ese valor cambia en milisegundos en cada render.

Resultado:
- React Query cree que es “una query nueva” todo el tiempo
- dispara requests en bucle con `created_at=lte...` cambiando (se ve en los network logs: varias llamadas seguidas con `.672Z`, `.895Z`, `.109Z`, `.326Z`, etc.)
- `isLoading` vuelve a `true` constantemente → el spinner nunca termina

## Solución técnica
Hacer que el rango de fechas (start/end) sea estable entre renders mientras el filtro no cambie.

La forma más simple (sin cambiar la API del hook) es:
- Memorizar el resultado de `getDateRange(filters)` con `useMemo`
- Usar como dependencias SOLO: `timeFilter`, `startDate`, `endDate` (no el objeto entero `filters`)
- Así, “now” queda congelado para ese filtro hasta que el usuario cambie el filtro/fechas

## Cambios a implementar

### 1) `src/hooks/useAnalyticsData.ts`
**Cambios:**
- Importar `useMemo` de React
- Reemplazar:
  - `const { start, end } = getDateRange(filters);`
- Por:
  - `const { start, end } = useMemo(() => getDateRange(filters), [filters.timeFilter, filters.startDate?.getTime(), filters.endDate?.getTime()]);`

**Por qué funciona:**
- `getDateRange()` solo se recalcula cuando el usuario cambia el filtro o las fechas.
- `queryKey` se queda estable, React Query deja de recrear queries infinitamente y `isLoading` pasa a `false` cuando llega la data.

### 2) (Opcional recomendado) `src/components/admin/AnalyticsDashboard.tsx`
Ahora que el rango se estabiliza, el “Hoy / Semana / Mes” quedará calculado hasta que cambies el filtro (no “en tiempo real” cada segundo). Para que sea más usable:
- Agregar un botón “Actualizar” (refresh) que:
  - fuerce a React Query a refetch (`queryClient.invalidateQueries({ queryKey: ['analytics'] })`) o
  - actualice un `refreshKey` local que se use como dependencia extra para recalcular el rango

Esto es opcional; lo crítico para quitar el loading infinito es el punto 1.

## Cómo validaremos que quedó bien
1. Entrar a `/admin`
2. Ver que el spinner desaparece y aparecen las tarjetas (Visitas, Únicos, Clicks, Engagement)
3. Abrir Network:
   - Debe haber 1 request por `page_views` y 1 por `section_clicks` al cargar
   - No debe haber spam infinito de requests con `created_at=lte` cambiando cada milisegundo
4. Cambiar el filtro (Hora/Día/Semana/Mes/Personalizado) y confirmar que:
   - se hace un nuevo request solo una vez por cambio
   - el dashboard responde y no se queda cargando

## Nota adicional (no bloqueante)
En consola aparece un warning de “Function components cannot be given refs…”. No rompe el dashboard, pero después podemos revisarlo para limpiar warnings (probablemente algún componente UI que está recibiendo `ref` sin `forwardRef`).

## Siguientes mejoras sugeridas (después de arreglar el loading)
- Botón “Actualizar” y/o auto-refresh cada 60s para “Hoy/Semana/Mes”
- Tracking de Gallery y Testimonials (clicks en navegación/slide)
- Métrica de “elementos más llamativos” (Top por sección + label, ya tenemos la tabla; se puede sumar un ranking global)
- Exportar CSV desde el dashboard para reportes
