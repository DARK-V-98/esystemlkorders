import type { Order, OrderStatus, ProjectType, OrderFilters, SortConfig } from '@/types';
import { format } from 'date-fns';

const MOCK_ORDERS: Order[] = [
  {
    id: 'ORD001',
    clientName: 'Alice Wonderland',
    projectName: 'E-commerce Platform',
    projectType: 'New Website',
    status: 'Pending',
    description: 'Develop a full-featured e-commerce platform for selling handmade crafts.',
    requestedFeatures: ['User Authentication', 'Product Catalog', 'Shopping Cart', 'Payment Gateway Integration'],
    deadline: new Date(2024, 8, 15).toISOString(),
    createdDate: new Date(2024, 6, 1).toISOString(),
    contactEmail: 'alice@example.com',
    budget: 5000,
    domain: 'wondercrafts.com',
    hostingDetails: 'Client will provide hosting'
  },
  {
    id: 'ORD002',
    clientName: 'Bob The Builder',
    projectName: 'Construction Co. Website Redesign',
    projectType: 'Redesign',
    status: 'In Progress',
    description: 'Redesign existing company website with modern UI/UX and mobile responsiveness.',
    requestedFeatures: ['Portfolio Showcase', 'Service Pages', 'Contact Form', 'Blog'],
    deadline: new Date(2024, 7, 30).toISOString(),
    createdDate: new Date(2024, 6, 5).toISOString(),
    contactEmail: 'bob@example.com',
    budget: 3500,
    domain: 'bobconstructs.com',
  },
  {
    id: 'ORD003',
    clientName: 'Charlie Brown',
    projectName: 'Peanuts Fan Club Portal',
    projectType: 'Feature Enhancement',
    status: 'Review',
    description: 'Add a members-only forum to the existing fan club website.',
    requestedFeatures: ['Forum Software Integration', 'User Roles', 'Moderation Tools'],
    deadline: new Date(2024, 7, 20).toISOString(),
    createdDate: new Date(2024, 6, 10).toISOString(),
    contactEmail: 'charlie@example.com',
    budget: 1500,
  },
  {
    id: 'ORD004',
    clientName: 'Diana Prince',
    projectName: 'Wonder Blog Maintenance',
    projectType: 'Maintenance',
    status: 'Completed',
    description: 'Monthly maintenance, security updates, and content posting for wonderblog.com.',
    requestedFeatures: ['Security Patching', 'Plugin Updates', 'Backup Management'],
    deadline: new Date(2024, 7, 1).toISOString(), // This deadline could be recurring in a real app
    createdDate: new Date(2024, 5, 15).toISOString(),
    contactEmail: 'diana@example.com',
    budget: 500,
  },
  {
    id: 'ORD005',
    clientName: 'Edward Scissorhands',
    projectName: 'Art Portfolio Site',
    projectType: 'New Website',
    status: 'Pending',
    description: 'A visually stunning portfolio website to showcase unique art pieces.',
    requestedFeatures: ['Image Galleries', 'Artist Bio', 'Contact Page', 'Mobile Friendly'],
    deadline: new Date(2024, 9, 1).toISOString(),
    createdDate: new Date(2024, 6, 20).toISOString(),
    contactEmail: 'edward@example.com',
    budget: 2500,
    domain: 'edwardart.net',
  },
  {
    id: 'ORD006',
    clientName: 'Fiona Gallagher',
    projectName: 'Community Event App',
    projectType: 'Feature Enhancement',
    status: 'In Progress',
    description: 'Add event ticketing and RSVP functionality to the community app.',
    requestedFeatures: ['Ticketing System', 'RSVP Tracking', 'Email Notifications'],
    deadline: new Date(2024, 8, 25).toISOString(),
    createdDate: new Date(2024, 6, 22).toISOString(),
    contactEmail: 'fiona@example.com',
    budget: 2200,
  },
  {
    id: 'ORD007',
    clientName: 'George Costanza',
    projectName: 'Vandelay Industries Internal Tool',
    projectType: 'New Website',
    status: 'Cancelled',
    description: 'Internal tool for latex sales. Project cancelled due to unforeseen circumstances.',
    requestedFeatures: ['Inventory Management', 'Sales Tracking'],
    deadline: new Date(2024, 7, 10).toISOString(),
    createdDate: new Date(2024, 6, 2).toISOString(),
    contactEmail: 'george@example.com',
    budget: 4000,
  },
];

export async function fetchOrders(
  filters: OrderFilters = {},
  sortConfig: SortConfig = { key: 'createdDate', direction: 'descending' }
): Promise<Order[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));

  let filteredOrders = MOCK_ORDERS.filter(order => {
    const statusMatch = !filters.status || order.status === filters.status;
    const typeMatch = !filters.projectType || order.projectType === filters.projectType;
    const searchTermMatch = !filters.searchTerm ||
      order.clientName.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      order.projectName.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      order.id.toLowerCase().includes(filters.searchTerm.toLowerCase());
    return statusMatch && typeMatch && searchTermMatch;
  });

  if (sortConfig.key) {
    filteredOrders.sort((a, b) => {
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

  return JSON.parse(JSON.stringify(filteredOrders)); // Deep copy to simulate fresh data
}

export async function fetchOrderById(id: string): Promise<Order | undefined> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 200));
  const order = MOCK_ORDERS.find(order => order.id === id);
  return order ? JSON.parse(JSON.stringify(order)) : undefined; // Deep copy
}

export const PROJECT_TYPES: ProjectType[] = ['New Website', 'Redesign', 'Feature Enhancement', 'Maintenance'];
export const ORDER_STATUSES: OrderStatus[] = ['Pending', 'In Progress', 'Review', 'Completed', 'Cancelled'];

export function formatDate(dateString: string, dateFormat: string = 'PPP'): string {
  if (!dateString) return 'N/A';
  try {
    return format(new Date(dateString), dateFormat);
  } catch (error) {
    return 'Invalid Date';
  }
}
