

# Sistema de Analytics para Landing Page

## Resumen

Implementar un sistema completo de analytics que permita al superadmin visualizar métricas de visitas y engagement en la landing page, con filtros por período de tiempo y visualización de clicks por sección.

---

## Arquitectura de la Solución

```text
┌─────────────────────────────────────────────────────────────────┐
│                      Landing Page (Index.tsx)                    │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │   Hero   │  │Services  │  │ Products │  │ Courses  │  ...   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘        │
│       │             │             │             │               │
│       └─────────────┴─────────────┴─────────────┘               │
│                          │                                       │
│                    useAnalytics()                                │
│                          │                                       │
└──────────────────────────┼───────────────────────────────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │   Supabase Database    │
              │                        │
              │  ┌──────────────────┐  │
              │  │  page_views      │  │
              │  │  - id            │  │
              │  │  - session_id    │  │
              │  │  - page_path     │  │
              │  │  - referrer      │  │
              │  │  - user_agent    │  │
              │  │  - created_at    │  │
              │  └──────────────────┘  │
              │                        │
              │  ┌──────────────────┐  │
              │  │  section_clicks  │  │
              │  │  - id            │  │
              │  │  - session_id    │  │
              │  │  - section_name  │  │
              │  │  - element_type  │  │
              │  │  - element_label │  │
              │  │  - created_at    │  │
              │  └──────────────────┘  │
              └────────────────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │   Admin Dashboard      │
              │                        │
              │  ┌──────────────────┐  │
              │  │ Analytics Panel  │  │
              │  │ - Time filters   │  │
              │  │ - Visit charts   │  │
              │  │ - Click metrics  │  │
              │  │ - Top sections   │  │
              │  └──────────────────┘  │
              └────────────────────────┘
```

---

## Paso 1: Crear Tablas en Supabase

### Tabla `page_views`
Almacena cada visita a la landing page.

```sql
CREATE TABLE page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  page_path text NOT NULL DEFAULT '/',
  referrer text,
  user_agent text,
  device_type text, -- 'mobile', 'tablet', 'desktop'
  country text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index para consultas por fecha
CREATE INDEX idx_page_views_created_at ON page_views(created_at DESC);

-- RLS: Solo superadmins pueden ver, insertar público (anónimo)
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert page views"
  ON page_views FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Superadmins can view page views"
  ON page_views FOR SELECT
  USING (has_role(auth.uid(), 'superadmin'));
```

### Tabla `section_clicks`
Almacena clicks en elementos interactivos de cada sección.

```sql
CREATE TABLE section_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  section_name text NOT NULL, -- 'hero', 'services', 'products', 'courses', 'contact', etc.
  element_type text NOT NULL, -- 'button', 'card', 'link', 'cta'
  element_label text, -- texto del botón o nombre del elemento
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index para consultas
CREATE INDEX idx_section_clicks_created_at ON section_clicks(created_at DESC);
CREATE INDEX idx_section_clicks_section ON section_clicks(section_name);

-- RLS
ALTER TABLE section_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert section clicks"
  ON section_clicks FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Superadmins can view section clicks"
  ON section_clicks FOR SELECT
  USING (has_role(auth.uid(), 'superadmin'));
```

---

## Paso 2: Hook de Analytics para Tracking

### Archivo: `src/hooks/useAnalytics.ts`

```typescript
import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Generar o recuperar session ID
const getSessionId = () => {
  let sessionId = sessionStorage.getItem('analytics_session');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem('analytics_session', sessionId);
  }
  return sessionId;
};

// Detectar tipo de dispositivo
const getDeviceType = () => {
  const ua = navigator.userAgent;
  if (/tablet|ipad/i.test(ua)) return 'tablet';
  if (/mobile|android|iphone/i.test(ua)) return 'mobile';
  return 'desktop';
};

export const useAnalytics = () => {
  const hasTrackedView = useRef(false);

  // Trackear vista de página (una vez por sesión)
  useEffect(() => {
    if (hasTrackedView.current) return;
    hasTrackedView.current = true;

    const trackPageView = async () => {
      try {
        await supabase.from('page_views').insert({
          session_id: getSessionId(),
          page_path: window.location.pathname,
          referrer: document.referrer || null,
          user_agent: navigator.userAgent,
          device_type: getDeviceType(),
        });
      } catch (error) {
        console.error('Error tracking page view:', error);
      }
    };

    trackPageView();
  }, []);

  // Función para trackear clicks
  const trackClick = useCallback(async (
    sectionName: string,
    elementType: string,
    elementLabel?: string
  ) => {
    try {
      await supabase.from('section_clicks').insert({
        session_id: getSessionId(),
        section_name: sectionName,
        element_type: elementType,
        element_label: elementLabel || null,
      });
    } catch (error) {
      console.error('Error tracking click:', error);
    }
  }, []);

  return { trackClick };
};
```

---

## Paso 3: Integrar Tracking en Componentes

### Modificaciones en `Index.tsx`
Pasar `trackClick` a las secciones.

### Modificaciones en secciones (ejemplo HeroSection):

```typescript
// Añadir prop onTrackClick
interface HeroSectionProps {
  content: LandingContent["hero"];
  whatsapp: string;
  whatsappMessage: string;
  onTrackClick?: (section: string, type: string, label?: string) => void;
}

// En el botón de WhatsApp
<Button
  onClick={() => {
    onTrackClick?.('hero', 'button', 'Reservar Cita');
    handleWhatsAppClick();
  }}
>
  {content.ctaText}
</Button>
```

### Secciones a trackear:
- **Hero**: CTAs principales (WhatsApp, Ver Servicios)
- **Services**: Click en cada servicio, botón "Reservar"
- **Products**: Click en cada producto, botón "Más Info"
- **Courses**: Click en cada curso, filtros
- **Contact**: Formulario enviado, WhatsApp
- **Gallery**: Navegación de galería
- **Testimonials**: Navegación de testimonios

---

## Paso 4: Dashboard de Analytics

### Nuevo componente: `src/components/admin/AnalyticsDashboard.tsx`

Incluirá:

1. **Filtros de tiempo**:
   - Última hora
   - Hoy
   - Esta semana
   - Este mes
   - Rango personalizado (DatePicker)

2. **Tarjetas de métricas**:
   - Total de visitas
   - Visitantes únicos (por session_id)
   - Total de clicks
   - Tasa de engagement (clicks/visitas)

3. **Gráfico de visitas** (con Recharts):
   - Línea temporal de visitas
   - Agrupación por hora/día según filtro

4. **Top secciones más clickeadas**:
   - Gráfico de barras horizontal
   - Lista ordenada con porcentajes

5. **Desglose por dispositivo**:
   - Pie chart (mobile/tablet/desktop)

6. **Clicks por sección detallado**:
   - Tabla con sección, elemento, cantidad

---

## Paso 5: Hook para Consultar Analytics

### Archivo: `src/hooks/useAnalyticsData.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfHour, startOfDay, startOfWeek, startOfMonth, subHours } from 'date-fns';

type TimeFilter = 'hour' | 'day' | 'week' | 'month' | 'custom';

interface AnalyticsFilters {
  timeFilter: TimeFilter;
  startDate?: Date;
  endDate?: Date;
}

export const useAnalyticsData = (filters: AnalyticsFilters) => {
  const getDateRange = () => {
    const now = new Date();
    switch (filters.timeFilter) {
      case 'hour': return { start: subHours(now, 1), end: now };
      case 'day': return { start: startOfDay(now), end: now };
      case 'week': return { start: startOfWeek(now), end: now };
      case 'month': return { start: startOfMonth(now), end: now };
      case 'custom': return { 
        start: filters.startDate || startOfDay(now), 
        end: filters.endDate || now 
      };
    }
  };

  // Query para page views
  const pageViewsQuery = useQuery({
    queryKey: ['analytics', 'pageViews', filters],
    queryFn: async () => {
      const { start, end } = getDateRange();
      const { data, error } = await supabase
        .from('page_views')
        .select('*')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  // Query para section clicks
  const clicksQuery = useQuery({
    queryKey: ['analytics', 'clicks', filters],
    queryFn: async () => {
      const { start, end } = getDateRange();
      const { data, error } = await supabase
        .from('section_clicks')
        .select('*')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());
      
      if (error) throw error;
      return data;
    },
  });

  return {
    pageViews: pageViewsQuery.data || [],
    clicks: clicksQuery.data || [],
    isLoading: pageViewsQuery.isLoading || clicksQuery.isLoading,
  };
};
```

---

## Paso 6: Integrar en AdminDashboard

Añadir la sección de Analytics debajo de las estadísticas actuales:

```typescript
// En AdminDashboard.tsx
import { AnalyticsDashboard } from '@/components/admin/AnalyticsDashboard';

// Añadir después del grid de cards existente
<div className="mt-8">
  <AnalyticsDashboard />
</div>
```

---

## Visualización del Dashboard

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        📊 Analytics de Landing                          │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Filtros: [Hora] [Hoy] [Semana] [Mes] [Personalizado 📅]               │
│                                                                         │
├─────────────────┬─────────────────┬─────────────────┬──────────────────┤
│   👁️ 1,234       │   👤 856         │   👆 3,456       │   📈 2.8         │
│   Visitas       │   Únicos        │   Clicks        │   Clicks/Visita  │
├─────────────────┴─────────────────┴─────────────────┴──────────────────┤
│                                                                         │
│  📈 Visitas por Tiempo                                                  │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │    ▲                                        ●                    │   │
│  │    │                      ●  ●           ●   ●                   │   │
│  │    │     ●  ●          ●       ●      ●        ●                 │   │
│  │    │  ●       ●     ●            ●  ●                            │   │
│  │    └────────────────────────────────────────────────────────►    │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
├────────────────────────────────┬────────────────────────────────────────┤
│  🏆 Top Secciones              │  📱 Dispositivos                       │
│                                │                                        │
│  Cursos      ████████████ 34%  │      ┌──────────┐                     │
│  Servicios   █████████ 28%     │     /   Desktop  \                    │
│  Hero        ███████ 22%       │    │    58%      │                    │
│  Productos   █████ 16%         │    │  Mobile 35% │                    │
│                                │     \  Tablet 7% /                    │
│                                │      └──────────┘                     │
├────────────────────────────────┴────────────────────────────────────────┤
│  📋 Detalle de Clicks                                                   │
│  ┌──────────────┬────────────────┬──────────────────┬─────────────┐    │
│  │ Sección      │ Elemento       │ Etiqueta         │ Cantidad    │    │
│  ├──────────────┼────────────────┼──────────────────┼─────────────┤    │
│  │ courses      │ card           │ Micropigmentación│ 245         │    │
│  │ hero         │ button         │ Reservar Cita    │ 189         │    │
│  │ services     │ button         │ Reservar         │ 156         │    │
│  │ products     │ button         │ Más Info         │ 134         │    │
│  └──────────────┴────────────────┴──────────────────┴─────────────┘    │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Archivos a Crear/Modificar

### Crear:
1. `src/hooks/useAnalytics.ts` - Hook para tracking
2. `src/hooks/useAnalyticsData.ts` - Hook para consultas
3. `src/components/admin/AnalyticsDashboard.tsx` - Panel principal

### Modificar:
1. **Base de datos**: Crear tablas `page_views` y `section_clicks`
2. `src/pages/Index.tsx` - Integrar useAnalytics
3. `src/components/landing/HeroSection.tsx` - Añadir tracking
4. `src/components/landing/ServicesSection.tsx` - Añadir tracking
5. `src/components/landing/ProductsSection.tsx` - Añadir tracking
6. `src/components/landing/CoursesSection.tsx` - Añadir tracking
7. `src/components/landing/ContactSection.tsx` - Añadir tracking
8. `src/pages/admin/AdminDashboard.tsx` - Integrar AnalyticsDashboard

---

## Consideraciones Técnicas

1. **Rendimiento**: El tracking es asíncrono y no bloquea la UI
2. **Privacidad**: No se almacenan datos personales identificables
3. **Session ID**: Usa sessionStorage (se resetea al cerrar pestaña)
4. **RLS**: Los datos solo son visibles para superadmins
5. **Recharts**: Ya está instalado en el proyecto para gráficos

