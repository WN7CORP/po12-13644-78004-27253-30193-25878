import { Scale, Home, Film, Calendar, BookOpen, Headphones, Gavel as GavelIcon } from 'lucide-react';
import { useState } from 'react';
import { useNavigation } from '@/context/NavigationContext';
import { useAppFunctions } from '@/hooks/useAppFunctions';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
interface FooterMenuProps {
  isVisible?: boolean;
}
export const FooterMenu = ({
  isVisible = true
}: FooterMenuProps) => {
  // Hide when search modal is open
  const isSearchModalOpen = document.body.classList.contains('search-modal-open');
  const [activeItem, setActiveItem] = useState('inicio');
  const {
    setCurrentFunction
  } = useNavigation();
  const {
    functions
  } = useAppFunctions();
  const {
    isDesktop
  } = useDeviceDetection();
  const findFunction = (searchTerm: string) => {
    return functions.find(func => func.funcao.toLowerCase().includes(searchTerm.toLowerCase()));
  };
  const menuItems = [{
    id: 'inicio',
    title: 'Início',
    icon: Home,
    function: 'inicio',
    color: 'primary'
  }, {
    id: 'vademecum',
    title: 'Vade Mecum',
    icon: Scale,
    function: 'Vade Mecum Digital',
    color: 'info'
  }, {
    id: 'assistenteia',
    title: 'Evelyn IA',
    icon: GavelIcon,
    function: 'Assistente IA Jurídica',
    color: 'special-ai'
  }, {
    id: 'planoestudo',
    title: 'Plano de Estudo',
    icon: Calendar,
    function: 'Plano de Estudo',
    color: 'library'
  }, {
    id: 'juriflix',
    title: 'Juriflix',
    icon: Film,
    function: 'Juriflix',
    color: 'community'
  }];
  const getItemStyles = (item: typeof menuItems[0], isActive: boolean) => {
    const baseStyles = "relative flex flex-col items-center py-3 px-3 rounded-xl transition-all duration-300 transform active:scale-95 group min-w-0 flex-1";
    if (isActive) {
      switch (item.color) {
        case 'special-ai':
          return `${baseStyles} text-white bg-gradient-to-br from-red-500 to-red-700 shadow-lg scale-105`;
        case 'community':
          return `${baseStyles} text-white bg-gradient-to-br from-purple-600 to-blue-600 shadow-lg scale-105`;
        case 'info':
          return `${baseStyles} text-white bg-gradient-to-br from-purple-600 to-blue-600 shadow-lg scale-105`;
        case 'library':
          return `${baseStyles} text-white bg-gradient-to-br from-green-600 to-emerald-600 shadow-lg scale-105`;
        default:
          return `${baseStyles} text-primary bg-gradient-to-br from-primary/30 to-accent-legal/30 shadow-lg scale-105 border border-primary/20`;
      }
    } else {
      return `${baseStyles} text-muted-foreground hover:text-primary hover:bg-footer-hover transition-all duration-300`;
    }
  };
  const getIconStyles = (item: typeof menuItems[0], isActive: boolean) => {
    const baseStyles = "relative p-2 rounded-lg transition-all duration-300";
    if (isActive) {
      return `${baseStyles} bg-white/20 scale-110`;
    } else {
      return `${baseStyles} group-hover:bg-primary/20 group-hover:scale-105`;
    }
  };
  const handleItemClick = (item: typeof menuItems[0]) => {
    setActiveItem(item.id);
    if (item.id === 'assistenteia') {
      // Não mudar currentFunction aqui para evitar abrir o chat legado automaticamente
      // Abrir apenas o chat global via evento
      const event = new CustomEvent('openProfessoraChat', {
        detail: {
          area: 'Direito'
        }
      });
      window.dispatchEvent(event);
    } else if (item.id === 'inicio') {
      // Volta para a página inicial
      setCurrentFunction('');
    } else {
      setCurrentFunction(item.function);
    }
  };

  // Hide when search modal is open or not visible
  if (!isVisible || isSearchModalOpen) {
    return null;
  }

  // Desktop version
  if (isDesktop) {
    return <div className="transition-all duration-300 translate-y-0 opacity-100 fixed bottom-6 left-1/2 transform -translate-x-1/2 z-[9999] w-auto max-w-2xl" data-footer-menu>
        <div className="glass-effect-modern rounded-3xl overflow-hidden bg-gradient-to-r from-red-950/90 via-red-900/90 to-red-950/90 backdrop-blur-xl border-2 border-red-500/30 shadow-2xl shadow-red-900/50">
          <div className="flex justify-around items-center px-3 py-2.5">
            {menuItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = activeItem === item.id;
            const isProfessoraIA = item.id === 'assistenteia';
            return <button key={item.id} onClick={() => handleItemClick(item)} className={`${getItemStyles(item, isActive)} ${isProfessoraIA ? 'rounded-full w-14 h-14 shadow-2xl shadow-red-500/40' : ''}`} style={{
              animationDelay: `${index * 50}ms`
            }}>
                  {/* Indicador ativo */}
                  {isActive && <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-primary rounded-full" />}
                  
                   {/* Icon container */}
                  <div className={`${getIconStyles(item, isActive)} ${isProfessoraIA ? 'rounded-full' : ''}`}>
                    {isProfessoraIA ? <GavelIcon className="h-8 w-8 text-white" /> : <Icon className={`${isProfessoraIA ? 'h-6 w-6' : 'h-5 w-5'} transition-all duration-300`} />}
                  </div>
                      
                      {/* Label - hide for circular Professora IA */}
                      {!isProfessoraIA && <span className={`text-xs font-medium transition-all duration-300 mt-1 text-center leading-tight ${isActive ? 'font-semibold text-white' : 'group-hover:font-medium'}`}>
                          {item.title}
                        </span>}
                  
                  {/* Efeito de brilho no hover */}
                  {isActive && <div className="absolute inset-0 bg-gradient-to-t from-white/5 to-transparent rounded-xl" />}
                </button>;
          })}
          </div>
        </div>
      </div>;
  }

  // Mobile version - always visible at bottom
  return <div data-footer-menu className="fixed bottom-0 left-0 right-0 z-[9999] transition-all duration-300 translate-y-0 opacity-100 safe-area-inset-bottom">
      {/* Power Red floating container */}
      <div className="mx-3 mb-3 bg-gradient-to-r from-red-950/98 via-red-900/98 to-red-950/98 backdrop-blur-2xl border-2 border-red-500/30 rounded-3xl shadow-2xl shadow-red-900/60 overflow-hidden">
        {/* Power Red premium container */}
        <div className="relative py-2.5 px-3">
          {/* Animated inner glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-500/15 to-transparent animate-shimmer" 
               style={{ backgroundSize: '200% 100%' }} />
          
          <div className="relative flex justify-between items-center">
            {/* Uniform grid with consistent spacing */}
            <div className="w-full grid grid-cols-5 gap-1 items-center">
              {menuItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = activeItem === item.id;
              const isProfessoraIA = item.id === 'assistenteia';
              return <div key={item.id} className="flex justify-center">
                    <button onClick={() => handleItemClick(item)} className={`
                        relative flex flex-col items-center justify-center
                        ${isProfessoraIA ? 'w-16 h-16 rounded-full bg-gradient-to-br from-red-600 via-red-500 to-red-700 text-white shadow-2xl shadow-red-500/60 hover:shadow-red-500/80 scale-110 border-2 border-red-400/60' : 'w-16 h-16 rounded-2xl'}
                        transition-all duration-500 transform
                        ${!isProfessoraIA && (isActive ? 'bg-gradient-to-br from-red-500/40 to-red-600/30 text-white shadow-xl scale-105 border-2 border-red-400/50' : 'bg-white/8 text-white/80 hover:bg-red-500/20 hover:text-white hover:scale-105 hover:border-red-500/30 border border-white/10')}
                        active:scale-95
                        backdrop-blur-md
                      `} style={{
                  animationDelay: `${index * 100}ms`
                }}>
                      {/* Icon with glow - compact for circular button */}
                      <Icon className={`
                        ${isProfessoraIA ? 'h-8 w-8' : 'h-6 w-6'} mb-1 transition-all duration-500
                        text-white filter drop-shadow-lg
                      `} />
                      
                      {/* Label - hide for circular button */}
                      {!isProfessoraIA && <span className={`
                          text-[10px] font-bold text-center leading-tight tracking-wide
                          text-white transition-all duration-500
                        `}>
                          {item.title}
                        </span>}
                      
                      {/* Enhanced glow effect for Professora IA */}
                      {isProfessoraIA && <div className="absolute inset-0 bg-gradient-to-t from-red-600/40 to-red-400/20 rounded-full animate-pulse" />}
                      
                      {/* Active indicator with glow */}
                      {isActive && !isProfessoraIA && <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-8 h-1.5 bg-gradient-to-r from-transparent via-red-400 to-transparent rounded-full shadow-lg shadow-red-400/50" />}
                    </button>
                  </div>;
            })}
            </div>
          </div>
        </div>
      </div>
    </div>;
};