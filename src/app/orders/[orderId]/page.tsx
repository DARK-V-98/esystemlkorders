import { fetchOrderById, formatDate } from "@/lib/data";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, CalendarDays, DollarSign, Briefcase, Users, Mail, Globe, Server, ListChecks, FileText } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";

interface OrderDetailPageProps {
  params: {
    orderId: string;
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
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold font-headline text-primary">
          Order Details: {order.id}
        </h1>
        <Button asChild variant="outline">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Orders
          </Link>
        </Button>
      </div>

      <Card className="shadow-xl overflow-hidden">
        <div className="relative h-48 w-full bg-gradient-to-r from-primary to-accent">
           <Image 
            src="https://placehold.co/1200x300.png" 
            alt="Abstract background" 
            layout="fill" 
            objectFit="cover"
            data-ai-hint="abstract tech"
          />
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <h2 className="text-4xl font-bold text-white text-center px-4">{order.projectName}</h2>
          </div>
        </div>
        
        <CardHeader className="border-b">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <CardDescription className="text-sm">Client: {order.clientName}</CardDescription>
            </div>
            <OrderStatusBadge status={order.status} />
          </div>
        </CardHeader>

        <CardContent className="p-6 grid md:grid-cols-2 gap-x-8 gap-y-6">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-accent mb-2">Project Information</h3>
            <DetailItem icon={Briefcase} label="Project Type" value={order.projectType} />
            <DetailItem icon={FileText} label="Description" value={order.description} className="text-sm leading-relaxed" />
            <DetailItem icon={CalendarDays} label="Created Date" value={formatDate(order.createdDate)} />
            <DetailItem icon={CalendarDays} label="Deadline" value={formatDate(order.deadline)} />
            {order.budget && <DetailItem icon={DollarSign} label="Budget" value={`$${order.budget.toLocaleString()}`} />}
          </div>

          <div className="space-y-4">
             <h3 className="text-xl font-semibold text-accent mb-2">Client & Technical Details</h3>
            <DetailItem icon={Mail} label="Contact Email" value={order.contactEmail} isLink={`mailto:${order.contactEmail}`} />
            {order.domain && <DetailItem icon={Globe} label="Domain" value={order.domain} isLink={`http://${order.domain}`} />}
            {order.hostingDetails && <DetailItem icon={Server} label="Hosting Details" value={order.hostingDetails} />}
          </div>
          
          <div className="md:col-span-2 space-y-4 pt-4 border-t">
            <h3 className="text-xl font-semibold text-accent mb-2">Requested Features</h3>
            {order.requestedFeatures.length > 0 ? (
              <ul className="list-disc list-inside space-y-1 pl-1">
                {order.requestedFeatures.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <ListChecks className="h-4 w-4 mr-2 text-primary flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">No specific features listed.</p>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="bg-muted/50 p-6 flex justify-end">
           <Button variant="default" className="bg-accent hover:bg-accent/90">
              Contact Client
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
  if (!value) return null;
  return (
    <div className="flex items-start space-x-3">
      <Icon className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
      <div>
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
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
