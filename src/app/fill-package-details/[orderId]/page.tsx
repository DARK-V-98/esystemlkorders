
"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm, Controller, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import type { Order, PackageOrderDetailsForm } from '@/types';
import { Loader2 } from 'lucide-react';

const designStyleOptions = ['Modern', 'Minimal', 'Classic', 'Playful', 'Elegant', 'Techy', 'Bohemian', 'Artistic', 'Other'] as const;

const packageDetailsSchema = z.object({
  // Basic Info
  fullName: z.string().min(1, 'Full name is required'),
  nicNumber: z.string().min(1, 'NIC number is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(1, 'Phone number is required'),
  address: z.string().min(1, 'Address is required'),

  // Website Setup
  websiteName: z.string().min(1, 'Desired website name is required'),
  hasDomain: z.enum(['Yes', 'No'], { required_error: "Please select if you have a domain." }),
  domainName: z.string().optional(),
  hasHosting: z.enum(['Yes', 'No'], { required_error: "Please select if you have hosting." }),
  hostingProvider: z.string().optional(),
  needsBusinessEmail: z.enum(['Yes', 'No'], { required_error: "Please select if you need business emails." }),
  businessEmailCount: z.number().min(0, "Number of emails cannot be negative.").optional(),

  // Design Preferences
  baseColors: z.string().min(1, 'Preferred base colors are required'),
  style: z.enum(designStyleOptions, { required_error: "Please select a style." }),
  styleOther: z.string().optional(),
  inspirationSites: z.string().optional(),
  fontAndLogoIdeas: z.string().optional(),

  // Features Needed
  featureOnlineOrdering: z.boolean().optional().default(false),
  featureOnlinePayments: z.boolean().optional().default(false),
  featureContactForm: z.boolean().optional().default(false),
  featureAdminPanel: z.boolean().optional().default(false),
  featureCustomerDashboard: z.boolean().optional().default(false),
  featureParcelTracking: z.boolean().optional().default(false),
  featureBooking: z.boolean().optional().default(false),
  featureBlog: z.boolean().optional().default(false),
  featureFileDownloads: z.boolean().optional().default(false),
  featureChatSupport: z.boolean().optional().default(false),
  otherFeatures: z.string().optional(),

  // Budget
  budgetRange: z.string().min(1, 'Budget range is required'),

  // Notes
  businessGoalsSpecialNeeds: z.string().optional(),

  // Consent
  confirmDetailsCorrect: z.boolean().refine(val => val === true, { message: 'You must confirm details are correct' }),
  agreeToShareMaterials: z.boolean().refine(val => val === true, { message: 'You must agree to share required materials' }),
}).superRefine((data, ctx) => {
  if (data.hasDomain === 'Yes' && (!data.domainName || data.domainName.trim() === '')) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Domain name is required if you have a domain.', path: ['domainName'] });
  }
  if (data.hasHosting === 'Yes' && (!data.hostingProvider || data.hostingProvider.trim() === '')) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Hosting provider name is required if you have hosting.', path: ['hostingProvider'] });
  }
   if (data.needsBusinessEmail === 'Yes' && (data.businessEmailCount === undefined || data.businessEmailCount <= 0)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Please specify a valid number of business emails (more than 0).', path: ['businessEmailCount'] });
  }
  if (data.style === 'Other' && (!data.styleOther || data.styleOther.trim() === '')) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Please specify other style if "Other" is selected.', path: ['styleOther'] });
  }
});

export default function FillPackageDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const orderId = params.orderId as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderData, setOrderData] = useState<Order | null>(null);

  const { control, handleSubmit, register, watch, setValue, formState: { errors } } = useForm<PackageOrderDetailsForm>({
    resolver: zodResolver(packageDetailsSchema),
    defaultValues: {
      hasDomain: undefined,
      hasHosting: undefined,
      needsBusinessEmail: undefined,
      style: undefined,
      businessEmailCount: 0,
      confirmDetailsCorrect: false,
      agreeToShareMaterials: false,
      featureOnlineOrdering: false,
      featureOnlinePayments: false,
      featureContactForm: false,
      featureAdminPanel: false,
      featureCustomerDashboard: false,
      featureParcelTracking: false,
      featureBooking: false,
      featureBlog: false,
      featureFileDownloads: false,
      featureChatSupport: false,
    },
  });

  const watchHasDomain = watch("hasDomain");
  const watchHasHosting = watch("hasHosting");
  const watchNeedsBusinessEmail = watch("needsBusinessEmail");
  const watchStyle = watch("style");

  useEffect(() => {
    if (!orderId) return;
    const fetchOrder = async () => {
      setIsLoading(true);
      try {
        const orderDocRef = doc(db, 'orders', orderId);
        const orderSnap = await getDoc(orderDocRef);
        if (orderSnap.exists()) {
          const fetchedOrder = orderSnap.data() as Order;
          if (fetchedOrder.projectType !== 'Budget Package') {
             toast({ variant: 'destructive', title: 'Invalid Order Type', description: 'This form is only for budget package orders.' });
             router.push(`/orders/${orderId}`);
             return;
          }
          setOrderData(fetchedOrder);
          
          if (fetchedOrder.packageOrderDetails) {
            const detailsToSet = JSON.parse(JSON.stringify(fetchedOrder.packageOrderDetails));
            Object.entries(detailsToSet).forEach(([key, value]) => {
               setValue(key as keyof PackageOrderDetailsForm, value as any);
            });
          } else {
             setValue('email', fetchedOrder.contactEmail || '');
             setValue('fullName', fetchedOrder.clientName || '');
             setValue('budgetRange', `${fetchedOrder.currencySymbol}${fetchedOrder.budget} ${fetchedOrder.selectedCurrency.toUpperCase()}`);
          }
        } else {
          toast({ variant: 'destructive', title: 'Error', description: 'Order not found.' });
          router.push('/');
        }
      } catch (error) {
        console.error("Error fetching order:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to load order details.' });
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrder();
  }, [orderId, router, toast, setValue]);

  const onSubmit: SubmitHandler<PackageOrderDetailsForm> = async (data) => {
    setIsSubmitting(true);
    try {
      const orderDocRef = doc(db, 'orders', orderId);
      const dataToSave: Partial<PackageOrderDetailsForm> & { lastUpdated?: any } = {
        ...data,
        lastUpdated: serverTimestamp(),
      };

      await updateDoc(orderDocRef, { packageOrderDetails: dataToSave });
      toast({ 
        title: 'Package Order Details Saved!', 
        description: 'Your package specifications have been successfully saved.' 
      });
      router.push(`/orders/${orderId}`); 
    } catch (error) {
      console.error("Error saving package order details:", error);
      toast({ variant: 'destructive', title: 'Save Error', description: 'Failed to save package details. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4">Loading package order information...</p>
      </div>
    );
  }
  if (!orderData) {
     return <div className="container mx-auto p-4 text-center">Order not found or failed to load.</div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-8 font-body">
      <header className="mb-8">
        <h1 className="text-3xl font-bold font-headline text-primary">Package Details Form</h1>
        <p className="text-muted-foreground">Order ID: {orderData.formattedOrderId} - Package: {orderData.projectName}</p>
        <p className="text-muted-foreground">Please fill out the form with your details for the selected package.</p>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
        <Card>
          <CardHeader><CardTitle>👤 Basic Info</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div><Label htmlFor="fullName">Full Name</Label><Input id="fullName" {...register("fullName")} disabled={isSubmitting} /><p className="text-destructive text-xs mt-1">{errors.fullName?.message}</p></div>
            <div><Label htmlFor="nicNumber">NIC Number</Label><Input id="nicNumber" {...register("nicNumber")} disabled={isSubmitting} /><p className="text-destructive text-xs mt-1">{errors.nicNumber?.message}</p></div>
            <div><Label htmlFor="email">Email</Label><Input id="email" type="email" {...register("email")} disabled={isSubmitting} /><p className="text-destructive text-xs mt-1">{errors.email?.message}</p></div>
            <div><Label htmlFor="phone">Phone</Label><Input id="phone" type="tel" {...register("phone")} disabled={isSubmitting} /><p className="text-destructive text-xs mt-1">{errors.phone?.message}</p></div>
            <div className="md:col-span-2"><Label htmlFor="address">Address</Label><Textarea id="address" {...register("address")} disabled={isSubmitting} /><p className="text-destructive text-xs mt-1">{errors.address?.message}</p></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>🌐 Website Setup</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div><Label htmlFor="websiteName">Desired Website Name / Title</Label><Input id="websiteName" {...register("websiteName")} disabled={isSubmitting} /><p className="text-destructive text-xs mt-1">{errors.websiteName?.message}</p></div>
            <Controller name="hasDomain" control={control} render={({ field }) => (
              <div><Label className="mb-1 block">Do you have a domain?</Label><RadioGroup onValueChange={field.onChange} value={field.value} className="flex gap-4" disabled={isSubmitting}><div className="flex items-center space-x-2"><RadioGroupItem value="Yes" id="domainYes" /><Label htmlFor="domainYes">Yes</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="No" id="domainNo" /><Label htmlFor="domainNo">No</Label></div></RadioGroup><p className="text-destructive text-xs mt-1">{errors.hasDomain?.message}</p></div>
            )} />
            {watchHasDomain === 'Yes' && <div><Label htmlFor="domainName">If yes, Domain Name</Label><Input id="domainName" {...register("domainName")} disabled={isSubmitting} /><p className="text-destructive text-xs mt-1">{errors.domainName?.message}</p></div>}
            
            <Controller name="hasHosting" control={control} render={({ field }) => (
              <div><Label className="mb-1 block">Do you have hosting?</Label><RadioGroup onValueChange={field.onChange} value={field.value} className="flex gap-4" disabled={isSubmitting}><div className="flex items-center space-x-2"><RadioGroupItem value="Yes" id="hostingYes" /><Label htmlFor="hostingYes">Yes</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="No" id="hostingNo" /><Label htmlFor="hostingNo">No</Label></div></RadioGroup><p className="text-destructive text-xs mt-1">{errors.hasHosting?.message}</p></div>
            )} />
            {watchHasHosting === 'Yes' && <div><Label htmlFor="hostingProvider">If yes, Hosting Provider Name</Label><Input id="hostingProvider" {...register("hostingProvider")} disabled={isSubmitting} /><p className="text-destructive text-xs mt-1">{errors.hostingProvider?.message}</p></div>}

            <Controller name="needsBusinessEmail" control={control} render={({ field }) => (
              <div><Label className="mb-1 block">Do you need business email accounts?</Label><RadioGroup onValueChange={field.onChange} value={field.value} className="flex gap-4" disabled={isSubmitting}><div className="flex items-center space-x-2"><RadioGroupItem value="Yes" id="bEmailYes" /><Label htmlFor="bEmailYes">Yes</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="No" id="bEmailNo" /><Label htmlFor="bEmailNo">No</Label></div></RadioGroup><p className="text-destructive text-xs mt-1">{errors.needsBusinessEmail?.message}</p></div>
            )} />
            {watchNeedsBusinessEmail === 'Yes' && <div><Label htmlFor="businessEmailCount">If yes, how many?</Label><Input id="businessEmailCount" type="number" {...register("businessEmailCount", { valueAsNumber: true, setValueAs: (v) => parseInt(v, 10) || 0 })} min="1" disabled={isSubmitting} /><p className="text-destructive text-xs mt-1">{errors.businessEmailCount?.message}</p></div>}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader><CardTitle>🎨 Design Preferences</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div><Label htmlFor="baseColors">Base Colors (e.g., #FF0000, Blue)</Label><Input id="baseColors" {...register("baseColors")} disabled={isSubmitting} /><p className="text-destructive text-xs mt-1">{errors.baseColors?.message}</p></div>
            <Controller name="style" control={control} render={({ field }) => (
              <div><Label className="mb-1 block">Style</Label>
                <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                  <SelectTrigger><SelectValue placeholder="Select style" /></SelectTrigger>
                  <SelectContent>
                    {designStyleOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                  </SelectContent>
                </Select><p className="text-destructive text-xs mt-1">{errors.style?.message}</p>
              </div>
            )} />
            {watchStyle === 'Other' && <div><Label htmlFor="styleOther">If Other, please specify</Label><Input id="styleOther" {...register("styleOther")} disabled={isSubmitting} /><p className="text-destructive text-xs mt-1">{errors.styleOther?.message}</p></div>}
            <div><Label htmlFor="inspirationSites">Sites you like for inspiration (URLs, comma-separated)</Label><Textarea id="inspirationSites" {...register("inspirationSites")} disabled={isSubmitting} placeholder="https://example.com, https://another.com"/></div>
            <div><Label htmlFor="fontAndLogoIdeas">Font & logo color ideas</Label><Textarea id="fontAndLogoIdeas" {...register("fontAndLogoIdeas")} disabled={isSubmitting} /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>🧩 Features Needed</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Label>Select desired features (tick checkboxes):</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { id: 'featureOnlineOrdering', label: 'Online Ordering' },
                { id: 'featureOnlinePayments', label: 'Online Payments' },
                { id: 'featureContactForm', label: 'Contact Form' },
                { id: 'featureAdminPanel', label: 'Admin Panel' },
                { id: 'featureCustomerDashboard', label: 'Customer Dashboard' },
                { id: 'featureParcelTracking', label: 'Parcel Tracking' },
                { id: 'featureBooking', label: 'Booking System' },
                { id: 'featureBlog', label: 'Blog Section' },
                { id: 'featureFileDownloads', label: 'File Downloads' },
                { id: 'featureChatSupport', label: 'Chat Support' },
              ].map(func => (
                <div key={func.id} className="flex items-center space-x-2">
                  <Controller
                    name={func.id as keyof PackageOrderDetailsForm}
                    control={control}
                    render={({ field }) => <Checkbox id={`func-${func.id}`} checked={!!field.value} onCheckedChange={field.onChange} disabled={isSubmitting}/>}
                  />
                  <Label htmlFor={`func-${func.id}`}>{func.label}</Label>
                </div>
              ))}
            </div>
            <div><Label htmlFor="otherFeatures">Other feature requirements</Label><Textarea id="otherFeatures" {...register("otherFeatures")} disabled={isSubmitting} /></div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader><CardTitle>💰 Budget</CardTitle></CardHeader>
          <CardContent>
            <div>
                <Label htmlFor="budgetRange">Budget Range (e.g., LKR 20,000 - 30,000, or a specific figure from package)</Label>
                <Input id="budgetRange" {...register("budgetRange")} disabled={isSubmitting} />
                <p className="text-destructive text-xs mt-1">{errors.budgetRange?.message}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>🧠 Notes</CardTitle></CardHeader>
          <CardContent>
            <div><Label htmlFor="businessGoalsSpecialNeeds">Business goals / Special needs</Label><Textarea id="businessGoalsSpecialNeeds" {...register("businessGoalsSpecialNeeds")} rows={4} disabled={isSubmitting} /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>✅ Final Consent</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start space-x-2">
              <Controller name="confirmDetailsCorrect" control={control} render={({ field }) => <Checkbox id="confirmDetailsCorrect" checked={field.value} onCheckedChange={field.onChange} disabled={isSubmitting}/>} />
              <div><Label htmlFor="confirmDetailsCorrect" className="font-normal">I confirm all details provided are accurate to the best of my knowledge.</Label><p className="text-destructive text-xs mt-1">{errors.confirmDetailsCorrect?.message}</p></div>
            </div>
            <div className="flex items-start space-x-2">
              <Controller name="agreeToShareMaterials" control={control} render={({ field }) => <Checkbox id="agreeToShareMaterials" checked={field.value} onCheckedChange={field.onChange} disabled={isSubmitting}/>} />
              <div><Label htmlFor="agreeToShareMaterials" className="font-normal">I agree to share necessary content, files, and provide timely feedback.</Label><p className="text-destructive text-xs mt-1">{errors.agreeToShareMaterials?.message}</p></div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end pt-6">
          <Button type="submit" size="lg" disabled={isSubmitting || isLoading}>
            {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
            Submit Package Details
          </Button>
        </div>
      </form>
    </div>
  );
}

