
import type { Order, OrderStatus, ProjectType, OrderFilters, SortConfig, SelectedFeatureInOrder, ProjectDetailsForm, SortableOrderKey, PackageOrderDetailsForm, PaymentStatus } from '@/types';
import { format } from 'date-fns';
import { collection, getDocs, doc, getDoc, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from './firebase';

// Helper function to safely convert various date inputs to ISO string
const safeToISOString = (dateInput: any, defaultToNow: boolean = false): string | undefined => {
  if (dateInput instanceof Timestamp) {
    return dateInput.toDate().toISOString();
  }
  if (typeof dateInput === 'string' || typeof dateInput === 'number') {
    const parsedDate = new Date(dateInput);
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate.toISOString();
    }
  }
  if (dateInput instanceof Date && !isNaN(dateInput.getTime())) { // Handle if it's already a Date object
    return dateInput.toISOString();
  }
  return defaultToNow ? new Date().toISOString() : undefined;
};


export async function fetchOrders(
  filters: OrderFilters = {},
  sortConfig: SortConfig = { key: 'createdDate', direction: 'descending' },
  userEmailForFilter?: string // Added for server-side filtering by user email
): Promise<Order[]> {
  try {
    const ordersCollectionRef = collection(db, 'orders');
    const firestoreSortKey: string = sortConfig.key || 'createdDate';
    const queryDirectionToSort: 'asc' | 'desc' = sortConfig.direction === 'ascending' ? 'asc' : 'desc';
    
    const queryConstraints = [];
    queryConstraints.push(orderBy(firestoreSortKey, queryDirectionToSort));

    if (userEmailForFilter) {
      queryConstraints.push(where("userEmail", "==", userEmailForFilter));
    }
    
    const q = query(ordersCollectionRef, ...queryConstraints);
    
    const querySnapshot = await getDocs(q);
    
    let fetchedOrders: Order[] = querySnapshot.docs.map(docSnapshot => {
      const data = docSnapshot.data();

      let projectDetails = data.projectDetails as ProjectDetailsForm | undefined;
      if (projectDetails && projectDetails.lastUpdated) {
        projectDetails = {
          ...projectDetails,
          lastUpdated: safeToISOString(projectDetails.lastUpdated),
        };
      }

      let packageOrderDetails = data.packageOrderDetails as PackageOrderDetailsForm | undefined;
      if (packageOrderDetails && packageOrderDetails.lastUpdated) {
        packageOrderDetails = {
          ...packageOrderDetails,
          lastUpdated: safeToISOString(packageOrderDetails.lastUpdated),
        };
      }
      
      return {
        id: docSnapshot.id,
        formattedOrderId: data.formattedOrderId || docSnapshot.id,
        clientName: data.clientName || 'N/A',
        projectName: data.projectName || 'N/A',
        projectType: data.projectType || 'Custom Build',
        status: data.status || 'Pending',
        paymentStatus: data.paymentStatus || 'Not Paid', 
        description: data.description || '',
        requestedFeatures: (Array.isArray(data.requestedFeatures) ? data.requestedFeatures : []) as SelectedFeatureInOrder[],
        createdDate: safeToISOString(data.createdDate, true)!, 
        deadline: safeToISOString(data.deadline),
        contactEmail: data.contactEmail || 'N/A',
        budget: typeof data.budget === 'number' ? data.budget : 0,
        numberOfPages: typeof data.numberOfPages === 'number' ? data.numberOfPages : 0,
        selectedCurrency: data.selectedCurrency || 'usd',
        currencySymbol: data.currencySymbol || '$',
        userEmail: data.userEmail || 'N/A',
        domain: data.domain || undefined,
        hostingDetails: data.hostingDetails || undefined,
        projectDetails: projectDetails, 
        packageOrderDetails: packageOrderDetails,
      } as Order;
    });

    // Client-side filtering for other filters (status, projectType, searchTerm)
    // These are applied *after* potential server-side userEmail filtering.
    if (filters.status) {
      fetchedOrders = fetchedOrders.filter(order => order.status === filters.status);
    }
    if (filters.projectType) {
      fetchedOrders = fetchedOrders.filter(order => order.projectType === filters.projectType);
    }
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      fetchedOrders = fetchedOrders.filter(order =>
        (order.clientName || '').toLowerCase().includes(term) ||
        (order.projectName || '').toLowerCase().includes(term) ||
        (order.formattedOrderId || '').toLowerCase().includes(term)
      );
    }
    return fetchedOrders;

  } catch (error) {
    console.error("Error fetching orders from Firestore:", error);
    return [];
  }
}

export async function fetchOrderById(id: string): Promise<Order | undefined> {
  try {
    const orderDocRef = doc(db, 'orders', id);
    const docSnap = await getDoc(orderDocRef);

    if (docSnap.exists()) {
      const data = docSnap.data();

      let projectDetails = data.projectDetails as ProjectDetailsForm | undefined;
      if (projectDetails && projectDetails.lastUpdated) {
        projectDetails = {
            ...projectDetails,
            lastUpdated: safeToISOString(projectDetails.lastUpdated),
        };
      }

      let packageOrderDetails = data.packageOrderDetails as PackageOrderDetailsForm | undefined;
      if (packageOrderDetails && packageOrderDetails.lastUpdated) {
         packageOrderDetails = {
            ...packageOrderDetails,
            lastUpdated: safeToISOString(packageOrderDetails.lastUpdated),
        };
      }

      return {
        id: docSnap.id,
        formattedOrderId: data.formattedOrderId || docSnap.id,
        clientName: data.clientName || 'N/A',
        projectName: data.projectName || 'N/A',
        projectType: data.projectType || 'Custom Build',
        status: data.status || 'Pending',
        paymentStatus: data.paymentStatus || 'Not Paid', 
        description: data.description || '',
        requestedFeatures: (Array.isArray(data.requestedFeatures) ? data.requestedFeatures : []) as SelectedFeatureInOrder[],
        createdDate: safeToISOString(data.createdDate, true)!, 
        deadline: safeToISOString(data.deadline),
        contactEmail: data.contactEmail || 'N/A',
        budget: typeof data.budget === 'number' ? data.budget : 0,
        numberOfPages: typeof data.numberOfPages === 'number' ? data.numberOfPages : 0,
        selectedCurrency: data.selectedCurrency || 'usd',
        currencySymbol: data.currencySymbol || '$',
        userEmail: data.userEmail || 'N/A',
        domain: data.domain || undefined,
        hostingDetails: data.hostingDetails || undefined,
        projectDetails: projectDetails,
        packageOrderDetails: packageOrderDetails, 
      } as Order;
    } else {
      console.log("No such order document!");
      return undefined;
    }
  } catch (error) {
    console.error("Error fetching order by ID from Firestore:", error);
    return undefined;
  }
}

export const PROJECT_TYPES: ProjectType[] = ['New Website', 'Redesign', 'Feature Enhancement', 'Maintenance', 'Custom Build', 'Budget Package'];
export const ORDER_STATUSES: OrderStatus[] = [
  'Pending', 
  'In Progress', 
  'Developing',
  'Waiting for Payment',
  'Review', 
  'Completed', 
  'Suspended',
  'Cancelled',
  'Rejected',
];

export const PAYMENT_STATUSES: PaymentStatus[] = [
  'Not Paid', 
  'Advanced Paid', 
  'Half Paid', 
  'Full Paid', 
  'Verification Pending'
];

export function formatDate(dateInput: string | number | Date | undefined | null, dateFormat: string = 'PPP'): string {
  if (!dateInput) return 'N/A';
  try {
    // Ensure dateInput is a Date object before formatting
    const date = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
    if (date instanceof Date && !isNaN(date.getTime())) { 
      return format(date, dateFormat);
    }
    return 'Invalid Date';
  } catch (error) {
    console.error("Error formatting date:", error, "Input was:", dateInput);
    return 'Invalid Date Format';
  }
}

