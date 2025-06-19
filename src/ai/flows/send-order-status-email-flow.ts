
'use server';
/**
 * @fileOverview A Genkit flow for sending order status update emails.
 *
 * - sendOrderStatusUpdateEmail - A function that triggers the email sending process.
 * - SendOrderStatusEmailInput - The input type for the flow.
 * - SendOrderStatusEmailOutput - The return type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit/zod';
import type { OrderStatus } from '@/types';

export const SendOrderStatusEmailInputSchema = z.object({
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

export const SendOrderStatusEmailOutputSchema = z.object({
  success: z.boolean().describe('Whether the email sending process was initiated successfully.'),
  message: z.string().describe('A message indicating the result of the initiation.'),
});
export type SendOrderStatusEmailOutput = z.infer<typeof SendOrderStatusEmailOutputSchema>;

async function generateEmailContent(input: SendOrderStatusEmailInput): Promise<{ subject: string, body: string }> {
  // This is a placeholder. You can use an LLM to generate email content
  // or use a templating engine (e.g., Handlebars, EJS) with predefined templates.
  
  let subject = `Order Update: Your project "${input.projectName}" is now ${input.newStatus}`;
  let body = `
Hello ${input.customerName},

This is an update regarding your order (${input.formattedOrderId}) for the project "${input.projectName}".

The status has been updated from "${input.oldStatus || 'Previous Status'}" to "${input.newStatus}".

`;

  switch (input.newStatus as OrderStatus) {
    case 'Confirmed': // Assuming 'Confirmed' is a status equivalent to 'In Progress' for email purposes
    case 'In Progress':
      subject = `🚀 Your Project "${input.projectName}" is In Progress! (Order: ${input.formattedOrderId})`;
      body += `We are excited to let you know that work on your project has officially started! We'll keep you updated on our progress.`;
      break;
    case 'Developing':
      subject = `🧑‍💻 Development Update for "${input.projectName}" (Order: ${input.formattedOrderId})`;
      body += `Our team is actively developing your project. We're making great progress and will let you know when it's ready for the next stage.`;
      break;
    case 'Waiting for Payment':
      subject = `💰 Payment Required for "${input.projectName}" (Order: ${input.formattedOrderId})`;
      body += `Your project has reached a stage where payment is required to proceed. Please check your invoice or contact us for payment details.`;
      break;
    case 'Review':
      subject = `👀 Your Project "${input.projectName}" is Ready for Review! (Order: ${input.formattedOrderId})`;
      body += `Great news! Your project is now ready for your review. Please take a look and provide us with your valuable feedback.`;
      // body += `\n\nYou can review it here: ${input.projectLink || 'Please contact us for the review link.'}`;
      break;
    case 'Completed':
      subject = `✅ Your Project "${input.projectName}" is Completed! (Order: ${input.formattedOrderId})`;
      body += `We're thrilled to announce that your project is now complete! Thank you for choosing us. We hope you love the final result.`;
      break;
    case 'Suspended':
      subject = `⏸️ Your Project "${input.projectName}" has been Suspended (Order: ${input.formattedOrderId})`;
      body += `This email is to inform you that your project has been temporarily suspended. We will reach out to you shortly with more details or please contact us if you have any questions.`;
      break;
    case 'Cancelled':
      subject = `❌ Order Cancelled for "${input.projectName}" (Order: ${input.formattedOrderId})`;
      body += `We are writing to confirm that your order for the project "${input.projectName}" has been cancelled. If you have any questions, please don't hesitate to contact us.`;
      break;
    case 'Rejected':
         subject = `❗ Order Rejected for "${input.projectName}" (Order: ${input.formattedOrderId})`;
         body += `We regret to inform you that your order for the project "${input.projectName}" has been rejected. Please contact us for further clarification if needed.`;
         break;
    default:
      body += `If you have any questions, feel free to reply to this email or contact our support team.`;
  }

  body += `

Thank you,
eSystemLK Team
`;
  // For HTML emails, you would construct HTML content here.
  // Example: body = `<h1>Hello ${input.customerName}</h1><p>Your order status is ${input.newStatus}.</p>`;
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

    const { subject, body } = await generateEmailContent(input);

    // **************************************************************************
    // TODO: IMPLEMENT ACTUAL EMAIL SENDING LOGIC HERE
    // This is where you would integrate with your chosen email service provider
    // (e.g., SendGrid, Nodemailer with SMTP, AWS SES, Firebase Email Extensions).
    //
    // Example (conceptual - does not actually send email):
    //
    // try {
    //   const emailService = getYourEmailService(); // Your configured email service
    //   await emailService.send({
    //     to: input.customerEmail,
    //     from: "your-email@example.com", // Configure your sender email
    //     subject: subject,
    //     html: body, // Or text: body for plain text emails
    //   });
    //   console.log(`[sendOrderStatusEmailFlow] Simulated email sent to ${input.customerEmail} for status ${input.newStatus}`);
    //   return { success: true, message: `Email notification for status "${input.newStatus}" would be sent to ${input.customerEmail}.` };
    // } catch (error) {
    //   console.error('[sendOrderStatusEmailFlow] Error sending email (simulation):', error);
    //   return { success: false, message: 'Failed to initiate email sending process.' };
    // }
    // **************************************************************************
    
    // For now, we just log and return success as a placeholder
    console.log(`[sendOrderStatusEmailFlow] PLACHOLDER: Email to ${input.customerEmail} for status ${input.newStatus}`);
    console.log(`[sendOrderStatusEmailFlow] Subject: ${subject}`);
    console.log(`[sendOrderStatusEmailFlow] Body:\n${body}`);

    return {
      success: true,
      message: `Placeholder: Email for status "${input.newStatus}" to ${input.customerEmail} logged. Implement actual sending.`,
    };
  }
);

export async function sendOrderStatusUpdateEmail(input: SendOrderStatusEmailInput): Promise<SendOrderStatusEmailOutput> {
  return sendOrderStatusEmailFlow(input);
}
