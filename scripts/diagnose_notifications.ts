
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Load env vars manually
const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env: Record<string, string> = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    const value = match[2].trim().replace(/^['"]|['"]$/g, ''); // remove quotes
    env[key] = value;
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function main() {
  console.log('--- Checking Notifications Table Structure ---');
  const { data: sample, error: sampleError } = await supabase.from('notifications').select('*').limit(1);
  if (sampleError) {
    console.error('Error selecting from notifications:', sampleError);
  } else {
    console.log('Sample row:', sample);
  }

  console.log('\n--- Checking Recent Meeting/Chat Notifications ---');
  const { data: recent, error: recentError } = await supabase
    .from('notifications')
    .select('*')
    .in('notification_type', ['meeting_request', 'meeting_chat'])
    .order('created_at', { ascending: false })
    .limit(10);

  if (recentError) {
    console.error('Error fetching recent notifications:', recentError);
  } else {
    console.log('Recent 10 meeting/chat notifications:');
    if (recent.length === 0) {
        console.log('No recent meeting/chat notifications found.');
    }
    recent.forEach(n => console.log(`[${n.created_at}] Type: ${n.notification_type}, User: ${n.user_id}, Title: ${n.title}`));
  }
  
  // Find a user first
  const { data: users, error: userError } = await supabase.from('user_profiles').select('id, email').limit(1);
  if (users && users.length > 0) {
     const testUserId = users[0].id;
     console.log(`\n--- Attempting Test Notification for User ${testUserId} (${users[0].email}) ---`);
     const testNoti = {
       user_id: testUserId,
       title: 'Diagnose Test',
       message: 'This is a test notification from the diagnose script',
       notification_type: 'system',
       target_type: 'specific',
       read_at: null
     };
     
     const { data: insertData, error: insertError } = await supabase
       .from('notifications')
       .insert(testNoti)
       .select()
       .single();
       
     if (insertError) {
       console.error('Insert failed:', insertError);
     } else {
       console.log('Insert successful:', insertData);
     }
  } else {
    console.log('No users found to test insertion.');
  }
}

main().catch(console.error);
