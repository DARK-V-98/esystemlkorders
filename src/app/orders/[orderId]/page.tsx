
import { fetchOrderById, formatDate } from "@/lib/data";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, CalendarDays, DollarSign, Briefcase, Users, Mail, Globe, Server, ListChecks, FileText, Package, User, Tag, HelpCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { SelectedFeatureInOrder } from "@/types";

interface OrderDetailPageProps {
  params: {
    orderId: string; // This is the Firestore document ID
  };
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const order = await fetchOrderById(params.orderId);

  if (!order) {
    return (
      <div className="container mx-auto p-4 md:p-6 lg:p-8 flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Card className="w-full max-w-md text-center shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-headline">Order Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              The order with ID <span className="font-semibold">{params.orderId}</span> could not be found.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button asChild>
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Orders
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline text-primary">
            Order Details
          </h1>
          {/* Display formattedOrderId to the user */}
          <p className="text-muted-foreground">ID: {order.formattedOrderId}</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Orders
          </Link>
        </Button>
      </div>

      <Card className="shadow-xl overflow-hidden rounded-xl">
        <div className="relative h-40 md:h-56 w-full bg-gradient-to-r from-primary to-accent">
           <Image
            src="https://placehold.co/1200x350.png"
            alt="Abstract project banner"
            layout="fill"
            objectFit="cover"
            data-ai-hint="abstract gradient"
            priority
          />
          <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center p-4">
            <h2 className="text-3xl md:text-4xl font-bold text-white text-center">{order.projectName}</h2>
            <p className="text-primary-foreground/80 mt-1 text-center">Client: {order.clientName}</p>
          </div>
        </div>

        <CardHeader className="border-b p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-y-2">
            <div className="flex items-center gap-3">
                <Briefcase className="h-6 w-6 text-accent" />
                <div>
                    <p className="text-sm text-muted-foreground">Project Type</p>
                    <p className="font-semibold text-lg">{order.projectType}</p>
                </div>
            </div>
            <OrderStatusBadge status={order.status} />
          </div>
        </CardHeader>

        <CardContent className="p-6 grid md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
          <div className="space-y-4 lg:col-span-2">
            <h3 className="text-xl font-semibold text-accent flex items-center mb-3">
              <FileText className="mr-2 h-5 w-5"/> Project & Client Information
            </h3>
            <DetailItem icon={User} label="Client Name" value={order.clientName} />
            <DetailItem icon={Mail} label="Contact Email" value={order.contactEmail} isLink={`mailto:${order.contactEmail}`} />
            {order.userEmail && <DetailItem icon={User} label="Submitted By (User Email)" value={order.userEmail} />}
            <DetailItem icon={HelpCircle} label="Project Description" value={order.description || "No description provided."} className="text-sm leading-relaxed whitespace-pre-wrap" />
            <DetailItem icon={CalendarDays} label="Created Date" value={formatDate(order.createdDate)} />
            {order.deadline && <DetailItem icon={CalendarDays} label="Deadline" value={formatDate(order.deadline)} />}
            <DetailItem icon={Package} label="Number of Pages" value={order.numberOfPages?.toString()} />
            <DetailItem icon={DollarSign} label="Total Budget" value={`${order.currencySymbol}${order.budget.toLocaleString()} ${order.selectedCurrency.toUpperCase()}`} />
            {order.domain && <DetailItem icon={Globe} label="Domain" value={order.domain} isLink={!order.domain.startsWith('http') ? `http://${order.domain}`: order.domain} />}
            {order.hostingDetails && <DetailItem icon={Server} label="Hosting Details" value={order.hostingDetails} />}
          </div>

          <div className="space-y-4 lg:col-span-1 border-t md:border-t-0 md:border-l md:pl-8 pt-6 md:pt-0">
            <h3 className="text-xl font-semibold text-accent flex items-center mb-3">
              <ListChecks className="mr-2 h-5 w-5"/>
              Requested Features 
              {order.requestedFeatures && order.requestedFeatures.length > 0 ? ` (${order.requestedFeatures.length})` : ''}
            </h3>
            {order.requestedFeatures && order.requestedFeatures.length > 0 ? (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {order.requestedFeatures.map((feature: SelectedFeatureInOrder, index) => (
                  <Card key={index} className="p-3 bg-muted/30 text-sm rounded-lg shadow-sm">
                    <div className="flex justify-between items-center">
                        <p className="font-medium text-foreground">{feature.name}</p>
                        <p className="font-semibold text-primary">
                            {feature.currencySymbol}{feature.price.toLocaleString()}
                        </p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">ID: {feature.id} ({feature.currency.toUpperCase()})</p>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No specific features were selected for this order.</p>
            )}
          </div>
        </CardContent>

        <CardFooter className="bg-muted/50 p-6 flex flex-col sm:flex-row justify-between items-center gap-3">
           {/* Display formattedOrderId in footer */}
           <p className="text-xs text-muted-foreground">Order ID: {order.formattedOrderId}</p>
           <Button variant="default" className="bg-accent hover:bg-accent/90 w-full sm:w-auto">
              <Mail className="mr-2 h-4 w-4" /> Contact Client
           </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

interface DetailItemProps {
  icon: React.ElementType;
  label: string;
  value: string | number | undefined;
  className?: string;
  isLink?: string;
}

function DetailItem({ icon: Icon, label, value, className, isLink }: DetailItemProps) {
  if (value === undefined || value === null || value === '') return null;
  return (
    <div className="flex items-start space-x-3">
      <Icon className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
        {isLink ? (
          <a href={isLink} target="_blank" rel="noopener noreferrer" className={cn("text-foreground hover:underline", className)}>
            {value}
          </a>
        ) : (
          <p className={cn("text-foreground", className)}>{value}</p>
        )}
      </div>
    </div>
  );
}
