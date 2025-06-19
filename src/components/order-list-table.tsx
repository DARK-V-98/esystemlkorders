
"use client";

import * as React from "react";
import Link from "next/link";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ExternalLink,
  Filter,
  Search,
  ListFilter,
  Package as PackageIcon,
  User as UserIcon,
  Info as InfoIcon
} from "lucide-react";
import type { Order, OrderStatus, ProjectType, OrderFilters, SortConfig, SortableOrderKey, PaymentStatus } from "@/types";
import { OrderStatusBadge } from "./order-status-badge";
import { PaymentStatusBadge } from "./payment-status-badge";
import { formatDate, ORDER_STATUSES, PROJECT_TYPES } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile"; // Import useIsMobile

interface OrderListTableProps {
  initialOrders: Order[];
}

export function OrderListTable({ initialOrders }: OrderListTableProps) {
  const [orders, setOrders] = React.useState<Order[]>(initialOrders);
  const [filters, setFilters] = React.useState<OrderFilters>({
    status: "",
    projectType: "",
    searchTerm: "",
  });
  const [sortConfig, setSortConfig] = React.useState<SortConfig>({
    key: "createdDate",
    direction: "descending",
  });
  const { toast } = useToast();
  const isMobile = useIsMobile();

  React.useEffect(() => {
    const applyFiltersAndSort = () => {
      let processedOrders = [...initialOrders];

      if (filters.status) {
        processedOrders = processedOrders.filter(order => order.status === filters.status);
      }
      if (filters.projectType) {
        processedOrders = processedOrders.filter(order => order.projectType === filters.projectType);
      }
      if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        processedOrders = processedOrders.filter(order =>
          order.clientName.toLowerCase().includes(term) ||
          order.projectName.toLowerCase().includes(term) ||
          order.formattedOrderId.toLowerCase().includes(term)
        );
      }

      if (sortConfig.key) {
        processedOrders.sort((a, b) => {
          const valA = a[sortConfig.key!];
          const valB = b[sortConfig.key!];
          let comparison = 0;
          if (valA === undefined || valA === null) comparison = -1;
          else if (valB === undefined || valB === null) comparison = 1;
          else if (typeof valA === 'string' && typeof valB === 'string') {
            comparison = valA.localeCompare(valB);
          } else if (typeof valA === 'number' && typeof valB === 'number') {
            comparison = valA - valB;
          } else if (valA > valB) {
            comparison = 1;
          } else if (valA < valB) {
            comparison = -1;
          }
          return sortConfig.direction === 'ascending' ? comparison : comparison * -1;
        });
      }
      setOrders(processedOrders);
    };

    applyFiltersAndSort();
  }, [filters, sortConfig, initialOrders]);


  const handleSort = (key: SortableOrderKey) => {
    let direction: "ascending" | "descending" = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const handleFilterChange = (filterName: keyof OrderFilters, value: string) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };

  const clearFilters = () => {
    setFilters({ status: "", projectType: "", searchTerm: "" });
    toast({ title: "Filters Cleared", description: "All filters have been reset." });
  };


  const renderSortIcon = (key: SortableOrderKey) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === "ascending" ? " ↑" : " ↓";
    }
    return null;
  };

  const renderFilterControls = () => (
    <div className="flex flex-col sm:flex-row gap-2 mt-4 items-center">
      <div className="relative w-full sm:w-auto sm:flex-grow">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search orders..."
          value={filters.searchTerm}
          onChange={(e) => handleFilterChange("searchTerm", e.target.value)}
          className="pl-8 w-full"
          aria-label="Search orders"
        />
      </div>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full sm:w-auto">
            <ListFilter className="mr-2 h-4 w-4" />
            Filters
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <h4 className="font-medium leading-none">Filter Options</h4>
              <p className="text-sm text-muted-foreground">
                Refine your order list.
              </p>
            </div>
            <div className="grid gap-2">
              <div className="grid grid-cols-3 items-center gap-4">
                <Label htmlFor="status-filter">Status</Label>
                <Select
                  value={filters.status}
                  onValueChange={(value) => handleFilterChange("status", value)}
                >
                  <SelectTrigger id="status-filter" className="col-span-2 h-8">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    {ORDER_STATUSES.map(status => (
                      <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-3 items-center gap-4">
                <Label htmlFor="type-filter">Project Type</Label>
                 <Select
                  value={filters.projectType}
                  onValueChange={(value) => handleFilterChange("projectType", value)}
                >
                  <SelectTrigger id="type-filter" className="col-span-2 h-8">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROJECT_TYPES.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" onClick={clearFilters} className="w-full mt-2">Clear Filters</Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl md:text-2xl font-headline">Manage Orders</CardTitle>
        {renderFilterControls()}
      </CardHeader>
      <CardContent>
        {isMobile ? (
          <div className="space-y-4">
            {orders.length > 0 ? (
              orders.map((order) => (
                <Card key={order.id} className="shadow-md">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold">{order.projectName}</CardTitle>
                    <CardDescription className="text-xs">ID: {order.formattedOrderId}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm pb-4">
                    <div className="flex items-center">
                      <UserIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span>Client: {order.clientName}</span>
                    </div>
                    <div className="flex items-center">
                      <PackageIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                       <span>Type: {order.projectType}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <InfoIcon className="mr-1 h-4 w-4 text-muted-foreground self-start mt-0.5" />
                        <div className="flex flex-col gap-1">
                             <OrderStatusBadge status={order.status} />
                             <PaymentStatusBadge status={order.paymentStatus} />
                        </div>
                    </div>
                     {order.deadline && (
                       <div className="flex items-center text-xs text-muted-foreground">
                         <ExternalLink className="mr-2 h-3 w-3" /> 
                         <span>Deadline: {formatDate(order.deadline, 'PP')}</span>
                       </div>
                     )}
                  </CardContent>
                  <CardFooter>
                    <Button asChild variant="outline" size="sm" className="w-full">
                      <Link href={`/orders/${order.id}`}>
                        View Details <ExternalLink className="ml-2 h-3 w-3" />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <div className="text-center text-muted-foreground py-10">
                No orders found.
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button variant="ghost" onClick={() => handleSort("formattedOrderId")} className="px-0 text-xs">
                      Order ID {renderSortIcon("formattedOrderId")}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => handleSort("clientName")} className="px-0 text-xs">
                      Client {renderSortIcon("clientName")}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => handleSort("projectName")} className="px-0 text-xs">
                      Project {renderSortIcon("projectName")}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => handleSort("projectType")} className="px-0 text-xs">
                      Type {renderSortIcon("projectType")}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => handleSort("status")} className="px-0 text-xs">
                      Order Status {renderSortIcon("status")}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => handleSort("paymentStatus")} className="px-0 text-xs">
                      Payment Status {renderSortIcon("paymentStatus")}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => handleSort("deadline")} className="px-0 text-xs">
                      Deadline {renderSortIcon("deadline")}
                    </Button>
                  </TableHead>
                  <TableHead className="text-right text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.length > 0 ? (
                  orders.map((order) => (
                    <TableRow key={order.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium text-xs">{order.formattedOrderId}</TableCell>
                      <TableCell className="text-xs">{order.clientName}</TableCell>
                      <TableCell className="text-xs">{order.projectName}</TableCell>
                      <TableCell className="text-xs">{order.projectType}</TableCell>
                      <TableCell>
                        <OrderStatusBadge status={order.status} />
                      </TableCell>
                      <TableCell>
                        <PaymentStatusBadge status={order.paymentStatus} />
                      </TableCell>
                      <TableCell className="text-xs">{formatDate(order.deadline, 'PP')}</TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/orders/${order.id}`}>
                            View <ExternalLink className="ml-1.5 h-3 w-3" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center h-24 text-xs">
                      No orders found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

