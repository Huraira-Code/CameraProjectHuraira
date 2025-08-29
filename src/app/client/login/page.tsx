
"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// This page is deprecated and replaced by the main /login page.
// It now just redirects to the main login page.
export default function DeprecatedClientLoginPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/login');
  }, [router]);

  return null;
}
