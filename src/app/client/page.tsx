
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// This page just redirects to the dashboard, which is the main client view.
export default function ClientPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/client/dashboard');
  }, [router]);

  return null;
}
