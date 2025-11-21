import { supabase } from "../lib/supabaseClient";
import { getSiteUrl } from "../lib/supabaseClient";

export async function signUp({ email, password, fullName }: any) {
  const redirectUrl = `${getSiteUrl()}/login`;
  
  const { data: authData, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
      emailRedirectTo: redirectUrl,
    },
  });

  if (error) throw error;

  // El perfil se crea automáticamente con el trigger en Supabase
  // Pero lo intentamos crear por si acaso
  if (authData.user) {
    try {
      await supabase.from("profiles").insert({
        id: authData.user.id,
        full_name: fullName,
        email: email,
        role: "customer",
      });
    } catch (profileError) {
      // Si falla, probablemente el trigger ya lo creó
      console.log("Profile creation:", profileError);
    }
  }

  return authData;
}

export async function login({ email, password }: any) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  return { data, error };
}

export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  return true;
}

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
}

export async function getUserProfile(userId?: string) {
  const { data: { session } } = await supabase.auth.getSession();
  const targetUserId = userId || session?.user?.id;
  
  if (!targetUserId) return null;

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", targetUserId)
      .single();

    if (error) {
      console.error("Error fetching profile:", error);
      // Si es error 406, intentar sin el header Accept
      if (error.code === 'PGRST116' || error.message?.includes('406')) {
        // Retornar datos básicos del usuario de auth
        if (session?.user) {
          return {
            id: session.user.id,
            email: session.user.email,
            full_name: session.user.user_metadata?.full_name || '',
            role: 'customer'
          };
        }
      }
      throw error;
    }
    return data;
  } catch (err: any) {
    console.error("Error in getUserProfile:", err);
    // Retornar datos básicos si hay error
    if (session?.user) {
      return {
        id: session.user.id,
        email: session.user.email,
        full_name: session.user.user_metadata?.full_name || '',
        role: 'customer'
      };
    }
    return null;
  }
}

export async function resendVerificationEmail(email: string) {
  const redirectUrl = `${getSiteUrl()}/login`;
  
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: email,
    options: {
      emailRedirectTo: redirectUrl,
    },
  });
  if (error) throw error;
  return true;
}
