// Core Web Vitals tracking

export interface WebVitalsMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
}

type MetricHandler = (metric: WebVitalsMetric) => void;

const thresholds = {
  LCP: { good: 2500, poor: 4000 },
  FID: { good: 100, poor: 300 },
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  TTFB: { good: 800, poor: 1800 },
};

const getRating = (name: string, value: number): 'good' | 'needs-improvement' | 'poor' => {
  const threshold = thresholds[name as keyof typeof thresholds];
  if (!threshold) return 'good';
  
  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
};

export const reportWebVitals = (onReport: MetricHandler) => {
  // Largest Contentful Paint (LCP)
  if ('PerformanceObserver' in window) {
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        const value = lastEntry.renderTime || lastEntry.loadTime;
        
        onReport({
          name: 'LCP',
          value,
          rating: getRating('LCP', value),
          delta: value,
        });
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (e) {
      console.warn('LCP observation failed:', e);
    }

    // First Input Delay (FID)
    try {
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const value = (entry as any).processingStart - entry.startTime;
          onReport({
            name: 'FID',
            value,
            rating: getRating('FID', value),
            delta: value,
          });
        }
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
    } catch (e) {
      console.warn('FID observation failed:', e);
    }

    // Cumulative Layout Shift (CLS)
    try {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
        
        onReport({
          name: 'CLS',
          value: clsValue,
          rating: getRating('CLS', clsValue),
          delta: clsValue,
        });
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (e) {
      console.warn('CLS observation failed:', e);
    }

    // First Contentful Paint (FCP)
    try {
      const fcpObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            onReport({
              name: 'FCP',
              value: entry.startTime,
              rating: getRating('FCP', entry.startTime),
              delta: entry.startTime,
            });
          }
        }
      });
      fcpObserver.observe({ entryTypes: ['paint'] });
    } catch (e) {
      console.warn('FCP observation failed:', e);
    }
  }

  // Time to First Byte (TTFB)
  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  if (navigation) {
    const ttfb = navigation.responseStart - navigation.requestStart;
    onReport({
      name: 'TTFB',
      value: ttfb,
      rating: getRating('TTFB', ttfb),
      delta: ttfb,
    });
  }
};

// Auto-report on load
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    reportWebVitals((metric) => {
      console.log(`📊 ${metric.name}:`, {
        value: `${metric.value.toFixed(2)}ms`,
        rating: metric.rating,
      });
    });
  });
}
