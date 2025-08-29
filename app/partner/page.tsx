
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// This page just redirects to the dashboard, which is the main partner view.
export default function PartnerPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/partner/dashboard');
  }, [router]);

  return null;
}
