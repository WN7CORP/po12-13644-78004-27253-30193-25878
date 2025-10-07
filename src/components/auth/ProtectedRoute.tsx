import { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  // Remove onboarding - go directly to app
  // User is always considered "registered" for immediate access
  return <>{children}</>;
};