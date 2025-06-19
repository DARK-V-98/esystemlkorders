
export type OrderStatus =
  | 'Pending'
  | 'In Progress'
  | 'Review'
  | 'Completed'
  | 'Cancelled'
  | 'Rejected'
  | 'Developing'
  | 'Waiting for Payment'
  | 'Suspended';

export type ProjectType = 'New Website' | 'Redesign' | 'Feature Enhancement' | 'Maintenance' | 'Custom Build' | 'Budget Package';

export type PaymentStatus = 
  | 'Not Paid' 
  | 'Advanced Paid' 
  | 'Half Paid' 
  | 'Full Paid' 
  | 'Verification Pending';

export interface CustomerDetailsForm {
  name: string;
  email: string;
  projectName: string;
  projectDescription: string;
  numberOfPages: string;
}

export interface SelectedFeatureInOrder {
  id: string;
  name: string;
  price: number;
  currency: Currency;
  currencySymbol: string;
}

export interface ProjectDetailsForm {
  // Client & Personal Information
  fullName: string;
  nicNumber: string;
  contactEmail: string;
  phoneNumber: string;
  address: string;

  // Business Details (optional)
  companyName?: string;
  businessRegNumber?: string;
  companyAddress?: string;
  companyContactNumber?: string;
  companyEmail?: string;
  companyLogoUrl?: string; 

  // Website Details
  desiredWebsiteName: string;
  hasDomain: 'Yes' | 'No';
  domainName?: string;
  hasHosting: 'Yes' | 'No';
  hostingProviderName?: string;
  needsBusinessEmails: 'Yes' | 'No';
  businessEmailCount?: number;

  // Design Preferences
  preferredBaseColors: string;
  themeStyle: 'Modern' | 'Minimal' | 'Classic' | 'Playful' | 'Elegant' | 'Other';
  themeStyleOther?: string;
  inspirationWebsites?: string;
  fontPreferences?: string;
  logoColors?: string;
  otherDesignInstructions?: string;

  // Functionality & Features
  functionalities?: {
    onlineOrdering?: boolean;
    paymentGateway?: boolean;
    contactForm?: boolean;
    blogSection?: boolean;
    customerDashboard?: boolean;
    adminDashboard?: boolean;
    imageVideoGallery?: boolean;
    parcelTracking?: boolean;
    bookingSystem?: boolean;
    inventoryManagement?: boolean;
    testimonialsSection?: boolean;
    fileDownloads?: boolean;
    chatIntegration?: boolean;
  };
  paymentGatewaysSelected?: Array<'PayHere' | 'Stripe' | 'PayPal'>;
  otherFeatureRequirements?: string;

  // Content & Pages
  pageList: string;
  hasPageContent: 'Yes' | 'No';
  wantsContentWriting: 'Yes' | 'No';
  hasImagesReady: 'Yes' | 'No';
  imageSourceUrl?: string; 

  // Legal & Docs
  hasLegalDocs: 'Yes' | 'No';
  legalDocsSourceUrl?: string; 

  // Timeline & Budget
  preferredLaunchDate?: string; 
  projectBudget: string;

  // Extra Notes
  businessDescriptionGoals: string;
  specialInstructions?: string;

  // Final Consent
  confirmDetailsAccurate: boolean;
  agreeToShareContent: boolean;
  lastUpdated?: string; // Added for serializable timestamp
}

export interface PackageOrderDetailsForm {
  fullName: string;
  nicNumber: string;
  email: string;
  phone: string;
  address: string;
  websiteName: string;
  needsWebsiteSetupAssistance: 'Yes' | 'No';
  hasDomain: 'Yes' | 'No';
  domainName?: string;
  hasHosting: 'Yes' | 'No';
  hostingProvider?: string;
  needsBusinessEmail: 'Yes' | 'No';
  businessEmailCount?: number;
  baseColors: string;
  style: 'Modern' | 'Minimal' | 'Classic' | 'Playful' | 'Elegant' | 'Techy' | 'Bohemian' | 'Artistic' | 'Other';
  styleOther?: string;
  inspirationSites?: string;
  fontAndLogoIdeas?: string;
  featureOnlineOrdering?: boolean;
  featureOnlinePayments?: boolean;
  featureContactForm?: boolean;
  featureAdminPanel?: boolean;
  featureCustomerDashboard?: boolean;
  featureParcelTracking?: boolean;
  featureBooking?: boolean;
  featureBlog?: boolean;
  featureFileDownloads?: boolean;
  featureChatSupport?: boolean;
  otherFeatures?: string;
  budgetRange: string;
  businessGoalsSpecialNeeds?: string;
  confirmDetailsCorrect: boolean;
  agreeToShareMaterials: boolean;
  lastUpdated?: string; // Added for serializable timestamp
}


export interface Order {
  id: string;
  formattedOrderId: string;
  clientName: string;
  projectName: string;
  projectType: ProjectType;
  status: OrderStatus;
  description: string;
  requestedFeatures: SelectedFeatureInOrder[];
  deadline?: string; 
  createdDate: string; 
  contactEmail: string;
  budget: number; 
  numberOfPages: number;
  selectedCurrency: Currency; 
  currencySymbol: string; 
  userEmail: string;
  domain?: string;
  hostingDetails?: string;
  projectDetails?: ProjectDetailsForm; 
  packageOrderDetails?: PackageOrderDetailsForm; 
  paymentStatus?: PaymentStatus; 
}

export interface OrderFilters {
  status?: OrderStatus | '';
  projectType?: ProjectType | '';
  searchTerm?: string;
}

export type SortableOrderKey =
  | 'formattedOrderId'
  | 'clientName'
  | 'projectName'
  | 'projectType'
  | 'status'
  | 'deadline' 
  | 'createdDate' 
  | 'contactEmail'
  | 'budget'
  | 'numberOfPages'
  | 'userEmail'
  | 'paymentStatus'; 

export interface SortConfig {
  key: SortableOrderKey | null; 
  direction: 'ascending' | 'descending';
}

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role?: 'user' | 'developer' | 'admin' | string;
}

export interface Price {
  usd: number;
  lkr: number;
}

export interface FeatureOption {
  id: string;
  name: string;
  description: string;
  price: Price;
  iconName?: string;
}

export interface FeatureCategory {
  id: string;
  name: string;
  description: string;
  iconName: string;
  features: FeatureOption[];
}

export type Currency = 'usd' | 'lkr';

