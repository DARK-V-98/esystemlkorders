
import { Badge } from "@/components/ui/badge";
import type { OrderStatus } from "@/types";
import { cn } from "@/lib/utils";

interface OrderStatusBadgeProps {
  status: OrderStatus;
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const statusColors: Record<OrderStatus, string> = {
    Pending: "bg-yellow-500 hover:bg-yellow-500/90",
    "In Progress": "bg-blue-500 hover:bg-blue-500/90",
    Developing: "bg-sky-500 hover:bg-sky-500/90", // New
    "Waiting for Payment": "bg-orange-500 hover:bg-orange-500/90", // New
    Review: "bg-purple-500 hover:bg-purple-500/90",
    Completed: "bg-green-500 hover:bg-green-500/90",
    Suspended: "bg-gray-700 hover:bg-gray-700/90", // New
    Cancelled: "bg-red-600 hover:bg-red-600/90", // Adjusted from red-500 for distinction
    Rejected: "bg-pink-700 hover:bg-pink-700/90", // New
  };

  return (
    <Badge
      className={cn(
        "text-xs font-semibold text-white",
        statusColors[status] || "bg-gray-500 hover:bg-gray-500/90"
      )}
    >
      {status}
    </Badge>
  );
}

