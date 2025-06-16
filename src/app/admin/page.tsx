
"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, UploadCloud, AlertTriangle, CheckCircle2 } from "lucide-react";
import { db } from '@/lib/firebase';
import { collection, doc, setDoc, writeBatch } from 'firebase/firestore';
import { FEATURE_CATEGORIES, PRICE_PER_PAGE, type FeatureCategory } from '@/app/custom-website/page'; // Import from custom-website page

// In a real app, you would protect this page based on user roles.
// import { useAuth } from '@/contexts/auth-context';
// import { useRouter } from 'next/navigation';

const FEATURES_COLLECTION = 'siteFeaturesConfig'; // Firestore collection for feature categories
const GLOBAL_PRICING_COLLECTION = 'siteGlobalConfig'; // Firestore collection for global settings like page price
const PAGE_PRICE_DOC_ID = 'pagePricing'; // Document ID for page price

export default function AdminConsolePage() {
  const [isSeeding, setIsSeeding] = useState(false);
  const { toast } = useToast();
  // const { user, loading } = useAuth(); // For role-based access later
  // const router = useRouter();

  // useEffect(() => { // Example for role protection
  //   if (!loading && (!user || user.role !== 'admin')) {
  //     toast({ variant: 'destructive', title: 'Access Denied', description: 'You do not have permission to view this page.' });
  //     router.push('/menu');
  //   }
  // }, [user, loading, router, toast]);

  const seedDataToFirestore = async () => {
    setIsSeeding(true);
    toast({
      title: "Seeding Data...",
      description: "Attempting to write pricing configuration to Firestore.",
    });

    try {
      const batch = writeBatch(db);

      // Seed feature categories
      FEATURE_CATEGORIES.forEach((category: FeatureCategory) => {
        // We use category.id as the document ID
        const categoryDocRef = doc(db, FEATURES_COLLECTION, category.id);
        // Firestore cannot store functions (React components for icons), so we store iconName (string)
        // The FEATURE_CATEGORIES constant should already be structured with iconName
        const categoryData = {
          name: category.name,
          description: category.description,
          iconName: category.iconName,
          features: category.features.map(feature => ({
            id: feature.id,
            name: feature.name,
            description: feature.description,
            price: feature.price,
            iconName: feature.iconName || null, // Ensure iconName is present or null
          })),
        };
        batch.set(categoryDocRef, categoryData);
      });

      // Seed global page price
      const pagePriceDocRef = doc(db, GLOBAL_PRICING_COLLECTION, PAGE_PRICE_DOC_ID);
      batch.set(pagePriceDocRef, { pricePerPage: PRICE_PER_PAGE });

      await batch.commit();

      toast({
        title: "Seeding Successful!",
        description: "Pricing data has been written to Firestore.",
        action: <CheckCircle2 className="h-5 w-5 text-green-500" />,
      });
    } catch (error) {
      console.error("Error seeding data to Firestore:", error);
      let errorMessage = "An unknown error occurred.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      toast({
        variant: "destructive",
        title: "Seeding Failed",
        description: errorMessage,
        action: <AlertTriangle className="h-5 w-5 text-red-500" />,
      });
    } finally {
      setIsSeeding(false);
    }
  };
  
  // if (loading || (!user || user.role !== 'admin')) { // Example loading/auth check
  //   return <div className="container mx-auto p-8 flex justify-center items-center min-h-[calc(100vh-100px)]"><UploadCloud className="h-16 w-16 animate-pulse text-primary" /> <p className="ml-4">Loading admin console...</p></div>;
  // }

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-8">
      <header className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <ShieldCheck className="h-10 w-10 text-primary" />
          <h1 className="text-4xl font-bold font-headline text-primary">
            Admin Console
          </h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Manage application settings and configurations.
        </p>
      </header>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl flex items-center">
            <UploadCloud className="mr-2 h-6 w-6 text-accent" />
            Pricing Data Management
          </CardTitle>
          <CardDescription>
            Use this section to initialize or update the core pricing data in Firestore.
            This data is used by the "Make Custom Website" page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Click the button below to seed the initial feature categories and page pricing
            to the Firestore database. This uses the hardcoded values currently in
            the application code (`src/app/custom-website/page.tsx`).
          </p>
          <p className="text-sm font-medium text-destructive-foreground bg-destructive/10 border border-destructive p-3 rounded-md flex items-start">
            <AlertTriangle className="h-5 w-5 mr-2 shrink-0 mt-0.5" />
            <span>
              <strong>Warning:</strong> Clicking this button will overwrite any existing data in the
              `{FEATURES_COLLECTION}` and `{GLOBAL_PRICING_COLLECTION}/{PAGE_PRICE_DOC_ID}` paths in Firestore
              with the current application defaults.
            </span>
          </p>
          <Button
            onClick={seedDataToFirestore}
            disabled={isSeeding}
            size="lg"
            className="bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            {isSeeding ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current mr-2"></div>
                Seeding Data...
              </>
            ) : (
              <>
                <UploadCloud className="mr-2 h-5 w-5" />
                Seed/Update Pricing Data in Firestore
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Placeholder for future tabs to edit prices */}
      {/* 
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Edit Prices</CardTitle>
          <CardDescription>
            (Future implementation) Tab menu to edit individual feature prices and page price.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Price editing interface will be here.</p>
        </CardContent>
      </Card>
      */}
    </div>
  );
}
