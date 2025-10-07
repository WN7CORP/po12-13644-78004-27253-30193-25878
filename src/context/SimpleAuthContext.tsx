import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface SimpleAuthContextType {
  isRegistered: boolean;
  setIsRegistered: (value: boolean) => void;
}

const SimpleAuthContext = createContext<SimpleAuthContextType | undefined>(undefined);

export const useSimpleAuth = () => {
  const context = useContext(SimpleAuthContext);
  if (context === undefined) {
    throw new Error('useSimpleAuth deve ser usado dentro de um SimpleAuthProvider');
  }
  return context;
};

interface SimpleAuthProviderProps {
  children: ReactNode;
}

export const SimpleAuthProvider = ({ children }: SimpleAuthProviderProps) => {
  const [isRegistered, setIsRegistered] = useState<boolean>(() => {
    // Verificar se já está registrado no localStorage
    return localStorage.getItem('user_registered') === 'true';
  });

  useEffect(() => {
    // Salvar no localStorage quando mudar
    localStorage.setItem('user_registered', isRegistered ? 'true' : 'false');
  }, [isRegistered]);

  return (
    <SimpleAuthContext.Provider value={{ isRegistered, setIsRegistered }}>
      {children}
    </SimpleAuthContext.Provider>
  );
};