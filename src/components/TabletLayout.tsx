import { ReactNode, useState } from 'react';
import { DesktopSidebar } from '@/components/DesktopSidebar';
import { MobileHeader } from '@/components/MobileHeader';
import { FooterMenu } from '@/components/FooterMenu';
import { GlobalProfessoraButton } from '@/components/GlobalProfessoraButton';

interface TabletLayoutProps {
  children: ReactNode;
}

export const TabletLayout = ({ children }: TabletLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true); // Start collapsed on tablet

  return (
    <div className="min-h-screen bg-background flex overflow-hidden">
      {/* Tablet Sidebar - collapsed by default but expandable */}
      <DesktopSidebar 
        collapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
      />
      
      {/* Main Content Area */}
      <div className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-72'} flex flex-col min-w-0`}>
        {/* Mobile-style Header for tablet */}
        <MobileHeader sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        
        {/* Main Content with space for footer */}
        <main className="flex-1 pt-14 pb-24 overflow-x-hidden overflow-y-auto">
          <div className="max-w-4xl mx-auto px-2 sm:px-4">
            {children}
          </div>
        </main>
        
        {/* Footer Menu - always visible at bottom */}
        <div className="fixed bottom-0 left-0 right-0 z-[9998]">
          <FooterMenu isVisible={true} />
        </div>
      </div>
      
      {/* Botão Global da Professora IA */}
      <GlobalProfessoraButton />
    </div>
  );
};