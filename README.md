# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Environment Variables

This project uses environment variables for Firebase configuration. You will need to create a `.env.local` file in the root of your project and add your Firebase project's configuration details.

Example `.env.local`:
```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1234567890
NEXT_PUBLIC_FIREBASE_APP_ID=1:1234567890:web:abcdef1234567890
```

### Email Notifications (SendGrid)

If you plan to use email notifications for order status updates (as implemented in `src/ai/flows/send-order-status-email-flow.ts`), you will also need to configure SendGrid:

1.  Sign up for a [SendGrid account](https://sendgrid.com/).
2.  Create an API Key with "Mail Send" permissions.
3.  Verify a "Single Sender" or "Domain" in SendGrid. This will be your "from" email address.
4.  Add the following environment variables to your `.env.local` file and your deployment environment:

```
SENDGRID_API_KEY=SG.your_actual_sendgrid_api_key
SENDGRID_FROM_EMAIL=your_verified_sender@example.com
```

**Important**: Keep your `SENDGRID_API_KEY` secure and do not commit it to your repository.
