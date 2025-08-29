
"use client"

import * as React from "react"
import Link from "next/link"
import {
  Home,
  Users,
  Building,
  Mail,
  PanelLeft,
  Settings,
  UserCheck,
  TestTube2,
  LogOut,
  HardDrive,
  CreditCard,
  User as UserIcon,
  RefreshCw,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
  SidebarFooter,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarGroup,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { usePathname, useRouter } from 'next/navigation'
import { useAuth, withAuth } from "@/lib/auth"


function AdminSidebar() {
  const pathname = usePathname();
  const { signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  }

  return (
     <Sidebar>
      <SidebarContent className="pt-8">
        <SidebarMenu>
            <Link href="/admin/dashboard">
          <SidebarMenuItem>
              <SidebarMenuButton isActive={pathname.startsWith('/admin/dashboard')}>
                <Home />
                Dashboard
              </SidebarMenuButton>
          </SidebarMenuItem>
            </Link>
            <Link href="/admin/clients">
          <SidebarMenuItem>
              <SidebarMenuButton isActive={pathname.startsWith('/admin/clients')}>
                <Users />
                Clients
              </SidebarMenuButton>
          </SidebarMenuItem>
            </Link>
           <Link href="/admin/staff">
           <SidebarMenuItem>
                <SidebarMenuButton isActive={pathname.startsWith('/admin/staff')}>
                <UserCheck />
                Staff
                </SidebarMenuButton>
          </SidebarMenuItem>
            </Link>
           <Link href="/admin/partners">
           <SidebarMenuItem>
              <SidebarMenuButton isActive={pathname.startsWith('/admin/partners')}>
                <Building />
                Partners
              </SidebarMenuButton>
          </SidebarMenuItem>
            </Link>
          <Link href="/admin/test-accounts">
          <SidebarMenuItem>
              <SidebarMenuButton isActive={pathname.startsWith('/admin/test-accounts')}>
                <TestTube2 />
                Test Accounts
              </SidebarMenuButton>
          </SidebarMenuItem>
            </Link>
            <Link href="/admin/payments">
           <SidebarMenuItem>
              <SidebarMenuButton isActive={pathname.startsWith('/admin/payments')}>
                <CreditCard />
                Payments
              </SidebarMenuButton>
          </SidebarMenuItem>
            </Link>
             <Link href="/admin/storage-test">
           <SidebarMenuItem>
              <SidebarMenuButton isActive={pathname.startsWith('/admin/storage-test')}>
                <HardDrive />
                Storage Test
              </SidebarMenuButton>
          </SidebarMenuItem>
            </Link>
            <Link href="/admin/resync">
           <SidebarMenuItem>
              <SidebarMenuButton isActive={pathname.startsWith('/admin/resync')}>
                <RefreshCw />
                Resync Photos
              </SidebarMenuButton>
          </SidebarMenuItem>
            </Link>
        </SidebarMenu>
      </SidebarContent>
       <SidebarFooter>
         <SidebarMenu>
            <Link href="/client/dashboard">
                <SidebarMenuItem>
                    <SidebarMenuButton>
                        <UserIcon />
                        Client View
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </Link>
             <Link href="/partner/dashboard">
                <SidebarMenuItem>
                    <SidebarMenuButton>
                        <Building />
                        Partner View
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </Link>
          <SidebarMenuItem>
             <SidebarMenuButton onClick={handleSignOut}>
                <LogOut />
                Exit Admin
             </SidebarMenuButton>
          </SidebarMenuItem>
         </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <AdminSidebar />
         <div className="flex flex-col flex-1">
           <header className="sticky top-0 z-10 flex h-[57px] items-center gap-1 border-b bg-background px-4 md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="shrink-0">
                    <PanelLeft className="h-5 w-5" />
                    <span className="sr-only">Toggle navigation menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0">
                  <AdminSidebar />
                </SheetContent>
              </Sheet>
            </header>
          <SidebarInset>
            {children}
            </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  )
}

export default withAuth(AdminLayout, ['Admin']);
