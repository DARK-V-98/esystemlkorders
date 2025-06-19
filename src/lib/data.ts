
import type { Order, OrderStatus, ProjectType, OrderFilters, SortConfig, SelectedFeatureInOrder } from '@/types';
import { format } from 'date-fns';
import { collection, getDocs, doc, getDoc, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from './firebase';

export async function fetchOrders(
  filters: OrderFilters = {},
  sortConfig: SortConfig = { key: 'createdDate', direction: 'descending' }
): Promise<Order[]> {
  try {
    const ordersCollectionRef = collection(db, 'orders');
    // Consider adding server-side filtering/sorting later if performance becomes an issue
    // For now, fetch all and process client-side as per existing logic.
    const querySnapshot = await getDocs(ordersCollectionRef);
    
    let fetchedOrders: Order[] = querySnapshot.docs.map(docSnapshot => {
      const data = docSnapshot.data();
      // Ensure requestedFeatures is an array, default to empty if not present or malformed
      const requestedFeatures = Array.isArray(data.requestedFeatures) ? data.requestedFeatures : [];
      
      return {
        id: docSnapshot.id,
        formattedOrderId: data.formattedOrderId || docSnapshot.id, // Use formattedOrderId, fallback to doc ID
        clientName: data.clientName || 'N/A',
        projectName: data.projectName || 'N/A',
        projectType: data.projectType || 'Custom Build',
        status: data.status || 'Pending',
        description: data.description || '',
        requestedFeatures: requestedFeatures as SelectedFeatureInOrder[],
        createdDate: data.createdDate instanceof Timestamp ? data.createdDate.toDate().toISOString() : (data.createdDate || new Date().toISOString()),
        deadline: data.deadline instanceof Timestamp ? data.deadline.toDate().toISOString() : data.deadline, // Keep optional
        contactEmail: data.contactEmail || 'N/A',
        budget: data.budget || 0,
        numberOfPages: data.numberOfPages || 0,
        selectedCurrency: data.selectedCurrency || 'usd',
        currencySymbol: data.currencySymbol || '$',
        userEmail: data.userEmail || 'N/A',
        domain: data.domain,
        hostingDetails: data.hostingDetails,
      } as Order;
    });

    // Apply client-side filtering
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
        order.formattedOrderId.toLowerCase().includes(term) // Search by formattedOrderId
      );
    }

    // Apply client-side sorting
    if (sortConfig.key) {
      fetchedOrders.sort((a, b) => {
        const valA = a[sortConfig.key!];
        const valB = b[sortConfig.key!];

        let comparison = 0;
        if (valA === undefined || valA === null) comparison = -1;
        else if (valB === undefined || valB === null) comparison = 1;
        else if (typeof valA === 'string' && typeof valB === 'string') {
          comparison = valA.localeCompare(valB);
        } else if (valA > valB) {
          comparison = 1;
        } else if (valA < valB) {
          comparison = -1;
        }
        
        return sortConfig.direction === 'ascending' ? comparison : comparison * -1;
      });
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
      // Ensure requestedFeatures is an array, default to empty if not present or malformed
      const requestedFeatures = Array.isArray(data.requestedFeatures) ? data.requestedFeatures : [];

      return {
        id: docSnap.id,
        formattedOrderId: data.formattedOrderId || docSnap.id, // Use formattedOrderId, fallback to doc ID
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
export const ORDER_STATUSES: OrderStatus[] = ['Pending', 'In Progress', 'Review', 'Completed', 'Cancelled'];

export function formatDate(dateString: string | undefined | null, dateFormat: string = 'PPP'): string {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      // Try to parse if it's already a number (timestamp)
      const numDate = new Date(Number(dateString));
      if(isNaN(numDate.getTime())) return 'Invalid Date';
      return format(numDate, dateFormat);
    }
    return format(date, dateFormat);
  } catch (error) {
    console.error("Error formatting date:", error, "Input was:", dateString);
    return 'Invalid Date';
  }
}
