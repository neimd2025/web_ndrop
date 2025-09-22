import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const createClient = () => {
  const client = createBrowserClient(
    supabaseUrl!,
    supabaseKey!,
  );

  // 과도한 에러 감지 제거 - Supabase가 자동으로 처리하도록 함
  // client.auth.onAuthStateChange는 auth-store에서만 처리

  return client;
};
