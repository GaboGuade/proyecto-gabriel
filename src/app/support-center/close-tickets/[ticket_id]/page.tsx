"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getTicket } from "@/services/tickets";
import { getMessages, sendMessage } from "@/services/messages";
import { toast } from "react-toastify";
import Loading from "../../open-tickets/loading";
import { FiArrowLeft, FiUser, FiSend, FiDownload } from "react-icons/fi";
import { exportSingleTicketToExcel } from "@/utils/exportToExcel";

export default function ClosedTicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params.ticket_id as string;

  const [ticket, setTicket] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messageText, setMessageText] = useState("");

  useEffect(() => {
    loadTicket();
    loadMessages();
  }, [ticketId]);

  async function loadTicket() {
    try {
      const data = await getTicket(parseInt(ticketId));
      setTicket(data);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
        >
          <FiArrowLeft />
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
          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
            Cerrado
          </span>
        </div>
      </div>

      {/* Ticket Info */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              {ticket.title}
            </h1>
            <p className="text-sm text-gray-500">
              Ticket ID: #{ticket.id} • Creado:{" "}
              {new Date(ticket.created_at).toLocaleString("es-ES")}
            </p>
          </div>
        </div>

        <div className="border-t pt-4 mt-4">
          <h3 className="font-semibold mb-2">Descripción:</h3>
          <p className="text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
        </div>

        {ticket.profiles && (
          <div className="border-t pt-4 mt-4">
            <p className="text-sm text-gray-600">
              <span className="font-semibold">Cliente:</span>{" "}
              {ticket.profiles.full_name || ticket.profiles.email}
            </p>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h2 className="text-xl font-semibold mb-4">Historial de Conversación</h2>

        <div className="space-y-4">
          {messages.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No hay mensajes en este ticket.
            </p>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className="border-b pb-4 last:border-b-0">
                <div className="flex items-center space-x-2 mb-2">
                  <FiUser className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-semibold text-gray-800">
                    {msg.profiles?.full_name ||
                      msg.profiles?.email ||
                      "Usuario"}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(msg.created_at).toLocaleString("es-ES")}
                  </span>
                </div>
                <p className="text-gray-700 whitespace-pre-wrap ml-6">{msg.body}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
