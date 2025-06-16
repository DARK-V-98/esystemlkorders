
"use client";

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SidebarNavigation } from "@/components/sidebar-navigation";

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
      // If user is trying to access /admin but doesn't have the role
      router.push('/menu'); // Or an unauthorized page
    }
    // Optional: If user is logged in and tries to access /login, redirect to home
    // if (user && pathname === '/login') {
    //   router.push('/menu'); 
    // }
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
    // Additional check for admin route access if user somehow bypasses initial redirect
    const isAdminRoute = pathname.startsWith('/admin');
    const allowedAdminRoles = ['admin', 'developer'];
    if (isAdminRoute && !allowedAdminRoles.includes(user.role || '')) {
      // This is a fallback, primary redirection is in useEffect
      // You might want to show an "Unauthorized" component here or redirect again
      // For now, returning null or a loader can prevent rendering admin content
      return (
        <div className="flex min-h-screen items-center justify-center bg-background">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
            <p className="ml-4">Access Denied. Redirecting...</p>
        </div>
      );
    }

    return (
      <SidebarProvider defaultOpen={true}>
        <div className="flex min-h-screen bg-background">
          <SidebarNavigation />
          <SidebarInset className="flex-1 flex flex-col">
            {children}
          </SidebarInset>
        </div>
      </SidebarProvider>
    );
  }

  return null; 
}
