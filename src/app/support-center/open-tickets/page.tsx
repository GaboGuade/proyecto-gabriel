"use client";

import Loading from "@/components/Loading";
import { useState, useEffect } from "react";
import { getOpenTickets, getMyTickets } from "@/services/tickets";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { toast } from "react-toastify";
import Link from "next/link";
import { 
  FiClock, 
  FiAlertCircle, 
  FiCheckCircle, 
  FiEye, 
  FiSearch,
  FiRefreshCw,
  FiTag,
  FiUser,
  FiCalendar,
  FiDownload
} from "react-icons/fi";
import { exportTicketsToExcel } from "@/utils/exportToExcel";
import { supabase } from "@/lib/supabaseClient";

export default function OpenTickets() {
  const user = useSelector((state: RootState) => state.auth.user);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadTickets();
  }, []);

  async function loadTickets() {
    setLoading(true);
    try {
      let data: any[] = [];
      
      if (user?.roll === "admin" || user?.roll === "assistance") {
        data = await getOpenTickets();
      } else {
        const allTickets = await getMyTickets();
        data = allTickets.filter((t: any) => t.status === "open" || t.status === "pending");
      }
      
      setTickets(data || []);
    } catch (error: any) {
      console.error("Error loading tickets:", error);
      toast.error("Error al cargar tickets: " + (error.message || "Error desconocido"));
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await loadTickets();
    setRefreshing(false);
    toast.success("Tickets actualizados");
  }

  async function handleExport() {
    try {
      if (tickets.length === 0) {
        toast.warning("No hay tickets para exportar");
        return;
      }

      // Enriquecer tickets con información completa
      const enrichedTickets = await Promise.all(
        tickets.map(async (ticket: any) => {
          const enriched: any = { ...ticket };
          
          // Obtener perfil del usuario si no está
          if (ticket.user_id && !ticket.profiles) {
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
          
          // Obtener categoría si no está
          if (ticket.category_id && !ticket.categories) {
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

      exportTicketsToExcel(enrichedTickets, 'tickets_abiertos');
      toast.success(`Se exportaron ${enrichedTickets.length} tickets exitosamente`);
    } catch (error: any) {
      console.error("Error exporting tickets:", error);
      toast.error("Error al exportar tickets: " + (error.message || "Error desconocido"));
    }
  }

  const filteredTickets = tickets.filter((ticket) => {
    if (!searchQuery) return true;
    
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

  const getStatusBadge = (status: string) => {
    const configs = {
      open: { 
        label: "Abierto", 
        className: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-300 dark:border-yellow-600",
        icon: <FiClock className="w-3 h-3" />
      },
      pending: { 
        label: "Pendiente", 
        className: "bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 border-orange-300 dark:border-orange-600",
        icon: <FiAlertCircle className="w-3 h-3" />
      },
      closed: { 
        label: "Cerrado", 
        className: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-300 dark:border-green-600",
        icon: <FiCheckCircle className="w-3 h-3" />
      }
    };
    
    const config = configs[status as keyof typeof configs] || configs.open;
    
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${config.className}`}>
        {config.icon}
        {config.label}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const configs = {
      high: { 
        label: "Alta", 
        className: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-300 dark:border-red-600"
      },
      medium: { 
        label: "Media", 
        className: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-300 dark:border-yellow-600"
      },
      low: { 
        label: "Baja", 
        className: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-300 dark:border-green-600"
      }
    };
    
    const config = configs[priority as keyof typeof configs] || configs.medium;
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${config.className}`}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="space-y-6 w-full max-w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <FiClock className="w-8 h-8 text-orange-500" />
            Tickets Abiertos
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Gestiona y revisa todos los tickets en proceso
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
            title="Actualizar"
          >
            <FiRefreshCw className={`w-5 h-5 text-gray-600 dark:text-gray-400 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          {(user?.roll === "admin" || user?.roll === "assistance") && (
            <button
              onClick={handleExport}
              className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors text-blue-600 dark:text-blue-400"
              title="Exportar a Excel"
            >
              <FiDownload className="w-5 h-5" />
            </button>
          )}
          <div className="bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-700 rounded-lg px-4 py-2">
            <span className="text-sm text-gray-600 dark:text-gray-300">
              Total: <span className="font-bold text-orange-600 dark:text-orange-400">{filteredTickets.length}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por título, descripción, categoría o cliente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-600 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400"
          />
        </div>
      </div>

      {/* Tickets List */}
      {filteredTickets.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 p-12 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 text-center">
          <FiAlertCircle className="w-20 h-20 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
            {searchQuery ? "No se encontraron tickets" : "No hay tickets abiertos"}
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {searchQuery 
              ? "Intenta con otros términos de búsqueda"
              : "Los tickets abiertos aparecerán aquí cuando se creen"}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredTickets.map((ticket) => (
            <div
              key={ticket.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow overflow-hidden"
            >
              <div className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                  {/* Main Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex-1">
                        {ticket.title}
                      </h3>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(ticket.status)}
                        {getPriorityBadge(ticket.priority)}
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                      {ticket.description}
                    </p>

                    {/* Metadata */}
                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                      {ticket.categories && (
                        <div className="flex items-center gap-1">
                          <FiTag className="w-4 h-4" />
                          <span>{ticket.categories.name || ticket.categories.type || "Sin categoría"}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <FiCalendar className="w-4 h-4" />
                        <span>
                          {new Date(ticket.created_at).toLocaleDateString("es-ES", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </span>
                      </div>
                      {ticket.profiles && (
                        <div className="flex items-center gap-1">
                          <FiUser className="w-4 h-4" />
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            Creado por: {ticket.profiles.full_name || ticket.profiles.email || "Usuario"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="lg:flex-shrink-0">
                    <Link
                      href={`/support-center/open-tickets/${ticket.id}`}
                      className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors shadow-sm hover:shadow-md"
                    >
                      <FiEye className="w-4 h-4" />
                      Ver Detalles
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
