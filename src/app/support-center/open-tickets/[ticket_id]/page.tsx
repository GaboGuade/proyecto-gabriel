"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getTicket, updateTicketStatus, assignTicket } from "@/services/tickets";
import { getMessages, sendMessage } from "@/services/messages";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { toast } from "react-toastify";
import Loading from "../loading";
import { 
  FiArrowLeft, 
  FiCheckCircle, 
  FiClock, 
  FiUser, 
  FiSend, 
  FiTag, 
  FiMail, 
  FiCalendar,
  FiEdit3,
  FiRefreshCw,
  FiMessageSquare,
  FiPaperclip,
  FiDownload
} from "react-icons/fi";
import { supabase } from "@/lib/supabaseClient";
import Feedback from "@/components/Feedback";
import { exportSingleTicketToExcel } from "@/utils/exportToExcel";
import TagManager from "@/components/TagManager";
import AttachmentGallery from "@/components/AttachmentGallery";
import AttachmentUploader from "@/components/AttachmentUploader";
import TicketHistory from "@/components/TicketHistory";
import FeedbackForm from "@/components/FeedbackForm";
import { getTicketFeedback } from "@/services/feedback";

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const user = useSelector((state: RootState) => state.auth.user);
  const ticketId = params.ticket_id as string;

  const [ticket, setTicket] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [availableAgents, setAvailableAgents] = useState<any[]>([]);
  const [assignedAgent, setAssignedAgent] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [hasFeedback, setHasFeedback] = useState(false);

  useEffect(() => {
    if (ticketId) {
      loadCurrentUserId();
      loadTicket();
      loadMessages();
      checkFeedback();
      if (user?.roll === "admin" || user?.roll === "assistance") {
        loadAgents();
      }
    }
  }, [ticketId, user?.roll]);

  async function checkFeedback() {
    try {
      const feedback = await getTicketFeedback(parseInt(ticketId));
      setHasFeedback(!!feedback);
    } catch (error) {
      setHasFeedback(false);
    }
  }

  async function loadCurrentUserId() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setCurrentUserId(session.user.id);
      }
    } catch (error) {
      console.error("Error loading current user ID:", error);
    }
  }

  async function loadTicket() {
    try {
      const data = await getTicket(parseInt(ticketId));
      setTicket(data);
      
      // Cargar información del agente asignado si existe
      if (data.assigned_to) {
        try {
          const { data: agent } = await supabase
            .from("profiles")
            .select("id, full_name, email, role")
            .eq("id", data.assigned_to)
            .single();
          if (agent) setAssignedAgent(agent);
        } catch (err) {
          console.log("Error loading assigned agent:", err);
        }
      } else {
        setAssignedAgent(null);
      }
    } catch (error: any) {
      toast.error("Error al cargar ticket: " + error.message);
      router.back();
    } finally {
      setLoading(false);
    }
  }

  async function loadMessages() {
    try {
      const data = await getMessages(parseInt(ticketId));
      setMessages(data);
    } catch (error: any) {
      console.error("Error loading messages:", error);
    }
  }

  async function loadAgents() {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .in("role", ["admin", "assistance"]);
      
      if (error) {
        console.error("Error loading agents:", error);
        return;
      }
      
      setAvailableAgents(data || []);
    } catch (error) {
      console.error("Error loading agents:", error);
    }
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!messageText.trim()) return;

    setSending(true);
    try {
      await sendMessage({
        ticket_id: ticketId,
        body: messageText,
      });
      setMessageText("");
      await loadMessages();
      toast.success("Mensaje enviado");
    } catch (error: any) {
      toast.error("Error al enviar mensaje: " + error.message);
    } finally {
      setSending(false);
    }
  }

  async function handleResolve() {
    try {
      await updateTicketStatus(parseInt(ticketId), "closed");
      toast.success("Ticket cerrado exitosamente");
      await loadTicket();
    } catch (error: any) {
      toast.error("Error al cerrar ticket: " + error.message);
    }
  }

  async function handleSetPending() {
    try {
      await updateTicketStatus(parseInt(ticketId), "pending");
      toast.success("Ticket marcado como pendiente");
      await loadTicket();
    } catch (error: any) {
      toast.error("Error al actualizar estado: " + error.message);
    }
  }

  async function handleAssign(agentId: string) {
    try {
      await assignTicket(parseInt(ticketId), agentId);
      toast.success("Ticket asignado exitosamente");
      await loadTicket();
      await loadAgents();
    } catch (error: any) {
      toast.error("Error al asignar ticket: " + error.message);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await Promise.all([loadTicket(), loadMessages()]);
      toast.success("Información actualizada");
    } catch (error: any) {
      toast.error("Error al actualizar: " + error.message);
    } finally {
      setRefreshing(false);
    }
  }

  async function handleReopen() {
    try {
      await updateTicketStatus(parseInt(ticketId), "open");
      toast.success("Ticket reabierto exitosamente");
      await loadTicket();
    } catch (error: any) {
      toast.error("Error al reabrir ticket: " + error.message);
    }
  }

  if (loading) {
    return <Loading />;
  }

  if (!ticket) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Ticket no encontrado</p>
      </div>
    );
  }

  const isAdmin = user?.roll === "admin" || user?.roll === "assistance";
  const isCustomer = user?.roll === "customer";

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <button
          onClick={() => router.back()}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <FiArrowLeft className="w-5 h-5" />
          <span>Volver</span>
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (ticket) {
                exportSingleTicketToExcel(ticket);
                toast.success("Ticket exportado exitosamente");
              }
            }}
            className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            title="Exportar ticket a Excel"
          >
            <FiDownload className="w-4 h-4" />
            <span>Exportar</span>
          </button>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center space-x-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            title="Actualizar"
          >
            <FiRefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>
          {isAdmin && (
            <div className="flex space-x-2">
              {ticket.status === "closed" && (
                <button
                  onClick={handleReopen}
                  className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <FiEdit3 />
                  <span>Reabrir</span>
                </button>
              )}
              {ticket.status === "open" && (
                <button
                  onClick={handleSetPending}
                  className="flex items-center space-x-2 bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors"
                >
                  <FiClock />
                  <span>Marcar Pendiente</span>
                </button>
              )}
              {ticket.status !== "closed" && (
                <button
                  onClick={handleResolve}
                  className="flex items-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                >
                  <FiCheckCircle />
                  <span>Cerrar Ticket</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Ticket Info */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex justify-between items-start mb-6 flex-wrap gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
              {ticket.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <FiTag className="w-4 h-4" />
                <span className="font-medium">ID: #{ticket.id}</span>
              </div>
              <div className="flex items-center gap-2">
                <FiCalendar className="w-4 h-4" />
                <span>
                  Creado: {new Date(ticket.created_at).toLocaleString("es-ES", {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              {ticket.updated_at && ticket.updated_at !== ticket.created_at && (
                <div className="flex items-center gap-2">
                  <FiEdit3 className="w-4 h-4" />
                  <span>
                    Actualizado: {new Date(ticket.updated_at).toLocaleString("es-ES", {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end space-y-2">
            <span
              className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                ticket.status === "open"
                  ? "bg-yellow-100 text-yellow-800 border border-yellow-300"
                  : ticket.status === "pending"
                  ? "bg-orange-100 text-orange-800 border border-orange-300"
                  : "bg-green-100 text-green-800 border border-green-300"
              }`}
            >
              {ticket.status === "open"
                ? "Abierto"
                : ticket.status === "pending"
                ? "Pendiente"
                : "Cerrado"}
            </span>
            <span
              className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                ticket.priority === "high"
                  ? "bg-red-100 text-red-800 border border-red-300"
                  : ticket.priority === "medium"
                  ? "bg-yellow-100 text-yellow-800 border border-yellow-300"
                  : "bg-green-100 text-green-800 border border-green-300"
              }`}
            >
              Prioridad:{" "}
              {ticket.priority === "high"
                ? "Alta"
                : ticket.priority === "medium"
                ? "Media"
                : "Baja"}
            </span>
          </div>
        </div>

        {/* Información del Creador */}
        {ticket.profiles && (
          <div className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-orange-500 p-3 rounded-full">
                <FiUser className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Creador del Ticket</h3>
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <span className="font-medium">Nombre:</span>
                    <span>
                      {(() => {
                        const name = ticket.profiles.full_name;
                        const email = ticket.profiles.email;
                        if (name && name.trim() !== "" && name !== "Usuario") {
                          return name;
                        }
                        if (email) {
                          return email.split("@")[0];
                        }
                        return "Sin nombre";
                      })()}
                    </span>
                  </div>
                  {ticket.profiles.email && (
                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <FiMail className="w-4 h-4" />
                      <span className="font-medium">Email:</span>
                      <span>{ticket.profiles.email}</span>
                    </div>
                  )}
                  {ticket.profiles.role && (
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-white rounded text-xs font-medium text-orange-700 border border-orange-300">
                        {ticket.profiles.role === "admin" ? "Administrador" : 
                         ticket.profiles.role === "assistance" ? "Asistente" : 
                         ticket.profiles.role === "empleado" ? "Empleado" : "Cliente"}
                      </span>
                    </div>
                  )}
                  {ticket.profiles.department && (
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-white rounded text-xs font-medium text-orange-600 border border-orange-200">
                        {ticket.profiles.department.replace(/_/g, ' ')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Categoría y Asignación */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {ticket.categories && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <FiTag className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Categoría</span>
              </div>
              <p className="text-gray-900 font-semibold">
                {ticket.categories.name || ticket.categories.type}
              </p>
              {ticket.categories.description && (
                <p className="text-xs text-gray-600 mt-1">{ticket.categories.description}</p>
              )}
            </div>
          )}
          
          {assignedAgent ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <FiUser className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">Asignado a</span>
              </div>
              <p className="text-gray-900 font-semibold">
                {assignedAgent.full_name || assignedAgent.email}
              </p>
              <p className="text-xs text-gray-600 mt-1">{assignedAgent.email}</p>
            </div>
          ) : isAdmin && availableAgents.length > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Asignar a:
              </label>
              <select
                onChange={(e) => e.target.value && handleAssign(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">Seleccionar agente</option>
                {availableAgents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.full_name || agent.email}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Etiquetas */}
        {isAdmin && (
          <div className="border-t pt-4 mb-4">
            <TagManager ticketId={parseInt(ticketId)} />
          </div>
        )}

        {/* Descripción */}
        <div className="border-t pt-4">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <FiMessageSquare className="w-5 h-5 text-orange-500" />
            Descripción del Problema
          </h3>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
              {ticket.description}
            </p>
          </div>
        </div>

        {/* Adjuntos */}
        <div className="border-t pt-4">
          <AttachmentGallery ticketId={parseInt(ticketId)} />
          {ticket.status !== "closed" && (
            <div className="mt-4">
              <AttachmentUploader
                ticketId={parseInt(ticketId)}
                onUploadComplete={() => {
                  loadTicket();
                }}
              />
            </div>
          )}
        </div>

        {/* Historial */}
        {isAdmin && (
          <div className="border-t pt-4 mt-4">
            <TicketHistory ticketId={parseInt(ticketId)} />
          </div>
        )}
      </div>

        {/* Feedback Section - Solo para tickets cerrados */}
        {ticket.status === "closed" && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Feedback del Cliente
            </h2>
            {!hasFeedback && currentUserId === ticket.user_id ? (
              <FeedbackForm
                ticketId={parseInt(ticketId)}
                onFeedbackSubmitted={() => {
                  checkFeedback();
                  loadTicket();
                }}
              />
            ) : (
              <Feedback status={ticket.status} tiket_id={ticketId} />
            )}
          </div>
        )}

        {/* Messages */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FiMessageSquare className="w-6 h-6 text-orange-500" />
              Conversación
            </h2>
            <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              {messages.length} {messages.length === 1 ? 'mensaje' : 'mensajes'}
            </span>
          </div>

          <div className="space-y-4 mb-6 max-h-[500px] overflow-y-auto pr-2">
            {messages.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <FiMessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No hay mensajes aún</p>
                <p className="text-sm text-gray-400 mt-1">Sé el primero en comentar</p>
              </div>
            ) : (
            messages.map((msg) => {
              const isMyMessage = msg.profiles?.id === currentUserId || 
                                   msg.sender_id === currentUserId ||
                                   (user?.email && msg.profiles?.email === user.email);
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isMyMessage ? "justify-end" : "justify-start"} animate-fade-in`}
                  >
                    <div
                      className={`max-w-lg p-4 rounded-xl shadow-sm ${
                        isMyMessage
                          ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white"
                          : "bg-gray-100 text-gray-800 border border-gray-200"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-full ${isMyMessage ? 'bg-white/20' : 'bg-gray-200'}`}>
                            <FiUser className={`w-3.5 h-3.5 ${isMyMessage ? 'text-white' : 'text-gray-600'}`} />
                          </div>
                          <span className={`text-sm font-semibold ${isMyMessage ? 'text-white' : 'text-gray-900 dark:text-gray-100'}`}>
                            {(() => {
                              // NUNCA mostrar "Usuario", siempre mostrar nombre real o email sin dominio
                              const name = msg.profiles?.full_name;
                              const email = msg.profiles?.email;
                              
                              // Si hay nombre y no es "Usuario" y tiene más de 1 carácter
                              if (name && name.trim() !== "" && name !== "Usuario" && name.length > 1) {
                                return name;
                              }
                              
                              // Si hay email, usar la parte antes del @
                              if (email && email.includes("@")) {
                                return email.split("@")[0];
                              }
                              
                              // Si no hay nada, usar ID truncado (nunca "Usuario")
                              return msg.profiles?.id ? msg.profiles.id.substring(0, 8) : "Usuario";
                            })()}
                          </span>
                          {/* SIEMPRE mostrar el rol, nunca ocultarlo */}
                          <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                            isMyMessage 
                              ? 'bg-white/20 text-white border border-white/30' 
                              : (msg.profiles?.role === "admin")
                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                              : (msg.profiles?.role === "assistance")
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : (msg.profiles?.role === "empleado")
                              ? 'bg-green-100 text-green-800 border border-green-200'
                              : 'bg-gray-200 text-gray-700 border border-gray-300'
                          }`}>
                            {msg.profiles?.role === "admin" ? "Administrador" : 
                             msg.profiles?.role === "assistance" ? "Asistente" : 
                             msg.profiles?.role === "empleado" ? "Empleado" : "Cliente"}
                          </span>
                          {msg.profiles?.department && (
                            <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                              {msg.profiles.department.replace('_', ' ')}
                            </span>
                          )}
                        </div>
                        <span className={`text-xs ${isMyMessage ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>
                          {new Date(msg.created_at).toLocaleString("es-ES", {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <p className={`whitespace-pre-wrap leading-relaxed ${isMyMessage ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                        {msg.body}
                      </p>
                      {msg.attachment_url && (
                        <div className="mt-3 pt-3 border-t border-white/20">
                          <a
                            href={msg.attachment_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`inline-flex items-center gap-2 text-sm hover:underline ${
                              isMyMessage ? 'text-white' : 'text-orange-600'
                            }`}
                          >
                            <FiPaperclip className="w-4 h-4" />
                            <span>Ver adjunto</span>
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Message Form */}
          {ticket.status !== "closed" && (
            <form onSubmit={handleSendMessage} className="border-t pt-4">
              <div className="space-y-3">
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Escribe tu mensaje aquí..."
                  className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none transition-all"
                  rows={4}
                />
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {messageText.length} caracteres
                  </p>
                  <button
                    type="submit"
                    disabled={sending || !messageText.trim()}
                    className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-lg hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-all shadow-md hover:shadow-lg font-semibold"
                  >
                    {sending ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Enviando...</span>
                      </>
                    ) : (
                      <>
                        <FiSend className="w-5 h-5" />
                        <span>Enviar Mensaje</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}
          {ticket.status === "closed" && (
            <div className="border-t pt-4">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                <FiCheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="text-gray-600 font-medium">Este ticket está cerrado</p>
                <p className="text-sm text-gray-500 mt-1">No se pueden enviar más mensajes</p>
              </div>
            </div>
          )}
        </div>
    </div>
  );
}

