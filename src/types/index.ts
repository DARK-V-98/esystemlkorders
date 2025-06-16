
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

// New type for authenticated user
export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  // Roles can be added here later, e.g., role?: 'user' | 'developer' | 'admin';
  role?: string; // Placeholder for roles for now
}
