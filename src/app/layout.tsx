
// No "use client" here

import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/contexts/auth-context';
import { CurrencyProvider } from '@/contexts/currency-context'; // Import CurrencyProvider
import { ProtectedLayoutContent } from '@/components/protected-layout';
import type { ReactNode } from 'react';


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
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <AuthProvider>
          <CurrencyProvider> {/* Wrap with CurrencyProvider */}
            <ProtectedLayoutContent>
              {children}
            </ProtectedLayoutContent>
          </CurrencyProvider>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
