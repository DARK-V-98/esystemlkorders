
export type OrderStatus = 'Pending' | 'In Progress' | 'Review' | 'Completed' | 'Cancelled';
export type ProjectType = 'New Website' | 'Redesign' | 'Feature Enhancement' | 'Maintenance' | 'Custom Build'; // Added 'Custom Build'

// For custom website form
export interface CustomerDetailsForm {
  name: string;
  email: string;
  projectName: string;
  projectDescription: string;
  numberOfPages: string; // String from form input
}

// For storing selected features in an order
export interface SelectedFeatureInOrder {
  id: string;
  name: string;
  price: number; // Price in the selected currency at the time of order
  currency: Currency;
  currencySymbol: string;
}

export interface Order {
  id: string; // Firestore document ID
  clientName: string; // From form: customerDetails.name
  projectName: string; // From form: customerDetails.projectName
  projectType: ProjectType; // Will be 'Custom Build' for these orders
  status: OrderStatus; // Default to 'Pending'
  description: string; // From form: customerDetails.projectDescription
  requestedFeatures: SelectedFeatureInOrder[]; // Structured list of features
  deadline?: string; // ISO date string, might be set later
  createdDate: string; // ISO date string (converted from Firestore Timestamp)
  contactEmail: string; // From form: customerDetails.email
  budget: number; // This will be the totalPrice from the form
  numberOfPages: number; // Parsed from form
  selectedCurrency: Currency; // usd or lkr
  currencySymbol: string; // $ or Rs.
  userEmail: string; // Email of the logged-in user who submitted
  domain?: string; // Optional, from original Order type
  hostingDetails?: string; // Optional, from original Order type
}

export interface OrderFilters {
  status?: OrderStatus | '';
  projectType?: ProjectType | '';
  searchTerm?: string;
}

export interface SortConfig {
  key: keyof Order | null;
  direction: 'ascending' | 'descending';
}

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role?: 'user' | 'developer' | 'admin' | string;
}

// From custom-website page, for consistency (can be merged or refined later)
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

// For currency context
export type Currency = 'usd' | 'lkr';
