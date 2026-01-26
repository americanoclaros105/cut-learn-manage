import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Generate or retrieve session ID
const getSessionId = () => {
  let sessionId = sessionStorage.getItem('analytics_session');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem('analytics_session', sessionId);
  }
  return sessionId;
};

// Detect device type
const getDeviceType = () => {
  const ua = navigator.userAgent;
  if (/tablet|ipad/i.test(ua)) return 'tablet';
  if (/mobile|android|iphone/i.test(ua)) return 'mobile';
  return 'desktop';
};

export const useAnalytics = () => {
  const hasTrackedView = useRef(false);

  // Track page view (once per session)
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

  // Function to track clicks
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
