// Análise de bundle e chunks em tempo de execução

interface BundleInfo {
  totalSize: number;
  chunks: Array<{
    name: string;
    size: number;
  }>;
}

export const analyzeBundleSize = async (): Promise<BundleInfo> => {
  const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  
  const jsResources = resources.filter(r => 
    r.name.endsWith('.js') || r.name.endsWith('.mjs')
  );

  const chunks = jsResources.map(resource => ({
    name: resource.name.split('/').pop() || 'unknown',
    size: resource.transferSize || 0,
  }));

  const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0);

  return {
    totalSize,
    chunks: chunks.sort((a, b) => b.size - a.size),
  };
};

export const logBundleAnalysis = async () => {
  const info = await analyzeBundleSize();
  
  console.group('📦 Bundle Analysis');
  console.log(`Total JS Size: ${(info.totalSize / 1024).toFixed(2)} KB`);
  console.table(
    info.chunks.map(chunk => ({
      ...chunk,
      size: `${(chunk.size / 1024).toFixed(2)} KB`,
    }))
  );
  console.groupEnd();
};

// Auto-log em desenvolvimento
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  window.addEventListener('load', () => {
    setTimeout(logBundleAnalysis, 2000);
  });
}
