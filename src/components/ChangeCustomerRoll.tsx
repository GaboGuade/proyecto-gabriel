"use client";

import { Dispatch, SetStateAction, useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "react-toastify";
import { getAllCategories } from "@/services/categories";

type Props = {
  selectedUser: string;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  data: any[];
  onSuccess?: () => void;
};

const DEPARTMENTS = [
  { value: "ventas", label: "Ventas" },
  { value: "soporte", label: "Soporte Técnico" },
  { value: "marketing", label: "Marketing" },
  { value: "recursos_humanos", label: "Recursos Humanos" },
  { value: "finanzas", label: "Finanzas" },
  { value: "operaciones", label: "Operaciones" },
  { value: "it", label: "Tecnología (IT)" },
  { value: "administracion", label: "Administración" },
];

export default function ChangeCustomerRoll({
  data,
  selectedUser,
  setIsOpen,
  onSuccess,
}: Props) {
  const [selectedRoll, setSelectedRoll] = useState<string>("customer");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryDescription, setNewCategoryDescription] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);

  useEffect(() => {
    loadCategories();
    if (selectedUser) {
      loadCurrentUser();
    }
  }, [selectedUser]);

  async function loadCurrentUser() {
    // Validar que selectedUser tenga un valor válido
    if (!selectedUser || selectedUser.trim() === "") {
      console.warn("⚠️ selectedUser está vacío, no se puede cargar el usuario");
      return;
    }

    try {
      console.log("📥 Cargando usuario con ID:", selectedUser);
      
      const { data: userData, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", selectedUser)
        .single();
      
      if (error) {
        console.error("❌ Error en consulta:", error);
        throw error;
      }
      
      if (userData) {
        console.log("✅ Usuario cargado:", userData);
        setCurrentUser(userData);
        setSelectedRoll(userData.role || "customer");
        setSelectedDepartment(userData.department || "");
        setSelectedCategory(userData.assigned_category_id ? userData.assigned_category_id.toString() : "");
      } else {
        console.warn("⚠️ No se encontró el usuario con ID:", selectedUser);
      }
    } catch (error: any) {
      console.error("❌ Error loading user:", error);
      toast.error("Error al cargar información del usuario: " + (error.message || "Error desconocido"));
    }
  }

  async function loadCategories() {
    try {
      // Solo cargar categorías de tipo 'user' para asistentes
      const { getUserCategories } = await import("@/services/categories");
      const cats = await getUserCategories();
      setCategories(cats);
    } catch (error: any) {
      toast.error("Error al cargar categorías: " + error.message);
    } finally {
      setLoadingCategories(false);
    }
  }

  async function handleCreateCategory(e: React.FormEvent) {
    e.preventDefault();
    
    if (!newCategoryName.trim()) {
      toast.error("Por favor ingresa el nombre de la categoría");
      return;
    }

    setCreatingCategory(true);
    try {
      // Verificar sesión antes de crear
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        toast.error("Tu sesión ha expirado. Por favor, recarga la página.");
        return;
      }

      const { createCategory } = await import("@/services/categories");
      const created = await createCategory({
        name: newCategoryName.trim(),
        description: newCategoryDescription.trim() || undefined,
        category_for: 'user', // Categoría para usuarios/asistentes
      });
      
      toast.success(`Categoría "${created.name}" creada exitosamente`);
      setNewCategoryName("");
      setNewCategoryDescription("");
      setShowCreateCategory(false);
      
      // Recargar categorías y seleccionar la recién creada
      await loadCategories();
      setSelectedCategory(created.id.toString());
    } catch (error: any) {
      console.error("Error al crear categoría:", error);
      
      // Manejar errores específicos sin cerrar sesión
      if (error.message?.includes("RLS") || error.message?.includes("policy") || error.message?.includes("permission")) {
        toast.error("No tienes permisos para crear categorías. Solo administradores pueden crear categorías.");
      } else if (error.message?.includes("no autenticado") || error.message?.includes("sesión")) {
        toast.error("Tu sesión ha expirado. Por favor, recarga la página.");
      } else {
        toast.error("Error al crear categoría: " + (error.message || "Error desconocido"));
      }
    } finally {
      setCreatingCategory(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedRoll === "assistance" && !selectedCategory) {
      toast.error("Por favor selecciona una categoría para el asistente");
      return;
    }

    if (selectedRoll === "empleado" && !selectedDepartment) {
      toast.error("Por favor selecciona un departamento para el empleado");
      return;
    }

    setLoading(true);
    try {
      // Preparar datos de actualización
      const updateData: any = {
        role: selectedRoll,
      };

      // SIEMPRE actualizar department según el rol
      if (selectedRoll === "empleado") {
        // Si es empleado, SIEMPRE usar el departamento seleccionado
        // Asegurarse de que selectedDepartment tenga un valor válido
        if (selectedDepartment && selectedDepartment.trim() !== "") {
          updateData.department = selectedDepartment;
        } else {
          // Si no hay departamento seleccionado, mantener el actual o poner null
          updateData.department = currentUser?.department || null;
        }
        // Limpiar categoría asignada si es empleado
        updateData.assigned_category_id = null;
      } else {
        // Si no es empleado, limpiar department explícitamente
        updateData.department = null;
      }

      // Actualizar categoría asignada para asistentes
      if (selectedRoll === "assistance") {
        if (selectedCategory && selectedCategory.trim() !== "") {
          updateData.assigned_category_id = parseInt(selectedCategory);
        } else {
          // Si no hay categoría seleccionada, mantener la actual o poner null
          updateData.assigned_category_id = currentUser?.assigned_category_id || null;
        }
      } else {
        // Si no es asistente, limpiar categoría asignada
        updateData.assigned_category_id = null;
      }

      console.log("📝 Datos a actualizar:", {
        userId: selectedUser,
        role: selectedRoll,
        selectedDepartment: selectedDepartment,
        departmentEnUpdate: updateData.department,
        currentUserDepartment: currentUser?.department,
        updateData
      });

      // Primera actualización: rol y departamento juntos
      const { error, data } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", selectedUser)
        .select();

      if (error) {
        console.error("❌ Error en primera actualización:", error);
        throw error;
      }

      console.log("✅ Primera actualización exitosa:", data);

      // Verificar que se actualizó correctamente
      const updatedProfile = data?.[0];
      if (!updatedProfile) {
        throw new Error("No se recibió el perfil actualizado");
      }

      // Verificar que el departamento se actualizó correctamente
      if (selectedRoll === "empleado" && selectedDepartment) {
        if (updatedProfile.department !== selectedDepartment) {
          console.warn("⚠️ El departamento no coincide. Esperado:", selectedDepartment, "Obtenido:", updatedProfile.department);
          console.log("🔄 Intentando actualizar solo el departamento...");
          
          // Intentar actualizar solo el departamento con un enfoque más directo
          const { error: deptError, data: deptData } = await supabase
            .from("profiles")
            .update({ department: selectedDepartment })
            .eq("id", selectedUser)
            .select();
          
          if (deptError) {
            console.error("❌ Error actualizando solo el departamento:", deptError);
            console.error("Detalles del error:", JSON.stringify(deptError, null, 2));
            toast.error("Error al actualizar el departamento: " + deptError.message);
            throw deptError;
          } else {
            console.log("✅ Departamento actualizado en segunda actualización:", deptData);
            // Verificar nuevamente
            const finalProfile = deptData?.[0];
            if (finalProfile && finalProfile.department === selectedDepartment) {
              console.log("✅✅ Departamento confirmado:", finalProfile.department);
            } else {
              console.warn("⚠️⚠️ El departamento aún no coincide después de la segunda actualización");
            }
          }
        } else {
          console.log("✅ Departamento actualizado correctamente en primera actualización:", updatedProfile.department);
        }
      }

      // Recargar el usuario actualizado para verificar
      await loadCurrentUser();
      
      // Verificar una vez más después de recargar
      const { data: verifyData } = await supabase
        .from("profiles")
        .select("role, department")
        .eq("id", selectedUser)
        .single();
      
      if (verifyData) {
        console.log("🔍 Verificación final - Rol:", verifyData.role, "Departamento:", verifyData.department);
        if (selectedRoll === "empleado" && selectedDepartment && verifyData.department !== selectedDepartment) {
          console.error("❌❌ ERROR CRÍTICO: El departamento NO se guardó. Valor esperado:", selectedDepartment, "Valor en BD:", verifyData.department);
          toast.error("El departamento no se guardó correctamente. Por favor, intenta de nuevo o verifica los permisos en Supabase.");
        }
      }

      toast.success("Rol y departamento actualizados exitosamente");
      setIsOpen(false);
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error("❌ Error completo al actualizar:", error);
      toast.error("Error al actualizar: " + (error.message || "Error desconocido"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
      <h1 className="pb-4 font-semibold text-xl text-gray-800 dark:text-white">
        Cambiar Rol de Usuario
      </h1>

      {currentUser && (
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium">Usuario:</span> {currentUser.full_name || currentUser.email || "Sin nombre"}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium">Rol actual:</span> <span className="capitalize">{currentUser.role || "customer"}</span>
          </p>
          {currentUser.department && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium">Departamento:</span> <span className="capitalize">{currentUser.department.replace('_', ' ')}</span>
            </p>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="roll" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Rol del Usuario *
          </label>
          <select
            id="roll"
            value={selectedRoll}
            onChange={(e) => {
              setSelectedRoll(e.target.value);
              // Limpiar department si no es empleado
              if (e.target.value !== "empleado") {
                setSelectedDepartment("");
              }
            }}
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 py-2 px-3 outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent capitalize bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            required
          >
            <option value="customer">Cliente</option>
            <option value="empleado">Empleado</option>
            <option value="assistance">Asistente</option>
            <option value="admin">Administrador</option>
          </select>
        </div>

        {selectedRoll === "empleado" && (
          <div>
            <label htmlFor="department" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Departamento *
            </label>
            <select
              id="department"
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 py-2 px-3 outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              required
            >
              <option value="">Selecciona un departamento</option>
              {DEPARTMENTS.map((dept) => (
                <option key={dept.value} value={dept.value}>
                  {dept.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Asigna el departamento al que pertenece el empleado
            </p>
          </div>
        )}

        {selectedRoll === "assistance" && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Categoría Asignada *
              </label>
              <button
                type="button"
                onClick={() => setShowCreateCategory(!showCreateCategory)}
                className="text-xs text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 font-medium"
              >
                {showCreateCategory ? "Cancelar" : "+ Crear nueva"}
              </button>
            </div>
            
            {showCreateCategory ? (
              <div className="mb-3 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                <form onSubmit={handleCreateCategory} className="space-y-2">
                  <div>
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Nombre de la categoría (ej: Pasante, Senior)"
                      className="w-full rounded-md border border-gray-300 dark:border-gray-600 py-2 px-3 outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <textarea
                      value={newCategoryDescription}
                      onChange={(e) => setNewCategoryDescription(e.target.value)}
                      placeholder="Descripción (opcional)"
                      rows={2}
                      className="w-full rounded-md border border-gray-300 dark:border-gray-600 py-2 px-3 outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={creatingCategory}
                    className="w-full bg-orange-500 dark:bg-orange-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-orange-600 dark:hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {creatingCategory ? "Creando..." : "Crear Categoría"}
                  </button>
                </form>
              </div>
            ) : (
              <>
                <select
                  id="category"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 py-2 px-3 outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  disabled={loadingCategories}
                  required
                >
                  <option value="">Selecciona una categoría</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name || cat.type}
                    </option>
                  ))}
                </select>
                {categories.length === 0 && !loadingCategories && (
                  <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                    No hay categorías disponibles. Crea una nueva categoría para usuarios.
                  </p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Asigna una categoría específica al asistente
                </p>
              </>
            )}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-orange-500 dark:bg-orange-600 py-2 rounded-md text-white font-semibold hover:bg-orange-600 dark:hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Actualizando..." : "Actualizar Rol"}
          </button>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
