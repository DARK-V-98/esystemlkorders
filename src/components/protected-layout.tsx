
"use client";

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SidebarNavigation } from "@/components/sidebar-navigation";

// This component handles the logic for protecting routes and rendering the main layout
// or the login page.
export function ProtectedLayoutContent({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user && pathname !== '/login') {
      router.push('/login');
    }
    // Optional: If user is logged in and tries to access /login, redirect to home
    // if (!loading && user && pathname === '/login') {
    //   router.push('/');
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
    // This case should ideally be covered by the redirect,
    // but as a fallback, show a loader or minimal content.
     return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="ml-4">Redirecting to login...</p>
      </div>
    );
  }
  
  // If on the login page, render children directly without the main layout
  if (pathname === '/login') {
    return <>{children}</>;
  }

  // If user is authenticated and not on login page, render the main app layout
  if (user) {
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

  // Fallback, though ideally should not be reached if logic above is correct.
  return null; 
}
