import { useNavigation } from '@/context/NavigationContext';
import { CursosPreparatoriosUltraFast } from './courses/CursosPreparatoriosUltraFast';

export const CursosPreparatorios = () => {
  const { setCurrentFunction } = useNavigation();

  const handleBack = () => {
    setCurrentFunction(null);
  };
  
  return <CursosPreparatoriosUltraFast onBack={handleBack} />;
};