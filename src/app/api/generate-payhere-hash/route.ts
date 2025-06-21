
import { NextResponse, type NextRequest } from 'next/server';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const { order_id, amount, currency } = await req.json();

    const merchantId = process.env.NEXT_PUBLIC_PAYHERE_MERCHANT_ID;
    const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;

    if (!merchantId || !merchantSecret) {
      console.error("PayHere environment variables are not set.");
      return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
    }

    const hashedSecret = crypto.createHash('md5').update(merchantSecret).digest('hex').toUpperCase();
    const amountFormatted = parseFloat(amount).toFixed(2).toString();
    
    const hash = crypto.createHash('md5').update(
        merchantId + 
        order_id + 
        amountFormatted + 
        currency + 
        hashedSecret
    ).digest('hex').toUpperCase();

    return NextResponse.json({ hash });

  } catch (error) {
    console.error("Error generating PayHere hash:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
