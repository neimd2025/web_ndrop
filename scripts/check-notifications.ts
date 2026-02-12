
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkLatestNotifications() {
  console.log('Checking latest notifications...');
  
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);
    
  if (error) {
    console.error('Error fetching notifications:', error);
  } else {
    console.log('Latest 5 notifications:');
    data.forEach(n => {
      console.log(`[${n.created_at}] To: ${n.user_id}, Type: ${n.notification_type}, Title: ${n.title}`);
    });
  }
}

checkLatestNotifications();
