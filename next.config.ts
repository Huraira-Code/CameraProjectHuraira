
import type { NextConfig } from 'next';

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  typescript: {
    // We'll handle type checking separately
    ignoreBuildErrors: true,
  },
  eslint: {
    // We'll handle linting separately
    ignoreDuringBuilds: true,
  },
  experimental: {
    // This allows the Next.js dev server to accept requests from the
    // Firebase Studio environment.
    allowedDevOrigins: [
        "6000-firebase-studio-1754896323560.cluster-ikslh4rdsnbqsvu5nw3v4dqjj2.cloudworkstations.dev"
    ],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
       {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
       },
       {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
       }
    ],
  },
  // Make environment variables available to the client-side
  env: {
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  },
};

export default nextConfig;

    