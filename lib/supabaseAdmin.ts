import { createClient } from "@supabase/supabase-js";

// SERVER-ONLY. This uses the Supabase service role key, which bypasses
// Row Level Security entirely — that's the whole point, since
// `app_passwords` intentionally has no RLS policies for the anon key to
// use. Never import this file from a "use client" component or anything
// that ends up in the browser bundle; it must only be used inside API
// routes / server code (e.g. app/api/auth/route.ts).
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});
