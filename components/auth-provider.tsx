"use client";

import { useAuth } from '@/lib/auth';

// This component just triggers the useAuth hook to initialize
// the auth state listener on the client side.
export function AuthProvider({ children }: { children: React.ReactNode }) {
  useAuth();
  return <>{children}</>;
}
