
import type { Order, OrderStatus, ProjectType, OrderFilters, SortConfig } from '@/types';
import { format } from 'date-fns';
import { collection, getDocs, doc, getDoc, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from './firebase'; // Import Firestore instance

// Note: The MOCK_ORDERS array is no longer used as data is fetched from Firestore.

export async function fetchOrders(
  filters: OrderFilters = {},
  sortConfig: SortConfig = { key: 'createdDate', direction: 'descending' }
): Promise<Order[]> {
  // Simulate API delay - can be removed if not needed
  // await new Promise(resolve => setTimeout(resolve, 300));

  try {
    const ordersCollectionRef = collection(db, 'orders');
    // For simplicity and to keep existing filter/sort logic, we fetch all orders
    // and then filter/sort client-side. For larger datasets, consider
    // implementing more complex Firestore queries or a dedicated search service.
    const querySnapshot = await getDocs(ordersCollectionRef);
    
    let fetchedOrders: Order[] = querySnapshot.docs.map(docSnapshot => {
      const data = docSnapshot.data();
      return {
        id: docSnapshot.id,
        ...data,
        // Convert Firestore Timestamps to ISO strings
        createdDate: data.createdDate instanceof Timestamp ? data.createdDate.toDate().toISOString() : data.createdDate,
        deadline: data.deadline instanceof Timestamp ? data.deadline.toDate().toISOString() : data.deadline,
      } as Order;
    });

    // Apply client-side filtering (matches previous mock data behavior)
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
        order.id.toLowerCase().includes(term)
      );
    }

    // Apply client-side sorting (matches previous mock data behavior)
    if (sortConfig.key) {
      fetchedOrders.sort((a, b) => {
        const valA = a[sortConfig.key!];
        const valB = b[sortConfig.key!];

        let comparison = 0;
        if (valA === undefined || valA === null) comparison = -1;
        else if (valB === undefined || valB === null) comparison = 1;
        else if (valA > valB) comparison = 1;
        else if (valA < valB) comparison = -1;
        
        return sortConfig.direction === 'ascending' ? comparison : comparison * -1;
      });
    }
    return fetchedOrders;

  } catch (error) {
    console.error("Error fetching orders from Firestore:", error);
    return []; // Return empty array on error
  }
}

export async function fetchOrderById(id: string): Promise<Order | undefined> {
  // Simulate API delay - can be removed
  // await new Promise(resolve => setTimeout(resolve, 200));
  try {
    const orderDocRef = doc(db, 'orders', id);
    const docSnap = await getDoc(orderDocRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        // Convert Firestore Timestamps to ISO strings
        createdDate: data.createdDate instanceof Timestamp ? data.createdDate.toDate().toISOString() : data.createdDate,
        deadline: data.deadline instanceof Timestamp ? data.deadline.toDate().toISOString() : data.deadline,
      } as Order;
    } else {
      console.log("No such document!");
      return undefined;
    }
  } catch (error) {
    console.error("Error fetching order by ID from Firestore:", error);
    return undefined;
  }
}

export const PROJECT_TYPES: ProjectType[] = ['New Website', 'Redesign', 'Feature Enhancement', 'Maintenance'];
export const ORDER_STATUSES: OrderStatus[] = ['Pending', 'In Progress', 'Review', 'Completed', 'Cancelled'];

export function formatDate(dateString: string, dateFormat: string = 'PPP'): string {
  if (!dateString) return 'N/A';
  try {
    // Ensure the date string is valid before formatting
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    return format(date, dateFormat);
  } catch (error) {
    console.error("Error formatting date:", error, "Input was:", dateString);
    return 'Invalid Date';
  }
}
