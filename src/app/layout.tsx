import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SidebarNavigation } from "@/components/sidebar-navigation";
import { Button } from '@/components/ui/button';
import { PanelLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'eSystemLK Gateway Dashboard',
  description: 'Manage website development orders for eSystemLK Gateway.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <SidebarProvider defaultOpen={true}>
          <div className="flex min-h-screen">
            <SidebarNavigation />
            <SidebarInset className="flex-1 flex flex-col">
              {children}
            </SidebarInset>
          </div>
        </SidebarProvider>
        <Toaster />
      </body>
    </html>
  );
}
