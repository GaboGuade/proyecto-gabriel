import { supabase } from "../lib/supabaseClient";

export async function getUserSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}
