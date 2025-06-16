
"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, UploadCloud, AlertTriangle, CheckCircle2, Edit } from "lucide-react";
import { db } from '@/lib/firebase';
import { doc, writeBatch } from 'firebase/firestore';
import { FEATURE_CATEGORIES, PRICE_PER_PAGE, type FeatureCategory, type Price as FeaturePrice } from '@/app/custom-website/page';

const FEATURES_COLLECTION = 'siteFeaturesConfig';
const GLOBAL_PRICING_COLLECTION = 'siteGlobalConfig';
const PAGE_PRICE_DOC_ID = 'pagePricing';

export default function AdminConsolePage() {
  const [isSeeding, setIsSeeding] = useState(false);
  const { toast } = useToast();

  const seedDataToFirestore = async () => {
    setIsSeeding(true);
    toast({
      title: "Seeding Data...",
      description: "Attempting to write default pricing configuration to Firestore.",
    });

    try {
      const batch = writeBatch(db);

      FEATURE_CATEGORIES.forEach((category: FeatureCategory) => {
        const categoryDocRef = doc(db, FEATURES_COLLECTION, category.id);
        const categoryData = {
          name: category.name,
          description: category.description,
          iconName: category.iconName,
          features: category.features.map(feature => ({
            id: feature.id,
            name: feature.name,
            description: feature.description,
            price: feature.price, // { usd: number, lkr: number }
            iconName: feature.iconName || null,
          })),
        };
        batch.set(categoryDocRef, categoryData);
      });

      const pagePriceDocRef = doc(db, GLOBAL_PRICING_COLLECTION, PAGE_PRICE_DOC_ID);
      batch.set(pagePriceDocRef, { pricePerPage: PRICE_PER_PAGE });

      await batch.commit();

      toast({
        title: "Seeding Successful!",
        description: "Default dual currency pricing data has been written to Firestore.",
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

      <Tabs defaultValue="seed-data" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-[400px] mb-6">
          <TabsTrigger value="seed-data">
            <UploadCloud className="mr-2 h-4 w-4" /> Seed/Update Defaults
          </TabsTrigger>
          <TabsTrigger value="live-editor">
            <Edit className="mr-2 h-4 w-4" /> Live Price Editor
          </TabsTrigger>
        </TabsList>

        <TabsContent value="seed-data">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl flex items-center">
                <UploadCloud className="mr-2 h-6 w-6 text-accent" />
                Seed Application Defaults to Firestore
              </CardTitle>
              <CardDescription>
                Use this section to initialize or overwrite the pricing data in Firestore
                with the hardcoded default values from the application code (`src/app/custom-website/page.tsx`).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                This operation is useful for initial setup or for resetting the Firestore data
                to the application's predefined defaults (including both USD and LKR prices).
              </p>
              <p className="text-sm font-medium text-destructive-foreground bg-destructive/10 border border-destructive p-3 rounded-md flex items-start">
                <AlertTriangle className="h-5 w-5 mr-2 shrink-0 mt-0.5" />
                <span>
                  <strong>Warning:</strong> Clicking this button will overwrite any existing data in the
                  `{FEATURES_COLLECTION}` and `{GLOBAL_PRICING_COLLECTION}/{PAGE_PRICE_DOC_ID}` paths in Firestore.
                  Any manual changes made via the "Live Price Editor" (if implemented) will be lost for these paths.
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
                    Seeding Defaults...
                  </>
                ) : (
                  <>
                    <UploadCloud className="mr-2 h-5 w-5" />
                    Seed/Update Default Pricing
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="live-editor">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl flex items-center">
                <Edit className="mr-2 h-6 w-6 text-accent" />
                Live Price Editor (Coming Soon)
              </CardTitle>
              <CardDescription>
                This section will allow direct editing of feature prices and page prices
                (USD and LKR) stored in Firestore.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                The interface to fetch, display, and update live pricing data from Firestore will be implemented here.
              </p>
              {/* Placeholder for future forms/tables to edit prices */}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
    