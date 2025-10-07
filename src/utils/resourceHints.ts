// Sistema de Resource Hints para otimização de carregamento

export const addResourceHints = () => {
  const hints = [
    // Preconnect to Supabase
    {
      rel: 'preconnect',
      href: 'https://phzcazcyjhlmdchcjagy.supabase.co',
      crossOrigin: 'anonymous'
    },
    // DNS Prefetch
    {
      rel: 'dns-prefetch',
      href: 'https://phzcazcyjhlmdchcjagy.supabase.co'
    },
  ];

  hints.forEach(hint => {
    const link = document.createElement('link');
    link.rel = hint.rel;
    link.href = hint.href;
    if (hint.crossOrigin) {
      link.crossOrigin = hint.crossOrigin;
    }
    document.head.appendChild(link);
  });
};

// Preload de módulos críticos
export const preloadModules = (modules: string[]) => {
  modules.forEach(modulePath => {
    const link = document.createElement('link');
    link.rel = 'modulepreload';
    link.href = modulePath;
    document.head.appendChild(link);
  });
};

// Prefetch de rotas
export const prefetchRoute = (path: string) => {
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = path;
  document.head.appendChild(link);
};

// Auto-inicializar
if (typeof window !== 'undefined') {
  addResourceHints();
  
  // Preload módulos críticos
  preloadModules([
    '/src/main.tsx',
    '/src/App.tsx',
  ]);
}
