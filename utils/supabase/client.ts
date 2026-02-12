import { createBrowserClient } from "@supabase/ssr";
import { Database } from "@/types/supabase";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let client: ReturnType<typeof createBrowserClient<Database>> | undefined;

export const createClient = () => {
  if (client) return client;

  client = createBrowserClient<Database>(
    supabaseUrl!,
    supabaseKey!,
  );

  return client;
};
