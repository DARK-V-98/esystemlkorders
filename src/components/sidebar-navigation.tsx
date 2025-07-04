
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  ListOrdered, LogOut, LogIn, UserCircle, Package, Palette, Settings, Gem, ShieldCheck, LayoutDashboard 
} from "lucide-react";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/auth-context";
import type { AuthUser } from "@/types"; 
import { CurrencySwitcher } from "./currency-switcher";
import { Separator } from "./ui/separator";
import Image from 'next/image'; // Import next/image

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  matchExact?: boolean;
  allowedRoles?: Array<AuthUser['role']>; 
}

const allNavItems: NavItem[] = [
  { href: "/menu", label: "Dashboard", icon: LayoutDashboard, matchExact: true },
  { href: "/", label: "Orders", icon: ListOrdered, allowedRoles: ['user', 'developer', 'admin'] },
  { 
    href: "/packages", 
    label: "Packages", 
    icon: Package,
    allowedRoles: ['user', 'developer', 'admin']
  },
  { 
    href: "/custom-website", 
    label: "Make Custom Website", 
    icon: Palette,
    allowedRoles: ['user', 'developer', 'admin']
  },
  { 
    href: "/custom-pack", 
    label: "Custom Pack", 
    icon: Settings,
    allowedRoles: ['developer', 'admin']
  },
  { 
    href: "/vip", 
    label: "VIP Access", 
    icon: Gem,
    allowedRoles: ['developer', 'admin'] 
  },
  { 
    href: "/admin", 
    label: "Admin Console", 
    icon: ShieldCheck,
    allowedRoles: ['admin', 'developer'] 
  },
];

export function SidebarNavigation() {
  const pathname = usePathname();
  const { user, signOutUser, loading } = useAuth();

  const visibleNavItems = allNavItems.filter(item => {
    if (!item.allowedRoles) return true; 
    if (!user || !user.role) return false; 
    return item.allowedRoles.includes(user.role);
  });


  return (
    <Sidebar collapsible="icon" variant="sidebar" side="left">
      <SidebarHeader className="p-4 flex items-center gap-2">
        <Image 
          src="/logo.png" 
          alt="eSystemLK Logo" 
          width={32} 
          height={32} 
          className="h-8 w-8"
          data-ai-hint="company logo"
        />
        <h1 className="text-xl font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden">
          eSystemLK
        </h1>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {visibleNavItems.map((item) => {
            const isActive = item.matchExact ? pathname === item.href : pathname.startsWith(item.href) && (item.href !== "/" || pathname === "/"); 
            
            return (
              <SidebarMenuItem key={item.label}>
                <Link href={item.href} legacyBehavior={false} passHref={false}>
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
      <SidebarFooter className="p-4 mt-auto space-y-3">
        <div className="group-data-[collapsible=icon]:hidden">
          <CurrencySwitcher />
        </div>
        <div className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center hidden">
           <CurrencySwitcher />
        </div>
        
        <Separator className="bg-sidebar-border group-data-[collapsible=icon]:hidden" />
        
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
                <AvatarImage src={user.photoURL} alt={user.displayName || "User Avatar"} data-ai-hint="user avatar"/>
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
            <span className="text-xs text-sidebar-foreground/70 group-data-[collapsible=icon]:hidden capitalize">
                Role: {user.role || 'N/A'}
            </span>
            <Button 
                variant="ghost" 
                size="sm" 
                onClick={signOutUser} 
                className="text-xs text-sidebar-foreground/70 hover:text-sidebar-primary hover:bg-sidebar-accent/50 justify-start p-0 h-auto mt-0.5 group-data-[collapsible=icon]:hidden"
                title="Sign Out"
            >
                <LogOut className="mr-1.5 h-3.5 w-3.5"/> Sign Out
             </Button>
           </div>
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

    