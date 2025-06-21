
import { NextResponse, type NextRequest } from 'next/server';
import crypto from 'crypto';
import { collection, query, where, getDocs, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { PaymentStatus } from '@/types';

// This is the notify URL for PayHere. It receives real-time updates about payments.
// In a real application, you would:
// 1. Receive the POST request from PayHere.
// 2. Validate the hash (md5sig) to ensure it's a legitimate request from PayHere.
// 3. Update the order status in your database based on the payment status_code.

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const data = Object.fromEntries(formData.entries());

    console.log("Received PayHere notification:", data);

    const merchantId = process.env.NEXT_PUBLIC_PAYHERE_MERCHANT_ID;
    const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;
    const orderId = data.order_id as string;
    const statusCode = data.status_code as string;
    const receivedHash = data.md5sig as string;

    if (!merchantId || !merchantSecret) {
      console.error("PayHere environment variables are not set.");
      return new Response('Server configuration error.', { status: 500 });
    }
    
    // --- Hash Validation (Security Check) ---
    const localHashSource = 
        merchantId +
        orderId +
        data.payhere_amount +
        data.payhere_currency +
        statusCode +
        crypto.createHash('md5').update(merchantSecret).digest('hex').toUpperCase();

    const localHash = crypto.createHash('md5').update(localHashSource).digest('hex').toUpperCase();

    if (localHash !== receivedHash) {
      console.error("PayHere hash validation failed. Received:", receivedHash, "Expected:", localHash);
      return new Response('Hash validation failed.', { status: 400 });
    }
    
    // --- Update Firestore ---
    // Find the order by `formattedOrderId`.
    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, where("formattedOrderId", "==", orderId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        console.error(`Order with formattedOrderId ${orderId} not found.`);
        return new Response('Order not found.', { status: 404 });
    }
    
    const orderDoc = querySnapshot.docs[0];

    let paymentStatus: PaymentStatus;
    switch (statusCode) {
        case '2':
            paymentStatus = 'Full Paid';
            break;
        case '0':
            paymentStatus = 'Verification Pending';
            break;
        case '-1':
            // Status can be updated to 'Cancelled' or remain 'Not Paid'
            paymentStatus = 'Not Paid'; 
            break;
        case '-2':
             // Status can be updated to a 'Failed' status if you add one
            paymentStatus = 'Not Paid';
            break;
        default:
            paymentStatus = 'Not Paid'; // Default or handle other codes
    }
    
    await updateDoc(doc(db, 'orders', orderDoc.id), {
      paymentStatus: paymentStatus,
      paymentGatewayDetails: data, // Store the full payment gateway response
      lastUpdated: serverTimestamp()
    });

    console.log(`Order ${orderId} payment status updated to: ${paymentStatus}`);
    
    return new Response('OK', { status: 200 });

  } catch (error) {
    console.error("Error in PayHere notify endpoint:", error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
