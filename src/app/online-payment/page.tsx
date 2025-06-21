
"use client";

import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from '@/contexts/auth-context';
import { generateFormattedOrderId } from '@/lib/utils';
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
import { Tag, ShieldCheck, Gem, CreditCard, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import type { Order } from '@/types';


interface PaymentPackage {
  id: string;
  title: string;
  description: string;
  priceLKR: number;
  priceDisplay: string;
  features: string[];
  icon: React.ElementType;
}

const paymentPackages: PaymentPackage[] = [
  {
    id: 'starter-payment',
    title: 'Starter Pack',
    description: 'An essential package to get your presence online quickly.',
    priceLKR: 15000,
    priceDisplay: 'Rs. 15,000',
    features: ['Basic 3-Page Design', 'Mobile Responsive', 'Contact Form'],
    icon: Tag,
  },
  {
    id: 'silver-plus-payment',
    title: 'Silver Plus Pack',
    description: 'A balanced package with advanced features and marketing tools.',
    priceLKR: 100000,
    priceDisplay: 'Rs. 100,000',
    features: ['Up to 15 Pages', 'Advanced UI/UX', 'Advanced SEO Package', 'Logo Design Concept'],
    icon: ShieldCheck,
  },
  {
    id: 'gold-essential-payment',
    title: 'Gold Essential Pack',
    description: 'Top-tier features for businesses aiming for market leadership.',
    priceLKR: 180000,
    priceDisplay: 'Rs. 180,000',
    features: ['Up to 25 Pages', 'Bespoke Design System', 'Full E-commerce Suite', 'Content Strategy'],
    icon: Gem,
  },
];

const PAYHERE_CHECKOUT_URL = "https://www.payhere.lk/pay/checkout";

export default function OnlinePaymentPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [selectedPackage, setSelectedPackage] = useState<PaymentPackage | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const merchantId = process.env.NEXT_PUBLIC_PAYHERE_MERCHANT_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '');

  const handleBuyNowClick = (pkg: PaymentPackage) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "Please log in to make a payment.",
      });
      router.push('/login');
      return;
    }
    if (!merchantId) {
      toast({
        variant: "destructive",
        title: "Configuration Error",
        description: "Payment gateway is not configured. Please contact support.",
      });
      return;
    }
    setSelectedPackage(pkg);
  };
  
  const proceedToPayment = async () => {
    if (!selectedPackage || !user || !merchantId || !appUrl) {
        setIsProcessing(false);
        return;
    };

    setIsProcessing(true);
    const formattedOrderId = generateFormattedOrderId();
    const amount = selectedPackage.priceLKR;
    const currency = 'LKR';

    const orderData: Omit<Order, 'id' | 'createdDate' | 'deadline' | 'projectDetails' | 'packageOrderDetails'> & { createdDate: any } = {
        formattedOrderId: formattedOrderId,
        clientName: user.displayName || user.email || 'N/A',
        projectName: `Payment for ${selectedPackage.title}`,
        projectType: 'Budget Package',
        status: 'Waiting for Payment',
        paymentStatus: 'Not Paid',
        description: `Online payment submission for: ${selectedPackage.description}`,
        requestedFeatures: selectedPackage.features.map(f => ({ id: f, name: f, price: 0, currency: 'lkr', currencySymbol: 'Rs.' })),
        contactEmail: user.email || 'N/A',
        budget: amount,
        numberOfPages: 0,
        selectedCurrency: 'lkr',
        currencySymbol: 'Rs.',
        userEmail: user.email || 'N/A',
        createdDate: serverTimestamp(),
    };

    try {
        await addDoc(collection(db, "orders"), orderData);

        const response = await fetch('/api/generate-payhere-hash', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                order_id: formattedOrderId,
                amount: amount,
                currency: currency
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Failed to generate payment hash. Please try again.' }));
            throw new Error(errorData.error || 'Failed to generate payment hash. Please try again.');
        }

        const { hash } = await response.json();

        if (!hash) {
            throw new Error('Invalid payment hash received from server.');
        }
        
        const form = formRef.current;
        if (form) {
            const createInput = (name: string, value: string) => {
                const input = document.createElement('input');
                input.type = 'hidden';
                input.name = name;
                input.value = value;
                return input;
            };
            
            form.innerHTML = '';
            
            const nameParts = user?.displayName?.split(' ') || [];
            const userFirstName = nameParts[0] || '';
            const userLastName = nameParts.slice(1).join(' ') || '';

            const fields = {
                merchant_id: merchantId,
                return_url: `${appUrl}/payment/success`,
                cancel_url: `${appUrl}/payment/cancel`,
                notify_url: `${appUrl}/api/payment-notify`,
                order_id: formattedOrderId,
                items: selectedPackage.title,
                currency: currency,
                amount: String(amount),
                first_name: userFirstName,
                last_name: userLastName,
                email: user.email || '',
                phone: '',
                address: '',
                city: '',
                country: 'Sri Lanka',
                hash: hash
            };

            Object.entries(fields).forEach(([name, value]) => {
                form.appendChild(createInput(name, value));
            });

            form.submit();
        } else {
            throw new Error("Could not find payment form reference. Please refresh and try again.");
        }

    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Payment Initialization Failed",
            description: error.message || "An unknown error occurred.",
        });
        setIsProcessing(false);
    }
  };

  return (
    <AlertDialog open={!!selectedPackage} onOpenChange={(open) => {if (!open) setSelectedPackage(null)}}>
      <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-8">
        <header className="text-center mb-12">
          <div className="flex items-center justify-center space-x-3 mb-3">
            <CreditCard className="h-10 w-10 md:h-12 md:w-12 text-primary" />
            <h1 className="text-3xl md:text-4xl font-bold font-headline text-primary">
              Online Payments
            </h1>
          </div>
          <p className="text-md sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Securely pay for your selected package using PayHere.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {paymentPackages.map((pkg) => (
            <Card key={pkg.id} className="flex flex-col rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300">
              <CardHeader className="p-6">
                <div className="flex items-center space-x-3 mb-2">
                  <pkg.icon className="h-8 w-8 text-accent" />
                  <CardTitle className="text-xl md:text-2xl font-semibold">{pkg.title}</CardTitle>
                </div>
                <CardDescription className="text-sm text-muted-foreground min-h-[40px]">{pkg.description}</CardDescription>
              </CardHeader>
              <CardContent className="p-6 flex-grow space-y-4">
                <div>
                  <p className="text-3xl md:text-4xl font-bold text-foreground">{pkg.priceDisplay}</p>
                  <p className="text-xs text-muted-foreground">LKR / one-time</p>
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
                <AlertDialogTrigger asChild>
                  <Button onClick={() => handleBuyNowClick(pkg)} className="w-full text-base py-3 bg-accent hover:bg-accent/80 text-accent-foreground">
                    Buy Now
                  </Button>
                </AlertDialogTrigger>
              </CardFooter>
            </Card>
          ))}
        </div>

        {selectedPackage && (
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Your Purchase</AlertDialogTitle>
              <AlertDialogDescription>
                You are about to be redirected to PayHere to purchase the <strong>{selectedPackage.title}</strong> for <strong>{selectedPackage.priceDisplay}</strong>.
              </AlertDialogDescription>
            </AlertDialogHeader>
            
            <form ref={formRef} action={PAYHERE_CHECKOUT_URL} method="post" id="payhere-form" />

            <AlertDialogFooter>
              <AlertDialogCancel disabled={isProcessing} onClick={() => setSelectedPackage(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={proceedToPayment} disabled={isProcessing}>
                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isProcessing ? 'Processing...' : 'Proceed to PayHere'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        )}
      </div>
    </AlertDialog>
  );
}
