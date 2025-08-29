
'use client';

import { atom, useAtom } from 'jotai';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';

type UserRole = 'Admin' | 'Client' | 'Partner' | null;

type BrandingSettings = {
    companyName: string;
    logoUrl: string;
    primaryColor: string;
    textColor: string;
    backgroundColor: string;
    menuBackgroundColor: string;
};

type Partner = {
  id: string;
  name: string;
  email: string;
  role: string;
  branding: BrandingSettings;
};


interface AuthState {
  user: User | null;
  role: UserRole;
  partner?: Partner | null;
  loading: boolean;
  isLoggedIn: boolean;
}

export const authAtom = atom<AuthState>({
  user: null,
  role: null,
  partner: null,
  loading: true,
  isLoggedIn: false,
});

export const useAuth = () => {
  const [authState, setAuthState] = useAtom(authAtom);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && user.email) {
        let role: UserRole = null;
        let partnerData: Partner | null = null;
        
        const staffRef = doc(db, 'staff', user.email);
        const staffDoc = await getDoc(staffRef);
        
        if (staffDoc.exists()) {
            const staffData = staffDoc.data();
            if (staffData.role === 'Admin' || staffData.role === 'Client') {
                role = staffData.role;
            }
        } else {
            const partnerRef = doc(db, 'partners', user.email);
            const partnerDoc = await getDoc(partnerRef);
            if (partnerDoc.exists()) {
                role = 'Partner';
                partnerData = { id: partnerDoc.id, ...partnerDoc.data() } as Partner;
            }
        }
        
        setAuthState({ user, role, partner: partnerData, loading: false, isLoggedIn: true });
      } else {
        setAuthState({ user: null, role: null, partner: null, loading: false, isLoggedIn: false });
      }
    });

    return () => unsubscribe();
  }, [setAuthState]);

  const signOut = async () => {
    await auth.signOut();
    setAuthState({ user: null, role: null, partner: null, loading: false, isLoggedIn: false });
  }

  return { ...authState, signOut };
};


export function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  allowedRoles: UserRole[]
) {
  const WithAuthComponent: React.FC<P> = (props) => {
    const { role, loading, isLoggedIn } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    React.useEffect(() => {
      if (!loading && !isLoggedIn) {
        router.push(`/login?redirect=${pathname}`);
        return;
      }
      
      if (!loading && isLoggedIn && (role === null || !allowedRoles.includes(role))) {
        // User is logged in but doesn't have the right role.
        // Redirect to a relevant page or show an unauthorized message.
        console.warn(`Unauthorized access attempt to ${pathname} by user with role: ${role}`);
        router.push('/login'); 
      }

    }, [role, loading, isLoggedIn, router, pathname]);

    if (loading || !isLoggedIn || (isLoggedIn && (role === null || !allowedRoles.includes(role)))) {
      return (
         <div className="flex h-screen w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
         </div>
      );
    }

    return <WrappedComponent {...props} />;
  };
  
  WithAuthComponent.displayName = `WithAuth(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return WithAuthComponent;
}
