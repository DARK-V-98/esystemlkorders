
"use client";

import { useState, useEffect, type ChangeEvent, Fragment } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { 
  ShieldCheck, UploadCloud, AlertTriangle, CheckCircle2, Edit, Save, Loader2, DollarSign, 
  ListChecks, ListOrdered, CheckSquare, Search, ExternalLink, XCircle, Settings, Clock, 
  MoreVertical, PauseCircle, PlayCircle, Trash2 
} from "lucide-react";
import { db } from '@/lib/firebase';
import { collection, doc, getDocs, getDoc, writeBatch, updateDoc, setDoc, Timestamp, query, orderBy as firestoreOrderBy } from 'firebase/firestore';
import { DEFAULT_FEATURE_CATEGORIES, DEFAULT_PRICE_PER_PAGE, type FeatureCategory, type FeatureOption, type Price } from '@/app/custom-website/page';
import { DynamicIcon } from '@/components/icons';
import type { Order, OrderStatus } from '@/types';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { formatDate } from "@/lib/data";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


const FEATURES_COLLECTION = 'siteFeaturesConfig';
const GLOBAL_PRICING_COLLECTION = 'siteGlobalConfig';
const PAGE_PRICE_DOC_ID = 'pagePricing';
const ORDERS_COLLECTION = 'orders';

function LivePriceEditorContent() {
  const [liveCategories, setLiveCategories] = useState<FeatureCategory[]>([]);
  const [livePagePrice, setLivePagePrice] = useState<Price | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [savingStates, setSavingStates] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const fetchLivePrices = async () => {
    setIsLoading(true);
    try {
      const categoriesSnapshot = await getDocs(collection(db, FEATURES_COLLECTION));
      const fetchedCategoriesData: FeatureCategory[] = categoriesSnapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<FeatureCategory, 'id'>),
      }));
      
      const sortedFetchedCategories = DEFAULT_FEATURE_CATEGORIES.map(defaultCat => {
        const foundCat = fetchedCategoriesData.find(fetchedCat => fetchedCat.id === defaultCat.id);
        return foundCat || defaultCat; 
      }).filter(cat => cat);
      setLiveCategories(sortedFetchedCategories);

      const pagePriceSnap = await getDoc(doc(db, GLOBAL_PRICING_COLLECTION, PAGE_PRICE_DOC_ID));
      if (pagePriceSnap.exists()) {
        setLivePagePrice(pagePriceSnap.data().pricePerPage as Price);
      } else {
        toast({ variant: "destructive", title: "Page Price Not Found", description: "Default page pricing is not set in Firestore."});
        setLivePagePrice(DEFAULT_PRICE_PER_PAGE);
      }
    } catch (error) {
      console.error("Error fetching live prices:", error);
      toast({ variant: "destructive", title: "Fetch Error", description: "Could not load live prices from Firestore." });
      setLiveCategories(DEFAULT_FEATURE_CATEGORIES);
      setLivePagePrice(DEFAULT_PRICE_PER_PAGE);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLivePrices();
  }, []);

  const handlePagePriceInputChange = (currency: keyof Price, value: string) => {
    setLivePagePrice(prev => prev ? { ...prev, [currency]: parseFloat(value) || 0 } : null);
  };

  const handleSavePagePrice = async () => {
    if (!livePagePrice) return;
    setSavingStates(prev => ({ ...prev, pagePrice: true }));
    try {
      await setDoc(doc(db, GLOBAL_PRICING_COLLECTION, PAGE_PRICE_DOC_ID), { pricePerPage: livePagePrice });
      toast({ title: "Page Price Saved", description: "Price per page has been updated in Firestore." });
    } catch (error) {
      console.error("Error saving page price:", error);
      toast({ variant: "destructive", title: "Save Error", description: "Could not save page price." });
    } finally {
      setSavingStates(prev => ({ ...prev, pagePrice: false }));
    }
  };

  const handleFeaturePriceInputChange = (categoryIndex: number, featureIndex: number, currency: keyof Price, value: string) => {
    setLiveCategories(prevCategories => {
      const newCategories = JSON.parse(JSON.stringify(prevCategories)); 
      if (newCategories[categoryIndex]?.features[featureIndex]) {
         newCategories[categoryIndex].features[featureIndex].price[currency] = parseFloat(value) || 0;
      }
      return newCategories;
    });
  };

  const handleSaveCategoryPrices = async (categoryId: string, categoryIndex: number) => {
    const categoryToSave = liveCategories[categoryIndex];
    if (!categoryToSave) return;

    setSavingStates(prev => ({ ...prev, [categoryId]: true }));
    try {
      const categoryDocRef = doc(db, FEATURES_COLLECTION, categoryId);
      await updateDoc(categoryDocRef, { 
        features: categoryToSave.features.map(f => ({
            id: f.id,
            name: f.name,
            description: f.description,
            price: f.price,
            iconName: f.iconName || null
        }))
      });
      toast({ title: "Category Prices Saved", description: `${categoryToSave.name} prices have been updated.` });
    } catch (error) {
      console.error(`Error saving prices for category ${categoryId}:`, error);
      toast({ variant: "destructive", title: "Save Error", description: `Could not save prices for ${categoryToSave.name}.` });
    } finally {
      setSavingStates(prev => ({ ...prev, [categoryId]: false }));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
        <span>Loading live prices...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><DollarSign className="mr-2 h-5 w-5 text-primary" />Edit Price Per Page</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="pagePriceUSD">Price Per Page (USD)</Label>
            <Input 
              id="pagePriceUSD" 
              type="number" 
              value={livePagePrice?.usd ?? ''} 
              onChange={(e) => handlePagePriceInputChange('usd', e.target.value)}
              className="mt-1"
              placeholder="e.g., 50"
            />
          </div>
          <div>
            <Label htmlFor="pagePriceLKR">Price Per Page (LKR)</Label>
            <Input 
              id="pagePriceLKR" 
              type="number" 
              value={livePagePrice?.lkr ?? ''} 
              onChange={(e) => handlePagePriceInputChange('lkr', e.target.value)}
              className="mt-1"
              placeholder="e.g., 15000"
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSavePagePrice} disabled={savingStates['pagePrice']}>
            {savingStates['pagePrice'] ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Page Price
          </Button>
        </CardFooter>
      </Card>

      <h2 className="text-xl font-semibold mt-6 mb-2 flex items-center">
        <ListChecks className="mr-2 h-6 w-6 text-primary"/>
        Edit Feature Prices
      </h2>
      {liveCategories.length === 0 && !isLoading && (
        <p className="text-muted-foreground">No feature categories found in Firestore. Try seeding default data first.</p>
      )}
      <Accordion type="multiple" defaultValue={liveCategories.map(cat => cat.id)} className="w-full">
        {liveCategories.map((category, categoryIndex) => (
          <AccordionItem value={category.id} key={category.id}>
            <AccordionTrigger className="hover:bg-muted/50 transition-colors text-lg">
              <div className="flex items-center">
                {category.iconName && <DynamicIcon name={category.iconName} className="mr-2 h-5 w-5 text-primary" />}
                {category.name}
              </div>
            </AccordionTrigger>
            <AccordionContent className="bg-background/50 p-4 space-y-4">
              <p className="text-sm text-muted-foreground mb-3">{category.description}</p>
              {category.features.map((feature, featureIndex) => (
                <Card key={feature.id} className="p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold flex items-center">
                      {feature.iconName && <DynamicIcon name={feature.iconName} className="mr-2 h-4 w-4 text-muted-foreground" />}
                      {feature.name}
                    </h4>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">{feature.description}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor={`${category.id}-${feature.id}-usd`}>Price (USD)</Label>
                      <Input
                        id={`${category.id}-${feature.id}-usd`}
                        type="number"
                        value={feature.price.usd}
                        onChange={(e) => handleFeaturePriceInputChange(categoryIndex, featureIndex, 'usd', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`${category.id}-${feature.id}-lkr`}>Price (LKR)</Label>
                      <Input
                        id={`${category.id}-${feature.id}-lkr`}
                        type="number"
                        value={feature.price.lkr}
                        onChange={(e) => handleFeaturePriceInputChange(categoryIndex, featureIndex, 'lkr', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </Card>
              ))}
              <div className="mt-4 flex justify-end">
                <Button 
                  onClick={() => handleSaveCategoryPrices(category.id, categoryIndex)} 
                  disabled={savingStates[category.id]}
                  variant="outline"
                >
                  {savingStates[category.id] ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save {category.name} Prices
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}

function AdminOrdersManagement() {
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [adminSearchTerm, setAdminSearchTerm] = useState('');
  const { toast } = useToast();

  const fetchAdminOrders = async () => {
    setIsLoading(true);
    try {
      const ordersQuery = query(collection(db, ORDERS_COLLECTION), firestoreOrderBy('createdDate', 'desc'));
      const querySnapshot = await getDocs(ordersQuery);
      const fetchedOrders: Order[] = querySnapshot.docs.map(docSnapshot => {
        const data = docSnapshot.data();
        return {
          id: docSnapshot.id,
          formattedOrderId: data.formattedOrderId || docSnapshot.id,
          ...data,
          createdDate: (data.createdDate as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
          deadline: (data.deadline as Timestamp)?.toDate().toISOString(),
        } as Order;
      });
      setAllOrders(fetchedOrders);
      setFilteredOrders(fetchedOrders); 
    } catch (error) {
      console.error("Error fetching orders for admin:", error);
      toast({ variant: "destructive", title: "Fetch Error", description: "Could not load orders." });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminOrders();
  }, []);

  useEffect(() => {
    if (adminSearchTerm === '') {
      setFilteredOrders(allOrders);
    } else {
      setFilteredOrders(
        allOrders.filter(order =>
          order.formattedOrderId.toLowerCase().includes(adminSearchTerm.toLowerCase())
        )
      );
    }
  }, [adminSearchTerm, allOrders]);


  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus, formattedOrderId: string) => {
    setUpdatingOrderId(orderId); 
    try {
      const orderDocRef = doc(db, ORDERS_COLLECTION, orderId);
      await updateDoc(orderDocRef, { status: newStatus });
      toast({ title: "Order Status Updated", description: `Order ${formattedOrderId} status changed to ${newStatus}.` });
      
      const updatedOrders = allOrders.map(o => o.id === orderId ? {...o, status: newStatus} : o);
      setAllOrders(updatedOrders);
      setFilteredOrders(
        updatedOrders.filter(order =>
          order.formattedOrderId.toLowerCase().includes(adminSearchTerm.toLowerCase()) || adminSearchTerm === ''
        )
      );

    } catch (error) {
      console.error(`Error updating order ${formattedOrderId} to ${newStatus}:`, error);
      toast({ variant: "destructive", title: "Update Error", description: `Could not update order ${formattedOrderId}.` });
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const availableActions: Array<{
    label: string;
    newStatus: OrderStatus;
    icon: React.ElementType;
    className?: string;
    allowedCurrentStatuses?: OrderStatus[]; // If undefined, allowed for most active states
  }> = [
    { label: "Mark as In Progress", newStatus: "In Progress", icon: PlayCircle, allowedCurrentStatuses: ["Pending", "Suspended", "Developing", "Waiting for Payment", "Review"] },
    { label: "Mark as Developing", newStatus: "Developing", icon: Settings, allowedCurrentStatuses: ["In Progress", "Waiting for Payment", "Suspended", "Review"] },
    { label: "Request Payment", newStatus: "Waiting for Payment", icon: Clock, allowedCurrentStatuses: ["In Progress", "Developing", "Suspended", "Review"] },
    { label: "Send for Review", newStatus: "Review", icon: ListChecks, allowedCurrentStatuses: ["In Progress", "Developing"] },
    { label: "Mark as Completed", newStatus: "Completed", icon: CheckCircle2, className:"text-green-600", allowedCurrentStatuses: ["In Progress", "Developing", "Waiting for Payment", "Review"] },
    { label: "Suspend Project", newStatus: "Suspended", icon: PauseCircle, className:"text-orange-600", allowedCurrentStatuses: ["In Progress", "Developing", "Waiting for Payment", "Review"] },
    { label: "Cancel Order", newStatus: "Cancelled", icon: Trash2, className:"text-red-600", allowedCurrentStatuses: ["Pending", "In Progress", "Developing", "Waiting for Payment", "Review", "Suspended"] },
    { label: "Reject Order", newStatus: "Rejected", icon: XCircle, className:"text-pink-700", allowedCurrentStatuses: ["Pending"] },
  ];
  
  const terminalStatuses: OrderStatus[] = ["Completed", "Cancelled", "Rejected"];


  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
        <span>Loading orders...</span>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex-grow">
                <CardTitle className="flex items-center"><ListOrdered className="mr-2 h-5 w-5 text-primary" />Manage Client Orders</CardTitle>
                <CardDescription>Review and update project order statuses.</CardDescription>
            </div>
            <div className="relative w-full sm:w-auto sm:max-w-xs">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                type="search"
                placeholder="Search by Order ID..."
                value={adminSearchTerm}
                onChange={(e) => setAdminSearchTerm(e.target.value)}
                className="pl-8 w-full"
                aria-label="Search orders by ID"
                />
            </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredOrders.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            {adminSearchTerm ? `No orders found matching "${adminSearchTerm}".` : "No orders found."}
            </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Client Name</TableHead>
                  <TableHead>Project Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.formattedOrderId}</TableCell>
                    <TableCell>{order.clientName}</TableCell>
                    <TableCell>{order.projectName}</TableCell>
                    <TableCell><OrderStatusBadge status={order.status} /></TableCell>
                    <TableCell>{formatDate(order.createdDate, 'PPp')}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/orders/${order.id}`}>
                          View <ExternalLink className="ml-1.5 h-3 w-3" />
                        </Link>
                      </Button>
                      {!terminalStatuses.includes(order.status) && (
                        <>
                          {order.status === 'Pending' && (
                            <>
                              <Button 
                                size="sm" 
                                onClick={() => handleUpdateStatus(order.id, "In Progress", order.formattedOrderId)}
                                disabled={updatingOrderId === order.id}
                                className="bg-green-500 hover:bg-green-600"
                              >
                                {updatingOrderId === order.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckSquare className="mr-1.5 h-4 w-4" />}
                                Confirm
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => handleUpdateStatus(order.id, "Rejected", order.formattedOrderId)}
                                disabled={updatingOrderId === order.id}
                                className="bg-pink-700 hover:bg-pink-800"
                              >
                                {updatingOrderId === order.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-1.5 h-4 w-4" />}
                                Reject
                              </Button>
                            </>
                          )}
                          {order.status !== 'Pending' && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" disabled={updatingOrderId === order.id}>
                                  {updatingOrderId === order.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-4 w-4" />}
                                   <span className="sr-only">Update Status</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {availableActions
                                  .filter(action => action.newStatus !== order.status) // Don't show current status as an option
                                  .filter(action => action.allowedCurrentStatuses?.includes(order.status) && action.newStatus !== "Rejected") // Filter for allowed transitions
                                  .map(action => (
                                  <DropdownMenuItem
                                    key={action.newStatus}
                                    onClick={() => handleUpdateStatus(order.id, action.newStatus, order.formattedOrderId)}
                                    disabled={updatingOrderId === order.id}
                                    className={action.className}
                                  >
                                    <action.icon className="mr-2 h-4 w-4" />
                                    {action.label}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


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

      DEFAULT_FEATURE_CATEGORIES.forEach((category: FeatureCategory) => {
        const categoryDocRef = doc(db, FEATURES_COLLECTION, category.id);
        const categoryData = {
          name: category.name,
          description: category.description,
          iconName: category.iconName,
          features: category.features.map(feature => ({
            id: feature.id,
            name: feature.name,
            description: feature.description,
            price: feature.price, 
            iconName: feature.iconName || null,
          })),
        };
        batch.set(categoryDocRef, categoryData);
      });

      const pagePriceDocRef = doc(db, GLOBAL_PRICING_COLLECTION, PAGE_PRICE_DOC_ID);
      batch.set(pagePriceDocRef, { pricePerPage: DEFAULT_PRICE_PER_PAGE });

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
          Manage application settings, pricing, and orders.
        </p>
      </header>

      <Tabs defaultValue="manage-orders" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 mb-6">
          <TabsTrigger value="manage-orders">
            <ListOrdered className="mr-2 h-4 w-4" /> Manage Orders
          </TabsTrigger>
          <TabsTrigger value="live-editor">
            <Edit className="mr-2 h-4 w-4" /> Live Price Editor
          </TabsTrigger>
          <TabsTrigger value="seed-data">
            <UploadCloud className="mr-2 h-4 w-4" /> Seed/Update Defaults
          </TabsTrigger>
        </TabsList>

        <TabsContent value="manage-orders">
           <AdminOrdersManagement />
        </TabsContent>
        
        <TabsContent value="live-editor">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl flex items-center">
                <Edit className="mr-2 h-6 w-6 text-accent" />
                Live Price Editor
              </CardTitle>
              <CardDescription>
                Directly edit feature prices and page prices (USD and LKR) stored in Firestore.
                Changes made here will reflect on the "Make Custom Website" page.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LivePriceEditorContent />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seed-data">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl flex items-center">
                <UploadCloud className="mr-2 h-6 w-6 text-accent" />
                Seed Application Defaults to Firestore
              </CardTitle>
              <CardDescription>
                Use this section to initialize or overwrite the pricing data in Firestore
                with the hardcoded default values from the application code.
                This includes dual currency prices (USD and LKR).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                This operation is useful for initial setup or for resetting the Firestore data
                to the application's predefined defaults.
              </p>
              <p className="text-sm font-medium text-destructive-foreground bg-destructive/10 border border-destructive p-3 rounded-md flex items-start">
                <AlertTriangle className="h-5 w-5 mr-2 shrink-0 mt-0.5" />
                <span>
                  <strong>Warning:</strong> Clicking this button will overwrite any existing data in the
                  `{FEATURES_COLLECTION}` and `{GLOBAL_PRICING_COLLECTION}/{PAGE_PRICE_DOC_ID}` paths in Firestore.
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
                    <Loader2 className="animate-spin rounded-full h-5 w-5 border-b-2 border-current mr-2"></Loader2>
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
      </Tabs>
    </div>
  );
}

      
