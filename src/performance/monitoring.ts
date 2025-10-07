// Sistema de Monitoramento de Performance
interface PerformanceMetrics {
  fcp: number;
  lcp: number;
  fid: number;
  cls: number;
  ttfb: number;
  tti: number;
}

class PerformanceMonitor {
  private metrics: Partial<PerformanceMetrics> = {};

  init() {
    this.measureFCP();
    this.measureLCP();
    this.measureFID();
    this.measureCLS();
    this.measureTTFB();
    this.measureTTI();
  }

  private measureFCP() {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          this.metrics.fcp = entry.startTime;
          console.log('FCP:', entry.startTime);
        }
      }
    });
    observer.observe({ entryTypes: ['paint'] });
  }

  private measureLCP() {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as any;
      this.metrics.lcp = lastEntry.renderTime || lastEntry.loadTime;
      console.log('LCP:', this.metrics.lcp);
    });
    observer.observe({ entryTypes: ['largest-contentful-paint'] });
  }

  private measureFID() {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.metrics.fid = (entry as any).processingStart - entry.startTime;
        console.log('FID:', this.metrics.fid);
      }
    });
    observer.observe({ entryTypes: ['first-input'] });
  }

  private measureCLS() {
    let cls = 0;
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          cls += (entry as any).value;
          this.metrics.cls = cls;
          console.log('CLS:', cls);
        }
      }
    });
    observer.observe({ entryTypes: ['layout-shift'] });
  }

  private measureTTFB() {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      this.metrics.ttfb = navigation.responseStart - navigation.requestStart;
      console.log('TTFB:', this.metrics.ttfb);
    }
  }

  private measureTTI() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'measure' && entry.name === 'tti') {
            this.metrics.tti = entry.startTime;
            console.log('TTI:', entry.startTime);
          }
        }
      });
    }
  }

  getMetrics(): Partial<PerformanceMetrics> {
    return { ...this.metrics };
  }

  logMetrics() {
    console.table(this.metrics);
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Auto init
if (typeof window !== 'undefined') {
  performanceMonitor.init();
}
