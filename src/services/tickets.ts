// src/services/tickets.ts
import { supabase } from "../lib/supabaseClient";

// Obtener tickets del usuario actual
export async function getMyTickets() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session || !session.user) throw new Error("Usuario no autenticado");
  
  const user = session.user;

  // Primero obtener los tickets sin relaciones para evitar errores
  const { data, error } = await supabase
    .from("tickets")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching my tickets:", error);
    throw error;
  }

  // Si hay datos, obtener las relaciones por separado
  if (data && data.length > 0) {
    const enrichedData = await Promise.all(
      data.map(async (ticket: any) => {
        const enriched: any = { ...ticket };
        
        // Obtener categoría si existe
        if (ticket.category_id) {
          try {
            const { data: category } = await supabase
              .from("categories")
              .select("id, name, type")
              .eq("id", ticket.category_id)
              .single();
            if (category) enriched.categories = category;
          } catch (err) {
            console.log("Error loading category:", err);
          }
        }
        
        return enriched;
      })
    );
    return enrichedData;
  }

  return data || [];
}

// Obtener todos los tickets (para admin)
export async function getAllTickets() {
  const { data, error } = await supabase
    .from("tickets")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching all tickets:", error);
    throw error;
  }
  return data || [];
}

// Obtener tickets abiertos
export async function getOpenTickets() {
  const { data, error } = await supabase
    .from("tickets")
    .select("*")
    .in("status", ["open", "pending"])
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching open tickets:", error);
    throw error;
  }

  // Enriquecer con relaciones
  if (data && data.length > 0) {
    const enrichedData = await Promise.all(
      data.map(async (ticket: any) => {
        const enriched: any = { ...ticket };
        
        // Obtener perfil del usuario con nombre completo
        if (ticket.user_id) {
          try {
            const { data: profile } = await supabase
              .from("profiles")
              .select("id, full_name, email, role, department")
              .eq("id", ticket.user_id)
              .single();
            if (profile) {
              // Asegurar que siempre tengamos un nombre completo
              let displayName = profile.full_name;
              if (!displayName || displayName.trim() === "" || displayName === "Usuario") {
                displayName = profile.email?.split("@")[0] || "Usuario";
              }
              enriched.profiles = {
                ...profile,
                full_name: displayName
              };
            }
          } catch (err) {
            console.log("Error loading profile:", err);
          }
        }
        
        // Obtener categoría si existe
        if (ticket.category_id) {
          try {
            const { data: category } = await supabase
              .from("categories")
              .select("id, name, type")
              .eq("id", ticket.category_id)
              .single();
            if (category) enriched.categories = category;
          } catch (err) {
            console.log("Error loading category:", err);
          }
        }
        
        return enriched;
      })
    );
    return enrichedData;
  }

  return data || [];
}

// Obtener tickets cerrados
export async function getClosedTickets() {
  const { data, error } = await supabase
    .from("tickets")
    .select("*")
    .eq("status", "closed")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching closed tickets:", error);
    throw error;
  }

  // Enriquecer con relaciones
  if (data && data.length > 0) {
    const enrichedData = await Promise.all(
      data.map(async (ticket: any) => {
        const enriched: any = { ...ticket };
        
        // Obtener perfil del usuario con nombre completo
        if (ticket.user_id) {
          try {
            const { data: profile } = await supabase
              .from("profiles")
              .select("id, full_name, email, role, department")
              .eq("id", ticket.user_id)
              .single();
            if (profile) {
              // Asegurar que siempre tengamos un nombre completo
              let displayName = profile.full_name;
              if (!displayName || displayName.trim() === "" || displayName === "Usuario") {
                displayName = profile.email?.split("@")[0] || "Usuario";
              }
              enriched.profiles = {
                ...profile,
                full_name: displayName
              };
            }
          } catch (err) {
            console.log("Error loading profile:", err);
          }
        }
        
        // Obtener categoría si existe
        if (ticket.category_id) {
          try {
            const { data: category } = await supabase
              .from("categories")
              .select("id, name, type")
              .eq("id", ticket.category_id)
              .single();
            if (category) enriched.categories = category;
          } catch (err) {
            console.log("Error loading category:", err);
          }
        }
        
        return enriched;
      })
    );
    return enrichedData;
  }

  return data || [];
}

// Crear ticket
export async function createTicket({ 
  title, 
  description, 
  priority, 
  category_id,
  attachment_url 
}: {
  title: string,
  description: string,
  priority: "low" | "medium" | "high",
  category_id?: number | null,
  attachment_url?: string | null
}) {
  // Primero intentar obtener la sesión
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError) {
    console.error("Error getting session:", sessionError);
    throw new Error("Error al obtener la sesión: " + sessionError.message);
  }
  
  if (!session || !session.user) {
    console.error("No session or user found");
    throw new Error("Usuario no autenticado. Por favor inicia sesión nuevamente.");
  }

  const user = session.user;

  // Construir el objeto de inserción - usar SOLO user_id (nombre estándar)
  const insertData: any = {
    user_id: user.id, // SIEMPRE usar user_id
    title: title.trim(),
    description: description.trim(),
    priority: priority || "medium",
    status: "open",
  };

  // Agregar category_id solo si se proporciona
  if (category_id) {
    insertData.category_id = category_id;
  }

  // Insertar el ticket
  const { data, error } = await supabase
    .from("tickets")
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error("Error creating ticket:", error);
    console.error("Insert data attempted:", insertData);
    
    // Mensaje de error más descriptivo
    if (error.message?.includes("user_id") || error.message?.includes("user")) {
      throw new Error(
        "Error: La columna 'user_id' no existe en la tabla 'tickets'. " +
        "Por favor ejecuta el script 'SOLUCION-DEFINITIVA-TICKETS.sql' en Supabase SQL Editor. " +
        "Ver el archivo 'INSTRUCCIONES-SOLUCION-TICKETS.md' para más detalles."
      );
    }
    
    throw new Error(error.message || "Error al crear el ticket");
  }

  // Intentar asignación automática si hay categoría
  if (data && category_id) {
    try {
      const { data: category } = await supabase
        .from("categories")
        .select("type")
        .eq("id", category_id)
        .single();

      if (category) {
        // Llamar a función de asignación automática
        await supabase.rpc('auto_assign_ticket', {
          p_ticket_id: data.id,
          p_category_id: category_id,
          p_department: null
        });
      }
    } catch (assignError) {
      console.log("Error en asignación automática (no crítico):", assignError);
      // No lanzar error, la asignación automática es opcional
    }
  }

  // Crear notificación para admins/asistentes sobre nuevo ticket
  try {
    const { data: admins } = await supabase
      .from("profiles")
      .select("id")
      .in("role", ["admin", "assistance"]);

    if (admins && admins.length > 0) {
      await Promise.all(
        admins.map(admin =>
          supabase.rpc('create_notification', {
            p_user_id: admin.id,
            p_ticket_id: data.id,
            p_type: 'ticket_created',
            p_title: 'Nuevo ticket creado',
            p_message: `Se ha creado un nuevo ticket: ${title}`
          })
        )
      );
    }
  } catch (notifError) {
    console.log("Error creando notificaciones (no crítico):", notifError);
  }
  
  return data;
}

// Obtener un ticket por ID
export async function getTicket(ticketId: number) {
  const { data, error } = await supabase
    .from("tickets")
    .select("*")
    .eq("id", ticketId)
    .single();

  if (error) {
    console.error("Error fetching ticket:", error);
    throw error;
  }

  // Enriquecer con relaciones
  const enriched: any = { ...data };
  
  // Obtener perfil del usuario con nombre completo
  if (data.user_id) {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, full_name, email, role, department")
        .eq("id", data.user_id)
        .single();
      if (profile) {
        // Asegurar que siempre tengamos un nombre completo
        let displayName = profile.full_name;
        if (!displayName || displayName.trim() === "" || displayName === "Usuario") {
          displayName = profile.email?.split("@")[0] || "Usuario";
        }
        enriched.profiles = {
          ...profile,
          full_name: displayName
        };
      }
    } catch (err) {
      console.log("Error loading profile:", err);
    }
  }
  
  // Obtener categoría si existe
  if (data.category_id) {
    try {
      const { data: category } = await supabase
        .from("categories")
        .select("id, name, type")
        .eq("id", data.category_id)
        .single();
      if (category) enriched.categories = category;
    } catch (err) {
      console.log("Error loading category:", err);
    }
  }

  return enriched;
}

// Actualizar ticket
export async function updateTicket(ticketId: number, updates: {
  status?: string,
  priority?: string,
  assigned_to?: string | null,
  category_id?: number | null
}) {
  const { data, error } = await supabase
    .from("tickets")
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq("id", ticketId)
    .select()
    .single();

  if (error) {
    console.error("Error updating ticket:", error);
    throw error;
  }
  return data;
}

// Eliminar ticket
export async function deleteTicket(ticketId: number) {
  const { error } = await supabase
    .from("tickets")
    .delete()
    .eq("id", ticketId);

  if (error) {
    console.error("Error deleting ticket:", error);
    throw error;
  }
  return true;
}

// Actualizar estado del ticket
export async function updateTicketStatus(ticketId: number, status: "open" | "pending" | "closed") {
  // Obtener información del ticket antes de actualizar
  const { data: ticketBefore } = await supabase
    .from("tickets")
    .select("user_id, assigned_to, title")
    .eq("id", ticketId)
    .single();

  const { data, error } = await supabase
    .from("tickets")
    .update({
      status,
      updated_at: new Date().toISOString()
    })
    .eq("id", ticketId)
    .select()
    .single();

  if (error) {
    console.error("Error updating ticket status:", error);
    throw error;
  }

  // Crear notificaciones cuando cambia el estado
  if (data && ticketBefore) {
    try {
      const { createNotification } = await import("@/services/notifications");
      
      // Notificar al creador del ticket
      if (ticketBefore.user_id) {
        await createNotification(
          ticketBefore.user_id,
          ticketId,
          'ticket_status_change',
          `Ticket ${status === 'closed' ? 'cerrado' : status === 'pending' ? 'marcado como pendiente' : 'reabierto'}`,
          `El estado de tu ticket "${ticketBefore.title}" ha cambiado a ${status === 'closed' ? 'cerrado' : status === 'pending' ? 'pendiente' : 'abierto'}`
        );
      }

      // Notificar al agente asignado si existe
      if (ticketBefore.assigned_to && ticketBefore.assigned_to !== ticketBefore.user_id) {
        await createNotification(
          ticketBefore.assigned_to,
          ticketId,
          'ticket_status_change',
          `Ticket ${status === 'closed' ? 'cerrado' : status === 'pending' ? 'marcado como pendiente' : 'reabierto'}`,
          `El ticket "${ticketBefore.title}" ha cambiado a ${status === 'closed' ? 'cerrado' : status === 'pending' ? 'pendiente' : 'abierto'}`
        );
      }
    } catch (notifError) {
      console.log("Error creando notificaciones de cambio de estado (no crítico):", notifError);
    }
  }

  return data;
}

// Asignar ticket a un agente
export async function assignTicket(ticketId: number, agentId: string | null) {
  // Obtener información del ticket antes de asignar
  const { data: ticketBefore } = await supabase
    .from("tickets")
    .select("user_id, assigned_to, title")
    .eq("id", ticketId)
    .single();

  const { data, error } = await supabase
    .from("tickets")
    .update({
      assigned_to: agentId,
      updated_at: new Date().toISOString()
    })
    .eq("id", ticketId)
    .select()
    .single();

  if (error) {
    console.error("Error assigning ticket:", error);
    throw error;
  }

  // Crear notificaciones cuando se asigna un ticket
  if (data && ticketBefore) {
    try {
      const { createNotification } = await import("@/services/notifications");
      
      // Notificar al agente asignado
      if (agentId) {
        await createNotification(
          agentId,
          ticketId,
          'ticket_assigned',
          'Nuevo ticket asignado',
          `Se te ha asignado el ticket: "${ticketBefore.title}"`
        );
      }

      // Notificar al creador del ticket sobre la asignación
      if (ticketBefore.user_id && agentId) {
        try {
          const { data: agentProfile } = await supabase
            .from("profiles")
            .select("full_name, email")
            .eq("id", agentId)
            .single();

          const agentName = agentProfile?.full_name || agentProfile?.email || "un agente";
          
          await createNotification(
            ticketBefore.user_id,
            ticketId,
            'ticket_assigned',
            'Ticket asignado',
            `Tu ticket "${ticketBefore.title}" ha sido asignado a ${agentName}`
          );
        } catch (err) {
          console.log("Error notificando al creador:", err);
        }
      }
    } catch (notifError) {
      console.log("Error creando notificaciones de asignación (no crítico):", notifError);
    }
  }

  return data;
}