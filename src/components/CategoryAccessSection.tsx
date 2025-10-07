import { GraduationCap, Library, Wrench, Target, ChevronRight, Newspaper, Search, Radar } from 'lucide-react';
import { useNavigation } from '@/context/NavigationContext';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import { useState, memo, useMemo, useCallback, Suspense } from 'react';
import { CategoryDialog } from './CategoryDialog';
import { useAuth } from '@/context/AuthContext';
import { GlobalSearch } from '@/components/GlobalSearch';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import categoriaJustica from '@/assets/categoria-justica.png';
import { motion, AnimatePresence } from 'framer-motion';
const CategoryAccessSection = memo(() => {
  const {
    setCurrentFunction
  } = useNavigation();
  const {
    isTablet,
    isMobile
  } = useDeviceDetection();
  const {
    profile
  } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<typeof categories[0] | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const categories = useMemo(() => [{
    id: 1,
    title: 'Estudar Agora',
    description: 'Comece seus estudos de forma prática',
    icon: GraduationCap,
    color: 'from-red-700 to-red-900',
    bgImage: categoriaJustica,
    functions: ['Cursos Preparatórios', 'Resumos Jurídicos', 'Flashcards', 'Mapas Mentais', 'Plano de estudo']
  }, {
    id: 2,
    title: 'Biblioteca e Leituras',
    description: 'Acesse conteúdos e materiais completos',
    icon: Library,
    color: 'from-red-600 to-red-800',
    bgImage: categoriaJustica,
    functions: ['Biblioteca Clássicos', 'Fora da Toga', 'Biblioteca de Estudos', 'Biblioteca Concurso Público', 'Biblioteca Exame da Ordem - OAB', 'Indicações de Livros']
  }, {
    id: 3,
    title: 'Minhas Ferramentas',
    description: 'Utilize recursos para organizar e facilitar',
    icon: Wrench,
    color: 'from-red-500 to-red-700',
    bgImage: categoriaJustica,
    functions: ['Assistente Evelyn', 'Vade Mecum Digital', 'Plataforma Desktop', 'Notícias Comentadas', 'Videoaulas', 'Radar Jurídico', 'Blog Jurídico', 'Artigos Comentados', 'Redação Perfeita', 'Áudio-aulas', 'Petições']
  }, {
    id: 4,
    title: 'Simulado e Questões',
    description: 'Treine e avalie seu conhecimento adquirido',
    icon: Target,
    color: 'from-red-800 to-red-950',
    bgImage: categoriaJustica,
    functions: ['Banco de Questões', 'Simulados OAB']
  }], []);
  const handleCategoryClick = useCallback((category: typeof categories[0]) => {
    setSelectedCategory(category);
  }, []);
  const handleFunctionSelect = useCallback((functionName: string) => {
    console.log('CategoryAccessSection - Selecionando função:', functionName);
    setCurrentFunction(functionName);
    setSelectedCategory(null);
  }, [setCurrentFunction]);

  // Helper function to render category title with proper line breaks
  const renderCategoryTitle = (title: string) => {
    switch (title) {
      case 'Minhas Ferramentas':
        return <div className="text-center">
            <div>Minhas</div>
            <div>Ferramentas</div>
          </div>;
      case 'Biblioteca e Leituras':
        return <div className="text-center">
            <div>Biblioteca e</div>
            <div>Leituras</div>
          </div>;
      default:
        return <div className="text-center">{title}</div>;
    }
  };
  return <>
    <div className={`${isTablet ? 'px-2 mx-2 mb-4 pt-6' : 'px-3 sm:px-4 mx-3 sm:mx-4 mb-6 pt-8'} relative overflow-hidden animate-fade-in`} style={{
      background: 'linear-gradient(135deg, hsl(var(--red-elegant-darkest)) 0%, hsl(var(--red-elegant-dark)) 30%, hsl(var(--red-elegant)) 60%, hsl(var(--red-elegant-darkest)) 100%)',
      borderRadius: '0 0 2rem 2rem',
      boxShadow: '0 10px 40px -10px hsl(var(--red-elegant) / 0.5)',
      animation: 'fade-in 0.6s ease-out'
    }}>
        {/* Subtle animated background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 animate-shimmer" style={{
          backgroundSize: '200% 200%'
        }} />
        </div>

        {/* Header Section - Animação Lottie Centralizada com Botões */}
        <div className="text-center mb-2 relative z-10">
          <div className="w-full max-w-md mx-auto relative flex items-center justify-center">
            {/* Botão Jusblog - Lado Esquerdo */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-gradient-to-br from-red-600 via-red-500 to-red-700 hover:from-red-500 hover:via-red-400 hover:to-red-600 text-white p-4 rounded-full shadow-2xl hover:shadow-red-500/50 transition-all duration-300 hover:scale-110 group flex flex-col items-center border border-red-400/30">
                  <Newspaper className="w-6 h-6 group-hover:scale-110 transition-transform duration-300 mb-1 filter drop-shadow-lg" />
                  <span className="text-xs font-bold tracking-wide">Jusblog</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64 bg-background border border-border">
                <DropdownMenuItem onClick={() => handleFunctionSelect('Blog Jurídico')} className="cursor-pointer hover:bg-accent focus:bg-accent">
                  <Newspaper className="h-4 w-4 mr-3" />
                  <div className="flex flex-col">
                    <span className="font-medium">Jusblog</span>
                    <span className="text-sm text-muted-foreground">Blog jurídico com artigos e análises</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleFunctionSelect('Radar Jurídico')} className="cursor-pointer hover:bg-accent focus:bg-accent">
                  <Radar className="h-4 w-4 mr-3" />
                  <div className="flex flex-col">
                    <span className="font-medium">Radar Jurídico</span>
                    <span className="text-sm text-muted-foreground">Acompanhe as últimas notícias jurídicas</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Animação Lottie Central - Chapéu de Formatura */}
            <iframe src="https://lottie.host/embed/4cf4ee37-a511-4357-a3ff-fa2115251444/oXRRrHCU8q.lottie" className="w-full h-32 border-0" title="Animação de Formatura" />
            
            {/* Botão Pesquisar - Lado Direito */}
            <button onClick={() => setIsSearchOpen(true)} className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-gradient-to-br from-red-600 via-red-500 to-red-700 hover:from-red-500 hover:via-red-400 hover:to-red-600 text-white p-4 rounded-full shadow-2xl hover:shadow-red-500/50 transition-all duration-300 hover:scale-110 group flex flex-col items-center border border-red-400/30">
              <Search className="w-6 h-6 group-hover:scale-110 transition-transform duration-300 mb-1 filter drop-shadow-lg" />
              <span className="text-xs font-bold tracking-wide">Pesquisar</span>
            </button>
          </div>
        </div>

        {/* Categories Grid */}
        <div className={`${isMobile ? 'grid grid-cols-2 gap-4 max-w-sm mx-auto' : isTablet ? 'grid grid-cols-2 gap-6 max-w-2xl mx-auto' : 'grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto'} relative z-10`}>
          {categories.map((category, index) => {
          const Icon = category.icon;
          return <div key={category.id} onClick={() => handleCategoryClick(category)} style={{
            animationDelay: `${index * 150}ms`,
            backgroundImage: `linear-gradient(135deg, hsl(var(--red-elegant-darkest) / 0.98), hsl(var(--red-elegant-dark) / 0.95)), url(${category.bgImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }} className={`
                  group cursor-pointer transition-all duration-500 hover:scale-[1.05] 
                  rounded-2xl 
                  ${isMobile ? 'p-4 h-44' : isTablet ? 'p-5 h-48' : 'p-6 h-52'} 
                  flex flex-col justify-between shadow-2xl hover:shadow-red-500/30
                  animate-fade-in-up relative overflow-hidden
                  border border-red-500/20 hover:border-red-400/40
                `}>
                {/* Glossy overlay effect */}
                
                
                {/* Icon and Title */}
                <div className="flex flex-col items-center text-center flex-1 relative z-10">
                  <div className={`
                    ${isMobile ? 'w-12 h-12 mb-3' : isTablet ? 'w-14 h-14 mb-3' : 'w-16 h-16 mb-4'}
                    bg-gradient-to-br from-white/25 to-white/10 rounded-2xl flex items-center justify-center
                    group-hover:from-white/35 group-hover:to-white/20 transition-all duration-500
                    shadow-lg group-hover:shadow-red-400/20 border border-white/20
                    group-hover:scale-110 group-hover:rotate-3
                  `}>
                    <Icon className={`${isMobile ? 'w-6 h-6' : isTablet ? 'w-7 h-7' : 'w-8 h-8'} text-white filter drop-shadow-lg`} />
                  </div>
                  
                  <h3 className={`${isMobile ? 'text-sm' : isTablet ? 'text-base' : 'text-lg'} font-bold text-white mb-2 leading-tight tracking-wide`}>
                    {renderCategoryTitle(category.title)}
                  </h3>
                </div>

                {/* Description */}
                <div className="text-center flex-1 flex items-center mb-3 relative z-10">
                  <p className={`${isMobile ? 'text-xs' : isTablet ? 'text-sm' : 'text-sm'} text-white/95 leading-tight text-center w-full font-medium`}>
                    {category.description}
                  </p>
                </div>

                {/* Arrow indicator - positioned in bottom right with glow */}
                <div className="absolute bottom-3 right-3 z-10">
                  
                </div>
              </div>;
        })}
        </div>
      </div>

      {/* Category Dialog */}
      <CategoryDialog category={selectedCategory} open={selectedCategory !== null} onOpenChange={open => !open && setSelectedCategory(null)} onFunctionSelect={handleFunctionSelect} />

      {/* Global Search com animação slide from bottom */}
      <AnimatePresence>
        {isSearchOpen && <Suspense fallback={null}>
            <motion.div initial={{
          y: "100%"
        }} animate={{
          y: 0
        }} exit={{
          y: "100%"
        }} transition={{
          type: "spring",
          damping: 30,
          stiffness: 300
        }} className="fixed inset-0 z-50">
              <GlobalSearch onClose={() => setIsSearchOpen(false)} />
            </motion.div>
          </Suspense>}
      </AnimatePresence>
    </>;
});
CategoryAccessSection.displayName = 'CategoryAccessSection';
export { CategoryAccessSection };