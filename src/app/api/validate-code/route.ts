// app/api/validate-code/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client using environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function POST(request: Request) {
  try {
    const { code } = await request.json();

    // Basic validation on the code format
    if (!code || typeof code !== 'string' || code.length !== 6) {
      return NextResponse.json(
        { error: 'Invalid code format' },
        { status: 400 }
      );
    }

    // Query Supabase for the provided code
    const { data, error } = await supabase
      .from('access_codes')
      .select('*')
      .eq('code', code)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { valid: false, message: 'Error validating code' },
        { status: 500 }
      );
    }

    if (data) {
      // Simulate unlocking the door in the server logs
      console.log('Door Opened');
      return NextResponse.json({ valid: true });
    } else {
      return NextResponse.json(
        { valid: false, message: 'Invalid Code' },
        { status: 401 }
      );
    }
  } catch (err) {
    console.error('Validation error:', err);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
