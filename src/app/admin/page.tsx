
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
  MoreVertical, PauseCircle, PlayCircle, Trash2, Mail, CreditCard, Banknote,
  User as UserIcon, Package as PackageIcon, Info as InfoIcon // Added icons for mobile card view
} from "lucide-react";
import { db } from '@/lib/firebase';
import { collection, doc, getDocs, getDoc, writeBatch, updateDoc, setDoc, Timestamp, query, orderBy as firestoreOrderBy, deleteDoc } from 'firebase/firestore';
import { DEFAULT_FEATURE_CATEGORIES, DEFAULT_PRICE_PER_PAGE, type FeatureCategory, type FeatureOption, type Price } from '@/app/custom-website/page';
import { DynamicIcon } from '@/components/icons';
import type { Order, OrderStatus, PaymentStatus } from '@/types'; 
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { PaymentStatusBadge } from "@/components/payment-status-badge"; 
import { formatDate, PAYMENT_STATUSES } from "@/lib/data"; 
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
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
import { sendOrderStatusUpdateEmail } from '@/ai/flows/send-order-status-email-flow';
import { useIsMobile } from '@/hooks/use-is-mobile'; // Import useIsMobile


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
          <CardTitle className="flex items-center text-xl md:text-2xl"><DollarSign className="mr-2 h-5 w-5 text-primary" />Edit Price Per Page</CardTitle>
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

      <h2 className="text-lg md:text-xl font-semibold mt-6 mb-2 flex items-center">
        <ListChecks className="mr-2 h-6 w-6 text-primary"/>
        Edit Feature Prices
      </h2>
      {liveCategories.length === 0 && !isLoading && (
        <p className="text-muted-foreground">No feature categories found in Firestore. Try seeding default data first.</p>
      )}
      <Accordion type="multiple" defaultValue={liveCategories.map(cat => cat.id)} className="w-full">
        {liveCategories.map((category, categoryIndex) => (
          <AccordionItem value={category.id} key={category.id}>
            <AccordionTrigger className="hover:bg-muted/50 transition-colors text-md md:text-lg">
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
  const [updatingStates, setUpdatingStates] = useState<Record<string, { orderStatus?: boolean; paymentStatus?: boolean }>>({});
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);
  const [adminSearchTerm, setAdminSearchTerm] = useState('');
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();

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
          paymentStatus: data.paymentStatus || 'Not Paid', 
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
          order.formattedOrderId.toLowerCase().includes(adminSearchTerm.toLowerCase()) ||
          order.clientName.toLowerCase().includes(adminSearchTerm.toLowerCase()) ||
          order.projectName.toLowerCase().includes(adminSearchTerm.toLowerCase())
        )
      );
    }
  }, [adminSearchTerm, allOrders]);

  const setUpdatingState = (orderId: string, type: 'orderStatus' | 'paymentStatus', value: boolean) => {
    setUpdatingStates(prev => ({
      ...prev,
      [orderId]: { ...prev[orderId], [type]: value }
    }));
  };

  const getUpdatingState = (orderId: string, type: 'orderStatus' | 'paymentStatus') => {
    return updatingStates[orderId]?.[type] || false;
  };


  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus, formattedOrderId: string) => {
    setUpdatingState(orderId, 'orderStatus', true);
    try {
      const orderDocRef = doc(db, ORDERS_COLLECTION, orderId);
      const orderToUpdate = allOrders.find(o => o.id === orderId);

      if (!orderToUpdate) {
        toast({ variant: "destructive", title: "Update Error", description: `Order ${formattedOrderId} not found.` });
        setUpdatingState(orderId, 'orderStatus', false);
        return;
      }
      
      const oldStatus = orderToUpdate.status; 

      await updateDoc(orderDocRef, { status: newStatus });
      toast({ title: "Order Status Updated", description: `Order ${formattedOrderId} status changed to ${newStatus}.` });
      
      const updatedOrders = allOrders.map(o => o.id === orderId ? {...o, status: newStatus} : o);
      setAllOrders(updatedOrders);

      if (orderToUpdate.contactEmail) {
        const emailInput = {
          customerEmail: orderToUpdate.contactEmail,
          customerName: orderToUpdate.clientName,
          projectName: orderToUpdate.projectName,
          formattedOrderId: orderToUpdate.formattedOrderId,
          newStatus: newStatus,
          oldStatus: oldStatus,
        };
        
        try {
          const emailResult = await sendOrderStatusUpdateEmail(emailInput);
          if (emailResult.success) {
            toast({ 
              title: "Notification Update",
              description: (
                <div className="flex items-start gap-2">
                  <Mail className="h-4 w-4 mt-0.5 text-green-500" />
                  <span>{emailResult.message}</span>
                </div>
              )
            });
          } else {
            toast({ 
              variant: "destructive", 
              title: "Notification Update Failed", 
              description: emailResult.message 
            });
          }
        } catch (emailError) {
          console.error("Error calling sendOrderStatusUpdateEmail flow:", emailError);
          toast({ 
            variant: "destructive", 
            title: "Notification Flow Error", 
            description: "Could not initiate the notification process." 
          });
        }
      } else {
        toast({
          variant: "default",
          title: "Notification Skipped",
          description: `No contact email found for order ${formattedOrderId}. Notification step bypassed.`
        });
      }

    } catch (error) {
      console.error(`Error updating order ${formattedOrderId} to ${newStatus}:`, error);
      toast({ variant: "destructive", title: "Update Error", description: `Could not update order ${formattedOrderId}.` });
    } finally {
      setUpdatingState(orderId, 'orderStatus', false);
    }
  };
  
  const handleUpdatePaymentStatus = async (orderId: string, newPaymentStatus: PaymentStatus, formattedOrderId: string) => {
    setUpdatingState(orderId, 'paymentStatus', true);
    try {
      const orderDocRef = doc(db, ORDERS_COLLECTION, orderId);
      await updateDoc(orderDocRef, { paymentStatus: newPaymentStatus });
      toast({ title: "Payment Status Updated", description: `Order ${formattedOrderId} payment status changed to ${newPaymentStatus}.` });
      
      const updatedOrders = allOrders.map(o => o.id === orderId ? {...o, paymentStatus: newPaymentStatus} : o);
      setAllOrders(updatedOrders);
    } catch (error) {
      console.error(`Error updating payment status for order ${formattedOrderId} to ${newPaymentStatus}:`, error);
      toast({ variant: "destructive", title: "Update Error", description: `Could not update payment status for order ${formattedOrderId}.` });
    } finally {
      setUpdatingState(orderId, 'paymentStatus', false);
    }
  };


  const handleDeleteOrder = async () => {
    if (!orderToDelete) return;
    setDeletingOrderId(orderToDelete.id);
    try {
      await deleteDoc(doc(db, ORDERS_COLLECTION, orderToDelete.id));
      toast({ title: "Order Deleted", description: `Order ${orderToDelete.formattedOrderId} has been successfully deleted.` });
      
      const updatedOrders = allOrders.filter(o => o.id !== orderToDelete.id);
      setAllOrders(updatedOrders);
      setOrderToDelete(null); 
    } catch (error) {
      console.error(`Error deleting order ${orderToDelete.formattedOrderId}:`, error);
      toast({ variant: "destructive", title: "Delete Error", description: `Could not delete order ${orderToDelete.formattedOrderId}.` });
    } finally {
      setDeletingOrderId(null);
    }
  };


  const availableActions: Array<{
    label: string;
    newStatus: OrderStatus;
    icon: React.ElementType;
    className?: string;
    allowedCurrentStatuses?: OrderStatus[]; 
  }> = [
    { label: "Mark as In Progress", newStatus: "In Progress", icon: PlayCircle, allowedCurrentStatuses: ["Pending", "Suspended", "Developing", "Waiting for Payment", "Review", "Completed", "Rejected"] },
    { label: "Mark as Developing", newStatus: "Developing", icon: Settings, allowedCurrentStatuses: ["In Progress", "Waiting for Payment", "Suspended", "Review", "Completed"] },
    { label: "Request Payment", newStatus: "Waiting for Payment", icon: Clock, allowedCurrentStatuses: ["In Progress", "Developing", "Suspended", "Review"] },
    { label: "Send for Review", newStatus: "Review", icon: ListChecks, allowedCurrentStatuses: ["In Progress", "Developing", "Completed"] },
    { label: "Mark as Completed", newStatus: "Completed", icon: CheckCircle2, className:"text-green-600", allowedCurrentStatuses: ["In Progress", "Developing", "Waiting for Payment", "Review"] },
    { label: "Suspend Project", newStatus: "Suspended", icon: PauseCircle, className:"text-orange-600", allowedCurrentStatuses: ["In Progress", "Developing", "Waiting for Payment", "Review", "Completed", "Rejected"] },
    { label: "Cancel Order", newStatus: "Cancelled", icon: Trash2, className:"text-red-600", allowedCurrentStatuses: ["Pending", "In Progress", "Developing", "Waiting for Payment", "Review", "Suspended", "Completed", "Rejected"] },
    { label: "Reject Order", newStatus: "Rejected", icon: XCircle, className:"text-pink-700", allowedCurrentStatuses: ["Pending"] },
  ];
  
  const terminalStatuses: OrderStatus[] = ["Cancelled"];


  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
        <span>Loading orders...</span>
      </div>
    );
  }

  return (
    <AlertDialog>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex-grow">
                  <CardTitle className="flex items-center text-xl md:text-2xl"><ListOrdered className="mr-2 h-5 w-5 text-primary" />Manage Client Orders</CardTitle>
                  <CardDescription className="text-sm md:text-base">Review and update project order statuses and payment statuses.</CardDescription>
              </div>
              <div className="relative w-full sm:w-auto sm:max-w-xs">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                  type="search"
                  placeholder="Search orders..."
                  value={adminSearchTerm}
                  onChange={(e) => setAdminSearchTerm(e.target.value)}
                  className="pl-8 w-full"
                  aria-label="Search orders by ID, client, or project name"
                  />
              </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredOrders.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              {adminSearchTerm ? `No orders found matching "${adminSearchTerm}".` : "No orders found."}
              </p>
          ) : isMobile ? (
             <div className="space-y-4">
              {filteredOrders.map((order) => (
                <Card key={order.id} className="shadow-md">
                   <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-base font-semibold">{order.projectName}</CardTitle>
                            <CardDescription className="text-xs">ID: {order.formattedOrderId}</CardDescription>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="h-8 w-8" 
                              disabled={getUpdatingState(order.id, 'orderStatus') || getUpdatingState(order.id, 'paymentStatus') || deletingOrderId === order.id}
                            >
                              {(getUpdatingState(order.id, 'orderStatus') || getUpdatingState(order.id, 'paymentStatus')) ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-4 w-4" />}
                               <span className="sr-only">Order Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {!terminalStatuses.includes(order.status) && order.status === 'Pending' && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => handleUpdateStatus(order.id, "In Progress", order.formattedOrderId)}
                                  disabled={getUpdatingState(order.id, 'orderStatus') || deletingOrderId === order.id}
                                  className="bg-green-500 hover:bg-green-600 text-white"
                                >
                                  <CheckSquare className="mr-1.5 h-4 w-4" /> Confirm Order
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleUpdateStatus(order.id, "Rejected", order.formattedOrderId)}
                                  disabled={getUpdatingState(order.id, 'orderStatus') || deletingOrderId === order.id}
                                  className="bg-pink-700 hover:bg-pink-800 text-white"
                                >
                                  <XCircle className="mr-1.5 h-4 w-4" /> Reject Order
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                              </>
                            )}
                            {!terminalStatuses.includes(order.status) && order.status !== 'Pending' && (
                                <>
                                 <DropdownMenuLabel>Change Order Status</DropdownMenuLabel>
                                  {availableActions
                                    .filter(action => action.newStatus !== order.status) 
                                    .filter(action => action.allowedCurrentStatuses?.includes(order.status) && action.newStatus !== "Rejected") 
                                    .map(action => (
                                    <DropdownMenuItem
                                      key={`order-${action.newStatus}`}
                                      onClick={() => handleUpdateStatus(order.id, action.newStatus, order.formattedOrderId)}
                                      disabled={getUpdatingState(order.id, 'orderStatus') || deletingOrderId === order.id}
                                      className={action.className}
                                    >
                                      <action.icon className="mr-2 h-4 w-4" />
                                      {action.label}
                                    </DropdownMenuItem>
                                  ))}
                                  <DropdownMenuSeparator />
                                </>
                            )}
                            <DropdownMenuSub>
                                <DropdownMenuSubTrigger 
                                    disabled={getUpdatingState(order.id, 'paymentStatus') || deletingOrderId === order.id}
                                >
                                    <Banknote className="mr-2 h-4 w-4" /> Update Payment Status
                                </DropdownMenuSubTrigger>
                                <DropdownMenuPortal>
                                    <DropdownMenuSubContent>
                                        <DropdownMenuLabel>Set Payment Status</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        {PAYMENT_STATUSES.map(pStatus => (
                                            <DropdownMenuItem 
                                                key={pStatus}
                                                onClick={() => handleUpdatePaymentStatus(order.id, pStatus, order.formattedOrderId)}
                                                disabled={getUpdatingState(order.id, 'paymentStatus') || order.paymentStatus === pStatus}
                                            >
                                                {order.paymentStatus === pStatus && <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />}
                                                {pStatus}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuSubContent>
                                </DropdownMenuPortal>
                            </DropdownMenuSub>

                            <DropdownMenuSeparator />
                             <AlertDialogTrigger asChild>
                               <DropdownMenuItem 
                                 className="text-red-600 focus:bg-red-100 focus:text-red-700"
                                 onSelect={(e) => e.preventDefault()} 
                                 onClick={() => setOrderToDelete(order)}
                                 disabled={deletingOrderId === order.id || getUpdatingState(order.id, 'orderStatus') || getUpdatingState(order.id, 'paymentStatus')}
                               >
                                 <Trash2 className="mr-2 h-4 w-4" /> Delete Order
                               </DropdownMenuItem>
                            </AlertDialogTrigger>
                          </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm pb-4">
                    <div className="flex items-center">
                      <UserIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span>Client: {order.clientName}</span>
                    </div>
                    <div className="flex items-center">
                      <PackageIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                       <span>Type: {order.projectType}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <InfoIcon className="mr-1 h-4 w-4 text-muted-foreground self-start mt-0.5" />
                        <div className="flex flex-col gap-1">
                             <OrderStatusBadge status={order.status} />
                             <PaymentStatusBadge status={order.paymentStatus} />
                        </div>
                    </div>
                     <div className="flex items-center text-xs text-muted-foreground">
                         <Clock className="mr-2 h-3 w-3" /> 
                         <span>Created: {formatDate(order.createdDate, 'PPp')}</span>
                     </div>
                  </CardContent>
                  <CardFooter>
                     <Button asChild variant="outline" size="sm" className="w-full">
                      <Link href={`/orders/${order.id}`}>
                        View Details <ExternalLink className="ml-1.5 h-3 w-3" />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Order ID</TableHead>
                    <TableHead className="text-xs">Client Name</TableHead>
                    <TableHead className="text-xs">Project Name</TableHead>
                    <TableHead className="text-xs">Order Status</TableHead>
                    <TableHead className="text-xs">Payment Status</TableHead>
                    <TableHead className="text-xs">Created Date</TableHead>
                    <TableHead className="text-right text-xs">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium text-xs">{order.formattedOrderId}</TableCell>
                      <TableCell className="text-xs">{order.clientName}</TableCell>
                      <TableCell className="text-xs">{order.projectName}</TableCell>
                      <TableCell><OrderStatusBadge status={order.status} /></TableCell>
                      <TableCell><PaymentStatusBadge status={order.paymentStatus} /></TableCell>
                      <TableCell className="text-xs">{formatDate(order.createdDate, 'PPp')}</TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/orders/${order.id}`}>
                            View <ExternalLink className="ml-1.5 h-3 w-3" />
                          </Link>
                        </Button>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="icon" 
                              className="h-8 w-8"
                              disabled={getUpdatingState(order.id, 'orderStatus') || getUpdatingState(order.id, 'paymentStatus') || deletingOrderId === order.id}
                            >
                              {(getUpdatingState(order.id, 'orderStatus') || getUpdatingState(order.id, 'paymentStatus')) ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-4 w-4" />}
                               <span className="sr-only">Order Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {!terminalStatuses.includes(order.status) && order.status === 'Pending' && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => handleUpdateStatus(order.id, "In Progress", order.formattedOrderId)}
                                  disabled={getUpdatingState(order.id, 'orderStatus') || deletingOrderId === order.id}
                                  className="bg-green-500 hover:bg-green-600 text-white"
                                >
                                  <CheckSquare className="mr-1.5 h-4 w-4" /> Confirm Order
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleUpdateStatus(order.id, "Rejected", order.formattedOrderId)}
                                  disabled={getUpdatingState(order.id, 'orderStatus') || deletingOrderId === order.id}
                                  className="bg-pink-700 hover:bg-pink-800 text-white"
                                >
                                  <XCircle className="mr-1.5 h-4 w-4" /> Reject Order
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                              </>
                            )}
                            {!terminalStatuses.includes(order.status) && order.status !== 'Pending' && (
                                <>
                                 <DropdownMenuLabel>Change Order Status</DropdownMenuLabel>
                                  {availableActions
                                    .filter(action => action.newStatus !== order.status) 
                                    .filter(action => action.allowedCurrentStatuses?.includes(order.status) && action.newStatus !== "Rejected") 
                                    .map(action => (
                                    <DropdownMenuItem
                                      key={`order-${action.newStatus}`}
                                      onClick={() => handleUpdateStatus(order.id, action.newStatus, order.formattedOrderId)}
                                      disabled={getUpdatingState(order.id, 'orderStatus') || deletingOrderId === order.id}
                                      className={action.className}
                                    >
                                      <action.icon className="mr-2 h-4 w-4" />
                                      {action.label}
                                    </DropdownMenuItem>
                                  ))}
                                  <DropdownMenuSeparator />
                                </>
                            )}
                            <DropdownMenuSub>
                                <DropdownMenuSubTrigger 
                                    disabled={getUpdatingState(order.id, 'paymentStatus') || deletingOrderId === order.id}
                                >
                                    <Banknote className="mr-2 h-4 w-4" /> Update Payment Status
                                </DropdownMenuSubTrigger>
                                <DropdownMenuPortal>
                                    <DropdownMenuSubContent>
                                        <DropdownMenuLabel>Set Payment Status</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        {PAYMENT_STATUSES.map(pStatus => (
                                            <DropdownMenuItem 
                                                key={pStatus}
                                                onClick={() => handleUpdatePaymentStatus(order.id, pStatus, order.formattedOrderId)}
                                                disabled={getUpdatingState(order.id, 'paymentStatus') || order.paymentStatus === pStatus}
                                            >
                                                {order.paymentStatus === pStatus && <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />}
                                                {pStatus}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuSubContent>
                                </DropdownMenuPortal>
                            </DropdownMenuSub>

                            <DropdownMenuSeparator />
                             <AlertDialogTrigger asChild>
                               <DropdownMenuItem 
                                 className="text-red-600 focus:bg-red-100 focus:text-red-700"
                                 onSelect={(e) => e.preventDefault()} 
                                 onClick={() => setOrderToDelete(order)}
                                 disabled={deletingOrderId === order.id || getUpdatingState(order.id, 'orderStatus') || getUpdatingState(order.id, 'paymentStatus')}
                               >
                                 <Trash2 className="mr-2 h-4 w-4" /> Delete Order
                               </DropdownMenuItem>
                            </AlertDialogTrigger>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      {orderToDelete && (
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this order?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the order for
              <span className="font-semibold"> {orderToDelete.projectName} (ID: {orderToDelete.formattedOrderId})</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setOrderToDelete(null)} disabled={!!deletingOrderId}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteOrder} 
              disabled={!!deletingOrderId}
              className="bg-red-600 hover:bg-red-700"
            >
              {deletingOrderId ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete Order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      )}
    </AlertDialog>
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
          <ShieldCheck className="h-8 w-8 md:h-10 md:w-10 text-primary" />
          <h1 className="text-3xl md:text-4xl font-bold font-headline text-primary">
            Admin Console
          </h1>
        </div>
        <p className="text-md sm:text-lg text-muted-foreground">
          Manage application settings, pricing, and orders.
        </p>
      </header>

      <Tabs defaultValue="manage-orders" className="w-full">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 md:grid-cols-3 mb-6">
          <TabsTrigger value="manage-orders" className="text-xs sm:text-sm">
            <ListOrdered className="mr-2 h-4 w-4" /> Manage Orders
          </TabsTrigger>
          <TabsTrigger value="live-editor" className="text-xs sm:text-sm">
            <Edit className="mr-2 h-4 w-4" /> Live Price Editor
          </TabsTrigger>
          <TabsTrigger value="seed-data" className="text-xs sm:text-sm">
            <UploadCloud className="mr-2 h-4 w-4" /> Seed/Update Defaults
          </TabsTrigger>
        </TabsList>

        <TabsContent value="manage-orders">
           <AdminOrdersManagement />
        </TabsContent>
        
        <TabsContent value="live-editor">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl md:text-2xl flex items-center">
                <Edit className="mr-2 h-5 w-5 md:h-6 md:w-6 text-accent" />
                Live Price Editor
              </CardTitle>
              <CardDescription className="text-sm md:text-base">
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
              <CardTitle className="text-xl md:text-2xl flex items-center">
                <UploadCloud className="mr-2 h-5 w-5 md:h-6 md:w-6 text-accent" />
                Seed Application Defaults to Firestore
              </CardTitle>
              <CardDescription className="text-sm md:text-base">
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
    
