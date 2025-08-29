
"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Home,
  LogOut,
  PlusCircle,
  Settings,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth, withAuth } from "@/lib/auth";
import { auth } from "@/lib/firebase";
import { usePathname, useRouter } from "next/navigation";
import { useLocale } from "@/lib/locale";
import React from "react";
import { signInWithCustomToken } from "firebase/auth";

function PartnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, signOut, role, partner } = useAuth();
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

  const primaryColor = partner?.branding?.primaryColor || 'hsl(var(--primary))';
  const textColor = partner?.branding?.textColor || 'hsl(var(--primary-foreground))';
  const mainBackgroundColor = partner?.branding?.backgroundColor || 'hsl(var(--muted))';
  const menuBackgroundColor = partner?.branding?.menuBackgroundColor || 'hsl(var(--card))';


  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden md:block" style={{ backgroundColor: menuBackgroundColor }}>
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-[80px] items-center justify-center px-4 lg:px-6">
             <Link href="/partner/dashboard" className="flex items-center gap-2 font-semibold">
                {partner?.branding?.logoUrl ? (
                    <Image src={partner.branding.logoUrl} alt={partner.branding.companyName || 'Partner Logo'} width={150} height={50} className="object-contain" />
                ) : (
                    <span className="font-bold text-lg">Partner Portal</span>
                )}
            </Link>
          </div>
          <div className="flex-1 pt-[50px]">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
              <Link
                href="/partner/dashboard"
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${pathname.startsWith('/partner/dashboard') ? 'text-primary-foreground' : ''}`}
                 style={pathname.startsWith('/partner/dashboard') ? { backgroundColor: primaryColor, color: textColor } : {}}
              >
                <Home className="h-4 w-4" />
                Dashboard
              </Link>
              <Link
                href="/partner/events/new"
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${pathname.startsWith('/partner/events/new') ? 'text-primary-foreground' : ''}`}
                 style={pathname.startsWith('/partner/events/new') ? { backgroundColor: primaryColor, color: textColor } : {}}
              >
                <PlusCircle className="h-4 w-4" />
                New Event
              </Link>
               <Link
                href="/partner/settings"
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${pathname.startsWith('/partner/settings') ? 'text-primary-foreground' : ''}`}
                 style={pathname.startsWith('/partner/settings') ? { backgroundColor: primaryColor, color: textColor } : {}}
              >
                <Settings className="h-4 w-4" />
                Settings
              </Link>
            </nav>
          </div>
          <div className="mt-auto p-4">
             <Button onClick={handleSignOut} className="w-full" style={{ backgroundColor: primaryColor, color: textColor }}>
                <LogOut className="mr-2 h-4 w-4"/> Exit
             </Button>
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <header 
          className="flex h-14 items-center gap-4 border-b px-4 lg:h-[60px] lg:px-6"
          style={{ backgroundColor: menuBackgroundColor, borderColor: menuBackgroundColor }}
        >
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
                    <p className="text-sm font-medium leading-none">My Account</p>
                    <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                    </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
               {role === 'Admin' && (
                 <DropdownMenuItem asChild>
                    <Link href="/admin/dashboard">Admin Dashboard</Link>
                 </DropdownMenuItem>
               )}
              <DropdownMenuItem asChild>
                <Link href="/partner/settings">Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                 <a href="mailto:support@wegwerpcamera.nl">Support</a>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main 
            className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6"
            style={{ backgroundColor: mainBackgroundColor }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

// Admins can also access the partner dashboard
export default withAuth(PartnerLayout, ['Partner', 'Admin']);
