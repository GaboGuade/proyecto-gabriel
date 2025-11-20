import { supabase } from "@/lib/supabaseClient";

export interface Tag {
  id: number;
  name: string;
  color: string;
  description?: string;
  created_by?: string;
  created_at: string;
}

// Obtener todas las etiquetas
export async function getTags(): Promise<Tag[]> {
  const { data, error } = await supabase
    .from("tags")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw error;
  return data || [];
}

// Crear nueva etiqueta
export async function createTag(
  name: string,
  color: string,
  description?: string
): Promise<Tag> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error("Usuario no autenticado");

  const { data, error } = await supabase
    .from("tags")
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

// Actualizar etiqueta
export async function updateTag(
  id: number,
  updates: { name?: string; color?: string; description?: string }
): Promise<Tag> {
  const { data, error } = await supabase
    .from("tags")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Eliminar etiqueta
export async function deleteTag(id: number): Promise<void> {
  const { error } = await supabase
    .from("tags")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

// Obtener etiquetas de un ticket
export async function getTicketTags(ticketId: number): Promise<Tag[]> {
  const { data, error } = await supabase
    .from("ticket_tags")
    .select("tag_id, tags(*)")
    .eq("ticket_id", ticketId);

  if (error) throw error;
  return data?.map((item: any) => item.tags).filter(Boolean) || [];
}

// Agregar etiqueta a ticket
export async function addTagToTicket(
  ticketId: number,
  tagId: number
): Promise<void> {
  const { error } = await supabase
    .from("ticket_tags")
    .insert({
      ticket_id: ticketId,
      tag_id: tagId
    });

  if (error) throw error;
}

// Remover etiqueta de ticket
export async function removeTagFromTicket(
  ticketId: number,
  tagId: number
): Promise<void> {
  const { error } = await supabase
    .from("ticket_tags")
    .delete()
    .eq("ticket_id", ticketId)
    .eq("tag_id", tagId);

  if (error) throw error;
}

// Obtener tickets por etiqueta
export async function getTicketsByTag(tagId: number): Promise<any[]> {
  const { data, error } = await supabase
    .from("ticket_tags")
    .select("ticket_id, tickets(*)")
    .eq("tag_id", tagId);

  if (error) throw error;
  return data?.map((item: any) => item.tickets).filter(Boolean) || [];
}

