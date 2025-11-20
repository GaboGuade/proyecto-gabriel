"use client";

import CategoryList from "@/components/CategoryList";
import Search from "@/components/Search";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { supabase } from "@/lib/supabaseClient";
import Loading from "@/components/Loading";

type Props = {};

export default function Customer({}: Props) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    try {
      // Obtener sesión
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (!session || sessionError) {
        toast.error("No hay sesión activa");
        setUsers([]);
        return;
      }

      console.log("Cargando usuarios para:", session.user.id);

      // Intentar primero con función RPC (más confiable, evita problemas de RLS)
      let data: any[] = [];
      let error: any = null;

      // Método 1: Intentar con función RPC
      try {
        console.log("Intentando obtener usuarios con RPC...");
        const rpcResult = await supabase.rpc('get_all_profiles');
        
        console.log("Resultado RPC completo:", {
          data: rpcResult.data,
          error: rpcResult.error,
          count: rpcResult.data?.length || 0
        });
        
        if (rpcResult.error) {
          console.error("Error en RPC:", rpcResult.error);
          // Si la función no existe, continuar con método 2
          if (rpcResult.error.message?.includes("function") || rpcResult.error.message?.includes("does not exist")) {
            console.log("La función RPC no existe, usando método alternativo");
          } else {
            // Otro tipo de error, intentar método 2
            console.log("Error en RPC, intentando método alternativo:", rpcResult.error.message);
          }
        } else if (rpcResult.data && Array.isArray(rpcResult.data)) {
          console.log("✅ Usuarios obtenidos con RPC:", rpcResult.data.length);
          console.log("Datos RPC:", rpcResult.data);
          data = rpcResult.data;
          error = null;
        } else {
          console.log("RPC retornó datos vacíos o inválidos");
        }
      } catch (rpcErr: any) {
        console.error("Excepción en RPC:", rpcErr);
        // Continuar con método 2
      }

      // Método 2: Si RPC no funcionó, intentar consulta directa
      // IMPORTANTE: Mostrar TODOS los usuarios, no solo admins
      if (!data || data.length === 0) {
        try {
          console.log("Intentando consulta directa...");
          const result = await supabase
            .from("profiles")
            .select("*")
            .order("created_at", { ascending: false });
          
          if (result.error) {
            console.error("Error en consulta directa:", result.error);
            error = result.error;
          } else {
            console.log("Usuarios obtenidos con consulta directa:", result.data?.length || 0);
            data = result.data || [];
            
            // Si tenemos datos pero no emails, intentar obtenerlos con la función RPC individual
            if (data.length > 0) {
              console.log("Obteniendo emails para usuarios sin email...");
              const usersWithEmails = await Promise.all(
                data.map(async (user: any) => {
                  if (!user.email) {
                    try {
                      const emailResult = await supabase.rpc('get_user_email_by_id', { user_uuid: user.id });
                      if (emailResult.data && !emailResult.error) {
                        user.email = emailResult.data;
                      }
                    } catch (e) {
                      console.log("No se pudo obtener email para:", user.id);
                    }
                  }
                  return user;
                })
              );
              data = usersWithEmails;
            }
          }
        } catch (directErr: any) {
          console.error("Error en consulta directa:", directErr);
          error = directErr;
        }
      }

      // Si hay error y no hay datos
      if (error && data.length === 0) {
        console.error("Error completo al cargar usuarios:", error);
        
        // Mensaje de error más específico
        if (error.message?.includes("permission denied") || error.message?.includes("policy") || error.message?.includes("RLS")) {
          toast.error("Error de permisos. Ejecuta el script SQL en Supabase para configurar las políticas correctamente.");
        } else if (error.message?.includes("function") || error.message?.includes("does not exist")) {
          toast.error("La función RPC no existe. Ejecuta el script SQL en Supabase para crearla.");
        } else {
          toast.error("Error al cargar usuarios: " + (error.message || "Error desconocido"));
        }
        
        setUsers([]);
        return;
      }

      // Si tenemos datos, procesarlos
      // La función RPC ya debería incluir los emails desde auth.users
      if (data && Array.isArray(data) && data.length > 0) {
        console.log("✅ Total de usuarios encontrados:", data.length);
        console.log("📋 Datos recibidos (primeros 3):", data.slice(0, 3));
        
        // Mapear los datos correctamente (TODOS los usuarios: customers, empleados, assistance, admin)
        const usersWithEmails = data.map((user: any) => {
          // El email debería venir de la función RPC que hace JOIN con auth.users
          const email = user.email || null;
          
          // Si no hay full_name, usar el email sin dominio
          let displayName = user.full_name;
          if (!displayName || displayName.trim() === "" || displayName === "Usuario") {
            displayName = email ? email.split("@")[0] : null;
          }
          
          return {
            id: user.id,
            full_name: displayName,
            email: email,
            role: user.role || "customer",  // Rol por defecto si no tiene
            department: user.department || null,
            created_at: user.created_at || new Date().toISOString(),
            updated_at: user.updated_at || null,
          };
        });

        setUsers(usersWithEmails);
        console.log("✅ Usuarios cargados exitosamente:", usersWithEmails.length);
        console.log("📊 Detalle completo de usuarios:", usersWithEmails.map(u => ({ 
          id: u.id,
          name: u.full_name || "Sin nombre", 
          email: u.email || "Sin email", 
          role: u.role 
        })));
        
        if (usersWithEmails.length === 1) {
          console.warn("⚠️ Solo se encontró 1 usuario. Verifica que el script SQL se ejecutó correctamente.");
          toast.warning("Solo se encontró 1 usuario. Verifica que el script SQL se ejecutó en Supabase.");
        }
      } else {
        console.warn("⚠️ No se encontraron usuarios o los datos están vacíos");
        console.log("Datos recibidos:", data);
        setUsers([]);
        if (!error) {
          toast.warning("No se encontraron usuarios. Verifica que el script SQL se ejecutó correctamente.");
        }
      }
    } catch (error: any) {
      console.error("Error completo en loadUsers:", error);
      toast.error("Error al cargar usuarios: " + (error.message || "Error desconocido"));
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }

  const filteredUsers = users.filter((user) =>
    (user.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.full_name || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
          Gestión de Clientes
        </h2>
      </div>

      <Search 
        level="Lista de Clientes"
        onSearch={(query) => setSearchQuery(query)}
      />

      {loading ? (
        <Loading />
      ) : filteredUsers.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg border border-gray-200 dark:border-gray-700 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            {searchQuery
              ? "No se encontraron clientes con ese criterio"
              : "No hay clientes registrados"}
          </p>
        </div>
      ) : (
        <CategoryList 
          user={filteredUsers.map(u => ({
            id: u.id,
            name: u.full_name || u.email,
            email: u.email,
            roll: u.role || "customer",
            department: u.department || null,
            assign_to: null, // Por ahora sin categoría asignada
          }))} 
          customer={true}
          onDelete={loadUsers}
        />
      )}
    </div>
  );
}
