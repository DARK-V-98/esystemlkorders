import { OrderListTable } from "@/components/order-list-table";
import { fetchOrders } from "@/lib/data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

async function OrdersContent() {
  const initialOrders = await fetchOrders();
  return <OrderListTable initialOrders={initialOrders} />;
}

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
              <Skeleton className="h-6 w-2/6" />
              <Skeleton className="h-6 w-1/6" />
              <Skeleton className="h-6 w-1/6" />
              <Skeleton className="h-8 w-16 ml-auto" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
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
      
      <Suspense fallback={<OrderListSkeleton />}>
        <OrdersContent />
      </Suspense>
    </div>
  );
}
