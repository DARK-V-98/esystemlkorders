
"use client";

import { useState, useEffect, type FormEvent, type ChangeEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { DynamicIcon } from '@/components/icons';
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from '@/contexts/currency-context';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import type { FeatureCategory, FeatureOption, Price, CustomerDetailsForm as CustomerFormDetails, SelectedFeatureInOrder, Order } from '@/types'; // Adjusted import
import { Loader2 } from 'lucide-react';
import { generateFormattedOrderId } from '@/lib/utils'; // Import the new ID generator

// Default data (could be fetched from Firestore in a real app for admin management)
export const DEFAULT_PRICE_PER_PAGE: Price = { usd: 50, lkr: 15000 };

export const DEFAULT_FEATURE_CATEGORIES: FeatureCategory[] = [
  {
    id: "frontend-development",
    name: "Frontend Development",
    description: "Crafting the visual and interactive aspects of your website.",
    iconName: "Palette",
    features: [
      { id: "ui-ux-design", name: "UI/UX Design", description: "Professional user interface and experience design.", price: { usd: 500, lkr: 150000 }, iconName: "BarChart3" },
      { id: "responsive-design", name: "Mobile Responsive Design", description: "Ensuring your site looks great on all devices.", price: { usd: 300, lkr: 90000 }, iconName: "Smartphone" },
      { id: "custom-animations", name: "Custom Animations", description: "Engaging animations to enhance user experience.", price: { usd: 250, lkr: 75000 } },
    ],
  },
  {
    id: "backend-development",
    name: "Backend Development",
    description: "Building the server-side logic and database interactions.",
    iconName: "Server",
    features: [
      { id: "user-accounts", name: "User Accounts & Roles", description: "User registration, login, and role management.", price: { usd: 600, lkr: 180000 }, iconName: "Users" },
      { id: "api-development", name: "Custom API Development", description: "Building custom APIs for your application.", price: { usd: 700, lkr: 210000 } },
      { id: "database-integration", name: "Database Integration", description: "Connecting and managing your database.", price: { usd: 400, lkr: 120000 }, iconName: "DatabaseZap" },
    ],
  },
  {
    id: "ecommerce-payments",
    name: "E-commerce & Payments",
    description: "Features for online stores and payment processing.",
    iconName: "CreditCard",
    features: [
      { id: "payment-integration", name: "Payment Gateway Integration", description: "Stripe, PayPal, or other payment integrations.", price: { usd: 450, lkr: 135000 } },
      { id: "shopping-cart", name: "Shopping Cart Functionality", description: "Full shopping cart and checkout system.", price: { usd: 550, lkr: 165000 } },
      { id: "product-management", name: "Product Management System", description: "Admin panel to manage products.", price: { usd: 400, lkr: 120000 } },
    ],
  },
  {
    id: "additional-services",
    name: "Additional Features & Services",
    description: "Other services to enhance your website.",
    iconName: "Settings",
    features: [
      { id: "seo-optimization", name: "Basic SEO Optimization", description: "Optimizing your site for search engines.", price: { usd: 200, lkr: 60000 } },
      { id: "analytics-integration", name: "Analytics Integration", description: "Integrating Google Analytics or similar.", price: { usd: 150, lkr: 45000 } },
      { id: "content-management", name: "Content Management System (CMS)", description: "Basic CMS for easy content updates.", price: { usd: 800, lkr: 240000 } },
      { id: "api-weather-map", name: "Weather/Map API Integration", description: "Using external APIs like weather or maps.", price: { usd: 250, lkr: 75000 }, iconName: "MapPin" },
      { id: "database-migration", name: "Database Migration Support", description: "Assistance with migrating existing databases.", price: { usd: 500, lkr: 150000 }, iconName: "DatabaseZap" },
    ],
  },
];


export default function MakeCustomWebsitePage() {
  const [featureCategories, setFeatureCategories] = useState<FeatureCategory[]>(DEFAULT_FEATURE_CATEGORIES);
  const [pricePerPage, setPricePerPage] = useState<Price>(DEFAULT_PRICE_PER_PAGE);
  // In a real app, you'd fetch featureCategories and pricePerPage from Firestore here
  // For now, we use the defaults.

  const [selectedFeatures, setSelectedFeatures] = useState<Record<string, boolean>>({});
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [customerDetails, setCustomerDetails] = useState<CustomerFormDetails>({
    name: '',
    email: '',
    projectName: '',
    projectDescription: '',
    numberOfPages: '1',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { selectedCurrency, currencySymbol } = useCurrency();
  const { user } = useAuth();

  useEffect(() => {
    let currentTotal = 0;
    featureCategories.forEach(category => {
      category.features.forEach(feature => {
        if (selectedFeatures[feature.id]) {
          currentTotal += feature.price[selectedCurrency];
        }
      });
    });
    const numPages = parseInt(customerDetails.numberOfPages, 10);
    if (!isNaN(numPages) && numPages > 0) {
      currentTotal += numPages * pricePerPage[selectedCurrency];
    }
    setTotalPrice(currentTotal);
  }, [selectedFeatures, customerDetails.numberOfPages, selectedCurrency, featureCategories, pricePerPage]);

  const handleFeatureToggle = (featureId: string) => {
    setSelectedFeatures(prev => ({
      ...prev,
      [featureId]: !prev[featureId],
    }));
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCustomerDetails(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "Please log in to submit a custom website request.",
      });
      setIsSubmitting(false);
      return;
    }

    const selectedFeatureDetails: SelectedFeatureInOrder[] = featureCategories.flatMap(category =>
      category.features
        .filter(feature => selectedFeatures[feature.id])
        .map(feature => ({
          id: feature.id,
          name: feature.name,
          price: feature.price[selectedCurrency],
          currency: selectedCurrency,
          currencySymbol: currencySymbol,
        }))
    );

    const numPages = parseInt(customerDetails.numberOfPages, 10);

    if (selectedFeatureDetails.length === 0 && (isNaN(numPages) || numPages <= 0)) {
      toast({
        variant: "destructive",
        title: "No Features or Pages Selected",
        description: "Please select at least one feature or specify a valid number of pages.",
      });
      setIsSubmitting(false);
      return;
    }
    if (!customerDetails.name || !customerDetails.email || !customerDetails.projectName) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill in your name, email, and project name.",
      });
      setIsSubmitting(false);
      return;
    }
    if (isNaN(numPages) || numPages < 0) { // Allow 0 pages if only features are selected
      toast({
        variant: "destructive",
        title: "Invalid Number of Pages",
        description: "Please enter a valid number for pages (0 or more).",
      });
      setIsSubmitting(false);
      return;
    }
    
    const formattedOrderId = generateFormattedOrderId();

    const orderData: Omit<Order, 'id' | 'createdDate' | 'deadline'> & { createdDate: any } = {
      formattedOrderId: formattedOrderId,
      clientName: customerDetails.name,
      projectName: customerDetails.projectName,
      projectType: 'Custom Build',
      status: 'Pending',
      description: customerDetails.projectDescription,
      requestedFeatures: selectedFeatureDetails,
      contactEmail: customerDetails.email,
      budget: totalPrice,
      numberOfPages: numPages,
      selectedCurrency: selectedCurrency,
      currencySymbol: currencySymbol,
      userEmail: user.email || 'N/A', 
      createdDate: serverTimestamp(),
    };

    try {
      // Firestore will auto-generate the document ID ('id' in our Order type)
      await addDoc(collection(db, "orders"), orderData);
      toast({
        title: "Request Submitted!",
        description: `Your custom website request for "${customerDetails.projectName}" (Order ID: ${formattedOrderId}) has been submitted. Total (${selectedCurrency.toUpperCase()}): ${currencySymbol}${totalPrice.toLocaleString()}. We'll be in touch!`,
      });
      setSelectedFeatures({});
      setCustomerDetails({ name: '', email: '', projectName: '', projectDescription: '', numberOfPages: '1' });
    } catch (error) {
      console.error("Error submitting custom website request:", error);
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: "There was an error submitting your request. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-8">
      {/* Combined Header and Top Right Total Display */}
      <div className="relative">
        <div className="flex flex-col md:flex-row justify-between md:items-start gap-6 mb-6">
          <header className="flex-grow text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start space-x-3 mb-2">
              <DynamicIcon name="Palette" className="h-10 w-10 text-primary" />
              <h1 className="text-4xl font-bold font-headline text-primary">
                Build Your Custom Website
              </h1>
            </div>
            <p className="text-muted-foreground text-lg">
              Select the features you need and get an instant price estimate in {selectedCurrency.toUpperCase()}.
            </p>
          </header>

          {/* Top Right Sticky Total - Visible on MD and up */}
          <div className="hidden md:block p-4 shadow-lg rounded-xl bg-card border border-border sticky top-6 z-20 self-start md:min-w-[280px]">
            <div className="flex items-center space-x-2 mb-1">
              <DynamicIcon name="DollarSign" className="h-5 w-5 text-primary" />
              <p className="text-sm font-semibold text-muted-foreground">Estimated Total ({selectedCurrency.toUpperCase()})</p>
            </div>
            <p className="text-3xl font-bold text-primary text-right">
              {currencySymbol}{totalPrice.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-1 text-right">As you select options</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10">
          <Card className="shadow-lg rounded-xl overflow-hidden">
            <CardHeader className="bg-primary/5">
              <div className="flex items-center space-x-3">
                <DynamicIcon name="Briefcase" className="h-6 w-6 text-primary" />
                <CardTitle className="text-2xl">Your Project Details</CardTitle>
              </div>
              <CardDescription>Tell us about your project and how to reach you.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="projectName" className="font-semibold">Project Name</Label>
                <Input
                  id="projectName"
                  name="projectName"
                  value={customerDetails.projectName}
                  onChange={handleInputChange}
                  placeholder="e.g., My Awesome Startup Site"
                  required
                  className="mt-1"
                  disabled={isSubmitting}
                />
              </div>
               <div>
                <Label htmlFor="name" className="font-semibold">Your Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={customerDetails.name}
                  onChange={handleInputChange}
                  placeholder="John Doe"
                  required
                  className="mt-1"
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="email" className="font-semibold">Your Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={customerDetails.email}
                  onChange={handleInputChange}
                  placeholder="you@example.com"
                  required
                  className="mt-1"
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="numberOfPages" className="font-semibold">Number of Pages</Label>
                <div className="flex items-center mt-1">
                  <DynamicIcon name="FileStack" className="h-5 w-5 text-muted-foreground mr-2" />
                  <Input
                    id="numberOfPages"
                    name="numberOfPages"
                    type="number"
                    min="0"
                    value={customerDetails.numberOfPages}
                    onChange={handleInputChange}
                    placeholder="e.g., 5"
                    required
                    disabled={isSubmitting}
                  />
                </div>
                 <p className="text-xs text-muted-foreground mt-1">
                   Each page costs an additional {currencySymbol}{pricePerPage[selectedCurrency].toLocaleString()}.
                 </p>
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="projectDescription" className="font-semibold">Project Description</Label>
                <Textarea
                  id="projectDescription"
                  name="projectDescription"
                  value={customerDetails.projectDescription}
                  onChange={handleInputChange}
                  placeholder="Briefly describe your website, its goals, and any specific requirements."
                  rows={4}
                  className="mt-1"
                  disabled={isSubmitting}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg rounded-xl overflow-hidden">
            <CardHeader className="bg-primary/5">
               <div className="flex items-center space-x-3">
                  <DynamicIcon name="Settings" className="h-6 w-6 text-primary" />
                  <CardTitle className="text-2xl">Select Features</CardTitle>
              </div>
              <CardDescription>Choose the components and services for your website.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Accordion type="multiple" defaultValue={featureCategories.map(cat => cat.id)} className="w-full">
                {featureCategories.map((category) => (
                  <AccordionItem value={category.id} key={category.id} className="border-b last:border-b-0">
                    <AccordionTrigger className="px-6 py-4 hover:bg-muted/50 transition-colors" disabled={isSubmitting}>
                      <div className="flex items-center space-x-3">
                        <DynamicIcon name={category.iconName} className="h-5 w-5 text-primary" />
                        <span className="text-lg font-medium">{category.name}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-2 sm:px-4 md:px-6 py-4 bg-background">
                      <p className="text-sm text-muted-foreground mb-4 ml-1">{category.description}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {category.features.map((feature) => (
                          <Card key={feature.id} className={`transition-all duration-200 rounded-lg overflow-hidden ${selectedFeatures[feature.id] ? 'border-primary ring-2 ring-primary shadow-md' : 'hover:shadow-md'}`}>
                            <CardContent className="p-4 flex flex-col h-full">
                              <div className="flex items-start space-x-3">
                                <Checkbox
                                  id={feature.id}
                                  checked={!!selectedFeatures[feature.id]}
                                  onCheckedChange={() => handleFeatureToggle(feature.id)}
                                  className="mt-1 shrink-0"
                                  aria-label={`Select ${feature.name}`}
                                  disabled={isSubmitting}
                                />
                                <div className="flex-grow">
                                  <Label htmlFor={feature.id} className="font-semibold text-base flex items-center cursor-pointer">
                                    {feature.iconName && <DynamicIcon name={feature.iconName} className="h-4 w-4 mr-2 text-muted-foreground" />}
                                    {feature.name}
                                  </Label>
                                  <p className="text-xs text-muted-foreground mt-1">{feature.description}</p>
                                </div>
                              </div>
                              <div className="mt-auto pt-3 text-right">
                                  <p className="text-lg font-semibold text-primary">
                                    {currencySymbol}{feature.price[selectedCurrency].toLocaleString()}
                                  </p>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>

          <Card className="shadow-lg rounded-xl overflow-hidden sticky bottom-4 z-10 backdrop-blur-sm bg-card/80">
            <CardHeader>
              <div className="flex items-center space-x-3">
                  <DynamicIcon name="DollarSign" className="h-6 w-6 text-primary" />
                  <CardTitle className="text-2xl">Estimated Total ({selectedCurrency.toUpperCase()})</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-5xl font-bold text-primary mb-2">
                {currencySymbol}{totalPrice.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">
                This is an estimate. We'll confirm all details with you.
              </p>
            </CardContent>
            <CardFooter className="flex justify-end p-6 bg-muted/30">
              <Button type="submit" size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground text-lg px-8 py-6" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                Submit Custom Website Request
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </div>
  );
}
