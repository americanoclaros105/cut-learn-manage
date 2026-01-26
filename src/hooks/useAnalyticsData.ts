import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfDay, startOfWeek, startOfMonth, subHours, endOfDay } from 'date-fns';

export type TimeFilter = 'hour' | 'day' | 'week' | 'month' | 'custom';

export interface AnalyticsFilters {
  timeFilter: TimeFilter;
  startDate?: Date;
  endDate?: Date;
}

export interface PageView {
  id: string;
  session_id: string;
  page_path: string;
  referrer: string | null;
  user_agent: string | null;
  device_type: string | null;
  created_at: string;
}

export interface SectionClick {
  id: string;
  session_id: string;
  section_name: string;
  element_type: string;
  element_label: string | null;
  created_at: string;
}

const getDateRange = (filters: AnalyticsFilters) => {
  const now = new Date();
  switch (filters.timeFilter) {
    case 'hour':
      return { start: subHours(now, 1), end: now };
    case 'day':
      return { start: startOfDay(now), end: now };
    case 'week':
      return { start: startOfWeek(now, { weekStartsOn: 1 }), end: now };
    case 'month':
      return { start: startOfMonth(now), end: now };
    case 'custom':
      return {
        start: filters.startDate || startOfDay(now),
        end: filters.endDate ? endOfDay(filters.endDate) : now,
      };
  }
};

export const useAnalyticsData = (filters: AnalyticsFilters) => {
  const { start, end } = getDateRange(filters);

  // Query for page views
  const pageViewsQuery = useQuery({
    queryKey: ['analytics', 'pageViews', filters.timeFilter, start.toISOString(), end.toISOString()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('page_views')
        .select('*')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as PageView[];
    },
  });

  // Query for section clicks
  const clicksQuery = useQuery({
    queryKey: ['analytics', 'clicks', filters.timeFilter, start.toISOString(), end.toISOString()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('section_clicks')
        .select('*')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

      if (error) throw error;
      return data as SectionClick[];
    },
  });

  // Calculate metrics
  const pageViews = pageViewsQuery.data || [];
  const clicks = clicksQuery.data || [];

  const uniqueVisitors = new Set(pageViews.map((pv) => pv.session_id)).size;
  const totalClicks = clicks.length;
  const engagementRate = pageViews.length > 0 ? (totalClicks / pageViews.length).toFixed(2) : '0';

  // Device breakdown
  const deviceBreakdown = pageViews.reduce(
    (acc, pv) => {
      const device = pv.device_type || 'unknown';
      acc[device] = (acc[device] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  // Section clicks breakdown
  const sectionBreakdown = clicks.reduce(
    (acc, click) => {
      acc[click.section_name] = (acc[click.section_name] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  // Detailed clicks (by section + element + label)
  const detailedClicks = clicks.reduce(
    (acc, click) => {
      const key = `${click.section_name}|${click.element_type}|${click.element_label || 'N/A'}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return {
    pageViews,
    clicks,
    uniqueVisitors,
    totalClicks,
    engagementRate,
    deviceBreakdown,
    sectionBreakdown,
    detailedClicks,
    isLoading: pageViewsQuery.isLoading || clicksQuery.isLoading,
    error: pageViewsQuery.error || clicksQuery.error,
  };
};
