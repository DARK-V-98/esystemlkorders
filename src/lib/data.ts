
import type { Order, OrderStatus, ProjectType, OrderFilters, SortConfig, SelectedFeatureInOrder, ProjectDetailsForm, SortableOrderKey } from '@/types';
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
  return defaultToNow ? new Date().toISOString() : undefined;
};


export async function fetchOrders(
  filters: OrderFilters = {},
  sortConfig: SortConfig = { key: 'createdDate', direction: 'descending' }
): Promise<Order[]> {
  try {
    const ordersCollectionRef = collection(db, 'orders');
    const firestoreSortKey: string = sortConfig.key || 'createdDate';
    let queryDirectionToSort: 'asc' | 'desc' = sortConfig.direction === 'ascending' ? 'asc' : 'desc';
    let requiresClientSideReverse = false;

    // Workaround for potential Firestore issues with descending sorts:
    // Query in ascending order and reverse on client if descending is requested.
    if (sortConfig.direction === 'descending') {
      queryDirectionToSort = 'asc';
      requiresClientSideReverse = true;
    }
    
    const q = query(ordersCollectionRef, orderBy(firestoreSortKey, queryDirectionToSort));
    
    const querySnapshot = await getDocs(q);
    
    let fetchedOrders: Order[] = querySnapshot.docs.map(docSnapshot => {
      const data = docSnapshot.data();
      
      return {
        id: docSnapshot.id,
        formattedOrderId: data.formattedOrderId || docSnapshot.id,
        clientName: data.clientName || 'N/A',
        projectName: data.projectName || 'N/A',
        projectType: data.projectType || 'Custom Build',
        status: data.status || 'Pending',
        description: data.description || '',
        requestedFeatures: (Array.isArray(data.requestedFeatures) ? data.requestedFeatures : []) as SelectedFeatureInOrder[],
        createdDate: safeToISOString(data.createdDate, true)!, // Default to now if invalid/missing
        deadline: safeToISOString(data.deadline),
        contactEmail: data.contactEmail || 'N/A',
        budget: typeof data.budget === 'number' ? data.budget : 0,
        numberOfPages: typeof data.numberOfPages === 'number' ? data.numberOfPages : 0,
        selectedCurrency: data.selectedCurrency || 'usd',
        currencySymbol: data.currencySymbol || '$',
        userEmail: data.userEmail || 'N/A',
        domain: data.domain || undefined,
        hostingDetails: data.hostingDetails || undefined,
        projectDetails: data.projectDetails as ProjectDetailsForm | undefined, 
      } as Order;
    });

    if (requiresClientSideReverse) {
      fetchedOrders.reverse();
    }

    // Apply client-side filtering if not handled by Firestore query
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
    // Advise checking Firestore console for index creation links.
    // The error message often includes a link to create missing indexes.
    return [];
  }
}

export async function fetchOrderById(id: string): Promise<Order | undefined> {
  try {
    const orderDocRef = doc(db, 'orders', id);
    const docSnap = await getDoc(orderDocRef);

    if (docSnap.exists()) {
      const data = docSnap.data();

      return {
        id: docSnap.id,
        formattedOrderId: data.formattedOrderId || docSnap.id,
        clientName: data.clientName || 'N/A',
        projectName: data.projectName || 'N/A',
        projectType: data.projectType || 'Custom Build',
        status: data.status || 'Pending',
        description: data.description || '',
        requestedFeatures: (Array.isArray(data.requestedFeatures) ? data.requestedFeatures : []) as SelectedFeatureInOrder[],
        createdDate: safeToISOString(data.createdDate, true)!, // Default to now if invalid/missing
        deadline: safeToISOString(data.deadline),
        contactEmail: data.contactEmail || 'N/A',
        budget: typeof data.budget === 'number' ? data.budget : 0,
        numberOfPages: typeof data.numberOfPages === 'number' ? data.numberOfPages : 0,
        selectedCurrency: data.selectedCurrency || 'usd',
        currencySymbol: data.currencySymbol || '$',
        userEmail: data.userEmail || 'N/A',
        domain: data.domain || undefined,
        hostingDetails: data.hostingDetails || undefined,
        projectDetails: data.projectDetails as ProjectDetailsForm | undefined,
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

export const PROJECT_TYPES: ProjectType[] = ['New Website', 'Redesign', 'Feature Enhancement', 'Maintenance', 'Custom Build'];
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

export function formatDate(dateInput: string | number | Date | undefined | null, dateFormat: string = 'PPP'): string {
  if (!dateInput) return 'N/A';
  try {
    const date = new Date(dateInput); // Works for ISO strings, epoch numbers, and Date objects
    if (isNaN(date.getTime())) { 
      return 'Invalid Date';
    }
    return format(date, dateFormat);
  } catch (error) {
    console.error("Error formatting date:", error, "Input was:", dateInput);
    return 'Invalid Date Format';
  }
}
