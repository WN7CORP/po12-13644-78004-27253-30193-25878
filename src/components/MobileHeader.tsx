import { Scale, Star, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { MobileSidebar } from './MobileSidebar';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
interface MobileHeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}
export const MobileHeader = ({
  sidebarOpen,
  setSidebarOpen
}: MobileHeaderProps) => {
  const [showRating, setShowRating] = useState(false);
  const {
    profile
  } = useAuth();
  const handleStarClick = () => {
    setShowRating(true);
  };
  return <>
      <header data-mobile-header className="fixed top-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border/20 safe-area-pt animate-slide-up">
        <div className="px-4 py-3 bg-zinc-950 relative overflow-hidden">
          {/* Background animated gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent-legal/5 to-primary/10 opacity-50 animate-shimmer" />
          
          <div className="flex items-center justify-between relative z-10 px-0 py-[6px]">
            {/* Logo and Title */}
            <div className="flex items-center gap-3 animate-slide-in-left">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg overflow-hidden 
                            transform transition-all duration-500 hover:scale-110 hover:rotate-6 
                            bg-gradient-to-br from-primary/20 to-accent-legal/20 backdrop-blur-sm
                            animate-float-enhanced">
                <img src="https://imgur.com/zlvHIAs.png" alt="Direito Premium" className="w-full h-full object-contain" />
              </div>
              <div className="animate-fade-in flex items-center gap-2" style={{
              animationDelay: '200ms'
            }}>
                <h1 className="text-lg font-bold text-white">
                  Direito
                </h1>
                <span className="text-lg font-bold text-amber-400">
                  Premium
                </span>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-2 animate-slide-in-right">
              {/* Star Rating Button */}
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-amber-400/20 bg-amber-400/10 
                         transition-all duration-500 active:scale-90 relative group overflow-hidden
                         transform hover:scale-110" onClick={handleStarClick}>
                {/* Multi-layered glow effects */}
                <div className="absolute inset-0 bg-gradient-to-r from-amber-400/30 via-yellow-400/30 to-amber-400/30 
                               opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse" />
                
                <Star className={cn("h-5 w-5 text-amber-400 transition-all duration-500 relative z-10 transform fill-amber-400", "group-hover:drop-shadow-2xl animate-pulse")} />
                
                {/* Ripple effect */}
                <div className="absolute inset-0 rounded-full bg-amber-400/30 scale-0 
                               group-active:scale-150 opacity-0 group-active:opacity-50 
                               transition-all duration-200" />
              </Button>

              {/* Enhanced Menu Button */}
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-amber-400/20 bg-amber-400/10 
                         transition-all duration-500 active:scale-90 relative group overflow-hidden
                         transform hover:scale-110" onClick={() => setSidebarOpen(true)}>
                {/* Background effects */}
                <div className="absolute inset-0 bg-gradient-to-r from-amber-400/20 via-yellow-400/20 to-amber-400/20 
                               opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <Menu className={`h-5 w-5 text-amber-400 transition-all duration-500 relative z-10 
                                transform group-hover:drop-shadow-lg group-hover:animate-wiggle
                                ${sidebarOpen ? 'rotate-180 scale-110' : 'rotate-0 scale-100'}`} />
                
                {/* Ripple effect */}
                <div className="absolute inset-0 rounded-full bg-amber-400/40 scale-0 
                               group-active:scale-150 opacity-0 group-active:opacity-50 
                               transition-all duration-200" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <MobileSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Rating Card Inline */}
      {showRating && <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
          <Card className="mx-4 max-w-sm w-full bg-card border-2 border-primary/20 shadow-2xl animate-scale-in">
            <CardContent className="p-6 text-center relative">
              <Button variant="ghost" size="icon" onClick={() => setShowRating(false)} className="absolute top-2 right-2 h-8 w-8 hover:bg-red-500/10">
                <X className="h-4 w-4" />
              </Button>

              <div className="w-32 h-32 mx-auto mb-4 flex items-center justify-center">
                <Star className="h-16 w-16 text-amber-400 fill-amber-400 animate-pulse" />
              </div>

              <h3 className="text-xl font-bold mb-2 gradient-text">
                Gostando do Direito?
              </h3>

              <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
                Sua avaliação nos ajuda a melhorar e alcançar mais estudantes de direito! ⭐
              </p>

              <div className="flex justify-center gap-1 mb-6">
                {[1, 2, 3, 4, 5].map(star => <Star key={star} className="h-6 w-6 text-amber-400 fill-amber-400 animate-pulse" style={{
              animationDelay: `${star * 0.1}s`
            }} />)}
              </div>

              <div className="flex flex-col gap-3">
                <Button onClick={() => {
              window.open('https://play.google.com/store/apps/details?id=br.com.app.gpu2994564.gpub492f9e6db037057aaa93d7adfa9e3e0', '_blank');
              setShowRating(false);
            }} className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-amber-500/25 transform hover:scale-105 transition-all duration-300">
                  ⭐ Avaliar Agora
                </Button>
                
                <Button variant="outline" onClick={() => setShowRating(false)} className="text-muted-foreground hover:text-foreground py-2">
                  Mais tarde
                </Button>
              </div>

              
            </CardContent>
          </Card>
        </div>}
    </>;
};