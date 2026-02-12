import { createClient, createAdminClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const supabase = await createClient(); // Auth check
  const supabaseAdmin = await createAdminClient(); // Read config
  const { eventId } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // TODO: Add admin check if needed

  const { data, error } = await supabaseAdmin
    .from("event_matching_configs")
    .select("*")
    .eq("event_id", eventId)
    .single();

  if (error && error.code !== "PGRST116") {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ config: data || null });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const supabase = await createClient(); // Auth check
  const supabaseAdmin = await createAdminClient(); // Write config
  const { eventId } = await params;
  
  try {
    const body = await request.json();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // TODO: Add admin check

    // Upsert config
    const { data, error } = await supabaseAdmin
      .from("event_matching_configs")
      .upsert({
        event_id: eventId,
        ...body,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ config: data });
  } catch (e) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
