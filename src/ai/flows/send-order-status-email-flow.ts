
'use server';
/**
 * @fileOverview A Genkit flow for handling order status update notifications.
 * Currently, this is a placeholder and does not send actual emails.
 *
 * - sendOrderStatusUpdateEmail - A function that triggers the notification process.
 * - SendOrderStatusEmailInput - The input type for the flow.
 * - SendOrderStatusEmailOutput - The return type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { OrderStatus } from '@/types';
// import sgMail from '@sendgrid/mail'; // Removed SendGrid

const SendOrderStatusEmailInputSchema = z.object({
  customerEmail: z.string().email().describe('The email address of the customer.'),
  customerName: z.string().describe('The name of the customer.'),
  projectName: z.string().describe('The name of the project.'),
  formattedOrderId: z.string().describe('The formatted order ID.'),
  newStatus: z.string().describe('The new status of the order.'),
  oldStatus: z.string().optional().describe('The previous status of the order, if available.'),
  // You can add more fields here to pass to your email template
  // e.g., projectLink: z.string().url().optional().describe('A link to view the project/order.')
});
export type SendOrderStatusEmailInput = z.infer<typeof SendOrderStatusEmailInputSchema>;

const SendOrderStatusEmailOutputSchema = z.object({
  success: z.boolean().describe('Whether the notification process was successful.'),
  message: z.string().describe('A message indicating the result of the notification process.'),
});
export type SendOrderStatusEmailOutput = z.infer<typeof SendOrderStatusEmailOutputSchema>;

async function generateEmailContent(input: SendOrderStatusEmailInput): Promise<{ subject: string, body: string }> {
  // This is a placeholder for email content generation.
  // You can use an LLM to generate email content or use a templating engine.
  
  let subject = `Order Update: Your project "${input.projectName}" is now ${input.newStatus}`;
  let body = `
<p>Hello ${input.customerName},</p>

<p>This is an update regarding your order (<strong>${input.formattedOrderId}</strong>) for the project "<strong>${input.projectName}</strong>".</p>

<p>The status has been updated from "<strong>${input.oldStatus || 'Previous Status'}</strong>" to "<strong>${input.newStatus}</strong>".</p>
`;

  switch (input.newStatus as OrderStatus) {
    case 'Confirmed': 
    case 'In Progress':
      subject = `🚀 Your Project "${input.projectName}" is In Progress! (Order: ${input.formattedOrderId})`;
      body += `<p>We are excited to let you know that work on your project has officially started! We'll keep you updated on our progress.</p>`;
      break;
    case 'Developing':
      subject = `🧑‍💻 Development Update for "${input.projectName}" (Order: ${input.formattedOrderId})`;
      body += `<p>Our team is actively developing your project. We're making great progress and will let you know when it's ready for the next stage.</p>`;
      break;
    case 'Waiting for Payment':
      subject = `💰 Payment Required for "${input.projectName}" (Order: ${input.formattedOrderId})`;
      body += `<p>Your project has reached a stage where payment is required to proceed. Please check your invoice or contact us for payment details.</p>`;
      break;
    case 'Review':
      subject = `👀 Your Project "${input.projectName}" is Ready for Review! (Order: ${input.formattedOrderId})`;
      body += `<p>Great news! Your project is now ready for your review. Please take a look and provide us with your valuable feedback.</p>`;
      break;
    case 'Completed':
      subject = `✅ Your Project "${input.projectName}" is Completed! (Order: ${input.formattedOrderId})`;
      body += `<p>We're thrilled to announce that your project is now complete! Thank you for choosing us. We hope you love the final result.</p>`;
      break;
    case 'Suspended':
      subject = `⏸️ Your Project "${input.projectName}" has been Suspended (Order: ${input.formattedOrderId})`;
      body += `<p>This email is to inform you that your project has been temporarily suspended. We will reach out to you shortly with more details or please contact us if you have any questions.</p>`;
      break;
    case 'Cancelled':
      subject = `❌ Order Cancelled for "${input.projectName}" (Order: ${input.formattedOrderId})`;
      body += `<p>We are writing to confirm that your order for the project "${input.projectName}" has been cancelled. If you have any questions, please don't hesitate to contact us.</p>`;
      break;
    case 'Rejected':
         subject = `❗ Order Rejected for "${input.projectName}" (Order: ${input.formattedOrderId})`;
         body += `<p>We regret to inform you that your order for the project "${input.projectName}" has been rejected. Please contact us for further clarification if needed.</p>`;
         break;
    default:
      body += `<p>If you have any questions, feel free to reply to this email or contact our support team.</p>`;
  }

  body += `
<br>
<p>Thank you,<br>
eSystemLK Team</p>
`;
  return { subject, body };
}


const sendOrderStatusEmailFlow = ai.defineFlow(
  {
    name: 'sendOrderStatusEmailFlow',
    inputSchema: SendOrderStatusEmailInputSchema,
    outputSchema: SendOrderStatusEmailOutputSchema,
  },
  async (input) => {
    console.log('[sendOrderStatusEmailFlow] Received input:', JSON.stringify(input, null, 2));

    // const apiKey = process.env.SENDGRID_API_KEY; // Removed
    // const fromEmail = process.env.SENDGRID_FROM_EMAIL; // Removed

    // if (!apiKey || !fromEmail) { // Removed
    //   const errorMessage = 'Email service is not configured in environment variables.';
    //   console.error(`[sendOrderStatusEmailFlow] ${errorMessage}`);
    //   return { 
    //     success: false, 
    //     message: `Email configuration error: ${errorMessage} Email not sent.` 
    //   };
    // }

    // sgMail.setApiKey(apiKey); // Removed
    const { subject, body } = await generateEmailContent(input); // Still generate content for logging/future
    console.log(`[sendOrderStatusEmailFlow] Generated email content for ${input.customerEmail} for status ${input.newStatus}:`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${body}`);


    // Placeholder: Actual email sending logic is removed.
    // This section is where you would integrate an email sending service.
    // For now, we just return a success message indicating it's a placeholder.
    const placeholderMessage = `Email notification for status "${input.newStatus}" to ${input.customerEmail} would be sent here (currently a placeholder).`;
    console.log(`[sendOrderStatusEmailFlow] ${placeholderMessage}`);
    
    return { 
      success: true, 
      message: `Notification step processed for ${input.customerEmail}. Email sending is currently a placeholder.` 
    };

    // try { // Removed SendGrid try/catch
    //   await sgMail.send(msg);
    //   console.log(`[sendOrderStatusEmailFlow] Email sent to ${input.customerEmail} via SendGrid for status ${input.newStatus}`);
    //   return { 
    //     success: true, 
    //     message: `Email notification for status "${input.newStatus}" sent to ${input.customerEmail}.` 
    //   };
    // } catch (error: any) {
    //   console.error('[sendOrderStatusEmailFlow] Error sending email via SendGrid:', error);
    //   if (error.response) {
    //     console.error(error.response.body);
    //   }
    //   return { 
    //     success: false, 
    //     message: `Failed to send email: ${error.message || 'Unknown SendGrid error'}.` 
    //   };
    // }
  }
);

export async function sendOrderStatusUpdateEmail(input: SendOrderStatusEmailInput): Promise<SendOrderStatusEmailOutput> {
  return sendOrderStatusEmailFlow(input);
}
