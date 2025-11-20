// src/services/messages.ts
import { supabase } from "../lib/supabaseClient";

// Obtener mensajes de un ticket
export async function getMessages(ticketId: number) {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  // Enriquecer mensajes con información de perfiles
  if (data && data.length > 0) {
    const enrichedMessages = await Promise.all(
      data.map(async (message: any) => {
        const enriched: any = { ...message };
        
        // Obtener perfil del remitente usando función RPC que incluye email de auth.users
        if (message.sender_id) {
          try {
            // Primero intentar obtener todos los perfiles y buscar el que necesitamos
            // Esto usa la función RPC que hace JOIN con auth.users
            const { data: allProfiles, error: rpcError } = await supabase.rpc('get_all_profiles');
            
            if (!rpcError && allProfiles && Array.isArray(allProfiles)) {
              const profile = allProfiles.find((p: any) => p.id === message.sender_id);
              
              if (profile) {
                // Asegurar que siempre tengamos un nombre completo
                let displayName = profile.full_name;
                const email = profile.email;
                
                // Si no hay full_name válido, usar email sin dominio
                if (!displayName || displayName.trim() === "" || displayName === "Usuario" || displayName.length <= 1) {
                  if (email && email.includes("@")) {
                    displayName = email.split("@")[0];
                  } else {
                    displayName = profile.id.substring(0, 8);
                  }
                }
                
                enriched.profiles = {
                  id: profile.id,
                  full_name: displayName,
                  email: email || null,
                  role: profile.role || "customer",
                  department: profile.department || null
                };
              } else {
                // Si no se encuentra en RPC, intentar consulta directa
                const { data: profile, error: profileError } = await supabase
                  .from("profiles")
                  .select("id, full_name, email, role, department")
                  .eq("id", message.sender_id)
                  .single();
                
                if (profile && !profileError) {
                  let displayName = profile.full_name;
                  if (!displayName || displayName.trim() === "" || displayName === "Usuario" || displayName.length <= 1) {
                    displayName = profile.email ? profile.email.split("@")[0] : profile.id.substring(0, 8);
                  }
                  
                  enriched.profiles = {
                    ...profile,
                    full_name: displayName,
                    role: profile.role || "customer"
                  };
                } else {
                  // Fallback: usar email del sender_id si es posible
                  enriched.profiles = {
                    id: message.sender_id,
                    email: null,
                    full_name: message.sender_id.substring(0, 8),
                    role: "customer",
                    department: null
                  };
                }
              }
            } else {
              // Si RPC falla, usar consulta directa
              const { data: profile, error: profileError } = await supabase
                .from("profiles")
                .select("id, full_name, email, role, department")
                .eq("id", message.sender_id)
                .single();
              
              if (profile && !profileError) {
                let displayName = profile.full_name;
                if (!displayName || displayName.trim() === "" || displayName === "Usuario" || displayName.length <= 1) {
                  displayName = profile.email ? profile.email.split("@")[0] : profile.id.substring(0, 8);
                }
                
                enriched.profiles = {
                  ...profile,
                  full_name: displayName,
                  role: profile.role || "customer"
                };
              } else {
                enriched.profiles = {
                  id: message.sender_id,
                  email: null,
                  full_name: message.sender_id.substring(0, 8),
                  role: "customer",
                  department: null
                };
              }
            }
          } catch (err) {
            console.log("Error loading profile for message:", err);
            // Fallback final
            enriched.profiles = {
              id: message.sender_id,
              email: null,
              full_name: message.sender_id.substring(0, 8),
              role: "customer",
              department: null
            };
          }
        }
        
        return enriched;
      })
    );
    
    return enrichedMessages;
  }

  return data || [];
}

// Enviar mensaje
export async function sendMessage({
  ticket_id,
  body,
  attachment_url
}: {
  ticket_id: number | string,
  body: string,
  attachment_url?: string | null
}) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session || !session.user) throw new Error("Usuario no autenticado");
  
  const user = session.user;

  const { data, error } = await supabase
    .from("messages")
    .insert({
      ticket_id: Number(ticket_id),
      body,
      attachment_url: attachment_url || null,
      sender_id: user.id,
    })
    .select("*")
    .single();

  if (error) throw error;

  // Obtener información del ticket para crear notificaciones
  const { data: ticket } = await supabase
    .from("tickets")
    .select("user_id, assigned_to, title")
    .eq("id", Number(ticket_id))
    .single();

  // Crear notificaciones cuando se envía un mensaje
  if (ticket) {
    try {
      const { createNotification } = await import("@/services/notifications");
      
      // Notificar al creador del ticket si el mensaje no es de él
      if (ticket.user_id && ticket.user_id !== user.id) {
        await createNotification(
          ticket.user_id,
          Number(ticket_id),
          'ticket_message',
          'Nuevo mensaje en tu ticket',
          `Hay un nuevo mensaje en el ticket: "${ticket.title}"`
        );
      }

      // Notificar al agente asignado si existe y no es el remitente
      if (ticket.assigned_to && ticket.assigned_to !== user.id && ticket.assigned_to !== ticket.user_id) {
        await createNotification(
          ticket.assigned_to,
          Number(ticket_id),
          'ticket_message',
          'Nuevo mensaje en ticket asignado',
          `Hay un nuevo mensaje en el ticket: "${ticket.title}"`
        );
      }
    } catch (notifError) {
      console.log("Error creando notificaciones de mensaje (no crítico):", notifError);
    }
  }

  // Enriquecer con información del perfil
  const enriched: any = { ...data };
  
  if (data.sender_id) {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, full_name, email, role, department")
        .eq("id", data.sender_id)
        .single();
      if (profile) {
        // Asegurar que siempre tengamos un nombre completo
        // NUNCA mostrar "Usuario" si hay un nombre real
        let displayName = profile.full_name;
        if (!displayName || displayName.trim() === "" || displayName === "Usuario" || displayName.length <= 1) {
          displayName = profile.email?.split("@")[0] || user.email?.split("@")[0] || user.id.substring(0, 8);
        }
        
        enriched.profiles = {
          ...profile,
          full_name: displayName,
          role: profile.role || "customer", // Siempre incluir rol
          email: profile.email || user.email
        };
      } else {
        // Si no hay perfil, usar datos del usuario
        const metadataName = user.user_metadata?.full_name;
        enriched.profiles = {
          id: user.id,
          email: user.email,
          full_name: metadataName || (user.email ? user.email.split("@")[0] : user.id.substring(0, 8)),
          role: "customer", // Rol por defecto
          department: null
        };
      }
    } catch (err) {
      console.log("Error loading profile for new message:", err);
      // Usar datos básicos del usuario
      const metadataName = user.user_metadata?.full_name;
      enriched.profiles = {
        id: user.id,
        email: user.email,
        full_name: metadataName || (user.email ? user.email.split("@")[0] : user.id.substring(0, 8)),
        role: "customer", // Rol por defecto
        department: null
      };
    }
  }

  return enriched;
}

// Eliminar mensaje
export async function deleteMessage(messageId: number) {
  const { error } = await supabase
    .from("messages")
    .delete()
    .eq("id", messageId);

  if (error) throw error;
  return true;
}
