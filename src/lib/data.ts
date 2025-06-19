
import type { Order, OrderStatus, ProjectType, OrderFilters, SortConfig, SelectedFeatureInOrder, ProjectDetailsForm } from '@/types';
import { format } from 'date-fns';
import { collection, getDocs, doc, getDoc, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from './firebase';

export async function fetchOrders(
  filters: OrderFilters = {},
  sortConfig: SortConfig = { key: 'createdDate', direction: 'descending' }
): Promise<Order[]> {
  try {
    const ordersCollectionRef = collection(db, 'orders');
    const q = query(ordersCollectionRef, orderBy(sortConfig.key || 'createdDate', sortConfig.direction));
    const querySnapshot = await getDocs(q);
    
    let fetchedOrders: Order[] = querySnapshot.docs.map(docSnapshot => {
      const data = docSnapshot.data();
      const requestedFeatures = Array.isArray(data.requestedFeatures) ? data.requestedFeatures : [];
      
      return {
        id: docSnapshot.id,
        formattedOrderId: data.formattedOrderId || docSnapshot.id,
        clientName: data.clientName || 'N/A',
        projectName: data.projectName || 'N/A',
        projectType: data.projectType || 'Custom Build',
        status: data.status || 'Pending',
        description: data.description || '',
        requestedFeatures: requestedFeatures as SelectedFeatureInOrder[],
        createdDate: data.createdDate instanceof Timestamp ? data.createdDate.toDate().toISOString() : (data.createdDate || new Date().toISOString()),
        deadline: data.deadline instanceof Timestamp ? data.deadline.toDate().toISOString() : data.deadline,
        contactEmail: data.contactEmail || 'N/A',
        budget: data.budget || 0,
        numberOfPages: data.numberOfPages || 0,
        selectedCurrency: data.selectedCurrency || 'usd',
        currencySymbol: data.currencySymbol || '$',
        userEmail: data.userEmail || 'N/A',
        domain: data.domain,
        hostingDetails: data.hostingDetails,
        projectDetails: data.projectDetails as ProjectDetailsForm | undefined, // Ensure this is mapped
      } as Order;
    });

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
        order.clientName.toLowerCase().includes(term) ||
        order.projectName.toLowerCase().includes(term) ||
        order.formattedOrderId.toLowerCase().includes(term)
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
      const requestedFeatures = Array.isArray(data.requestedFeatures) ? data.requestedFeatures : [];

      return {
        id: docSnap.id,
        formattedOrderId: data.formattedOrderId || docSnap.id,
        clientName: data.clientName || 'N/A',
        projectName: data.projectName || 'N/A',
        projectType: data.projectType || 'Custom Build',
        status: data.status || 'Pending',
        description: data.description || '',
        requestedFeatures: requestedFeatures as SelectedFeatureInOrder[],
        createdDate: data.createdDate instanceof Timestamp ? data.createdDate.toDate().toISOString() : (data.createdDate || new Date().toISOString()),
        deadline: data.deadline instanceof Timestamp ? data.deadline.toDate().toISOString() : data.deadline,
        contactEmail: data.contactEmail || 'N/A',
        budget: data.budget || 0,
        numberOfPages: data.numberOfPages || 0,
        selectedCurrency: data.selectedCurrency || 'usd',
        currencySymbol: data.currencySymbol || '$',
        userEmail: data.userEmail || 'N/A',
        domain: data.domain,
        hostingDetails: data.hostingDetails,
        projectDetails: data.projectDetails as ProjectDetailsForm | undefined, // Ensure this is mapped
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

export function formatDate(dateString: string | undefined | null, dateFormat: string = 'PPP'): string {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    // Check if date is Invalid Date
    if (isNaN(date.getTime())) { 
      // Attempt to parse if it's a number string (timestamp)
      const numDate = new Date(Number(dateString));
      if(isNaN(numDate.getTime())) return 'Invalid Date'; // Still invalid
      return format(numDate, dateFormat);
    }
    return format(date, dateFormat);
  } catch (error) {
    console.error("Error formatting date:", error, "Input was:", dateString);
    return 'Invalid Date Format'; // More specific error message
  }
}
