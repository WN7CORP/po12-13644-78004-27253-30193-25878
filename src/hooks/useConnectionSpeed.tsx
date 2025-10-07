import { useState, useEffect } from 'react';

type ConnectionSpeed = 'slow' | 'medium' | 'fast';

export const useConnectionSpeed = (): ConnectionSpeed => {
  const [speed, setSpeed] = useState<ConnectionSpeed>('medium');

  useEffect(() => {
    const connection = (navigator as any).connection;
    
    if (!connection) return;

    const updateSpeed = () => {
      const effectiveType = connection.effectiveType;
      
      if (effectiveType === 'slow-2g' || effectiveType === '2g') {
        setSpeed('slow');
      } else if (effectiveType === '3g') {
        setSpeed('medium');
      } else {
        setSpeed('fast');
      }
    };

    updateSpeed();
    connection.addEventListener('change', updateSpeed);

    return () => {
      connection.removeEventListener('change', updateSpeed);
    };
  }, []);

  return speed;
};

// Hook para saber se deve fazer prefetch
export const useShouldPrefetch = (): boolean => {
  const speed = useConnectionSpeed();
  return speed !== 'slow';
};
