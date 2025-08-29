
import type { Metadata } from 'next';
import { Poppins, PT_Sans } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import { Providers } from '@/components/providers';
import { AuthProvider } from '@/components/auth-provider';

const fontPoppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-poppins',
});

const fontPtSans = PT_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-pt-sans',
});

export const metadata: Metadata = {
  title: 'Wegwerpcamera.nl',
  description: 'Leg elk moment vast, direct. Jouw gasten, jouw fotografen.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="nl" suppressHydrationWarning>
      <body className={cn("min-h-screen bg-background font-sans antialiased", fontPoppins.variable, fontPtSans.variable)}>
          <Providers>
            <AuthProvider>
              {children}
            </AuthProvider>
          </Providers>
      </body>
    </html>
  );
}
