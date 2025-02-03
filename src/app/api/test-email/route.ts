// api/test-email/route.ts
import { NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';

// Initialize SendGrid with the API key from environment variables
sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function POST(_request: Request) {
  void _request;
  try {
    // Construct the email message
    const msg = {
      to: 'matias.stur@gmail.com', // Recipient email
      from: process.env.SENDGRID_FROM_EMAIL!, // Verified sender email from your env vars
      subject: 'Standalone Test Email',
      text: 'This is a test email sent from a standalone script.',
      html: '<p>This is a test email sent from a standalone script.</p>',
    };

    // Send the email using SendGrid
    await sgMail.send(msg);
    console.log('Email sent successfully!');
    
    // Return a JSON response indicating success
    return NextResponse.json({ success: true, message: 'Email sent successfully!' });
  } catch (error: unknown) {
    console.error('Error sending email:');
    if (typeof error === 'object' && error !== null && 'response' in error) {
      console.error((error as { response: { body: unknown } }).response.body);
    } else {
      console.error(error instanceof Error ? error.message : error);
    }
    // Return an error response
    return NextResponse.json({ success: false, error: 'Failed to send email' }, { status: 500 });
  }
}
