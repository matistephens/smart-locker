// app/api/delivery/close/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import sgMail from '@sendgrid/mail';

// Initialize Supabase client using env variables
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Set up SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

// Utility: Generate a random 6-digit code
const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

// Helper function to log events in Supabase
async function logEvent({ event_type, user_type, details }: { event_type: string, user_type: string, details: string }) {
  const { error } = await supabase
    .from('logs')
    .insert([{ event_type, user_type, details }]);
  if (error) {
    console.error("Logging error:", error);
  }
}

export async function POST(request: Request) {
  const { resident_email } = await request.json();
  if (!resident_email) {
    return NextResponse.json({ error: 'Resident email required' }, { status: 400 });
  }
  
  // Generate a new code and update the delivery record
  const newCode = generateCode();
  
  // Insert a new delivery record with status 'in_use'
  const { data, error } = await supabase
    .from('deliveries')
    .insert([
      { resident_email, code: newCode, status: 'in_use', fail_attempts: 0 }
    ]);
  
  if (error) {
    console.error("Supabase error:", error);
    return NextResponse.json({ error: 'Error creating delivery record' }, { status: 500 });
  }
  
  // Simulate locking the door
  console.log("Door locked");
  await logEvent({
    event_type: 'door_locked',
    user_type: 'delivery',
    details: `Door locked after package drop-off for ${resident_email}`
  });
  
  // Prepare and send the email notification via SendGrid
  const msg = {
    to: resident_email,
    from: process.env.SENDGRID_FROM_EMAIL!,
    subject: 'Your Package Pickup Code',
    text: `Your pickup code is ${newCode}. Please use it to unlock your package box.`,
  };
  
  try {
    await sgMail.send(msg);
    await logEvent({
      event_type: 'email_sent',
      user_type: 'system',
      details: `Email sent to ${resident_email} with code ${newCode}`
    });
  } catch (emailError) {
    console.error("Email sending error:", emailError);
    await logEvent({
      event_type: 'email_error',
      user_type: 'system',
      details: `Failed to send email to ${resident_email}`
    });
  }
  
  return NextResponse.json({ success: true, message: 'Delivery processed, door locked, email sent.' });
}