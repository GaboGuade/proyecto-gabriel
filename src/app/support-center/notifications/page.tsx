"use client";

import { useState, useEffect } from "react";
import { getNotifications, markAsRead, markAllAsRead } from "@/services/notifications";
import { FiBell, FiCheck, FiCheckCircle } from "react-icons/fi";
import { toast } from "react-toastify";
import Link from "next/link";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  async function loadNotifications() {
    setLoading(true);
    try {
      const data = await getNotifications();
      setNotifications(data);
    } catch (error: any) {
      toast.error("Error al cargar notificaciones: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkAsRead(notificationId: number) {
    try {
      await markAsRead(notificationId);
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
    } catch (error: any) {
      toast.error("Error: " + error.message);
    }
  }

  async function handleMarkAllAsRead() {
    try {
      await markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      toast.success("Todas las notificaciones marcadas como leídas");
    } catch (error: any) {
      toast.error("Error: " + error.message);
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <FiBell className="w-6 h-6" />
            Notificaciones
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {unreadCount > 0 ? `${unreadCount} no leídas` : "Todas leídas"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            <FiCheckCircle className="w-4 h-4" />
            Marcar todas como leídas
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Cargando...</div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          No hay notificaciones
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 rounded-lg border transition-colors ${
                notification.read
                  ? "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                  : "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start gap-3">
                    {!notification.read && (
                      <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {notification.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                        {new Date(notification.created_at).toLocaleString("es-ES", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {notification.ticket_id && (
                    <Link
                      href={`/support-center/open-tickets/${notification.ticket_id}`}
                      className="px-3 py-1 text-sm bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
                    >
                      Ver ticket
                    </Link>
                  )}
                  {!notification.read && (
                    <button
                      onClick={() => handleMarkAsRead(notification.id)}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                      title="Marcar como leída"
                    >
                      <FiCheck className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

