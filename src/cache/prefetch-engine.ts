// Sistema de Prefetch Inteligente
import { indexedDBCache } from './indexeddb-cache';

interface PrefetchConfig {
  enabled: boolean;
  maxConcurrent: number;
  priority: number;
}

class PrefetchEngine {
  private queue: Array<{ url: string; priority: number }> = [];
  private isProcessing = false;
  private maxConcurrent = 3;

  // Detectar qualidade de conexão
  getConnectionQuality(): 'slow' | 'medium' | 'fast' {
    const connection = (navigator as any).connection;
    if (!connection) return 'medium';

    const effectiveType = connection.effectiveType;
    if (effectiveType === 'slow-2g' || effectiveType === '2g') return 'slow';
    if (effectiveType === '3g') return 'medium';
    return 'fast';
  }

  // Adicionar à fila de prefetch
  add(url: string, priority = 1) {
    const quality = this.getConnectionQuality();
    
    // Não fazer prefetch em conexões lentas
    if (quality === 'slow' && priority < 3) return;

    this.queue.push({ url, priority });
    this.queue.sort((a, b) => b.priority - a.priority);
    
    if (!this.isProcessing) {
      this.process();
    }
  }

  // Processar fila de prefetch
  private async process() {
    if (this.queue.length === 0) {
      this.isProcessing = false;
      return;
    }

    this.isProcessing = true;
    const batch = this.queue.splice(0, this.maxConcurrent);

    await Promise.all(
      batch.map(async ({ url }) => {
        try {
          const cached = await indexedDBCache.get(url);
          if (!cached) {
            const response = await fetch(url);
            const data = await response.json();
            await indexedDBCache.set(url, data, 30 * 60 * 1000, 2);
          }
        } catch (error) {
          console.warn('Prefetch failed:', url, error);
        }
      })
    );

    // Continue processing
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => this.process());
    } else {
      setTimeout(() => this.process(), 100);
    }
  }

  // Prefetch baseado em hover
  onHover(url: string) {
    this.add(url, 2);
  }

  // Prefetch baseado em histórico
  prefetchFromHistory(urls: string[]) {
    urls.forEach(url => this.add(url, 1));
  }
}

export const prefetchEngine = new PrefetchEngine();

// Setup event listeners
if (typeof window !== 'undefined') {
  document.addEventListener('mouseover', (e) => {
    const target = e.target as HTMLElement;
    const link = target.closest('[data-prefetch]');
    if (link) {
      const url = link.getAttribute('data-prefetch');
      if (url) prefetchEngine.onHover(url);
    }
  });
}
