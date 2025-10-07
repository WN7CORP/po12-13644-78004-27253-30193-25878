// Otimizações de animação baseadas em preferências do usuário

export const shouldReduceMotion = (): boolean => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

export const setupAnimationOptimization = () => {
  if (shouldReduceMotion()) {
    document.documentElement.style.setProperty('--animation-duration', '0.01ms');
    document.documentElement.style.setProperty('--transition-duration', '0.01ms');
    document.documentElement.classList.add('reduce-motion');
  }
};

// Usar GPU acceleration para animações
export const optimizeForGPU = (element: HTMLElement) => {
  element.style.willChange = 'transform';
  element.style.transform = 'translateZ(0)';
};

// Debounce de scroll para animações
export const createScrollOptimizer = (callback: () => void, delay = 100) => {
  let timeoutId: NodeJS.Timeout;
  let isScrolling = false;

  return () => {
    if (!isScrolling) {
      isScrolling = true;
      document.body.classList.add('is-scrolling');
    }

    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      isScrolling = false;
      document.body.classList.remove('is-scrolling');
      callback();
    }, delay);
  };
};

// Auto-setup
if (typeof window !== 'undefined') {
  setupAnimationOptimization();
}
