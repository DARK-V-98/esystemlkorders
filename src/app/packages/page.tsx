
"use client";

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Layers, Palette, Tag } from "lucide-react"; // Using Tag for budget, Palette for custom
import { useCurrency } from '@/contexts/currency-context';
import { DynamicIcon } from '@/components/icons';

interface PackageInfo {
  id: string;
  title: string;
  description: string;
  priceLKR: number;
  priceDisplay: string; // Formatted price string
  features: string[];
  iconName: string; 
  href?: string;
  actionText: string;
  highlight?: boolean;
}

export default function PackagesPage() {
  const { currencySymbol, selectedCurrency } = useCurrency(); // We might only show LKR for these fixed packages

  // For fixed LKR packages, we'll display LKR regardless of currency selection,
  // or you could adapt to show an equivalent USD if desired.
  // For now, let's stick to the specified LKR amounts.

  const packagesData: PackageInfo[] = [
    {
      id: 'budget-starter',
      title: 'Starter Pack',
      description: 'An essential package to get your presence online quickly and effectively.',
      priceLKR: 15000,
      priceDisplay: `Rs. 15,000`, 
      features: ['Basic 3-Page Design', 'Mobile Responsive', 'Contact Form', 'Social Media Links'],
      iconName: 'Tag',
      actionText: 'Get Started',
      href: '/contact?package=starter', // Example contact link
    },
    {
      id: 'budget-growth',
      title: 'Growth Pack',
      description: 'More features to help your business grow and engage with customers.',
      priceLKR: 30000,
      priceDisplay: `Rs. 30,000`,
      features: ['Up to 5 Pages', 'Custom Design Elements', 'Basic SEO Setup', 'Blog Integration'],
      iconName: 'Tag',
      actionText: 'Choose Plan',
      highlight: true,
      href: '/contact?package=growth', // Example contact link
    },
    {
      id: 'budget-pro',
      title: 'Pro Pack',
      description: 'A comprehensive solution for established businesses looking for a robust online platform.',
      priceLKR: 50000,
      priceDisplay: `Rs. 50,000`,
      features: ['Up to 10 Pages', 'Advanced UI/UX', 'E-commerce Ready (Basic)', 'Analytics Integration'],
      iconName: 'Tag',
      actionText: 'Select Pro',
      href: '/contact?package=pro', // Example contact link
    },
    {
      id: 'custom-package',
      title: 'Make Your Custom Package',
      description: 'Tailor a website to your exact needs. Choose features, pages, and design elements with our interactive builder.',
      priceLKR: 0, // Price is dynamic
      priceDisplay: 'Dynamic Pricing',
      features: ['Fully Customizable', 'Interactive Builder', 'Personalized Quote', 'Scalable Solution'],
      iconName: 'Palette', 
      href: '/custom-website',
      actionText: 'Build Your Website',
    },
  ];

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-8">
      <header className="text-center mb-12">
        <div className="flex items-center justify-center space-x-3 mb-3">
          <Layers className="h-12 w-12 text-primary" />
          <h1 className="text-4xl font-bold font-headline text-primary">
            Our Service Packages
          </h1>
        </div>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Choose from our expertly crafted packages or build your own custom solution to perfectly fit your needs.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {packagesData.map((pkg) => (
          <Card 
            key={pkg.id} 
            className={`flex flex-col rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300 ${pkg.highlight ? 'border-2 border-primary ring-2 ring-primary/50' : 'border'}`}
          >
            <CardHeader className="bg-card p-6">
              <div className="flex items-center space-x-3 mb-2">
                <DynamicIcon name={pkg.iconName} className={`h-8 w-8 ${pkg.highlight ? 'text-primary' : 'text-accent'}`} />
                <CardTitle className={`text-2xl font-semibold ${pkg.highlight ? 'text-primary' : ''}`}>{pkg.title}</CardTitle>
              </div>
              <CardDescription className="text-sm text-muted-foreground min-h-[60px]">{pkg.description}</CardDescription>
            </CardHeader>
            <CardContent className="p-6 flex-grow space-y-4">
              <div>
                <p className={`text-4xl font-bold ${pkg.highlight ? 'text-primary' : 'text-foreground'}`}>{pkg.priceDisplay}</p>
                {pkg.id !== 'custom-package' && <p className="text-xs text-muted-foreground">LKR / one-time</p>}
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {pkg.features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-2 text-green-500 shrink-0"><path d="M20 6L9 17l-5-5"/></svg>
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="p-6 bg-muted/20 mt-auto">
              {pkg.href ? (
                <Button asChild className={`w-full text-lg py-6 ${pkg.highlight ? 'bg-primary hover:bg-primary/90 text-primary-foreground' : 'bg-accent hover:bg-accent/80 text-accent-foreground'}`}>
                  <Link href={pkg.href}>
                    {pkg.actionText} <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              ) : (
                <Button className="w-full text-lg py-6" disabled>
                  {pkg.actionText}
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}

