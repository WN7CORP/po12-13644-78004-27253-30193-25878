// Sistema de carregamento instantâneo otimizado
import { prefetchEngine } from '@/cache/prefetch-engine';

// Componentes críticos para preload imediato
const CRITICAL_COMPONENTS = [
  '@/components/CategoryAccessSection',
  '@/components/SocialMediaFooter',
];

// Componentes importantes para preload quando idle
const IMPORTANT_COMPONENTS = [
  '@/components/DesktopLayout',
  '@/components/NoticiasJuridicas',
  '@/components/BancoQuestoes',
];

class InstantLoader {
  private loadedComponents = new Set<string>();
  private isInitialized = false;

  async initialize() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // Preload crítico imediato
    this.preloadCritical();
    
    // Preload importante quando idle
    this.preloadWhenIdle();
    
    // Setup prefetch inteligente
    this.setupSmartPrefetch();
  }

  private preloadCritical() {
    CRITICAL_COMPONENTS.forEach(component => {
      import(component).then(() => {
        this.loadedComponents.add(component);
      }).catch(() => {});
    });
  }

  private preloadWhenIdle() {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        IMPORTANT_COMPONENTS.forEach((component, index) => {
          setTimeout(() => {
            import(component).then(() => {
              this.loadedComponents.add(component);
            }).catch(() => {});
          }, index * 50);
        });
      }, { timeout: 2000 });
    }
  }

  private setupSmartPrefetch() {
    document.addEventListener('mouseover', (e) => {
      const target = e.target as HTMLElement;
      const prefetchUrl = target.getAttribute('data-prefetch');
      if (prefetchUrl) {
        prefetchEngine.onHover(prefetchUrl);
      }
    });
  }

  getStats() {
    return {
      loaded: this.loadedComponents.size,
      components: Array.from(this.loadedComponents)
    };
  }
}

export const instantLoader = new InstantLoader();

// Auto-inicializar
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      instantLoader.initialize();
    });
  } else {
    instantLoader.initialize();
  }
}