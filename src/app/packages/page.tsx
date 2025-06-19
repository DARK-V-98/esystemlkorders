
"use client";

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Layers, Palette, Tag, ShoppingCart, Loader2, ExternalLink, ShieldCheck, Settings as SettingsIcon, Gem } from "lucide-react";
import { useCurrency } from '@/contexts/currency-context';
import { DynamicIcon } from '@/components/icons';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, type DocumentReference } from 'firebase/firestore';
import { generateFormattedOrderId } from '@/lib/utils';
import type { Order, SelectedFeatureInOrder } from '@/types';

interface PackageInfo {
  id: string;
  title: string;
  description: string;
  priceLKR: number;
  priceDisplay: string;
  features: string[];
  iconName: string;
  actionText: string;
  highlight?: boolean;
  isCustom?: boolean;
  estimatedPages?: number;
}

const commonFeature = "Basic Technical Support"; // This will be overridden by lifetime support in Premium+

const packagesData: PackageInfo[] = [
  // Budget Packs
  {
    id: 'budget-starter',
    title: 'Starter Pack',
    description: 'An essential package to get your presence online quickly and effectively.',
    priceLKR: 15000,
    priceDisplay: `Rs. 15,000`,
    features: ['Basic 3-Page Design', 'Mobile Responsive', 'Contact Form', 'Social Media Links', commonFeature],
    iconName: 'Tag',
    actionText: 'Order Starter Pack',
    estimatedPages: 3,
  },
  {
    id: 'budget-growth',
    title: 'Growth Pack',
    description: 'More features to help your business grow and engage with customers.',
    priceLKR: 30000,
    priceDisplay: `Rs. 30,000`,
    features: ['Up to 5 Pages', 'Custom Design Elements', 'Basic SEO Setup', 'Blog Integration', commonFeature],
    iconName: 'Tag',
    actionText: 'Order Growth Pack',
    estimatedPages: 5,
  },
  {
    id: 'budget-pro',
    title: 'Pro Pack',
    description: 'A comprehensive solution for established businesses looking for a robust online platform.',
    priceLKR: 50000,
    priceDisplay: `Rs. 50,000`,
    features: ['Up to 10 Pages', 'Advanced UI/UX', 'Basic E-commerce Ready', 'Analytics Integration', commonFeature],
    iconName: 'Tag',
    actionText: 'Order Pro Pack',
    estimatedPages: 10,
  },
  // Silver Packs
  {
    id: 'silver-starter',
    title: 'Silver Starter Pack',
    description: 'Enhanced design and more pages for growing businesses.',
    priceLKR: 75000,
    priceDisplay: `Rs. 75,000`,
    features: ['Up to 12 Pages', 'Enhanced UI/UX Design', 'Basic SEO Setup', 'Blog Setup', 'Basic Content Writing Aid', commonFeature],
    iconName: 'ShieldCheck',
    actionText: 'Order Silver Starter',
    estimatedPages: 12,
  },
  {
    id: 'silver-plus',
    title: 'Silver Plus Pack',
    description: 'A balanced package with advanced features and marketing tools.',
    priceLKR: 100000,
    priceDisplay: `Rs. 100,000`,
    features: ['Up to 15 Pages', 'Advanced UI/UX', 'Advanced SEO Package', 'Social Media Integration (Full)', 'Logo Design Concept', commonFeature],
    iconName: 'ShieldCheck',
    actionText: 'Order Silver Plus',
    highlight: true,
    estimatedPages: 15,
  },
  {
    id: 'silver-premium',
    title: 'Silver Premium Pack',
    description: 'Comprehensive silver tier solution with e-commerce capabilities.',
    priceLKR: 130000,
    priceDisplay: `Rs. 130,000`,
    features: ['Up to 20 Pages', 'Premium UI/UX Design', 'Full SEO & Analytics', 'Standard E-commerce Setup', 'Newsletter Integration', commonFeature],
    iconName: 'ShieldCheck',
    actionText: 'Order Silver Premium',
    estimatedPages: 20,
  },
  // Gold Packs
  {
    id: 'gold-essential',
    title: 'Gold Essential Pack',
    description: 'Top-tier features for businesses aiming for market leadership.',
    priceLKR: 180000,
    priceDisplay: `Rs. 180,000`,
    features: ['Up to 25 Pages', 'Bespoke Design System', 'Full E-commerce Suite', 'Dedicated Project Manager (Light)', 'Content Strategy', commonFeature],
    iconName: 'Settings', 
    actionText: 'Order Gold Essential',
    estimatedPages: 25,
  },
  {
    id: 'gold-advanced',
    title: 'Gold Advanced Pack',
    description: 'Advanced solutions including custom integrations and reporting.',
    priceLKR: 250000,
    priceDisplay: `Rs. 250,000`,
    features: ['Up to 30 Pages', 'Personalized UI/UX Workshop', 'Advanced E-commerce & Payments', 'Custom API Integrations (1-2)', 'Advanced Analytics & Reporting', commonFeature],
    iconName: 'Settings', 
    actionText: 'Order Gold Advanced',
    estimatedPages: 30,
  },
  {
    id: 'gold-ultimate',
    title: 'Gold Ultimate Pack',
    description: 'The ultimate package for a dominant online presence and performance.',
    priceLKR: 350000,
    priceDisplay: `Rs. 350,000`,
    features: ['30+ Pages & Scalable Architecture', 'Full Branding Suite (Logo, Guidelines)', 'Premium E-commerce & Custom Features', 'Performance Optimization & Security Suite', 'Priority Support & Training Session', commonFeature],
    iconName: 'Settings', 
    actionText: 'Order Gold Ultimate',
    highlight: true,
    estimatedPages: 35,
  },
  // Premium+ Packs
  {
    id: 'premium-plus-core',
    title: 'Premium+ Core',
    description: 'The ultimate solution with dedicated support, free hosting, and top-tier premium features for unparalleled online presence.',
    priceLKR: 500000,
    priceDisplay: `Rs. 500,000`,
    features: ['Up to 40 Pages', 'Elite Custom Design & Branding', 'Advanced E-commerce & Marketplace Features', 'Dedicated Account Manager', '1 Year Free Hosting', 'Lifetime Technical Support', 'Priority Feature Updates', 'Advanced Security Suite'],
    iconName: 'Gem',
    actionText: 'Order Premium+ Core',
    estimatedPages: 40,
  },
  {
    id: 'premium-plus-elite',
    title: 'Premium+ Elite',
    description: 'Our flagship offering with bespoke development, strategic consultancy, and every premium feature for market domination.',
    priceLKR: 750000,
    priceDisplay: `Rs. 750,000`,
    features: ['Unlimited Pages (Scalable)', 'Fully Bespoke Development & Integrations', 'AI-Powered Features & Personalization', 'Strategic Growth Consultancy', '1 Year Free Hosting', 'Lifetime Technical Support', 'Dedicated Support Team Access', 'Quarterly Performance Audits & Optimization'],
    iconName: 'Gem',
    actionText: 'Order Premium+ Elite',
    highlight: true,
    estimatedPages: 50,
  },
  {
    id: 'premium-plus-ultra',
    title: 'Premium+ Ultra',
    description: 'The pinnacle of web solutions, offering comprehensive, custom-built platforms with continuous innovation and support.',
    priceLKR: 1000000,
    priceDisplay: `Rs. 1,000,000`,
    features: ['Custom Platform Development', 'Enterprise-Grade Infrastructure & Scalability', 'Full Suite of AI & Automation Tools', 'Ongoing Strategic Partnership & Innovation Roadmap', '1 Year Free Hosting', 'Lifetime Technical Support', '24/7 Priority Support Line', 'Complete Digital Ecosystem Integration'],
    iconName: 'Gem',
    actionText: 'Order Premium+ Ultra',
    estimatedPages: 60,
  },
  // Custom Package
  {
    id: 'custom-package',
    title: 'Make Your Custom Package',
    description: 'Tailor a website to your exact needs. Choose features, pages, and design elements with our interactive builder.',
    priceLKR: 0,
    priceDisplay: 'Dynamic Pricing',
    features: ['Fully Customizable', 'Interactive Builder', 'Personalized Quote', 'Scalable Solution'],
    iconName: 'Palette',
    actionText: 'Build Your Website',
    isCustom: true,
  },
];

export default function PackagesPage() {
  const { currencySymbol, selectedCurrency } = useCurrency();
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedPackage, setSelectedPackage] = useState<PackageInfo | null>(null);
  const [isOrdering, setIsOrdering] = useState(false);

  const handleOrderPackage = async () => {
    if (!selectedPackage || selectedPackage.isCustom) return;
    if (!user) {
      toast({
        variant: "destructive",
        title: "Login Required",
        description: "Please log in to order a package.",
      });
      setSelectedPackage(null);
      return;
    }

    setIsOrdering(true);

    const formattedOrderId = generateFormattedOrderId();
    const orderFeatures: SelectedFeatureInOrder[] = selectedPackage.features.map(featureName => ({
      id: featureName.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, ''),
      name: featureName,
      price: 0, 
      currency: 'lkr',
      currencySymbol: 'Rs.',
    }));

    const orderData: Omit<Order, 'id' | 'createdDate' | 'deadline' | 'projectDetails' | 'packageOrderDetails'> & { createdDate: any } = {
      formattedOrderId: formattedOrderId,
      clientName: user.displayName || user.email || 'N/A',
      projectName: selectedPackage.title,
      projectType: 'Budget Package', 
      status: 'Pending',
      paymentStatus: 'Not Paid',
      description: selectedPackage.description,
      requestedFeatures: orderFeatures,
      contactEmail: user.email || 'N/A',
      budget: selectedPackage.priceLKR,
      numberOfPages: selectedPackage.estimatedPages || 0,
      selectedCurrency: 'lkr',
      currencySymbol: 'Rs.',
      userEmail: user.email || 'N/A',
      createdDate: serverTimestamp(),
    };

    try {
      const docRef = await addDoc(collection(db, "orders"), orderData) as DocumentReference;
      const newOrderId = docRef.id;
      toast({
        title: "Package Order Placed! Next Step: Fill Details",
        description: (
           <div>
            <p>Your order for "{selectedPackage.title}" (ID: {formattedOrderId}) has been placed. Total: Rs.{selectedPackage.priceLKR.toLocaleString()}.</p>
            <p className="mt-2">Please proceed to fill out the required details for your package.</p>
            <Button asChild variant="link" className="p-0 h-auto mt-1 text-accent hover:underline">
              <Link href={`/fill-package-details/${newOrderId}`}>
                Go to Package Details Form <ExternalLink className="ml-1.5 h-3 w-3" />
              </Link>
            </Button>
          </div>
        ),
        duration: 15000,
      });
    } catch (error) {
      console.error("Error ordering package:", error);
      toast({
        variant: "destructive",
        title: "Order Failed",
        description: "There was an error placing your order. Please try again.",
      });
    } finally {
      setIsOrdering(false);
      setSelectedPackage(null);
    }
  };

  return (
    <AlertDialog open={!!selectedPackage && !selectedPackage.isCustom} onOpenChange={(open) => { if (!open) setSelectedPackage(null); }}>
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
          <p className="text-muted-foreground text-md max-w-2xl mx-auto mt-2">
            All of these packages include many more features. Contact eSystemLK for full details.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
                {pkg.isCustom ? (
                  <Button asChild className={`w-full text-lg py-6 ${pkg.highlight ? 'bg-primary hover:bg-primary/90 text-primary-foreground' : 'bg-accent hover:bg-accent/80 text-accent-foreground'}`}>
                    <Link href="/custom-website">
                      {pkg.actionText} <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                ) : (
                  <AlertDialogTrigger asChild>
                    <Button
                      onClick={() => setSelectedPackage(pkg)}
                      className={`w-full text-lg py-6 ${pkg.highlight ? 'bg-primary hover:bg-primary/90 text-primary-foreground' : 'bg-accent hover:bg-accent/80 text-accent-foreground'}`}
                    >
                      <ShoppingCart className="mr-2 h-5 w-5" /> {pkg.actionText}
                    </Button>
                  </AlertDialogTrigger>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>

        {selectedPackage && !selectedPackage.isCustom && (
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Package Order</AlertDialogTitle>
              <AlertDialogDescription>
                You are about to order the <strong>{selectedPackage.title}</strong> for <strong>{selectedPackage.priceDisplay}</strong>.
                Are you sure you want to proceed?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setSelectedPackage(null)} disabled={isOrdering}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleOrderPackage} disabled={isOrdering}>
                {isOrdering && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm Order
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        )}
      </div>
    </AlertDialog>
  );
}
