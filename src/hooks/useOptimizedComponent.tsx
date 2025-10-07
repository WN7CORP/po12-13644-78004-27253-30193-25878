import { memo, useMemo, useCallback } from 'react';

// HOC para otimização automática de componentes
export function withOptimization<P extends object>(
  Component: React.ComponentType<P>,
  displayName?: string
) {
  const MemoizedComponent = memo(Component, (prevProps, nextProps) => {
    // Compare shallow
    const prevKeys = Object.keys(prevProps);
    const nextKeys = Object.keys(nextProps);
    
    if (prevKeys.length !== nextKeys.length) return false;
    
    return prevKeys.every(key => {
      const prevValue = (prevProps as any)[key];
      const nextValue = (nextProps as any)[key];
      
      // For functions, consider them equal if both exist
      if (typeof prevValue === 'function' && typeof nextValue === 'function') {
        return true;
      }
      
      return prevValue === nextValue;
    });
  });

  if (displayName) {
    MemoizedComponent.displayName = displayName;
  }

  return MemoizedComponent;
}

// Hook para memoização inteligente
export function useSmartMemo<T>(factory: () => T, deps: React.DependencyList): T {
  return useMemo(factory, deps);
}

// Hook para callbacks otimizados
export function useSmartCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T {
  return useCallback(callback, deps);
}

// Hook para validar se componente deve re-renderizar
export function useShouldUpdate(deps: React.DependencyList): boolean {
  const prevDeps = useMemo(() => deps, []);
  
  return useMemo(() => {
    if (prevDeps.length !== deps.length) return true;
    return deps.some((dep, i) => dep !== prevDeps[i]);
  }, deps);
}
