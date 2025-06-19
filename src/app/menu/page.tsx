
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Package, PlusCircle, Settings, Gem, ShieldCheck, LayoutDashboard, ListOrdered, Palette, ExternalLink } from "lucide-react"; 
import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import type { AuthUser } from "@/types";

interface MenuItem {
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  allowedRoles?: Array<AuthUser['role']>;
}

const menuItemsList: MenuItem[] = [
  {
    title: "Manage Orders",
    description: "View and manage client project orders.",
    icon: ListOrdered,
    href: "/", 
    allowedRoles: ['user', 'developer', 'admin'],
  },
  {
    title: "Packages",
    description: "View and manage existing service packages.",
    icon: Package,
    href: "/packages", 
    allowedRoles: ['user', 'developer', 'admin'],
  },
  {
    title: "Make Custom Website",
    description: "Design and order a unique website.",
    icon: Palette, 
    href: "/custom-website", 
    allowedRoles: ['user', 'developer', 'admin'],
  },
  {
    title: "Custom Pack",
    description: "Configure a custom package for a client.",
    icon: Settings,
    href: "/custom-pack", 
    allowedRoles: ['developer', 'admin'],
  },
  {
    title: "VIP Features",
    description: "Access exclusive VIP services and features.",
    icon: Gem,
    href: "/vip", 
    allowedRoles: ['developer', 'admin'],
  },
  {
    title: "Admin Console",
    description: "Manage application settings and users.",
    icon: ShieldCheck,
    href: "/admin", 
    allowedRoles: ['developer', 'admin'],
  },
];

export default function MenuPage() {
  const { user } = useAuth();

  const visibleMenuItems = menuItemsList.filter(item => {
    if (!item.allowedRoles) return true; 
    if (!user || !user.role) return false; 
    return item.allowedRoles.includes(user.role);
  });


  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <header className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <LayoutDashboard className="h-8 w-8 md:h-10 md:w-10 text-primary" />
          <h1 className="text-3xl md:text-4xl font-bold font-headline text-primary">
            eSystemLK Orders
          </h1>
        </div>
        <p className="text-md sm:text-lg text-muted-foreground">
          Welcome! Select an option below to get started.
        </p>
        <Button asChild variant="link" className="p-0 h-auto mt-2 text-accent hover:underline">
          <Link href="https://www.esystemlk.xyz" target="_blank" rel="noopener noreferrer">
            Visit Our Main Website <ExternalLink className="ml-1.5 h-4 w-4" />
          </Link>
        </Button>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {visibleMenuItems.map((item) => (
          <MenuItemCard
            key={item.title}
            title={item.title}
            description={item.description}
            icon={item.icon}
            href={item.href}
          />
        ))}
      </div>
    </div>
  );
}

interface MenuItemCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
}

function MenuItemCard({ title, description, icon: Icon, href }: MenuItemCardProps) {
  return (
    <Link href={href} passHref>
      <Card className="hover:shadow-lg hover:border-primary/50 transition-all duration-300 cursor-pointer h-full flex flex-col rounded-xl overflow-hidden group">
        <CardHeader className="flex flex-row items-center space-x-4 pb-3 pt-5 bg-card">
          <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
            <Icon className="h-7 w-7 text-primary group-hover:scale-110 transition-transform" />
          </div>
          <CardTitle className="text-xl font-semibold">{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow pt-2 pb-5">
          <CardDescription className="text-sm text-muted-foreground group-hover:text-foreground/90 transition-colors">
            {description}
          </CardDescription>
        </CardContent>
         <div className="px-6 pb-4 mt-auto">
            <div className="text-sm text-primary group-hover:underline font-medium flex items-center">
                Go to {title}
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-transform"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </div>
        </div>
      </Card>
    </Link>
  );
}
