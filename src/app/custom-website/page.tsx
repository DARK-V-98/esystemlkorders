
"use client";

import { useState, useEffect, type FormEvent, type ChangeEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Palette, Server, Settings, Smartphone, DollarSign, Briefcase, User, Mail, FileText, BarChart3, CreditCard, Users, ShieldCheck, MapPin, DatabaseZap, FileStack } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface FeatureOption {
  id: string;
  name: string;
  description: string;
  price: number;
  icon?: React.ElementType;
}

interface FeatureCategory {
  name: string;
  description: string;
  icon: React.ElementType;
  features: FeatureOption[];
}

const PRICE_PER_PAGE = 50; // Example price per page

const FEATURE_CATEGORIES: FeatureCategory[] = [
  {
    name: "Frontend Development",
    description: "Crafting the visual and interactive aspects of your website.",
    icon: Palette,
    features: [
      { id: "ui-ux-design", name: "UI/UX Design", description: "Professional user interface and experience design.", price: 500, icon: BarChart3 },
      { id: "responsive-design", name: "Mobile Responsive Design", description: "Ensuring your site looks great on all devices.", price: 300, icon: Smartphone },
      { id: "custom-animations", name: "Custom Animations", description: "Engaging animations to enhance user experience.", price: 250 },
    ],
  },
  {
    name: "Backend Development",
    description: "Building the server-side logic and database interactions.",
    icon: Server,
    features: [
      { id: "user-accounts", name: "User Accounts & Roles", description: "User registration, login, and role management.", price: 600, icon: Users },
      { id: "api-development", name: "Custom API Development", description: "Building custom APIs for your application.", price: 700 },
      { id: "database-integration", name: "Database Integration", description: "Connecting and managing your database.", price: 400, icon: DatabaseZap },
    ],
  },
  {
    name: "E-commerce & Payments",
    description: "Features for online stores and payment processing.",
    icon: CreditCard,
    features: [
      { id: "payment-integration", name: "Payment Gateway Integration", description: "Stripe, PayPal, or other payment integrations.", price: 450 },
      { id: "shopping-cart", name: "Shopping Cart Functionality", description: "Full shopping cart and checkout system.", price: 550 },
      { id: "product-management", name: "Product Management System", description: "Admin panel to manage products.", price: 400 },
    ],
  },
  {
    name: "Additional Features & Services",
    description: "Other services to enhance your website.",
    icon: Settings,
    features: [
      { id: "seo-optimization", name: "Basic SEO Optimization", description: "Optimizing your site for search engines.", price: 200 },
      { id: "analytics-integration", name: "Analytics Integration", description: "Integrating Google Analytics or similar.", price: 150 },
      { id: "content-management", name: "Content Management System (CMS)", description: "Basic CMS for easy content updates.", price: 800 },
      { id: "api-weather-map", name: "Weather/Map API Integration", description: "Using external APIs like weather or maps.", price: 250, icon: MapPin },
      { id: "database-migration", name: "Database Migration Support", description: "Assistance with migrating existing databases.", price: 500, icon: DatabaseZap },
    ],
  },
];

interface CustomerDetails {
  name: string;
  email: string;
  projectName: string;
  projectDescription: string;
  numberOfPages: string; // Changed to string to match input value, parse to number when calculating
}

export default function MakeCustomWebsitePage() {
  const [selectedFeatures, setSelectedFeatures] = useState<Record<string, boolean>>({});
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [customerDetails, setCustomerDetails] = useState<CustomerDetails>({
    name: '',
    email: '',
    projectName: '',
    projectDescription: '',
    numberOfPages: '1', // Default to 1 page
  });
  const { toast } = useToast();

  useEffect(() => {
    let currentTotal = 0;
    FEATURE_CATEGORIES.forEach(category => {
      category.features.forEach(feature => {
        if (selectedFeatures[feature.id]) {
          currentTotal += feature.price;
        }
      });
    });
    const numPages = parseInt(customerDetails.numberOfPages, 10);
    if (!isNaN(numPages) && numPages > 0) {
      currentTotal += numPages * PRICE_PER_PAGE;
    }
    setTotalPrice(currentTotal);
  }, [selectedFeatures, customerDetails.numberOfPages]);

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
    const selectedFeatureDetails = FEATURE_CATEGORIES.flatMap(category => 
      category.features.filter(feature => selectedFeatures[feature.id])
    );

    const numPages = parseInt(customerDetails.numberOfPages, 10);

    if (selectedFeatureDetails.length === 0 && (isNaN(numPages) || numPages <= 0)) {
      toast({
        variant: "destructive",
        title: "No Features or Pages Selected",
        description: "Please select at least one feature or specify the number of pages for your custom website.",
      });
      return;
    }
     if (!customerDetails.name || !customerDetails.email || !customerDetails.projectName) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill in your name, email, and project name.",
      });
      return;
    }
    if (isNaN(numPages) || numPages < 0) {
      toast({
        variant: "destructive",
        title: "Invalid Number of Pages",
        description: "Please enter a valid number for pages (0 or more).",
      });
      return;
    }


    console.log("Custom Website Request Submitted:");
    console.log("Customer Details:", { ...customerDetails, numberOfPages: numPages });
    console.log("Selected Features:", selectedFeatureDetails);
    console.log("Total Estimated Price: $", totalPrice);

    // TODO: Implement actual submission to backend (e.g., Firestore)
    // Example: await createCustomOrder({ ...customerDetails, numberOfPages: numPages, features: selectedFeatureDetails, totalPrice });

    toast({
      title: "Request Submitted!",
      description: `Your custom website request for "${customerDetails.projectName}" has been submitted. Total: $${totalPrice}. We'll be in touch!`,
    });

    // Reset form
    setSelectedFeatures({});
    setCustomerDetails({ name: '', email: '', projectName: '', projectDescription: '', numberOfPages: '1' });
  };

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-8">
      <header className="mb-8 text-center md:text-left">
        <div className="flex items-center justify-center md:justify-start space-x-3 mb-2">
          <Palette className="h-10 w-10 text-primary" />
          <h1 className="text-4xl font-bold font-headline text-primary">
            Build Your Custom Website
          </h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Select the features you need and get an instant price estimate.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-10">
        <Card className="shadow-lg rounded-xl overflow-hidden">
          <CardHeader className="bg-primary/5">
            <div className="flex items-center space-x-3">
              <Briefcase className="h-6 w-6 text-primary" />
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
              />
            </div>
            <div>
              <Label htmlFor="numberOfPages" className="font-semibold">Number of Pages</Label>
              <div className="flex items-center mt-1">
                <FileStack className="h-5 w-5 text-muted-foreground mr-2" />
                <Input 
                  id="numberOfPages" 
                  name="numberOfPages" 
                  type="number"
                  min="0"
                  value={customerDetails.numberOfPages}
                  onChange={handleInputChange}
                  placeholder="e.g., 5" 
                  required 
                />
              </div>
               <p className="text-xs text-muted-foreground mt-1">Each page costs an additional ${PRICE_PER_PAGE}.</p>
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
              />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg rounded-xl overflow-hidden">
          <CardHeader className="bg-primary/5">
             <div className="flex items-center space-x-3">
                <Settings className="h-6 w-6 text-primary" />
                <CardTitle className="text-2xl">Select Features</CardTitle>
            </div>
            <CardDescription>Choose the components and services for your website.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Accordion type="multiple" defaultValue={FEATURE_CATEGORIES.map(cat => cat.name)} className="w-full">
              {FEATURE_CATEGORIES.map((category) => (
                <AccordionItem value={category.name} key={category.name} className="border-b last:border-b-0">
                  <AccordionTrigger className="px-6 py-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <category.icon className="h-5 w-5 text-primary" />
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
                              />
                              <div className="flex-grow">
                                <Label htmlFor={feature.id} className="font-semibold text-base flex items-center cursor-pointer">
                                  {feature.icon && <feature.icon className="h-4 w-4 mr-2 text-muted-foreground" />}
                                  {feature.name}
                                </Label>
                                <p className="text-xs text-muted-foreground mt-1">{feature.description}</p>
                              </div>
                            </div>
                            <div className="mt-auto pt-3 text-right">
                                <p className="text-lg font-semibold text-primary">${feature.price.toLocaleString()}</p>
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
                <DollarSign className="h-6 w-6 text-primary" />
                <CardTitle className="text-2xl">Estimated Total</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-5xl font-bold text-primary mb-2">
              ${totalPrice.toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground">
              This is an estimate. We'll confirm all details with you.
            </p>
          </CardContent>
          <CardFooter className="flex justify-end p-6 bg-muted/30">
            <Button type="submit" size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground text-lg px-8 py-6">
              Submit Custom Website Request
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}


