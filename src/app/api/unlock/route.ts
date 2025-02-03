// app/api/unlock/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import sgMail from '@sendgrid/mail';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Set up SendGrid (if not already set globally)
sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

// Helper: Log events to Supabase
async function logEvent({ event_type, user_type, details }: { event_type: string, user_type: string, details: string }) {
  const { error } = await supabase
    .from('logs')
    .insert([{ event_type, user_type, details }]);
  if (error) {
    console.error("Logging error:", error);
  }
}

// Helper: Send alert email for multiple failed attempts
async function sendAlertEmail(resident_email: string) {
  const msg = {
    to: resident_email,
    from: process.env.SENDGRID_FROM_EMAIL!,
    subject: 'Alert: Multiple Failed Access Attempts',
    text: 'There have been multiple failed attempts to access your package. Please be cautious and contact support if this wasn’t you.',
  };
  try {
    await sgMail.send(msg);
    await logEvent({
      event_type: 'alert_email_sent',
      user_type: 'system',
      details: `Alert email sent to ${resident_email} after multiple failed attempts.`
    });
  } catch (error) {
    console.error("Alert email error:", error);
    await logEvent({
      event_type: 'alert_email_error',
      user_type: 'system',
      details: `Failed to send alert email to ${resident_email}.`
    });
  }
}

export async function POST(request: Request) {
  const { code } = await request.json();
  
  // Check for master code first
  const masterCode = process.env.MASTER_CODE;
  if (masterCode && code === masterCode) {
    await logEvent({
      event_type: 'master_code_used',
      user_type: 'admin',
      details: 'Master code used to unlock the door.'
    });
    console.log("Door Opened (via master code)");
    return NextResponse.json({ valid: true, message: 'Door unlocked using master code.' });
  }
  
  // Fetch the active delivery (assuming only one active record)
  const { data, error } = await supabase
    .from('deliveries')
    .select('*')
    .eq('status', 'in_use')
    .single();
  
  if (error || !data) {
    return NextResponse.json({ valid: false, message: 'No active delivery found.' }, { status: 400 });
  }
  
  // Check if the provided code is correct
  if (data.code === code) {
    // Correct code: update status and reset fail_attempts
    await supabase
      .from('deliveries')
      .update({ status: 'idle', fail_attempts: 0 })
      .eq('id', data.id);
      
    await logEvent({
      event_type: 'door_unlocked',
      user_type: 'resident',
      details: 'Resident unlocked door with valid code.'
    });
    console.log("Door Opened");
    return NextResponse.json({ valid: true, message: 'Door unlocked successfully.' });
  } else {
    // Incorrect code: increment fail_attempts
    const newFailAttempts = (data.fail_attempts || 0) + 1;
    await supabase
      .from('deliveries')
      .update({ fail_attempts: newFailAttempts })
      .eq('id', data.id);
      
    await logEvent({
      event_type: 'failed_attempt',
      user_type: 'resident',
      details: `Failed attempt #${newFailAttempts} for delivery ID ${data.id}`
    });
    
    // If three or more failed attempts, trigger an alert email
    if (newFailAttempts >= 3) {
      await sendAlertEmail(data.resident_email);
    }
    
    return NextResponse.json({ valid: false, message: 'Invalid Code.' }, { status: 401 });
  }
}