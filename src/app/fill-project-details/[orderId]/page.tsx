
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
import { DatePicker } from '@/components/ui/date-picker';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import type { Order, ProjectDetailsForm } from '@/types';
import { Loader2 } from 'lucide-react';

const functionalityOptions = [
  { id: 'onlineOrdering', label: 'Online Ordering/E-commerce' },
  { id: 'paymentGateway', label: 'Payment Gateway Integration' },
  { id: 'contactForm', label: 'Contact Form' },
  { id: 'blogSection', label: 'Blog or News Section' },
  { id: 'customerDashboard', label: 'Customer Dashboard' },
  { id: 'adminDashboard', label: 'Admin Dashboard' },
  { id: 'imageVideoGallery', label: 'Image/Video Gallery' },
  { id: 'parcelTracking', label: 'Parcel Tracking System' },
  { id: 'bookingSystem', label: 'Booking/Reservation System' },
  { id: 'inventoryManagement', label: 'Inventory Management' },
  { id: 'testimonialsSection', label: 'Testimonials Section' },
  { id: 'fileDownloads', label: 'File Downloads Section' },
  { id: 'chatIntegration', label: 'Chat/Messenger Integration' },
] as const;

const paymentGatewayOptions = ['PayHere', 'Stripe', 'PayPal'] as const;

const themeStyleOptions = ['Modern', 'Minimal', 'Classic', 'Playful', 'Elegant', 'Other'] as const;

const projectDetailsSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  nicNumber: z.string().min(1, 'NIC number is required'),
  contactEmail: z.string().email('Invalid email address'),
  phoneNumber: z.string().min(1, 'Phone number is required'),
  address: z.string().min(1, 'Address is required'),
  companyName: z.string().optional(),
  businessRegNumber: z.string().optional(),
  companyAddress: z.string().optional(),
  companyContactNumber: z.string().optional(),
  companyEmail: z.string().email().optional().or(z.literal('')),
  companyLogoUrl: z.string().url({ message: "Please enter a valid URL for the company logo." }).optional().or(z.literal('')),
  desiredWebsiteName: z.string().min(1, 'Desired website name is required'),
  hasDomain: z.enum(['Yes', 'No'], { required_error: "Please select if you have a domain."}),
  domainName: z.string().optional(),
  hasHosting: z.enum(['Yes', 'No'], { required_error: "Please select if you have hosting."}),
  hostingProviderName: z.string().optional(),
  needsBusinessEmails: z.enum(['Yes', 'No'], { required_error: "Please select if you need business emails."}),
  businessEmailCount: z.number().min(0, "Number of emails cannot be negative.").optional(),
  preferredBaseColors: z.string().min(1, 'Preferred colors are required'),
  themeStyle: z.enum(themeStyleOptions, { required_error: "Please select a theme style."}),
  themeStyleOther: z.string().optional(),
  inspirationWebsites: z.string().optional(),
  fontPreferences: z.string().optional(),
  logoColors: z.string().optional(),
  otherDesignInstructions: z.string().optional(),
  functionalities: z.object({
    onlineOrdering: z.boolean().optional(),
    paymentGateway: z.boolean().optional(),
    contactForm: z.boolean().optional(),
    blogSection: z.boolean().optional(),
    customerDashboard: z.boolean().optional(),
    adminDashboard: z.boolean().optional(),
    imageVideoGallery: z.boolean().optional(),
    parcelTracking: z.boolean().optional(),
    bookingSystem: z.boolean().optional(),
    inventoryManagement: z.boolean().optional(),
    testimonialsSection: z.boolean().optional(),
    fileDownloads: z.boolean().optional(),
    chatIntegration: z.boolean().optional(),
  }).optional().default({}), // Ensure functionalities object is always present
  paymentGatewaysSelected: z.array(z.enum(paymentGatewayOptions)).optional().default([]),
  otherFeatureRequirements: z.string().optional(),
  pageList: z.string().min(1, 'Page list is required (e.g., Home, About, Contact)'),
  hasPageContent: z.enum(['Yes', 'No'], { required_error: "Please select if you have page content."}),
  wantsContentWriting: z.enum(['Yes', 'No'], { required_error: "Please select if you want content writing services."}),
  hasImagesReady: z.enum(['Yes', 'No'], { required_error: "Please select if you have images ready."}),
  imageSourceUrl: z.string().url({ message: "Please enter a valid URL for image source." }).optional().or(z.literal('')),
  hasLegalDocs: z.enum(['Yes', 'No'], { required_error: "Please select if you have legal documents."}),
  legalDocsSourceUrl: z.string().url({ message: "Please enter a valid URL for legal documents." }).optional().or(z.literal('')),
  preferredLaunchDate: z.string().optional(), 
  projectBudget: z.string().min(1, 'Project budget is required'),
  businessDescriptionGoals: z.string().min(1, 'Business description and goals are required'),
  specialInstructions: z.string().optional(),
  confirmDetailsAccurate: z.boolean().refine(val => val === true, { message: 'You must confirm details are accurate' }),
  agreeToShareContent: z.boolean().refine(val => val === true, { message: 'You must agree to share content' }),
}).superRefine((data, ctx) => {
  if (data.hasDomain === 'Yes' && (!data.domainName || data.domainName.trim() === '')) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Domain name is required if you have a domain.', path: ['domainName'] });
  }
  if (data.hasHosting === 'Yes' && (!data.hostingProviderName || data.hostingProviderName.trim() === '')) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Hosting provider name is required if you have hosting.', path: ['hostingProviderName'] });
  }
  if (data.needsBusinessEmails === 'Yes' && (data.businessEmailCount === undefined || data.businessEmailCount <= 0)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Please specify a valid number of business emails (more than 0).', path: ['businessEmailCount'] });
  }
  if (data.themeStyle === 'Other' && (!data.themeStyleOther || data.themeStyleOther.trim() === '')) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Please specify other theme style if "Other" is selected.', path: ['themeStyleOther'] });
  }
});


export default function FillProjectDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const orderId = params.orderId as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderData, setOrderData] = useState<Order | null>(null);

  const { control, handleSubmit, register, watch, setValue, formState: { errors } } = useForm<ProjectDetailsForm>({
    resolver: zodResolver(projectDetailsSchema),
    defaultValues: {
      functionalities: {},
      paymentGatewaysSelected: [],
      confirmDetailsAccurate: false,
      agreeToShareContent: false,
      hasDomain: undefined, // Explicitly undefined for radio groups
      hasHosting: undefined,
      needsBusinessEmails: undefined,
      hasPageContent: undefined,
      wantsContentWriting: undefined,
      hasImagesReady: undefined,
      hasLegalDocs: undefined,
      themeStyle: undefined,
    },
  });

  const watchHasDomain = watch("hasDomain");
  const watchHasHosting = watch("hasHosting");
  const watchNeedsBusinessEmails = watch("needsBusinessEmails");
  const watchThemeStyle = watch("themeStyle");
  const watchFunctionalityPaymentGateway = watch("functionalities.paymentGateway");

  useEffect(() => {
    if (!orderId) return;
    const fetchOrder = async () => {
      setIsLoading(true);
      try {
        const orderDocRef = doc(db, 'orders', orderId);
        const orderSnap = await getDoc(orderDocRef);
        if (orderSnap.exists()) {
          const fetchedOrder = orderSnap.data() as Order;
          setOrderData(fetchedOrder);
          
          if (fetchedOrder.projectDetails) {
            Object.entries(fetchedOrder.projectDetails).forEach(([key, value]) => {
               if (key === 'preferredLaunchDate' && typeof value === 'string' && value) {
                 // Ensure date is correctly parsed for DatePicker if it's already a string
                 // The DatePicker itself expects a Date object for its `value` prop when setting initially
                 // but receives and onChange provides ISO string. Our zod schema expects string.
                 setValue(key as keyof ProjectDetailsForm, value as any); 
              } else if (typeof value !== 'undefined') { 
                setValue(key as keyof ProjectDetailsForm, value as any);
              }
            });
          } else {
             // Pre-fill some fields from the initial order if projectDetails are not yet submitted
             setValue('contactEmail', fetchedOrder.contactEmail || '');
             setValue('fullName', fetchedOrder.clientName || '');
             setValue('projectBudget', `${fetchedOrder.currencySymbol}${fetchedOrder.budget} ${fetchedOrder.selectedCurrency.toUpperCase()}`);
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

  const onSubmit: SubmitHandler<ProjectDetailsForm> = async (data) => {
    setIsSubmitting(true);
    try {
      const orderDocRef = doc(db, 'orders', orderId);
      // Ensure date is stored as ISO string if present, or undefined
      const dataToSave = {
        ...data,
        preferredLaunchDate: data.preferredLaunchDate ? new Date(data.preferredLaunchDate).toISOString() : undefined,
      };
      await updateDoc(orderDocRef, { projectDetails: dataToSave });
      toast({ title: 'Success', description: 'Project details submitted successfully.' });
      router.push(`/orders/${orderId}`);
    } catch (error) {
      console.error("Error submitting project details:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to submit project details.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4">Loading order information...</p>
      </div>
    );
  }
  if (!orderData) {
     return <div className="container mx-auto p-4 text-center">Order not found or failed to load.</div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-8 font-body">
      <header className="mb-8">
        <h1 className="text-3xl font-bold font-headline text-primary">Project Details Form</h1>
        <p className="text-muted-foreground">Order ID: {orderData.formattedOrderId} - Project: {orderData.projectName}</p>
        <p className="text-muted-foreground">Please fill out the form below with as much detail as possible.</p>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
        <Card>
          <CardHeader><CardTitle>Client & Personal Information</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div><Label htmlFor="fullName">Full Name</Label><Input id="fullName" {...register("fullName")} disabled={isSubmitting} /><p className="text-destructive text-xs mt-1">{errors.fullName?.message}</p></div>
            <div><Label htmlFor="nicNumber">NIC Number</Label><Input id="nicNumber" {...register("nicNumber")} disabled={isSubmitting} /><p className="text-destructive text-xs mt-1">{errors.nicNumber?.message}</p></div>
            <div><Label htmlFor="contactEmail">Email Address</Label><Input id="contactEmail" type="email" {...register("contactEmail")} disabled={isSubmitting} /><p className="text-destructive text-xs mt-1">{errors.contactEmail?.message}</p></div>
            <div><Label htmlFor="phoneNumber">Phone Number</Label><Input id="phoneNumber" type="tel" {...register("phoneNumber")} disabled={isSubmitting} /><p className="text-destructive text-xs mt-1">{errors.phoneNumber?.message}</p></div>
            <div className="md:col-span-2"><Label htmlFor="address">Address</Label><Textarea id="address" {...register("address")} disabled={isSubmitting} /><p className="text-destructive text-xs mt-1">{errors.address?.message}</p></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Business Details (Optional)</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div><Label htmlFor="companyName">Company Name</Label><Input id="companyName" {...register("companyName")} disabled={isSubmitting} /></div>
            <div><Label htmlFor="businessRegNumber">Business Registration Number</Label><Input id="businessRegNumber" {...register("businessRegNumber")} disabled={isSubmitting} /></div>
            <div className="md:col-span-2"><Label htmlFor="companyAddress">Company Address</Label><Textarea id="companyAddress" {...register("companyAddress")} disabled={isSubmitting} /></div>
            <div><Label htmlFor="companyContactNumber">Company Contact Number</Label><Input id="companyContactNumber" type="tel" {...register("companyContactNumber")} disabled={isSubmitting} /></div>
            <div><Label htmlFor="companyEmail">Company Email</Label><Input id="companyEmail" type="email" {...register("companyEmail")} disabled={isSubmitting} /><p className="text-destructive text-xs mt-1">{errors.companyEmail?.message}</p></div>
            <div className="md:col-span-2"><Label htmlFor="companyLogoUrl">Company Logo URL (e.g., Google Drive, Dropbox link)</Label><Input id="companyLogoUrl" type="url" {...register("companyLogoUrl")} placeholder="https://example.com/logo.png" disabled={isSubmitting} /><p className="text-destructive text-xs mt-1">{errors.companyLogoUrl?.message}</p></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Website Details</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div><Label htmlFor="desiredWebsiteName">Desired Website Name / Title</Label><Input id="desiredWebsiteName" {...register("desiredWebsiteName")} disabled={isSubmitting} /><p className="text-destructive text-xs mt-1">{errors.desiredWebsiteName?.message}</p></div>
            <Controller name="hasDomain" control={control} render={({ field }) => (
              <div><Label className="mb-1 block">Do you have a domain?</Label><RadioGroup onValueChange={field.onChange} value={field.value} className="flex gap-4" disabled={isSubmitting}><div className="flex items-center space-x-2"><RadioGroupItem value="Yes" id="domainYes" /><Label htmlFor="domainYes">Yes</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="No" id="domainNo" /><Label htmlFor="domainNo">No</Label></div></RadioGroup><p className="text-destructive text-xs mt-1">{errors.hasDomain?.message}</p></div>
            )} />
            {watchHasDomain === 'Yes' && <div><Label htmlFor="domainName">If yes, Domain Name</Label><Input id="domainName" {...register("domainName")} disabled={isSubmitting} /><p className="text-destructive text-xs mt-1">{errors.domainName?.message}</p></div>}
            
            <Controller name="hasHosting" control={control} render={({ field }) => (
              <div><Label className="mb-1 block">Do you have hosting?</Label><RadioGroup onValueChange={field.onChange} value={field.value} className="flex gap-4" disabled={isSubmitting}><div className="flex items-center space-x-2"><RadioGroupItem value="Yes" id="hostingYes" /><Label htmlFor="hostingYes">Yes</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="No" id="hostingNo" /><Label htmlFor="hostingNo">No</Label></div></RadioGroup><p className="text-destructive text-xs mt-1">{errors.hasHosting?.message}</p></div>
            )} />
            {watchHasHosting === 'Yes' && <div><Label htmlFor="hostingProviderName">If yes, Hosting Provider Name</Label><Input id="hostingProviderName" {...register("hostingProviderName")} disabled={isSubmitting} /><p className="text-destructive text-xs mt-1">{errors.hostingProviderName?.message}</p></div>}

            <Controller name="needsBusinessEmails" control={control} render={({ field }) => (
              <div><Label className="mb-1 block">Do you need business emails (e.g., info@yourdomain.com)?</Label><RadioGroup onValueChange={field.onChange} value={field.value} className="flex gap-4" disabled={isSubmitting}><div className="flex items-center space-x-2"><RadioGroupItem value="Yes" id="emailYes" /><Label htmlFor="emailYes">Yes</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="No" id="emailNo" /><Label htmlFor="emailNo">No</Label></div></RadioGroup><p className="text-destructive text-xs mt-1">{errors.needsBusinessEmails?.message}</p></div>
            )} />
            {watchNeedsBusinessEmails === 'Yes' && <div><Label htmlFor="businessEmailCount">If yes, how many?</Label><Input id="businessEmailCount" type="number" {...register("businessEmailCount", { valueAsNumber: true })} min="1" disabled={isSubmitting} /><p className="text-destructive text-xs mt-1">{errors.businessEmailCount?.message}</p></div>}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader><CardTitle>Design Preferences</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div><Label htmlFor="preferredBaseColors">Preferred Base Colors (e.g., #FF0000, Blue, Dark Gray)</Label><Input id="preferredBaseColors" {...register("preferredBaseColors")} disabled={isSubmitting} /><p className="text-destructive text-xs mt-1">{errors.preferredBaseColors?.message}</p></div>
            <Controller name="themeStyle" control={control} render={({ field }) => (
              <div><Label className="mb-1 block">Theme Style</Label>
                <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                  <SelectTrigger><SelectValue placeholder="Select theme style" /></SelectTrigger>
                  <SelectContent>
                    {themeStyleOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                  </SelectContent>
                </Select><p className="text-destructive text-xs mt-1">{errors.themeStyle?.message}</p>
              </div>
            )} />
            {watchThemeStyle === 'Other' && <div><Label htmlFor="themeStyleOther">If Other, please specify</Label><Input id="themeStyleOther" {...register("themeStyleOther")} disabled={isSubmitting} /><p className="text-destructive text-xs mt-1">{errors.themeStyleOther?.message}</p></div>}
            <div><Label htmlFor="inspirationWebsites">Websites you like for inspiration (URLs, comma-separated)</Label><Textarea id="inspirationWebsites" {...register("inspirationWebsites")} disabled={isSubmitting} placeholder="https://example.com, https://another.com"/></div>
            <div><Label htmlFor="fontPreferences">Font preferences (e.g., Serif, Sans-serif, Specific font names)</Label><Textarea id="fontPreferences" {...register("fontPreferences")} disabled={isSubmitting} /></div>
            <div><Label htmlFor="logoColors">Logo colors (if you have a logo)</Label><Input id="logoColors" {...register("logoColors")} disabled={isSubmitting} /></div>
            <div><Label htmlFor="otherDesignInstructions">Other design instructions</Label><Textarea id="otherDesignInstructions" {...register("otherDesignInstructions")} disabled={isSubmitting} /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Functionality & Features</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <Label>Select desired functionalities (tick checkboxes):</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {functionalityOptions.map(func => (
                <div key={func.id} className="flex items-center space-x-2">
                  <Controller
                    name={`functionalities.${func.id}` as any}
                    control={control}
                    render={({ field }) => <Checkbox id={`func-${func.id}`} checked={!!field.value} onCheckedChange={field.onChange} disabled={isSubmitting}/>}
                  />
                  <Label htmlFor={`func-${func.id}`}>{func.label}</Label>
                </div>
              ))}
            </div>
            {watchFunctionalityPaymentGateway && (
              <div>
                <Label>Select Payment Gateways (if "Payment Gateway Integration" is checked):</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
                  {paymentGatewayOptions.map(pg => (
                    <Controller
                      key={pg}
                      name="paymentGatewaysSelected"
                      control={control}
                      render={({ field }) => (
                        <div className="flex items-center space-x-2">
                           <Checkbox
                            id={`pg-${pg}`}
                            checked={field.value?.includes(pg)}
                            onCheckedChange={(checked) => {
                              const currentSelection = field.value || [];
                              if (checked) {
                                field.onChange([...currentSelection, pg]);
                              } else {
                                field.onChange(currentSelection.filter(val => val !== pg));
                              }
                            }}
                            disabled={isSubmitting}
                          />
                          <Label htmlFor={`pg-${pg}`}>{pg}</Label>
                        </div>
                      )}
                    />
                  ))}
                </div>
              </div>
            )}
            <div><Label htmlFor="otherFeatureRequirements">Other feature requirements</Label><Textarea id="otherFeatureRequirements" {...register("otherFeatureRequirements")} disabled={isSubmitting} /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Content & Pages</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div><Label htmlFor="pageList">List of pages you want (e.g., Home, About, Services, Contact)</Label><Textarea id="pageList" {...register("pageList")} disabled={isSubmitting} /><p className="text-destructive text-xs mt-1">{errors.pageList?.message}</p></div>
            <Controller name="hasPageContent" control={control} render={({ field }) => (
              <div><Label className="mb-1 block">Do you have content (text, images) for these pages?</Label><RadioGroup onValueChange={field.onChange} value={field.value} className="flex gap-4" disabled={isSubmitting}><div className="flex items-center space-x-2"><RadioGroupItem value="Yes" id="contentYes" /><Label htmlFor="contentYes">Yes</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="No" id="contentNo" /><Label htmlFor="contentNo">No</Label></div></RadioGroup><p className="text-destructive text-xs mt-1">{errors.hasPageContent?.message}</p></div>
            )} />
            <Controller name="wantsContentWriting" control={control} render={({ field }) => (
              <div><Label className="mb-1 block">Do you want us to write content for you?</Label><RadioGroup onValueChange={field.onChange} value={field.value} className="flex gap-4" disabled={isSubmitting}><div className="flex items-center space-x-2"><RadioGroupItem value="Yes" id="writeYes" /><Label htmlFor="writeYes">Yes</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="No" id="writeNo" /><Label htmlFor="writeNo">No</Label></div></RadioGroup><p className="text-destructive text-xs mt-1">{errors.wantsContentWriting?.message}</p></div>
            )} />
            <Controller name="hasImagesReady" control={control} render={({ field }) => (
              <div><Label className="mb-1 block">Do you have images ready?</Label><RadioGroup onValueChange={field.onChange} value={field.value} className="flex gap-4" disabled={isSubmitting}><div className="flex items-center space-x-2"><RadioGroupItem value="Yes" id="imagesYes" /><Label htmlFor="imagesYes">Yes</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="No" id="imagesNo" /><Label htmlFor="imagesNo">No</Label></div></RadioGroup><p className="text-destructive text-xs mt-1">{errors.hasImagesReady?.message}</p></div>
            )} />
            <div><Label htmlFor="imageSourceUrl">If you have images online, provide a link (e.g., Google Drive, Dropbox)</Label><Input id="imageSourceUrl" type="url" {...register("imageSourceUrl")} disabled={isSubmitting} placeholder="https://example.com/images_folder" /><p className="text-destructive text-xs mt-1">{errors.imageSourceUrl?.message}</p></div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader><CardTitle>Legal & Documents</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <Controller name="hasLegalDocs" control={control} render={({ field }) => (
              <div><Label className="mb-1 block">Do you have Terms & Conditions and Privacy Policy documents?</Label><RadioGroup onValueChange={field.onChange} value={field.value} className="flex gap-4" disabled={isSubmitting}><div className="flex items-center space-x-2"><RadioGroupItem value="Yes" id="legalYes" /><Label htmlFor="legalYes">Yes</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="No" id="legalNo" /><Label htmlFor="legalNo">No</Label></div></RadioGroup><p className="text-destructive text-xs mt-1">{errors.hasLegalDocs?.message}</p></div>
            )} />
            <div><Label htmlFor="legalDocsSourceUrl">If yes, provide a link to the documents (e.g., Google Drive) or mention you will email them</Label><Input id="legalDocsSourceUrl" type="url" {...register("legalDocsSourceUrl")} disabled={isSubmitting} placeholder="https://example.com/legal_docs" /><p className="text-destructive text-xs mt-1">{errors.legalDocsSourceUrl?.message}</p></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Timeline & Budget</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Preferred website launch date</Label>
              <Controller
                name="preferredLaunchDate"
                control={control}
                render={({ field }) => (
                  <DatePicker 
                    value={field.value ? new Date(field.value) : undefined} 
                    onChange={(date) => field.onChange(date?.toISOString())} 
                    disabled={isSubmitting}
                  />
                )}
              />
              <p className="text-destructive text-xs mt-1">{errors.preferredLaunchDate?.message}</p>
            </div>
            <div>
                <Label htmlFor="projectBudget">Project budget (e.g., LKR 50,000 - 70,000, or specific amount)</Label>
                <Input id="projectBudget" {...register("projectBudget")} disabled={isSubmitting} />
                <p className="text-destructive text-xs mt-1">{errors.projectBudget?.message}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Extra Notes</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div><Label htmlFor="businessDescriptionGoals">Describe your business and goals for this website</Label><Textarea id="businessDescriptionGoals" {...register("businessDescriptionGoals")} rows={5} disabled={isSubmitting} /><p className="text-destructive text-xs mt-1">{errors.businessDescriptionGoals?.message}</p></div>
            <div><Label htmlFor="specialInstructions">Any special instructions or anything else we should know?</Label><Textarea id="specialInstructions" {...register("specialInstructions")} rows={3} disabled={isSubmitting} /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Final Consent</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start space-x-2">
              <Controller name="confirmDetailsAccurate" control={control} render={({ field }) => <Checkbox id="confirmDetailsAccurate" checked={field.value} onCheckedChange={field.onChange} disabled={isSubmitting}/>} />
              <div><Label htmlFor="confirmDetailsAccurate" className="font-normal">I confirm all details provided are accurate to the best of my knowledge.</Label><p className="text-destructive text-xs mt-1">{errors.confirmDetailsAccurate?.message}</p></div>
            </div>
            <div className="flex items-start space-x-2">
              <Controller name="agreeToShareContent" control={control} render={({ field }) => <Checkbox id="agreeToShareContent" checked={field.value} onCheckedChange={field.onChange} disabled={isSubmitting}/>} />
              <div><Label htmlFor="agreeToShareContent" className="font-normal">I agree to share necessary content, files, and provide timely feedback during the project lifecycle.</Label><p className="text-destructive text-xs mt-1">{errors.agreeToShareContent?.message}</p></div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end pt-6">
          <Button type="submit" size="lg" disabled={isSubmitting || isLoading}>
            {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
            Submit Project Details
          </Button>
        </div>
      </form>
    </div>
  );
}

