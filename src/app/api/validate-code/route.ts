// app/api/validate-code/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function POST(request: Request) {
  try {
    const { code } = await request.json();

    // Validate code format
    if (!code || typeof code !== 'string' || code.length !== 6) {
      return NextResponse.json({ error: 'Invalid code format' }, { status: 400 });
    }

    // 1. Check if the submitted code is a master code from the access_codes table.
    const { data: masterData, error: masterError } = await supabase
      .from('access_codes')
      .select('*')
      .eq('code', code)
      .maybeSingle();

    if (masterError) {
      console.error('Error checking master code:', masterError);
    }
    if (masterData) {
      console.log('Master code used.');
      // Optionally, log this event in a logs table.
      return NextResponse.json({ valid: true, message: 'Door unlocked with master code.' });
    }

    // 2. If not a master code, check the active dynamic delivery record.
    const { data, error } = await supabase
      .from('deliveries')
      .select('*')
      .eq('status', 'in_use')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({ valid: false, message: 'No active delivery found.' }, { status: 400 });
    }

    // Validate dynamic code
    if (data.code === code) {
      await supabase
        .from('deliveries')
        .update({ status: 'idle', fail_attempts: 0 })
        .eq('id', data.id);
      console.log('Door Opened with dynamic code');
      return NextResponse.json({ valid: true, message: 'Door unlocked successfully.' });
    } else {
      // Incorrect code: increment fail_attempts
      const newFailAttempts = (data.fail_attempts || 0) + 1;
      await supabase
        .from('deliveries')
        .update({ fail_attempts: newFailAttempts })
        .eq('id', data.id);
      return NextResponse.json({ valid: false, message: 'Invalid Code.' }, { status: 401 });
    }
  } catch (err) {
    console.error('Error validating code:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
