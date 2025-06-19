
import { fetchOrderById, formatDate } from "@/lib/data";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { 
    ArrowLeft, Briefcase, CheckSquare, Clock, DollarSign, FileText, FileType, Globe, Info, ListChecks, 
    Mail, PaletteIcon, Server, Settings2, ShieldQuestion, Star, User, Users, Building, Package, Edit3, HelpCircle
} from "lucide-react"; 
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import type { SelectedFeatureInOrder, ProjectDetailsForm, PackageOrderDetailsForm, Order, Price } from "@/types";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";


interface OrderDetailPageProps {
  params: {
    orderId: string;
  };
}

const SectionTitle = ({ icon: Icon, title }: { icon: React.ElementType, title: string }) => (
  <div className="flex items-center text-xl font-semibold text-primary mb-3">
    <Icon className="mr-2 h-5 w-5" /> {title}
  </div>
);

const DetailRow = ({ label, value, isLink, isPreformatted, currencySymbol, currency}: { 
    label: string, 
    value?: string | number | boolean | string[] | Price | null, // Allow Price type
    isLink?: string, 
    isPreformatted?: boolean,
    currencySymbol?: string, // Optional, used if value is a simple number
    currency?: 'lkr' | 'usd' // Optional, used if value is a Price object
 }) => {
  if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '') || (Array.isArray(value) && value.length === 0)) return null;
  
  let displayValue: React.ReactNode = String(value);

  if (typeof value === 'boolean') {
    displayValue = value ? "Yes" : "No";
  } else if (Array.isArray(value)) {
    displayValue = value.join(', ');
  } else if (typeof value === 'object' && 'lkr' in value && 'usd' in value && currency && currencySymbol) {
    // Handling Price object
    const priceObj = value as Price;
    displayValue = `${currencySymbol}${priceObj[currency].toLocaleString()} ${currency.toUpperCase()}`;
  } else if (typeof value === 'number' && currencySymbol) {
    // Handling simple number with currency symbol
    displayValue = `${currencySymbol}${value.toLocaleString()}`;
  }


  return (
    <div className="py-3 grid grid-cols-1 md:grid-cols-3 gap-2 items-start border-b border-border last:border-b-0">
      <dt className="text-sm font-medium text-muted-foreground">{label}:</dt>
      <dd className="text-sm text-foreground md:col-span-2">
        {isLink && typeof value === 'string' && value.startsWith('http') ? (
          <a href={value} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline break-all">
            {displayValue}
          </a>
        ) : isLink && typeof value === 'string' && !value.startsWith('http') && value.includes('@') ? ( 
           <a href={`mailto:${value}`} className="text-accent hover:underline break-all">
            {displayValue}
          </a>
        ) : isPreformatted ? (
          <pre className="whitespace-pre-wrap font-body text-sm bg-muted/30 p-2 rounded-md">{displayValue}</pre>
        ) : (
          <span className="break-words">{displayValue}</span>
        )}
      </dd>
    </div>
  );
};


const FunctionalityDisplay = ({ functionalities, paymentGateways }: { functionalities?: ProjectDetailsForm['functionalities'], paymentGateways?: string[] }) => {
  if (!functionalities || Object.values(functionalities).every(v => !v)) {
    return <p className="text-sm text-muted-foreground">No specific functionalities selected.</p>;
  }

  const selectedFunctionalities = Object.entries(functionalities)
    .filter(([, value]) => value)
    .map(([key]) => {
      const option = projectFunctionalityOptions.find(opt => opt.id === key);
      let formattedKey = option ? option.label : key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      
      if (key === 'paymentGateway' && paymentGateways && paymentGateways.length > 0) {
        return `${formattedKey} (Gateways: ${paymentGateways.join(', ')})`;
      }
      return formattedKey;
    });
    
  if (selectedFunctionalities.length === 0) {
    return <p className="text-sm text-muted-foreground">No specific functionalities selected.</p>;
  }

  return (
    <ul className="list-disc list-inside space-y-1 pl-4">
      {selectedFunctionalities.map((func, idx) => <li key={idx} className="text-sm text-foreground">{func}</li>)}
    </ul>
  );
};

// Simplified display for package add-ons (boolean flags)
const PackageAddonsDisplay = ({ details }: { details?: PackageOrderDetailsForm }) => {
  const selectedFeatures: string[] = [];
  if (details?.featureOnlineOrdering) selectedFeatures.push("Online Ordering");
  if (details?.featureOnlinePayments) selectedFeatures.push("Online Payments");
  if (details?.featureContactForm) selectedFeatures.push("Contact Form");
  if (details?.featureAdminPanel) selectedFeatures.push("Admin Panel");
  if (details?.featureCustomerDashboard) selectedFeatures.push("Customer Dashboard");
  if (details?.featureParcelTracking) selectedFeatures.push("Parcel Tracking");
  if (details?.featureBooking) selectedFeatures.push("Booking System");
  if (details?.featureBlog) selectedFeatures.push("Blog Section");
  if (details?.featureFileDownloads) selectedFeatures.push("File Downloads");
  if (details?.featureChatSupport) selectedFeatures.push("Chat Support");

  if (selectedFeatures.length === 0 && !details?.otherFeatures) {
    return <p className="text-sm text-muted-foreground">No specific add-ons or other requirements selected.</p>;
  }
  
  return (
    <div className="space-y-3">
      {selectedFeatures.length > 0 && (
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">Selected Add-ons:</p>
          <ul className="list-disc list-inside space-y-1 pl-4">
            {selectedFeatures.map((featureName, idx) => (
              <li key={idx} className="text-sm text-foreground">{featureName}</li>
            ))}
          </ul>
        </div>
      )}
      {details?.otherFeatures && (
        <div>
          <p className="text-sm font-medium text-muted-foreground mt-2">Other Requirements:</p>
          <p className="text-sm text-foreground whitespace-pre-wrap bg-muted/30 p-2 rounded-md">{details.otherFeatures}</p>
        </div>
      )}
    </div>
  );
};


const projectFunctionalityOptions = [ 
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


export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const order = await fetchOrderById(params.orderId);

  if (!order) {
    return (
      <div className="container mx-auto p-4 md:p-6 lg:p-8 flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Card className="w-full max-w-md text-center shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-headline">Order Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              The order with ID <span className="font-semibold">{params.orderId}</span> could not be found.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button asChild>
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Orders
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const pd = order.projectDetails;
  const pkgDetails = order.packageOrderDetails;
  const isBudgetPackage = order.projectType === 'Budget Package';

  const getDefaultAccordionOpenValues = (order: Order) => {
    const openValues = ['core-info'];
    if (isBudgetPackage) {
      if (!order.packageOrderDetails) openValues.push('fill-package-details-prompt');
      else openValues.push('package-order-details');
    } else {
      if (!order.projectDetails) openValues.push('fill-project-details-prompt');
      else openValues.push('project-details');
    }
    return openValues;
  };


  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-8 font-body">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline text-primary">
            Order Details
          </h1>
          <p className="text-muted-foreground">ID: {order.formattedOrderId}</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Orders
          </Link>
        </Button>
      </div>

      <Card className="shadow-xl overflow-hidden rounded-xl">
        <div className="relative h-40 md:h-56 w-full bg-gradient-to-r from-primary to-accent">
           <Image
            src="https://placehold.co/1200x350.png"
            alt="Abstract project banner"
            layout="fill"
            objectFit="cover"
            data-ai-hint="abstract gradient"
            priority
          />
          <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center p-4">
            <h2 className="text-3xl md:text-4xl font-bold text-white text-center">{order.projectName}</h2>
            <p className="text-primary-foreground/80 mt-1 text-center">Client: {order.clientName}</p>
          </div>
        </div>

        <CardHeader className="border-b p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-y-2">
            <div className="flex items-center gap-3">
                {isBudgetPackage ? <Package className="h-6 w-6 text-accent" /> : <Briefcase className="h-6 w-6 text-accent" /> }
                <div>
                    <p className="text-sm text-muted-foreground">Project Type</p>
                    <p className="font-semibold text-lg">{order.projectType}</p>
                </div>
            </div>
            <OrderStatusBadge status={order.status} />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Accordion type="multiple" defaultValue={getDefaultAccordionOpenValues(order)} className="w-full">
            <AccordionItem value="core-info">
              <AccordionTrigger className="text-lg font-semibold hover:no-underline px-6 py-4">
                <div className="flex items-center"> <Info className="mr-2 h-5 w-5 text-primary" /> Core Order Information</div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-4 pt-2">
                <dl className="divide-y divide-border">
                  <DetailRow label="Initial Project Description" value={order.description || "No description provided."} isPreformatted/>
                  <DetailRow label="Created Date" value={formatDate(order.createdDate, 'PPpp')} />
                  {order.deadline && <DetailRow label="Initial Deadline" value={formatDate(order.deadline)} />}
                  <DetailRow label="Number of Pages" value={order.numberOfPages?.toString()} />
                  <DetailRow 
                    label="Base Budget/Price" 
                    value={order.budget}
                    currencySymbol={order.currencySymbol}
                  />
                  {order.domain && <DetailRow label="Initial Domain" value={order.domain} isLink={!order.domain.startsWith('http') ? `http://${order.domain}`: order.domain} />}
                  {order.hostingDetails && <DetailRow label="Initial Hosting Details" value={order.hostingDetails} />}
                   {order.requestedFeatures && order.requestedFeatures.length > 0 && (
                    <div className="py-3 border-b border-border last:border-b-0">
                        <dt className="text-sm font-medium text-muted-foreground mb-2">Initially Requested Features/Package Items ({order.requestedFeatures.length}):</dt>
                        <dd className="text-sm text-foreground col-span-2 space-y-2">
                        {order.requestedFeatures.map((feature: SelectedFeatureInOrder, index) => (
                          <Card key={index} className="p-3 bg-muted/30 text-sm rounded-lg shadow-sm">
                            <div className="flex justify-between items-center">
                                <p className="font-medium text-foreground">{feature.name}</p>
                                {/* For package orders, individual feature prices might be 0 or not shown here */}
                                {order.projectType !== 'Budget Package' && (
                                  <p className="font-semibold text-primary">
                                      {feature.currencySymbol}{feature.price.toLocaleString()}
                                  </p>
                                )}
                            </div>
                            {order.projectType !== 'Budget Package' && <p className="text-xs text-muted-foreground mt-1">ID: {feature.id} ({feature.currency.toUpperCase()})</p>}
                          </Card>
                        ))}
                        </dd>
                    </div>
                    )}
                </dl>
              </AccordionContent>
            </AccordionItem>
            
            {/* Conditional rendering for Project Details (Custom Build) */}
            {!isBudgetPackage && pd && (
            <AccordionItem value="project-details">
              <AccordionTrigger className="text-lg font-semibold hover:no-underline px-6 py-4">
                <div className="flex items-center"> <FileText className="mr-2 h-5 w-5 text-primary" /> Detailed Project Specifications</div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-4 pt-2 space-y-6">
                <Card className="border-none shadow-none bg-transparent">
                  <CardHeader className="px-0 pt-0"><SectionTitle icon={User} title="Client & Personal Information" /></CardHeader>
                  <CardContent className="px-0 pb-0"><dl className="divide-y divide-border">
                    <DetailRow label="Full Name" value={pd.fullName} />
                    <DetailRow label="NIC Number" value={pd.nicNumber} />
                    <DetailRow label="Contact Email" value={pd.contactEmail} isLink={pd.contactEmail} />
                    <DetailRow label="Phone Number" value={pd.phoneNumber} />
                    <DetailRow label="Address" value={pd.address} isPreformatted />
                  </dl></CardContent>
                </Card>

                {(pd.companyName || pd.businessRegNumber || pd.companyAddress || pd.companyContactNumber || pd.companyEmail || pd.companyLogoUrl) && (
                  <Card className="border-none shadow-none bg-transparent">
                    <CardHeader className="px-0"><SectionTitle icon={Building} title="Business Details" /></CardHeader>
                    <CardContent className="px-0 pb-0"><dl className="divide-y divide-border">
                      <DetailRow label="Company Name" value={pd.companyName} />
                      <DetailRow label="Business Reg. No." value={pd.businessRegNumber} />
                      <DetailRow label="Company Address" value={pd.companyAddress} isPreformatted />
                      <DetailRow label="Company Contact No." value={pd.companyContactNumber} />
                      <DetailRow label="Company Email" value={pd.companyEmail} isLink={pd.companyEmail} />
                      <DetailRow label="Company Logo URL" value={pd.companyLogoUrl} isLink={pd.companyLogoUrl} />
                    </dl></CardContent>
                  </Card>
                )}

                <Card className="border-none shadow-none bg-transparent">
                  <CardHeader className="px-0"><SectionTitle icon={Globe} title="Website Details" /></CardHeader>
                  <CardContent className="px-0 pb-0"><dl className="divide-y divide-border">
                    <DetailRow label="Desired Website Name" value={pd.desiredWebsiteName} />
                    <DetailRow label="Has Domain?" value={pd.hasDomain} />
                    {pd.hasDomain === 'Yes' && <DetailRow label="Domain Name" value={pd.domainName} isLink={pd.domainName && !pd.domainName.startsWith('http') ? `http://${pd.domainName}` : pd.domainName} />}
                    <DetailRow label="Has Hosting?" value={pd.hasHosting} />
                    {pd.hasHosting === 'Yes' && <DetailRow label="Hosting Provider" value={pd.hostingProviderName} />}
                    <DetailRow label="Needs Business Emails?" value={pd.needsBusinessEmails} />
                    {pd.needsBusinessEmails === 'Yes' && <DetailRow label="No. of Business Emails" value={pd.businessEmailCount?.toString()} />}
                  </dl></CardContent>
                </Card>

                <Card className="border-none shadow-none bg-transparent">
                  <CardHeader className="px-0"><SectionTitle icon={PaletteIcon} title="Design Preferences" /></CardHeader>
                  <CardContent className="px-0 pb-0"><dl className="divide-y divide-border">
                    <DetailRow label="Preferred Base Colors" value={pd.preferredBaseColors} />
                    <DetailRow label="Theme Style" value={pd.themeStyle === 'Other' && pd.themeStyleOther ? `Other: ${pd.themeStyleOther}`: pd.themeStyle} />
                    <DetailRow label="Inspiration Websites" value={pd.inspirationWebsites} isPreformatted/>
                    <DetailRow label="Font Preferences" value={pd.fontPreferences} isPreformatted/>
                    <DetailRow label="Logo Colors" value={pd.logoColors} />
                    <DetailRow label="Other Design Instructions" value={pd.otherDesignInstructions} isPreformatted/>
                  </dl></CardContent>
                </Card>

                <Card className="border-none shadow-none bg-transparent">
                  <CardHeader className="px-0"><SectionTitle icon={Settings2} title="Functionality & Features" /></CardHeader>
                  <CardContent className="px-0 pb-0"><dl className="divide-y divide-border">
                    <div className="py-3 border-b border-border last:border-b-0">
                      <dt className="text-sm font-medium text-muted-foreground mb-2">Selected Functionalities:</dt>
                      <dd><FunctionalityDisplay functionalities={pd.functionalities} paymentGateways={pd.paymentGatewaysSelected} /></dd>
                    </div>
                    <DetailRow label="Other Feature Requirements" value={pd.otherFeatureRequirements} isPreformatted/>
                  </dl></CardContent>
                </Card>

                <Card className="border-none shadow-none bg-transparent">
                  <CardHeader className="px-0"><SectionTitle icon={FileType} title="Content & Pages" /></CardHeader>
                  <CardContent className="px-0 pb-0"><dl className="divide-y divide-border">
                    <DetailRow label="List of Pages" value={pd.pageList} isPreformatted/>
                    <DetailRow label="Has Page Content?" value={pd.hasPageContent} />
                    <DetailRow label="Wants Content Writing?" value={pd.wantsContentWriting} />
                    <DetailRow label="Has Images Ready?" value={pd.hasImagesReady} />
                    <DetailRow label="Image Source URL" value={pd.imageSourceUrl} isLink={pd.imageSourceUrl} />
                  </dl></CardContent>
                </Card>
                
                <Card className="border-none shadow-none bg-transparent">
                  <CardHeader className="px-0"><SectionTitle icon={ShieldQuestion} title="Legal & Documents" /></CardHeader>
                  <CardContent className="px-0 pb-0"><dl className="divide-y divide-border">
                    <DetailRow label="Has Legal Docs (T&C, Privacy)?" value={pd.hasLegalDocs} />
                    <DetailRow label="Legal Docs Source URL" value={pd.legalDocsSourceUrl} isLink={pd.legalDocsSourceUrl} />
                  </dl></CardContent>
                </Card>

                <Card className="border-none shadow-none bg-transparent">
                  <CardHeader className="px-0"><SectionTitle icon={Clock} title="Timeline & Budget" /></CardHeader>
                  <CardContent className="px-0 pb-0"><dl className="divide-y divide-border">
                    <DetailRow label="Preferred Launch Date" value={pd.preferredLaunchDate ? formatDate(pd.preferredLaunchDate) : 'Not specified'} />
                    <DetailRow label="Stated Project Budget" value={pd.projectBudget} />
                  </dl></CardContent>
                </Card>

                <Card className="border-none shadow-none bg-transparent">
                  <CardHeader className="px-0"><SectionTitle icon={Star} title="Extra Notes" /></CardHeader>
                  <CardContent className="px-0 pb-0"><dl className="divide-y divide-border">
                    <DetailRow label="Business Description & Goals" value={pd.businessDescriptionGoals} isPreformatted/>
                    <DetailRow label="Special Instructions" value={pd.specialInstructions} isPreformatted/>
                  </dl></CardContent>
                </Card>
                
                <Card className="border-none shadow-none bg-transparent">
                   <CardHeader className="px-0"><SectionTitle icon={CheckSquare} title="Consent" /></CardHeader>
                   <CardContent className="px-0 pb-0"><dl className="divide-y divide-border">
                        <DetailRow label="Confirmed Details Accurate" value={pd.confirmDetailsAccurate} />
                        <DetailRow label="Agreed to Share Content/Feedback" value={pd.agreeToShareContent} />
                   </dl></CardContent>
                </Card>
              </AccordionContent>
            </AccordionItem>
            )}
            {!isBudgetPackage && !pd && (
              <AccordionItem value="fill-project-details-prompt" className="border-t">
                <AccordionContent className="px-6 py-4 bg-muted/20">
                    <div className="text-center text-muted-foreground">
                        <p className="mb-3 text-base">No detailed project specifications have been submitted for this order yet.</p>
                        <Button asChild variant="default" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                            <Link href={`/fill-project-details/${order.id}`}>
                                <Edit3 className="mr-2 h-4 w-4" /> Click here to fill out the Project Details Form
                            </Link>
                        </Button>
                    </div>
                </AccordionContent>
              </AccordionItem>
            )}

            {/* Conditional rendering for Package Order Details */}
            {isBudgetPackage && pkgDetails && (
              <AccordionItem value="package-order-details">
                <AccordionTrigger className="text-lg font-semibold hover:no-underline px-6 py-4">
                  <div className="flex items-center"> <Package className="mr-2 h-5 w-5 text-primary" /> Package Order Specifications</div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4 pt-2 space-y-6">
                  <Card className="border-none shadow-none bg-transparent">
                    <CardHeader className="px-0 pt-0"><SectionTitle icon={User} title="Basic Info" /></CardHeader>
                    <CardContent className="px-0 pb-0"><dl className="divide-y divide-border">
                      <DetailRow label="Full Name" value={pkgDetails.fullName} />
                      <DetailRow label="NIC Number" value={pkgDetails.nicNumber} />
                      <DetailRow label="Email" value={pkgDetails.email} isLink={pkgDetails.email}/>
                      <DetailRow label="Phone" value={pkgDetails.phone} />
                      <DetailRow label="Address" value={pkgDetails.address} isPreformatted />
                    </dl></CardContent>
                  </Card>

                  <Card className="border-none shadow-none bg-transparent">
                    <CardHeader className="px-0"><SectionTitle icon={Globe} title="Website Setup" /></CardHeader>
                    <CardContent className="px-0 pb-0"><dl className="divide-y divide-border">
                      <DetailRow label="Desired Website Name" value={pkgDetails.websiteName} />
                      <DetailRow label="Needs Setup Assistance?" value={pkgDetails.needsWebsiteSetupAssistance} />
                      <DetailRow label="Has Domain?" value={pkgDetails.hasDomain} />
                      {pkgDetails.hasDomain === 'Yes' && <DetailRow label="Domain Name" value={pkgDetails.domainName} isLink={pkgDetails.domainName && !pkgDetails.domainName.startsWith('http') ? `http://${pkgDetails.domainName}`: pkgDetails.domainName} />}
                      <DetailRow label="Has Hosting?" value={pkgDetails.hasHosting} />
                      {pkgDetails.hasHosting === 'Yes' && <DetailRow label="Hosting Provider" value={pkgDetails.hostingProvider} />}
                      <DetailRow label="Needs Business Emails?" value={pkgDetails.needsBusinessEmail} />
                      {pkgDetails.needsBusinessEmail === 'Yes' && <DetailRow label="No. of Business Emails" value={pkgDetails.businessEmailCount?.toString()} />}
                    </dl></CardContent>
                  </Card>

                  <Card className="border-none shadow-none bg-transparent">
                    <CardHeader className="px-0"><SectionTitle icon={PaletteIcon} title="Design Preferences" /></CardHeader>
                    <CardContent className="px-0 pb-0"><dl className="divide-y divide-border">
                      <DetailRow label="Base Colors" value={pkgDetails.baseColors} />
                      <DetailRow label="Style" value={pkgDetails.style === 'Other' && pkgDetails.styleOther ? `Other: ${pkgDetails.styleOther}`: pkgDetails.style} />
                      <DetailRow label="Inspiration Sites" value={pkgDetails.inspirationSites} isPreformatted />
                      <DetailRow label="Font & Logo Ideas" value={pkgDetails.fontAndLogoIdeas} isPreformatted />
                    </dl></CardContent>
                  </Card>

                  <Card className="border-none shadow-none bg-transparent">
                    <CardHeader className="px-0"><SectionTitle icon={Settings2} title="Add-on Features & Requirements" /></CardHeader>
                    <CardContent className="px-0 pb-0"><dl className="divide-y divide-border">
                       <div className="py-3 border-b border-border last:border-b-0">
                         <dd><PackageAddonsDisplay details={pkgDetails} /></dd>
                       </div>
                    </dl></CardContent>
                  </Card>
                  
                  <Card className="border-none shadow-none bg-transparent">
                      <CardHeader className="px-0"><SectionTitle icon={DollarSign} title="Budget" /></CardHeader>
                      <CardContent className="px-0 pb-0"><dl className="divide-y divide-border">
                          <DetailRow label="User Stated Budget Range" value={pkgDetails.budgetRange} />
                      </dl></CardContent>
                  </Card>

                  <Card className="border-none shadow-none bg-transparent">
                    <CardHeader className="px-0"><SectionTitle icon={Star} title="Notes" /></CardHeader>
                    <CardContent className="px-0 pb-0"><dl className="divide-y divide-border">
                      <DetailRow label="Business Goals / Special Needs" value={pkgDetails.businessGoalsSpecialNeeds} isPreformatted />
                    </dl></CardContent>
                  </Card>

                  <Card className="border-none shadow-none bg-transparent">
                    <CardHeader className="px-0"><SectionTitle icon={CheckSquare} title="Consent" /></CardHeader>
                    <CardContent className="px-0 pb-0"><dl className="divide-y divide-border">
                      <DetailRow label="Confirmed Details Correct" value={pkgDetails.confirmDetailsCorrect} />
                      <DetailRow label="Agreed to Share Materials" value={pkgDetails.agreeToShareMaterials} />
                    </dl></CardContent>
                  </Card>
                </AccordionContent>
              </AccordionItem>
            )}
            {isBudgetPackage && !pkgDetails && (
              <AccordionItem value="fill-package-details-prompt" className="border-t">
                <AccordionContent className="px-6 py-4 bg-muted/20">
                    <div className="text-center text-muted-foreground">
                        <p className="mb-3 text-base">No specific details have been submitted for this package order yet.</p>
                        <Button asChild variant="default" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                            <Link href={`/fill-package-details/${order.id}`}>
                                <Edit3 className="mr-2 h-4 w-4" /> Click here to fill out the Package Details Form
                            </Link>
                        </Button>
                    </div>
                </AccordionContent>
              </AccordionItem>
            )}

          </Accordion>
        </CardContent>

        <CardFooter className="bg-muted/50 p-6 flex flex-col sm:flex-row justify-between items-center gap-3 border-t">
           <p className="text-xs text-muted-foreground">Order ID: {order.formattedOrderId}</p>
           <Button variant="default" className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto" asChild>
              <a href={`mailto:${order.contactEmail}`}>
                <Mail className="mr-2 h-4 w-4" /> Contact Client ({order.contactEmail})
              </a>
           </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
