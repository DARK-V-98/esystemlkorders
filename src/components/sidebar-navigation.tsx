
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ListOrdered, LogOut, LogIn, UserCircle } from "lucide-react";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  // SidebarTrigger, // Not used currently as sidebar is always open for authenticated users
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/auth-context";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  matchExact?: boolean;
}

// Initial nav items, will be expanded based on roles later
const navItems: NavItem[] = [
  { href: "/", label: "Orders", icon: ListOrdered, matchExact: true },
  // Add more navigation items here if needed in the future
  // e.g. { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  // { href: "/clients", label: "Clients", icon: Users },
];

export function SidebarNavigation() {
  const pathname = usePathname();
  const { user, signOutUser, loading } = useAuth();

  // If loading auth state or no user (which implies redirect to login is happening),
  // you might want to render a slimmed-down sidebar or nothing.
  // For now, the ProtectedLayoutContent handles the main loading/redirect.
  // This component will render once user state is resolved and user is present.

  return (
    <Sidebar collapsible="icon" variant="sidebar" side="left">
      <SidebarHeader className="p-4 flex items-center gap-2">
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-8 w-8 text-primary"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
          </svg>
        <h1 className="text-xl font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden">
          eSystemLK
        </h1>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {navItems.map((item) => {
            const isActive = item.matchExact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <SidebarMenuItem key={item.label}>
                <Link href={item.href}>
                  <SidebarMenuButton
                    isActive={isActive}
                    tooltip={{ children: item.label, side: "right", align: "center" }}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-4 mt-auto">
        {loading ? (
          <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
            <UserCircle className="h-9 w-9 text-sidebar-foreground/50 animate-pulse" />
            <div className="flex flex-col group-data-[collapsible=icon]:hidden">
              <span className="text-sm h-4 w-24 bg-sidebar-foreground/20 rounded animate-pulse"></span>
              <span className="text-xs h-3 w-20 mt-1 bg-sidebar-foreground/10 rounded animate-pulse"></span>
            </div>
          </div>
        ) : user ? (
          <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
           <Avatar className="h-9 w-9">
             {user.photoURL ? (
                <AvatarImage src={user.photoURL} alt={user.displayName || "User Avatar"} data-ai-hint="user avatar" />
             ) : (
                <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground">
                  {user.email?.[0]?.toUpperCase() || <UserCircle size={20}/>}
                </AvatarFallback>
             )}
           </Avatar>
           <div className="flex flex-col group-data-[collapsible=icon]:hidden">
             <span className="text-sm font-medium text-sidebar-foreground truncate max-w-[150px]" title={user.email || undefined}>
                {user.displayName || user.email}
            </span>
            <Button 
                variant="ghost" 
                size="sm" 
                onClick={signOutUser} 
                className="text-xs text-sidebar-foreground/70 hover:text-sidebar-primary hover:bg-sidebar-accent/50 justify-start p-0 h-auto group-data-[collapsible=icon]:hidden"
                title="Sign Out"
            >
                <LogOut className="mr-1.5 h-3.5 w-3.5"/> Sign Out
             </Button>
           </div>
           {/* Icon-only sign out for collapsed sidebar */}
            <Button 
                variant="ghost" 
                size="icon" 
                onClick={signOutUser} 
                className="text-sidebar-foreground/70 hover:text-sidebar-primary hover:bg-sidebar-accent/50 hidden group-data-[collapsible=icon]:flex h-8 w-8"
                title="Sign Out"
            >
                <LogOut className="h-4 w-4"/>
             </Button>

          </div>
        ) : (
           <Link href="/login" className="w-full">
            <Button variant="default" className="w-full bg-sidebar-primary hover:bg-sidebar-primary/90 text-sidebar-primary-foreground group-data-[collapsible=icon]:aspect-square group-data-[collapsible=icon]:p-0">
                <LogIn className="h-4 w-4 group-data-[collapsible=icon]:m-auto" />
                <span className="ml-2 group-data-[collapsible=icon]:hidden">Sign In</span>
            </Button>
           </Link>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
