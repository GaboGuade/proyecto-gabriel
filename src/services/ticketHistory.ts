import { supabase } from "@/lib/supabaseClient";

export interface TicketHistory {
  id: number;
  ticket_id: number;
  changed_by: string;
  action: string;
  field_name?: string;
  old_value?: string;
  new_value?: string;
  description?: string;
  created_at: string;
}

// Obtener historial de un ticket
export async function getTicketHistory(ticketId: number): Promise<TicketHistory[]> {
  const { data, error } = await supabase
    .from("ticket_history")
    .select(`
      *,
      changed_by_profile:profiles!ticket_history_changed_by_fkey(id, full_name, email, role)
    `)
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

// Registrar cambio manualmente (si es necesario)
export async function logTicketChange(
  ticketId: number,
  action: string,
  fieldName?: string,
  oldValue?: string,
  newValue?: string,
  description?: string
): Promise<TicketHistory> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error("Usuario no autenticado");

  const { data, error } = await supabase.rpc('log_ticket_change', {
    p_ticket_id: ticketId,
    p_changed_by: session.user.id,
    p_action: action,
    p_field_name: fieldName || null,
    p_old_value: oldValue || null,
    p_new_value: newValue || null,
    p_description: description || null
  });

  if (error) throw error;

  // Obtener el registro creado
  const { data: history, error: fetchError } = await supabase
    .from("ticket_history")
    .select("*")
    .eq("id", data)
    .single();

  if (fetchError) throw fetchError;
  return history;
}

// Obtener historial con información del usuario que hizo el cambio
export async function getTicketHistoryWithUsers(ticketId: number): Promise<any[]> {
  const history = await getTicketHistory(ticketId);
  
  // Enriquecer con información de perfiles
  const enrichedHistory = await Promise.all(
    history.map(async (item) => {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, full_name, email, role")
          .eq("id", item.changed_by)
          .single();

        return {
          ...item,
          changed_by_profile: profile || null
        };
      } catch (err) {
        return {
          ...item,
          changed_by_profile: null
        };
      }
    })
  );

  return enrichedHistory;
}

