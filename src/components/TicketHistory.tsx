"use client";

import { useState, useEffect } from "react";
import { getTicketHistoryWithUsers, TicketHistory } from "@/services/ticketHistory";
import { FiClock, FiUser, FiEdit, FiTag, FiCheckCircle, FiAlertCircle } from "react-icons/fi";

interface TicketHistoryProps {
  ticketId: number;
}

export default function TicketHistory({ ticketId }: TicketHistoryProps) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, [ticketId]);

  async function loadHistory() {
    setLoading(true);
    try {
      const data = await getTicketHistoryWithUsers(ticketId);
      setHistory(data);
    } catch (error: any) {
      console.error("Error loading history:", error);
    } finally {
      setLoading(false);
    }
  }

  function getActionIcon(action: string) {
    switch (action) {
      case 'created':
        return <FiTag className="w-4 h-4 text-blue-500" />;
      case 'status_changed':
        return <FiCheckCircle className="w-4 h-4 text-green-500" />;
      case 'priority_changed':
        return <FiAlertCircle className="w-4 h-4 text-orange-500" />;
      case 'assigned':
        return <FiUser className="w-4 h-4 text-purple-500" />;
      default:
        return <FiEdit className="w-4 h-4 text-gray-500" />;
    }
  }

  function getActionLabel(action: string) {
    switch (action) {
      case 'created':
        return 'Ticket creado';
      case 'status_changed':
        return 'Estado cambiado';
      case 'priority_changed':
        return 'Prioridad cambiada';
      case 'assigned':
        return 'Asignación cambiada';
      case 'updated':
        return 'Actualizado';
      default:
        return action;
    }
  }

  if (loading) {
    return <div className="text-sm text-gray-500">Cargando historial...</div>;
  }

  if (history.length === 0) {
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
        No hay historial disponible
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
        <FiClock className="w-5 h-5" />
        Historial de Cambios
      </h3>
      <div className="space-y-3">
        {history.map((item, index) => (
          <div
            key={item.id}
            className="flex gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <div className="flex-shrink-0 mt-1">
              {getActionIcon(item.action)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {item.description || getActionLabel(item.action)}
                  </p>
                  {item.field_name && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {item.field_name}: {item.old_value} → {item.new_value}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 flex items-center gap-1">
                    <FiUser className="w-3 h-3" />
                    {item.changed_by_profile?.full_name || item.changed_by_profile?.email || "Usuario desconocido"}
                  </p>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                  {new Date(item.created_at).toLocaleString("es-ES", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

