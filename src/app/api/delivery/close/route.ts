// app/api/delivery/close/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import sgMail from '@sendgrid/mail';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

// Utility: Generate a random 6-digit code as a string
const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

export async function POST(request: Request) {
  try {
    const { resident_email } = await request.json();
    if (!resident_email) {
      return NextResponse.json(
        { error: 'Resident email required' },
        { status: 400 }
      );
    }

    // Generate a new 6-digit code
    const newCode = generateCode();

    // Insert a new delivery record with status 'in_use'
    const { data, error } = await supabase
      .from('deliveries')
      .insert([{ resident_email, code: newCode, status: 'in_use', fail_attempts: 0 }])
      .select();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Error creating delivery record' },
        { status: 500 }
      );
    }

    // Log the door locking (simulated)
    console.log('Door locked');

    // Prepare and send the email with the generated code
    const msg = {
      to: resident_email,
      from: process.env.SENDGRID_FROM_EMAIL!,
      subject: 'Your Package Pickup Code',
      text: `Your pickup code is ${newCode}. Please use it to unlock your package box.`,
      html: `<p>Your pickup code is <strong>${newCode}</strong>. Please use it to unlock your package box.</p>`,
    };

    try {
      await sgMail.send(msg);
      console.log('Email sent successfully to', resident_email);
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      // Optionally, you can handle email failures further
    }

    return NextResponse.json({
      success: true,
      message: 'Delivery processed, door locked, email sent.',
    });
  } catch (err) {
    console.error('Error in delivery API:', err);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
