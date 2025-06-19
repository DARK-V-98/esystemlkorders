
import { Badge } from "@/components/ui/badge";
import type { PaymentStatus } from "@/types";
import { cn } from "@/lib/utils";

interface PaymentStatusBadgeProps {
  status?: PaymentStatus; // Make status optional as it might not exist on all orders initially
}

export function PaymentStatusBadge({ status = 'Not Paid' }: PaymentStatusBadgeProps) {
  const statusColors: Record<PaymentStatus, string> = {
    'Not Paid': "bg-gray-400 hover:bg-gray-400/90 text-gray-800",
    'Advanced Paid': "bg-teal-500 hover:bg-teal-500/90",
    'Half Paid': "bg-cyan-500 hover:bg-cyan-500/90",
    'Full Paid': "bg-emerald-500 hover:bg-emerald-500/90",
    'Verification Pending': "bg-yellow-500 hover:bg-yellow-500/90 text-yellow-800",
  };

  return (
    <Badge
      className={cn(
        "text-xs font-semibold text-white", // Default text color
        statusColors[status] || "bg-gray-500 hover:bg-gray-500/90"
      )}
    >
      {status}
    </Badge>
  );
}
