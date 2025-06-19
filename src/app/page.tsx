
"use client";

import { OrderListTable } from "@/components/order-list-table";
import { fetchOrders } from "@/lib/data";
import { Card, CardContent, CardHeader } from "@/components/ui/card"; // Removed CardTitle, CardDescription
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/auth-context";
import type { Order } from "@/types";

function OrderListSkeleton() {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <Skeleton className="h-8 w-1/3" /> 
        <div className="flex flex-col sm:flex-row gap-2 mt-4">
          <Skeleton className="h-10 w-full sm:flex-grow" />
          <Skeleton className="h-10 w-full sm:w-auto" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4 p-4 border-b">
              <Skeleton className="h-6 w-1/6" />
              <Skeleton className="h-6 w-1/6" />
              <Skeleton className="h-6 w-1/6" /> {/* Adjusted from 2/6 */}
              <Skeleton className="h-6 w-1/6" />
              <Skeleton className="h-6 w-1/6" />
              <Skeleton className="h-6 w-1/6" /> {/* New for payment status */}
              <Skeleton className="h-8 w-16 ml-auto" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function OrdersContent() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Only fetch if user is loaded and authenticated
    if (user && !user.loading) {
      const loadOrders = async () => {
        setIsLoading(true);
        let fetchedOrders: Order[] = [];
        const allowedRoles = ['admin', 'developer'];

        if (allowedRoles.includes(user.role || '')) {
          fetchedOrders = await fetchOrders(); // Admins/Developers see all orders
        } else if (user.email) {
          // Regular users see only their own orders, filtered by email server-side
          fetchedOrders = await fetchOrders({}, { key: 'createdDate', direction: 'descending' }, user.email);
        }
        setOrders(fetchedOrders);
        setIsLoading(false);
      };
      loadOrders();
    } else if (!user && !user?.loading) {
      // User is not logged in (and loading is false), clear orders and stop loading
      setOrders([]);
      setIsLoading(false);
    }
    // If user.loading is true, we wait for it to become false in a subsequent effect run.
  }, [user]); // Re-fetch if user object changes

  if (isLoading) {
    return <OrderListSkeleton />;
  }

  return <OrderListTable initialOrders={orders} />;
}


export default function OrdersPage() {
  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold font-headline text-primary">
          eSystemLK Orders
        </h1>
        <p className="text-muted-foreground text-lg">
          Overview of all website development projects.
        </p>
      </header>
      
      {/* 
        Suspense is useful for server components. 
        Since OrdersContent is now a client component handling its own loading,
        Suspense might not be strictly necessary here unless there are other 
        server components inside it that need suspending.
        For now, OrdersContent handles its own loading UI.
      */}
      <OrdersContent />
    </div>
  );
}
