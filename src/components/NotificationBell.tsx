"use client";

import { useState, useEffect } from "react";
import { FiBell } from "react-icons/fi";
import { getUnreadCount, getNotifications, markAsRead, markAllAsRead, subscribeToNotifications } from "@/services/notifications";
import { toast } from "react-toastify";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadNotifications();
    loadUnreadCount();

    // Suscribirse a notificaciones en tiempo real
    let unsubscribe: (() => void) | undefined;
    
    const setupRealtime = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        unsubscribe = subscribeToNotifications(session.user.id, (newNotification) => {
          setUnreadCount(prev => prev + 1);
          setNotifications(prev => [newNotification, ...prev]);
          toast.info(newNotification.title);
        });
      }
    };

    setupRealtime();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  async function loadNotifications() {
    setLoading(true);
    try {
      const data = await getNotifications();
      setNotifications(data.slice(0, 10)); // Solo las últimas 10
    } catch (error: any) {
      console.error("Error loading notifications:", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadUnreadCount() {
    try {
      const count = await getUnreadCount();
      setUnreadCount(count);
    } catch (error: any) {
      console.error("Error loading unread count:", error);
    }
  }

  async function handleMarkAsRead(notificationId: number) {
    try {
      await markAsRead(notificationId);
      setUnreadCount(prev => Math.max(0, prev - 1));
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
    } catch (error: any) {
      toast.error("Error al marcar notificación: " + error.message);
    }
  }

  async function handleMarkAllAsRead() {
    try {
      await markAllAsRead();
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      toast.success("Todas las notificaciones marcadas como leídas");
    } catch (error: any) {
      toast.error("Error: " + error.message);
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => {
          setShowDropdown(!showDropdown);
          if (!showDropdown) loadNotifications();
        }}
        className="relative p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-orange-100 dark:hover:bg-orange-900 hover:text-orange-600 dark:hover:text-orange-400 transition-all duration-200"
        title="Notificaciones"
      >
        <FiBell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-20 max-h-96 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Notificaciones
                {unreadCount > 0 && (
                  <span className="ml-2 text-sm text-gray-500">
                    ({unreadCount} nuevas)
                  </span>
                )}
              </h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-sm text-orange-600 hover:text-orange-700 dark:text-orange-400"
                >
                  Marcar todas
                </button>
              )}
            </div>

            <div className="overflow-y-auto flex-1">
              {loading ? (
                <div className="p-4 text-center text-gray-500">Cargando...</div>
              ) : notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  No hay notificaciones
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer ${
                      !notification.read ? "bg-orange-50 dark:bg-orange-900/20" : ""
                    }`}
                    onClick={() => {
                      if (!notification.read) {
                        handleMarkAsRead(notification.id);
                      }
                      if (notification.ticket_id) {
                        window.location.href = `/support-center/open-tickets/${notification.ticket_id}`;
                      }
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-sm text-gray-900 dark:text-white">
                          {notification.title}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          {new Date(notification.created_at).toLocaleString("es-ES", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-orange-500 rounded-full ml-2 flex-shrink-0 mt-1" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-3 border-t border-gray-200 dark:border-gray-700 text-center">
              <Link
                href="/support-center/notifications"
                className="text-sm text-orange-600 hover:text-orange-700 dark:text-orange-400"
                onClick={() => setShowDropdown(false)}
              >
                Ver todas las notificaciones
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

