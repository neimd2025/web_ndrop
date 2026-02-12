
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkPublication() {
  console.log('Checking supabase_realtime publication...');
  
  // We cannot directly query pg_publication_tables via JS client unless we have a stored procedure or can run SQL.
  // But we can check if we can subscribe to changes.
  
  const channel = supabase.channel('test_channel')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, (payload) => {
      console.log('Received event:', payload);
    })
    .subscribe((status) => {
      console.log('Subscription status:', status);
    });
    
  // Wait a bit
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Get a valid user ID
  const { data: users, error: userError } = await supabase.from('user_profiles').select('id').limit(1);
  if (userError || !users || users.length === 0) {
    console.error('Failed to get a user:', userError);
    return;
  }
  const userId = users[0].id;
  console.log('Using user ID:', userId);
  
  // Insert a test notification
  console.log('Inserting test notification...');
  const { data, error } = await supabase.from('notifications').insert({
    user_id: userId,
    title: 'Test Notification',
    message: 'This is a test',
    notification_type: 'system',
    target_type: 'specific',
    read_at: null
  }).select().single();
  
  if (error) {
    console.error('Insert error:', error);
    // If FK error, we know connection is good but constraint failed
    if (error.code === '23503') { // Foreign key violation
        console.log('Foreign key constraint confirmed. Table exists.');
    }
  } else {
    console.log('Insert success:', data);
  }
  
  // Wait for realtime event
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  process.exit(0);
}

checkPublication();
