import { supabase } from "@/lib/supabaseClient";

export interface TicketFeedback {
  id: number;
  ticket_id: number;
  user_id: string;
  rating: number; // 1-5
  comment?: string;
  created_at: string;
}

// Obtener feedback de un ticket
export async function getTicketFeedback(ticketId: number): Promise<TicketFeedback | null> {
  const { data, error } = await supabase
    .from("ticket_feedback")
    .select("*")
    .eq("ticket_id", ticketId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // No encontrado
    throw error;
  }
  return data;
}

// Crear feedback para un ticket
export async function createFeedback(
  ticketId: number,
  rating: number,
  comment?: string
): Promise<TicketFeedback> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error("Usuario no autenticado");

  // Validar rating
  if (rating < 1 || rating > 5) {
    throw new Error("La calificación debe estar entre 1 y 5");
  }

  // Verificar que el ticket esté cerrado
  const { data: ticket } = await supabase
    .from("tickets")
    .select("status, user_id")
    .eq("id", ticketId)
    .single();

  if (!ticket) throw new Error("Ticket no encontrado");
  if (ticket.status !== 'closed') {
    throw new Error("Solo se puede dar feedback a tickets cerrados");
  }
  if (ticket.user_id !== session.user.id) {
    throw new Error("Solo el creador del ticket puede dar feedback");
  }

  const { data, error } = await supabase
    .from("ticket_feedback")
    .insert({
      ticket_id: ticketId,
      user_id: session.user.id,
      rating,
      comment: comment || null
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') { // Unique constraint violation
      throw new Error("Ya has dado feedback para este ticket");
    }
    throw error;
  }

  return data;
}

// Obtener estadísticas de feedback
export async function getFeedbackStats(): Promise<{
  total: number;
  average: number;
  distribution: { rating: number; count: number }[];
}> {
  const { data, error } = await supabase
    .from("ticket_feedback")
    .select("rating");

  if (error) throw error;

  const total = data?.length || 0;
  const sum = data?.reduce((acc, item) => acc + item.rating, 0) || 0;
  const average = total > 0 ? sum / total : 0;

  // Distribución por rating
  const distribution = [1, 2, 3, 4, 5].map(rating => ({
    rating,
    count: data?.filter(item => item.rating === rating).length || 0
  }));

  return {
    total,
    average: Math.round(average * 10) / 10,
    distribution
  };
}

// Obtener todos los feedbacks (solo para admins/assistants)
export async function getAllFeedback(): Promise<TicketFeedback[]> {
  const { data, error } = await supabase
    .from("ticket_feedback")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}
