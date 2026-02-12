
// import { createClient, createAdminClient } from "@/utils/supabase/server";

// 이 스크립트는 터미널에서 실행되지 않고, API Route 내부 로직을 흉내내는 용도입니다.
// 실제 테스트는 API Endpoint를 호출해야 정확합니다.
// 하지만 여기서는 AdminClient가 제대로 동작하는지 검증하기 위해
// 간단한 독립 실행형 스크립트를 작성합니다.

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function testAdminInsert() {
  console.log("🛠️ Testing Admin Client Notification Insert...");

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error("❌ Missing environment variables");
    process.exit(1);
  }

  const adminClient = createSupabaseClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // 1. 임의의 사용자 ID 가져오기 (테스트 대상)
  // 실제 존재하는 사용자 ID를 하나 가져옵니다.
  const { data: users, error: userError } = await adminClient
    .from("user_profiles")
    .select("id")
    .limit(1);

  if (userError || !users || users.length === 0) {
    console.error("❌ Failed to fetch a user for testing:", userError);
    return;
  }

  const targetUserId = users[0].id;
  console.log(`🎯 Target User ID: ${targetUserId}`);

  // 2. 알림 삽입 시도
  const testNotification = {
    user_id: targetUserId,
    notification_type: "system",
    title: "TEST_NOTIFICATION_DEBUG",
    message: "This is a debug notification to verify admin insert capability.",
    target_type: "specific",
    sent_by: null, // System notification
    read_at: null,
    created_at: new Date().toISOString()
  };

  console.log("📤 Attempting insert with:", testNotification);

  const { data, error } = await adminClient
    .from("notifications")
    .insert(testNotification)
    .select()
    .single();

  if (error) {
    console.error("❌ Insert Failed:", error);
    console.error("Details:", JSON.stringify(error, null, 2));
  } else {
    console.log("✅ Insert Successful!", data);
  }
}

testAdminInsert();
