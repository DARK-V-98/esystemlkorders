
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ListOrdered, LayoutDashboard, Settings, Users } from "lucide-react";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  matchExact?: boolean;
}

const navItems: NavItem[] = [
  { href: "/", label: "Orders", icon: ListOrdered, matchExact: true },
  // Add more navigation items here if needed in the future
  // e.g. { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  // { href: "/clients", label: "Clients", icon: Users },
];

export function SidebarNavigation() {
  const pathname = usePathname();

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
        <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
           <Avatar className="h-9 w-9">
             <AvatarImage src="https://placehold.co/40x40.png" alt="User Avatar" data-ai-hint="user avatar" />
             <AvatarFallback>U</AvatarFallback>
           </Avatar>
           <div className="flex flex-col group-data-[collapsible=icon]:hidden">
             <span className="text-sm font-medium text-sidebar-foreground">Admin User</span>
             <span className="text-xs text-sidebar-foreground/70">admin@esystemlk.com</span>
           </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

