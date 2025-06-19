
"use client";

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"; // Added SidebarTrigger
import { SidebarNavigation } from "@/components/sidebar-navigation";
import Image from 'next/image'; // Added Image
import Link from 'next/link'; // Added Link

export function ProtectedLayoutContent({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const isAdminRoute = pathname.startsWith('/admin');
    const allowedAdminRoles = ['admin', 'developer'];

    if (!user && pathname !== '/login') {
      router.push('/login');
    } else if (user && isAdminRoute && !allowedAdminRoles.includes(user.role || '')) {
      router.push('/menu'); 
    }
  }, [user, loading, pathname, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (!user && pathname !== '/login') {
     return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="ml-4">Redirecting to login...</p>
      </div>
    );
  }
  
  if (pathname === '/login') {
    return <>{children}</>;
  }

  if (user) {
    const isAdminRoute = pathname.startsWith('/admin');
    const allowedAdminRoles = ['admin', 'developer'];
    if (isAdminRoute && !allowedAdminRoles.includes(user.role || '')) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
            <p className="ml-4">Access Denied. Redirecting...</p>
        </div>
      );
    }

    return (
      <SidebarProvider defaultOpen={true}>
        <div className="flex min-h-screen bg-background"> {/* This is group/sidebar-wrapper */}
          <SidebarNavigation /> {/* This is the Sidebar component instance */}
          <div className="flex flex-1 flex-col overflow-hidden"> {/* Main wrapper for header and content */}
            {/* Mobile-only Header */}
            <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background px-4 md:hidden">
              <SidebarTrigger /> {/* Will render hamburger icon on mobile */}
              <Link href="/menu" className="flex items-center gap-2">
                  <Image src="/logo.png" alt="eSystemLK Logo" width={28} height={28} data-ai-hint="company logo"/>
                  <span className="font-semibold text-lg text-primary">eSystemLK</span>
              </Link>
            </header>
            {/* Main content area */}
            <main className="flex-1 overflow-x-hidden overflow-y-auto">
              {/* Children pages typically have their own padding, e.g., "container mx-auto p-4" */}
              {children}
            </main>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  return null; 
}
