import { ReactNode, useState } from 'react';
import { FooterMenu } from '@/components/FooterMenu';
import { MobileHeader } from '@/components/MobileHeader';
import { GlobalProfessoraButton } from '@/components/GlobalProfessoraButton';
interface MobileLayoutProps {
  children: ReactNode;
}
export const MobileLayout = ({
  children
}: MobileLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return <div className="min-h-screen bg-background flex flex-col overflow-x-hidden">
      {/* Mobile Header - responsivo */}
      <MobileHeader sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      
      {/* Main Content with proper spacing for fixed footer */}
      <main className="flex-1 pt-14 sm:pt-16 pb-24 sm:pb-28 overflow-x-hidden">
        <div className="w-full max-w-full px-[5px] py-[5px] my-[2px] mx-[4px]">
          {children}
        </div>
      </main>
      
      {/* Bottom Navigation - always visible */}
      <FooterMenu isVisible={true} />
      
      {/* Botão Global da Professora IA */}
      <GlobalProfessoraButton />
    </div>;
};