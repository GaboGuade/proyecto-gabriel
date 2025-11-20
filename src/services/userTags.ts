import { supabase } from "@/lib/supabaseClient";

export interface UserTag {
  id: number;
  name: string;
  color: string;
  description?: string;
  created_by?: string;
  created_at: string;
}

// Obtener todas las etiquetas de usuarios
export async function getUserTags(): Promise<UserTag[]> {
  const { data, error } = await supabase
    .from("user_tags")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw error;
  return data || [];
}

// Crear nueva etiqueta de usuario
export async function createUserTag(
  name: string,
  color: string,
  description?: string
): Promise<UserTag> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error("Usuario no autenticado");

  const { data, error } = await supabase
    .from("user_tags")
    .insert({
      name,
      color,
      description,
      created_by: session.user.id
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Actualizar etiqueta de usuario
export async function updateUserTag(
  id: number,
  updates: { name?: string; color?: string; description?: string }
): Promise<UserTag> {
  const { data, error } = await supabase
    .from("user_tags")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Eliminar etiqueta de usuario
export async function deleteUserTag(id: number): Promise<void> {
  const { error } = await supabase
    .from("user_tags")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

// Obtener etiquetas de un usuario
export async function getUserUserTags(userId: string): Promise<UserTag[]> {
  const { data, error } = await supabase
    .from("user_user_tags")
    .select("tag_id, user_tags(*)")
    .eq("user_id", userId);

  if (error) throw error;
  return data?.map((item: any) => item.user_tags).filter(Boolean) || [];
}

// Agregar etiqueta a usuario
export async function addTagToUser(
  userId: string,
  tagId: number
): Promise<void> {
  const { error } = await supabase
    .from("user_user_tags")
    .insert({
      user_id: userId,
      tag_id: tagId
    });

  if (error) throw error;
}

// Remover etiqueta de usuario
export async function removeTagFromUser(
  userId: string,
  tagId: number
): Promise<void> {
  const { error } = await supabase
    .from("user_user_tags")
    .delete()
    .eq("user_id", userId)
    .eq("tag_id", tagId);

  if (error) throw error;
}

