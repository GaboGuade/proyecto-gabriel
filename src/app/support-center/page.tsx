"use client";

import { useEffect, useState } from "react";
import { getMyTickets, getAllTickets } from "@/services/tickets";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import Link from "next/link";
import { 
  FiPlus, 
  FiTrendingUp, 
  FiClock, 
  FiCheckCircle, 
  FiAlertCircle,
  FiArrowRight,
  FiFileText,
  FiBarChart2,
  FiSettings,
  FiTag,
  FiMessageSquare,
  FiRefreshCw,
  FiActivity,
  FiSearch,
  FiDownload,
  FiUser
} from "react-icons/fi";
import Loading from "@/components/Loading";
import { exportTicketsToExcel } from "@/utils/exportToExcel";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "react-toastify";

export default function SupportCenter() {
  const user = useSelector((state: RootState) => state.auth.user);
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    closed: 0,
    pending: 0,
    high: 0,
    medium: 0,
    low: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [recentTickets, setRecentTickets] = useState<any[]>([]);
  const [allTickets, setAllTickets] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    setLoading(true);
    try {
      let tickets: any[] = [];
      
      if (user?.roll === "admin" || user?.roll === "assistance") {
        tickets = await getAllTickets();
      } else {
        tickets = await getMyTickets();
      }

      // Enriquecer tickets con perfiles y categorías
      const enrichedTickets = await Promise.all(
        tickets.map(async (ticket: any) => {
          const enriched: any = { ...ticket };
          
          if (ticket.user_id) {
            try {
              const { data: profile } = await supabase
                .from("profiles")
                .select("id, full_name, email, role")
                .eq("id", ticket.user_id)
                .single();
              if (profile) {
                enriched.profiles = {
                  ...profile,
                  full_name: profile.full_name || profile.email?.split("@")[0] || "Usuario"
                };
              }
            } catch (err) {
              console.log("Error loading profile:", err);
            }
          }
          
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

      const sortedTickets = [...enrichedTickets].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      setAllTickets(sortedTickets);
      setRecentTickets(sortedTickets.slice(0, 5));

      setStats({
        total: enrichedTickets.length,
        open: enrichedTickets.filter((t) => t.status === "open").length,
        closed: enrichedTickets.filter((t) => t.status === "closed").length,
        pending: enrichedTickets.filter((t) => t.status === "pending").length,
        high: enrichedTickets.filter((t) => t.priority === "high").length,
        medium: enrichedTickets.filter((t) => t.priority === "medium").length,
        low: enrichedTickets.filter((t) => t.priority === "low").length,
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  }

  async function handleExport() {
    try {
      const allTicketsData = await getAllTickets();
      const enrichedTickets = await Promise.all(
        allTicketsData.map(async (ticket: any) => {
          const enriched: any = { ...ticket };
          if (ticket.user_id) {
            try {
              const { data: profile } = await supabase
                .from("profiles")
                .select("id, full_name, email, role")
                .eq("id", ticket.user_id)
                .single();
              if (profile) enriched.profiles = profile;
            } catch (err) {
              console.log("Error loading profile:", err);
            }
          }
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
      exportTicketsToExcel(enrichedTickets, "todos_los_tickets");
      toast.success("Todos los tickets exportados exitosamente");
    } catch (error: any) {
      toast.error("Error al exportar: " + (error.message || "Error desconocido"));
    }
  }

  const isAdmin = user?.roll === "admin" || user?.roll === "assistance";
  const completionRate = stats.total > 0 ? Math.round((stats.closed / stats.total) * 100) : 0;
  const openRate = stats.total > 0 ? Math.round((stats.open / stats.total) * 100) : 0;
  
  const filteredTickets = allTickets.filter(ticket => {
    if (!searchQuery) return false;
    
    const query = searchQuery.toLowerCase();
    const title = ticket.title?.toLowerCase() || "";
    const description = ticket.description?.toLowerCase() || "";
    const status = ticket.status?.toLowerCase() || "";
    const priority = ticket.priority?.toLowerCase() || "";
    const categoryName = ticket.categories?.name?.toLowerCase() || "";
    const categoryType = ticket.categories?.type?.toLowerCase() || "";
    const creatorName = ticket.profiles?.full_name?.toLowerCase() || "";
    const creatorEmail = ticket.profiles?.email?.toLowerCase() || "";
    
    return (
      title.includes(query) ||
      description.includes(query) ||
      status.includes(query) ||
      priority.includes(query) ||
      categoryName.includes(query) ||
      categoryType.includes(query) ||
      creatorName.includes(query) ||
      creatorEmail.includes(query)
    );
  });

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="space-y-6 w-full max-w-full">
      {/* Header */}
      <div className="bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 dark:from-orange-600 dark:via-orange-700 dark:to-orange-800 rounded-2xl shadow-xl p-6 lg:p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-5"></div>
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-3">
              <div className="bg-white/20 p-4 rounded-xl backdrop-blur-sm">
                <FiFileText className="w-10 h-10" />
              </div>
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold mb-1">
                  Centro de Soporte
                </h1>
                <p className="text-orange-50 text-base lg:text-lg">
                  Sistema de gestión de tickets - Antares Panamericana
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4 mt-4">
              <div className="bg-white/10 px-4 py-2 rounded-lg backdrop-blur-sm">
                <span className="text-sm text-orange-100">Usuario:</span>
                <span className="ml-2 font-semibold">{user?.name || user?.email || "Usuario"}</span>
              </div>
              <div className="bg-white/10 px-4 py-2 rounded-lg backdrop-blur-sm">
                <span className="text-sm text-orange-100">Rol:</span>
                <span className="ml-2 font-semibold capitalize">{user?.roll || "customer"}</span>
              </div>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="bg-white/20 hover:bg-white/30 px-6 py-3 rounded-xl backdrop-blur-sm transition-all flex items-center gap-2 disabled:opacity-50"
            title="Actualizar estadísticas"
          >
            <FiRefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* Estadísticas Principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatCard
          title="Total Tickets"
          value={stats.total}
          icon={<FiTrendingUp className="w-6 h-6" />}
          color="bg-blue-500"
          bgColor="bg-blue-50 dark:bg-blue-900/20"
          borderColor="border-blue-200 dark:border-blue-800"
        />
        <StatCard
          title="Abiertos"
          value={stats.open}
          icon={<FiClock className="w-6 h-6" />}
          color="bg-yellow-500"
          bgColor="bg-yellow-50 dark:bg-yellow-900/20"
          borderColor="border-yellow-200 dark:border-yellow-800"
          subtitle={`${openRate}% del total`}
        />
        <StatCard
          title="Pendientes"
          value={stats.pending}
          icon={<FiAlertCircle className="w-6 h-6" />}
          color="bg-orange-500"
          bgColor="bg-orange-50 dark:bg-orange-900/20"
          borderColor="border-orange-200 dark:border-orange-800"
        />
        <StatCard
          title="Cerrados"
          value={stats.closed}
          icon={<FiCheckCircle className="w-6 h-6" />}
          color="bg-green-500"
          bgColor="bg-green-50 dark:bg-green-900/20"
          borderColor="border-green-200 dark:border-green-800"
          subtitle={`${completionRate}% completado`}
        />
      </div>

      {/* Prioridades - Solo para Admin */}
      {isAdmin && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
          <PriorityCard
            title="Prioridad Alta"
            value={stats.high}
            color="red"
            total={stats.total}
          />
          <PriorityCard
            title="Prioridad Media"
            value={stats.medium}
            color="yellow"
            total={stats.total}
          />
          <PriorityCard
            title="Prioridad Baja"
            value={stats.low}
            color="green"
            total={stats.total}
          />
        </div>
      )}

      {/* Búsqueda y Acciones */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
            <input
              type="text"
              placeholder="Buscar tickets por título, descripción, categoría, creador..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>
        </div>
      </div>

      {/* Botón Crear Ticket */}
      <Link href="/support-center/create-ticket" className="block w-full">
        <div className="bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 p-8 rounded-2xl shadow-2xl border-4 border-orange-300 hover:border-orange-400 hover:shadow-3xl transition-all cursor-pointer group transform hover:scale-[1.01]">
          <div className="flex items-center justify-center gap-6 text-white">
            <div className="bg-white/20 p-6 rounded-2xl backdrop-blur-sm group-hover:bg-white/30 transition-all shadow-lg">
              <FiPlus className="w-16 h-16" />
            </div>
            <div className="text-center flex-1">
              <h2 className="text-4xl font-bold mb-2">
                Crear Nuevo Ticket
              </h2>
              <p className="text-lg text-orange-50">
                Reporta un problema, solicita soporte o haz una consulta
              </p>
            </div>
            <div className="bg-white/20 p-4 rounded-xl group-hover:bg-white/30 transition-all">
              <FiArrowRight className="w-10 h-10 transform group-hover:translate-x-2 transition-transform" />
            </div>
          </div>
        </div>
      </Link>

      {/* Acciones Rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
        <QuickActionCard
          href="/support-center/open-tickets"
          title="Tickets Abiertos"
          description={`${stats.open} tickets pendientes`}
          icon={<FiClock className="w-8 h-8" />}
          color="blue"
        />
        <QuickActionCard
          href="/support-center/close-tickets"
          title="Tickets Cerrados"
          description={`${stats.closed} tickets resueltos`}
          icon={<FiCheckCircle className="w-8 h-8" />}
          color="green"
        />
        {isAdmin && (
          <>
            <QuickActionCard
              href="/support-center/category"
              title="Gestionar Categorías"
              description="Crear y editar categorías"
              icon={<FiTag className="w-8 h-8" />}
              color="purple"
            />
            <QuickActionCard
              href="/support-center/settings"
              title="Configuración"
              description="Ajustes del sistema"
              icon={<FiSettings className="w-8 h-8" />}
              color="gray"
            />
          </>
        )}
      </div>

      {/* Resumen y Tickets Recientes */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Resumen del Sistema */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <FiBarChart2 className="w-6 h-6 text-orange-500" />
            Resumen del Sistema
          </h2>
          <div className="space-y-3">
            <SummaryItem
              icon={<FiTrendingUp className="w-5 h-5 text-blue-600" />}
              label="Total de tickets"
              value={stats.total}
              color="blue"
            />
            <SummaryItem
              icon={<FiClock className="w-5 h-5 text-yellow-600" />}
              label="Tickets abiertos"
              value={stats.open}
              color="yellow"
            />
            <SummaryItem
              icon={<FiAlertCircle className="w-5 h-5 text-orange-600" />}
              label="Tickets pendientes"
              value={stats.pending}
              color="orange"
            />
            <SummaryItem
              icon={<FiCheckCircle className="w-5 h-5 text-green-600" />}
              label="Tickets cerrados"
              value={stats.closed}
              color="green"
            />
          </div>
          {isAdmin && (
            <div className="mt-4 p-4 bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-2 border-orange-200 dark:border-orange-800 rounded-lg">
              <p className="text-sm text-orange-800 dark:text-orange-200 font-medium flex items-center gap-2">
                <FiActivity className="w-4 h-4" />
                Como administrador, puedes gestionar todos los tickets y asignarlos a los agentes de soporte.
              </p>
            </div>
          )}
        </div>

        {/* Tickets Recientes */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between gap-4 mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FiMessageSquare className="w-6 h-6 text-orange-500" />
              {searchQuery ? "Resultados de Búsqueda" : "Tickets Recientes"}
              {searchQuery && (
                <span className="text-sm font-normal text-gray-500">
                  ({filteredTickets.length} resultados)
                </span>
              )}
            </h2>
            <div className="flex items-center gap-2">
              {isAdmin && !searchQuery && (
                <button
                  onClick={handleExport}
                  className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-lg transition-colors flex items-center gap-2 text-sm"
                  title="Exportar todos los tickets a Excel"
                >
                  <FiDownload className="w-4 h-4" />
                  <span className="hidden sm:inline">Exportar todos</span>
                </button>
              )}
              <Link 
                href="/support-center/open-tickets"
                className="text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1"
              >
                Ver todos
                <FiArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {(searchQuery ? filteredTickets : recentTickets).length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <FiFileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>{searchQuery ? "No se encontraron tickets" : "No hay tickets recientes"}</p>
              </div>
            ) : (
              (searchQuery ? filteredTickets : recentTickets).map((ticket) => (
                <Link 
                  key={ticket.id}
                  href={`/support-center/open-tickets/${ticket.id}`}
                  className="block p-4 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 transition-all group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base text-gray-900 dark:text-gray-100 mb-1 truncate group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                        {ticket.title}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                        {new Date(ticket.created_at).toLocaleString("es-ES", {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                      {ticket.profiles && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-1">
                          <FiUser className="w-3 h-3" />
                          <span className="font-medium">
                            {ticket.profiles.full_name || ticket.profiles.email || "Usuario"}
                          </span>
                        </p>
                      )}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          ticket.status === "open" 
                            ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300"
                            : ticket.status === "pending"
                            ? "bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300"
                            : "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                        }`}>
                          {ticket.status === "open" ? "Abierto" : ticket.status === "pending" ? "Pendiente" : "Cerrado"}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          ticket.priority === "high"
                            ? "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300"
                            : ticket.priority === "medium"
                            ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300"
                            : "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                        }`}>
                          {ticket.priority === "high" ? "Alta" : ticket.priority === "medium" ? "Media" : "Baja"}
                        </span>
                      </div>
                    </div>
                    <FiArrowRight className="w-5 h-5 text-gray-400 group-hover:text-orange-500 transition-colors flex-shrink-0" />
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  color,
  bgColor,
  borderColor,
  subtitle,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  subtitle?: string;
}) {
  return (
    <div className={`p-6 rounded-xl shadow-md border-2 ${borderColor} ${bgColor} hover:shadow-lg transition-all transform hover:-translate-y-1`}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">{title}</p>
        <div className={`${color} text-white p-3 rounded-lg shadow-md`}>
          {icon}
        </div>
      </div>
      <div>
        <p className="text-4xl font-bold text-gray-900 dark:text-white mb-1">{value}</p>
        {subtitle && (
          <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

function PriorityCard({
  title,
  value,
  color,
  total,
}: {
  title: string;
  value: number;
  color: "red" | "yellow" | "green";
  total: number;
}) {
  const colorClasses = {
    red: {
      bg: "from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20",
      border: "border-red-200 dark:border-red-800",
      text: "text-red-900 dark:text-red-200",
      number: "text-red-600 dark:text-red-400",
      bar: "bg-red-200 dark:bg-red-900/30",
      fill: "bg-red-600 dark:bg-red-500",
    },
    yellow: {
      bg: "from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20",
      border: "border-yellow-200 dark:border-yellow-800",
      text: "text-yellow-900 dark:text-yellow-200",
      number: "text-yellow-600 dark:text-yellow-400",
      bar: "bg-yellow-200 dark:bg-yellow-900/30",
      fill: "bg-yellow-600 dark:bg-yellow-500",
    },
    green: {
      bg: "from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20",
      border: "border-green-200 dark:border-green-800",
      text: "text-green-900 dark:text-green-200",
      number: "text-green-600 dark:text-green-400",
      bar: "bg-green-200 dark:bg-green-900/30",
      fill: "bg-green-600 dark:bg-green-500",
    },
  };

  const colors = colorClasses[color];
  const percentage = total > 0 ? (value / total) * 100 : 0;

  return (
    <div className={`bg-gradient-to-br ${colors.bg} border-2 ${colors.border} rounded-xl p-6 shadow-sm`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-lg font-semibold ${colors.text} flex items-center gap-2`}>
          <FiAlertCircle className="w-5 h-5" />
          {title}
        </h3>
        <span className={`text-3xl font-bold ${colors.number}`}>{value}</span>
      </div>
      <div className={`w-full ${colors.bar} rounded-full h-2`}>
        <div 
          className={`${colors.fill} h-2 rounded-full transition-all`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
}

function QuickActionCard({
  href,
  title,
  description,
  icon,
  color,
}: {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: "blue" | "green" | "purple" | "gray";
}) {
  const colorClasses = {
    blue: {
      bg: "from-blue-50 to-white dark:from-blue-900/20 dark:to-gray-800",
      border: "border-blue-200 dark:border-blue-800",
      iconBg: "from-blue-400 to-blue-500",
      iconHover: "from-blue-500 to-blue-600",
      text: "text-blue-500 dark:text-blue-400",
    },
    green: {
      bg: "from-green-50 to-white dark:from-green-900/20 dark:to-gray-800",
      border: "border-green-200 dark:border-green-800",
      iconBg: "from-green-400 to-green-500",
      iconHover: "from-green-500 to-green-600",
      text: "text-green-500 dark:text-green-400",
    },
    purple: {
      bg: "from-purple-50 to-white dark:from-purple-900/20 dark:to-gray-800",
      border: "border-purple-200 dark:border-purple-800",
      iconBg: "from-purple-400 to-purple-500",
      iconHover: "from-purple-500 to-purple-600",
      text: "text-purple-500 dark:text-purple-400",
    },
    gray: {
      bg: "from-gray-50 to-white dark:from-gray-800 dark:to-gray-800",
      border: "border-gray-200 dark:border-gray-700",
      iconBg: "from-gray-400 to-gray-500",
      iconHover: "from-gray-500 to-gray-600",
      text: "text-gray-500 dark:text-gray-400",
    },
  };

  const colors = colorClasses[color];

  return (
    <Link href={href}>
      <div className={`bg-gradient-to-br ${colors.bg} p-6 rounded-xl shadow-md border-2 ${colors.border} hover:shadow-lg transition-all cursor-pointer group transform hover:-translate-y-1`}>
        <div className="flex items-center space-x-4">
          <div className={`bg-gradient-to-br ${colors.iconBg} p-4 rounded-xl group-hover:${colors.iconHover} transition-all shadow-lg`}>
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-1">
              {title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {description}
            </p>
          </div>
          <FiArrowRight className={`w-6 h-6 text-gray-400 group-hover:${colors.text} transition-colors transform group-hover:translate-x-1 flex-shrink-0`} />
        </div>
      </div>
    </Link>
  );
}

function SummaryItem({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: "blue" | "yellow" | "orange" | "green";
}) {
  const colorClasses = {
    blue: "from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400",
    yellow: "from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-200 dark:border-yellow-800 text-yellow-600 dark:text-yellow-400",
    orange: "from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400",
    green: "from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800 text-green-600 dark:text-green-400",
  };

  return (
    <div className={`flex items-center justify-between p-4 bg-gradient-to-r ${colorClasses[color]} rounded-lg border`}>
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
      </div>
      <span className="text-2xl font-bold">{value}</span>
    </div>
  );
}
