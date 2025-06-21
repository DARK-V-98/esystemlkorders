
"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { Tag, ShieldCheck, Gem, CreditCard, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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

  const merchantId = process.env.NEXT_PUBLIC_PAYHERE_MERCHANT_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

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
    if (!merchantId || !appUrl) {
      toast({
        variant: "destructive",
        title: "Configuration Error",
        description: "Payment gateway is not configured. Please contact support.",
      });
      return;
    }
    setSelectedPackage(pkg);
  };

  const orderId = generateFormattedOrderId();
  const userFirstName = user?.displayName?.split(' ')[0] || '';
  const userLastName = user?.displayName?.split(' ').slice(1).join(' ') || '';

  return (
    <AlertDialog open={!!selectedPackage} onOpenChange={(open) => !open && setSelectedPackage(null)}>
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

        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Important Security Notice</AlertTitle>
          <AlertDescription>
            For a production environment, the PayHere `hash` parameter must be generated on your server to protect your Merchant Secret. This prototype does not include server-side hash generation for simplicity. Do not deploy to production without implementing this server-side.
          </AlertDescription>
        </Alert>

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
                You are about to proceed to PayHere to purchase the <strong>{selectedPackage.title}</strong> for <strong>{selectedPackage.priceDisplay}</strong>.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <form action={PAYHERE_CHECKOUT_URL} method="post" id="payhere-form">
              {/* These values should be dynamically generated and secured */}
              <input type="hidden" name="merchant_id" value={merchantId || ''} />
              <input type="hidden" name="return_url" value={`${appUrl}/payment/success`} />
              <input type="hidden" name="cancel_url" value={`${appUrl}/payment/cancel`} />
              <input type="hidden" name="notify_url" value={`${appUrl}/api/payment-notify`} />

              {/* Order & Item Details */}
              <input type="hidden" name="order_id" value={orderId} />
              <input type="hidden" name="items" value={selectedPackage.title} />
              <input type="hidden" name="currency" value="LKR" />
              <input type="hidden" name="amount" value={selectedPackage.priceLKR} />

              {/* Customer Details (pre-filled) */}
              <input type="hidden" name="first_name" value={userFirstName} />
              <input type="hidden" name="last_name" value={userLastName} />
              <input type="hidden" name="email" value={user?.email || ''} />
              <input type="hidden" name="phone" value="" />
              <input type="hidden" name="address" value="" />
              <input type="hidden" name="city" value="" />
              <input type="hidden" name="country" value="Sri Lanka" />
              
              {/* HASH - IMPORTANT: Generate this on the server-side in production */}
              {/* <input type="hidden" name="hash" value={generatedHash} /> */}
            </form>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction asChild>
                <button type="submit" form="payhere-form">Proceed to PayHere</button>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        )}
      </div>
    </AlertDialog>
  );
}
