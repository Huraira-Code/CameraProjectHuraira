
"use client";

import Link from "next/link";
import {
  Bell,
  Home,
  LogOut,
  PlusCircle,
  Settings,
  User,
  Building,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { WegwerpcameraLogo } from "@/components/snapmoment-logo";
import { useAuth, withAuth } from "@/lib/auth";
import { auth } from "@/lib/firebase";
import { usePathname, useRouter } from "next/navigation";
import { useLocale } from "@/lib/locale";
import React from "react";
import { signInWithCustomToken } from "firebase/auth";

function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, signOut, role } = useAuth();
  const { t } = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    const impersonationToken = localStorage.getItem('impersonationToken');
    if (impersonationToken) {
        signInWithCustomToken(auth, impersonationToken)
            .then(() => {
                console.log("Successfully signed in with impersonation token.");
                localStorage.removeItem('impersonationToken'); 
                // No need to force-refresh, the auth listener in `useAuth` will handle the state update.
            })
            .catch((error) => {
                console.error("Failed to sign in with impersonation token:", error);
                localStorage.removeItem('impersonationToken'); 
            });
    }
  }, []);

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <WegwerpcameraLogo />
            </Link>
          </div>
          <div className="flex-1">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
              <Link
                href="/client/dashboard"
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${pathname.startsWith('/client/dashboard') ? 'bg-muted text-primary' : ''}`}
              >
                <Home className="h-4 w-4" />
                {t('client_layout_nav_dashboard')}
              </Link>
              <Link
                href="/client/events/new"
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${pathname.startsWith('/client/events/new') ? 'bg-muted text-primary' : ''}`}
              >
                <PlusCircle className="h-4 w-4" />
                {t('client_layout_nav_new_event')}
              </Link>
               <Link
                href="/client/settings"
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${pathname.startsWith('/client/settings') ? 'bg-muted text-primary' : ''}`}
              >
                <Settings className="h-4 w-4" />
                {t('client_layout_nav_settings')}
              </Link>
            </nav>
          </div>
          <div className="mt-auto p-4">
             <Button onClick={handleSignOut} className="w-full">
                <LogOut className="mr-2 h-4 w-4"/> {t('client_layout_exit_button')}
             </Button>
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
           <div className="w-full flex-1">
             {/* Future search bar can go here */}
           </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="rounded-full">
                <User className="h-5 w-5" />
                <span className="sr-only">Toggle user menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{t('client_layout_user_menu_title')}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                    </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
               {role === 'Admin' && (
                 <>
                  <DropdownMenuItem asChild>
                      <Link href="/admin/dashboard">Admin Dashboard</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                      <Link href="/partner/dashboard">Partner Dashboard</Link>
                  </DropdownMenuItem>
                 </>
               )}
              <DropdownMenuItem asChild>
                <Link href="/client/settings">{t('client_layout_nav_settings')}</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                 <a href="mailto:support@wegwerpcamera.nl">{t('client_layout_user_menu_support')}</a>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>{t('client_layout_user_menu_logout')}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-muted/40">
          {children}
        </main>
      </div>
    </div>
  );
}

// Admins can also access the client dashboard
export default withAuth(ClientLayout, ['Client', 'Admin']);
