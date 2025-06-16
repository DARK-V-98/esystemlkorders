
export type OrderStatus = 'Pending' | 'In Progress' | 'Review' | 'Completed' | 'Cancelled';
export type ProjectType = 'New Website' | 'Redesign' | 'Feature Enhancement' | 'Maintenance';

export interface Order {
  id: string;
  clientName: string;
  projectName: string;
  projectType: ProjectType;
  status: OrderStatus;
  description: string;
  requestedFeatures: string[];
  deadline: string; // ISO date string
  createdDate: string; // ISO date string
  contactEmail: string;
  budget?: number;
  domain?: string;
  hostingDetails?: string;
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

// Updated AuthUser to include role
export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role?: 'user' | 'developer' | 'admin' | string; // Added role, string for flexibility if more roles are added
}
