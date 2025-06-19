
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
  ArrowUpDown,
  ExternalLink,
  Filter,
  Search,
  ListFilter,
} from "lucide-react";
import type { Order, OrderStatus, ProjectType, OrderFilters, SortConfig, SortableOrderKey, PaymentStatus } from "@/types";
import { OrderStatusBadge } from "./order-status-badge";
import { PaymentStatusBadge } from "./payment-status-badge"; // Import PaymentStatusBadge
import { formatDate, ORDER_STATUSES, PROJECT_TYPES } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

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

  React.useEffect(() => {
    const applyFiltersAndSort = () => {
      let processedOrders = [...initialOrders];

      // Apply filtering
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

      // Apply sorting
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

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-headline">Manage Orders</CardTitle>
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
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort("formattedOrderId")} className="px-0">
                    Order ID {renderSortIcon("formattedOrderId")}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort("clientName")} className="px-0">
                    Client {renderSortIcon("clientName")}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort("projectName")} className="px-0">
                    Project {renderSortIcon("projectName")}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort("projectType")} className="px-0">
                    Type {renderSortIcon("projectType")}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort("status")} className="px-0">
                    Order Status {renderSortIcon("status")}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort("paymentStatus")} className="px-0">
                    Payment Status {renderSortIcon("paymentStatus")}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort("deadline")} className="px-0">
                    Deadline {renderSortIcon("deadline")}
                  </Button>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length > 0 ? (
                orders.map((order) => (
                  <TableRow key={order.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{order.formattedOrderId}</TableCell>
                    <TableCell>{order.clientName}</TableCell>
                    <TableCell>{order.projectName}</TableCell>
                    <TableCell>{order.projectType}</TableCell>
                    <TableCell>
                      <OrderStatusBadge status={order.status} />
                    </TableCell>
                    <TableCell>
                      <PaymentStatusBadge status={order.paymentStatus} />
                    </TableCell>
                    <TableCell>{formatDate(order.deadline, 'PP')}</TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/orders/${order.id}`}>
                          View <ExternalLink className="ml-2 h-3 w-3" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center h-24">
                    No orders found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
