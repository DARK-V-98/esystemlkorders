
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { XCircle, RefreshCw } from "lucide-react";

export default function PaymentCancelPage() {
  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
      <Card className="w-full max-w-md text-center shadow-lg">
        <CardHeader className="items-center">
          <XCircle className="h-16 w-16 text-destructive mb-4" />
          <CardTitle className="text-xl md:text-2xl font-headline">Payment Canceled</CardTitle>
          <CardDescription>Your payment was not completed.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            It looks like you've canceled the payment process. Your order has not been completed. If this was a mistake, you can try again.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button asChild>
            <Link href="/online-payment">
              <RefreshCw className="mr-2 h-4 w-4" /> Try Again
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
