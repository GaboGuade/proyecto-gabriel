import { supabase } from "@/lib/supabaseClient";

export interface Notification {
  id: number;
  user_id: string;
  ticket_id?: number;
  type: 'ticket_assigned' | 'ticket_message' | 'ticket_status_change' | 'ticket_created' | 'ticket_closed';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

// Obtener todas las notificaciones del usuario actual
export async function getNotifications(): Promise<Notification[]> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error("Usuario no autenticado");

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

// Obtener notificaciones no leídas
export async function getUnreadNotifications(): Promise<Notification[]> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error("Usuario no autenticado");

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", session.user.id)
    .eq("read", false)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

// Contar notificaciones no leídas
export async function getUnreadCount(): Promise<number> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return 0;

  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", session.user.id)
    .eq("read", false);

  if (error) throw error;
  return count || 0;
}

// Marcar notificación como leída
export async function markAsRead(notificationId: number): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", notificationId);

  if (error) throw error;
}

// Marcar todas las notificaciones como leídas
export async function markAllAsRead(): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error("Usuario no autenticado");

  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", session.user.id)
    .eq("read", false);

  if (error) throw error;
}

// Crear notificación (usando función RPC)
export async function createNotification(
  userId: string,
  ticketId: number | null,
  type: Notification['type'],
  title: string,
  message: string
): Promise<number> {
  const { data, error } = await supabase.rpc('create_notification', {
    p_user_id: userId,
    p_ticket_id: ticketId,
    p_type: type,
    p_title: title,
    p_message: message
  });

  if (error) throw error;
  return data;
}

// Suscribirse a notificaciones en tiempo real
export function subscribeToNotifications(
  userId: string,
  callback: (notification: Notification) => void
) {
  const channelName = `notifications:${userId}`;
  
  // Obtener canales existentes y remover si hay alguno con el mismo nombre
  const existingChannels = supabase.getChannels();
  const existingChannel = existingChannels.find(ch => ch.topic === channelName);
  if (existingChannel) {
    supabase.removeChannel(existingChannel);
  }

  // Crear nuevo canal con configuración mejorada
  const channel = supabase
    .channel(channelName, {
      config: {
        broadcast: { self: false },
        presence: { key: userId }
      }
    })
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        console.log('✅ Nueva notificación recibida en tiempo real:', payload.new);
        callback(payload.new as Notification);
      }
    )
    .subscribe((status, err) => {
      console.log('📡 Estado de suscripción a notificaciones:', status);
      if (status === 'SUBSCRIBED') {
        console.log('✅ Suscrito exitosamente a notificaciones en tiempo real');
      } else if (status === 'CHANNEL_ERROR') {
        console.error('❌ Error en canal de notificaciones:', err);
      } else if (status === 'TIMED_OUT') {
        console.warn('⏱️ Timeout en suscripción a notificaciones');
      } else if (status === 'CLOSED') {
        console.log('🔒 Canal de notificaciones cerrado');
      }
    });

  return () => {
    console.log('🔌 Desuscribiendo de notificaciones');
    try {
      supabase.removeChannel(channel);
    } catch (error) {
      console.error('Error al remover canal:', error);
    }
  };
}

