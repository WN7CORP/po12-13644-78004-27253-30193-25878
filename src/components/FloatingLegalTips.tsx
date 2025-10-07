import { motion } from 'framer-motion';
import { useNavigation } from '@/context/NavigationContext';
import { Scale } from 'lucide-react';
export const FloatingLegalTips = () => {
  const {
    setCurrentFunction
  } = useNavigation();
  const handleVadeMecumClick = () => {
    setCurrentFunction('Vade Mecum Digital');
  };
  return <div className="fixed bottom-[88px] left-0 right-0 z-[45] px-4 py-[45px]">
      <div className="flex justify-center py-[15px]">
        <motion.button onClick={handleVadeMecumClick} className="relative flex items-center gap-3 px-8 py-4 rounded-2xl
            bg-gradient-to-br from-[hsl(var(--red-elegant))] via-[hsl(var(--red-elegant-light))] to-[hsl(var(--red-elegant-dark))]
            hover:from-[hsl(var(--red-elegant-light))] hover:via-[hsl(var(--red-elegant))] hover:to-[hsl(var(--red-elegant-light))]
            shadow-[0_0_20px_hsl(var(--red-elegant)/0.4),0_8px_24px_rgba(0,0,0,0.3)]
            hover:shadow-[0_0_30px_hsl(var(--red-elegant)/0.6),0_12px_32px_rgba(0,0,0,0.4)]
            border-2 border-[hsl(var(--red-elegant-light)/0.5)]
            transition-all duration-300 backdrop-blur-md
            group overflow-hidden" whileHover={{
        scale: 1.05
      }} whileTap={{
        scale: 0.95
      }}>
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent 
            opacity-0 group-hover:opacity-100 transition-opacity duration-500 
            translate-x-[-100%] group-hover:translate-x-[100%] group-hover:transition-transform group-hover:duration-1000" />
          
          {/* Icon with pulse effect */}
          <div className="relative z-10">
            <Scale className="w-6 h-6 text-white group-hover:scale-110 transition-transform duration-300" />
          </div>
          
          {/* Text */}
          <span className="text-base font-bold text-white relative z-10 tracking-wide">
            Vade Mecum
          </span>
          
          {/* Shine effect on hover */}
          <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r 
            from-transparent via-white/40 to-transparent group-hover:left-full 
            transition-all duration-700 ease-in-out" />
        </motion.button>
      </div>
    </div>;
};