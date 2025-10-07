import { lazy, Suspense, ComponentType } from 'react';

interface LazyComponentOptions {
  fallback?: React.ReactNode;
  delay?: number;
}

// Lazy loading com fallback automático
export function useLazyComponent<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  options: LazyComponentOptions = {}
) {
  const { fallback = <div className="animate-pulse bg-muted h-32 rounded-lg" />, delay = 0 } = options;

  const LazyComponent = lazy(() => {
    if (delay > 0) {
      return new Promise<{ default: T }>((resolve) => {
        setTimeout(() => {
          importFunc().then(resolve);
        }, delay);
      });
    }
    return importFunc();
  });

  return (props: any) => (
    <Suspense fallback={fallback}>
      <LazyComponent {...props} />
    </Suspense>
  );
}

// Preload de componente lazy
export const preloadLazyComponent = (importFunc: () => Promise<any>) => {
  importFunc().catch(() => {});
};
