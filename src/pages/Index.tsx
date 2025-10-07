import { Suspense, memo, useEffect } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { MobileLayout } from '@/components/MobileLayout';
import { DesktopLayout } from '@/components/DesktopLayout';
import { TabletLayout } from '@/components/TabletLayout';
import { NewsUpdateNotification } from '@/components/NewsUpdateNotification';
import { useNavigation } from '@/context/NavigationContext';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import { useAuth } from '@/context/AuthContext';
import { 
  LazyFeaturesGrid, 
  LazySuporteTab, 
  LazyProductCarousel,
  preloadCriticalComponents
} from '@/components/lazy/LazyComponents';
import { FloatingNotesButton } from '@/components/FloatingNotesButton';
import { FloatingLegalTips } from '@/components/FloatingLegalTips';
import { CategoryAccessSection } from '@/components/CategoryAccessSection';
import { SocialMediaFooter } from '@/components/SocialMediaFooter';
import { AppFunction } from '@/components/AppFunctionOptimized';
import { optimizeAppLoading } from '@/utils/bundleOptimization';
import { ExplorarCarousel } from '@/components/ExplorarCarousel';

// Loading fallback component
const LoadingComponent = memo(() => <div className="w-full h-32 flex items-center justify-center">
    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
  </div>);
LoadingComponent.displayName = 'LoadingComponent';

const Index = memo(() => {
  const {
    isInFunction,
    isExplorarOpen
  } = useNavigation();
  const {
    isMobile,
    isTablet,
    isDesktop
  } = useDeviceDetection();

  // Preload componentes críticos na inicialização
  useEffect(() => {
    preloadCriticalComponents();
    optimizeAppLoading();
  }, []);

  // If we're in a function, show the function component directly (no loading)
  if (isInFunction) {
    return <AppFunction />;
  }

  // Main content for both mobile and desktop with instant loading
  const mainContent = <>
      {/* Category Access Section - Direct loading */}
      <CategoryAccessSection />

      {/* Social Media Footer - Direct loading */}
      <SocialMediaFooter />
    </>;

  // Return appropriate layout based on device
  const layoutContent = (
    <div className="relative overflow-hidden min-h-screen">
      {/* Main Content with slide transition */}
      <div className={`
        transition-transform duration-500 ease-in-out
        ${isExplorarOpen ? '-translate-x-full opacity-20' : 'translate-x-0 opacity-100'}
      `}>
        {isMobile ? (
          <MobileLayout>{mainContent}</MobileLayout>
        ) : isTablet ? (
          <TabletLayout>{mainContent}</TabletLayout>
        ) : (
          <DesktopLayout>{mainContent}</DesktopLayout>
        )}
        
        {/* Notificação de atualizações de notícias */}
        <NewsUpdateNotification />
        
        {/* Floating Legal Tips - acima do menu de rodapé */}
        {!isExplorarOpen && <FloatingLegalTips />}
        
        {/* Toast notifications */}
        <Toaster />
      </div>
      
      {/* Explorar Carousel Overlay */}
      {isExplorarOpen && <ExplorarCarousel />}
    </div>
  );

  return layoutContent;
});
Index.displayName = 'Index';
export default Index;