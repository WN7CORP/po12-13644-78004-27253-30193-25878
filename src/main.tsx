import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Performance monitoring
import { performanceMonitor } from "./performance/monitoring";

// Initialize optimization systems
import "./utils/instantLoader";
import "./utils/resourceHints";

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('✅ Service Worker registered:', registration.scope);
        
        // Send preload message
        if (registration.active) {
          registration.active.postMessage({
            type: 'PRELOAD_COMPONENTS',
            components: [
              '/src/components/DesktopLayout.tsx',
              '/src/components/CategoryAccessSection.tsx',
            ]
          });
        }
      })
      .catch(error => console.log('❌ SW registration failed:', error));
  });
}

// Add manifest link
const manifestLink = document.createElement('link');
manifestLink.rel = 'manifest';
manifestLink.href = '/manifest.json';
document.head.appendChild(manifestLink);

// Preload critical resources
const preloadCritical = () => {
  const criticalImages = [
    '/src/assets/logo-direito.png',
    '/src/assets/categoria-justica.png'
  ];
  
  criticalImages.forEach(src => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    document.head.appendChild(link);
  });
};

preloadCritical();

createRoot(document.getElementById("root")!).render(<App />);
