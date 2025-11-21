"use client";

import Loading from "@/components/Loading";
import { useForm, type SubmitHandler } from "react-hook-form";
import { toast } from "react-toastify";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createTicket } from "@/services/tickets";
import { getAllCategories, createCategory } from "@/services/categories";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import Link from "next/link";
import { 
  FiFileText, 
  FiTag, 
  FiAlertCircle, 
  FiCheckCircle, 
  FiXCircle,
  FiInfo,
  FiArrowLeft,
  FiPlus,
  FiX
} from "react-icons/fi";

type Inputs = {
  title: string;
  category_id: string;
  priority: "low" | "medium" | "high";
  description: string;
};

export default function CreateTicket() {
  const router = useRouter();
  const user = useSelector((state: RootState) => state.auth.user);
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<Inputs>({
    defaultValues: {
      priority: "medium",
    },
  });

  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [errorLoadingCategories, setErrorLoadingCategories] = useState(false);
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: "", type: "", description: "" });
  const [creatingCategory, setCreatingCategory] = useState(false);

  const selectedPriority = watch("priority");
  const selectedCategory = watch("category_id");

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    setLoadingCategories(true);
    setErrorLoadingCategories(false);
    try {
      // Solo cargar categorías de tipo 'ticket'
      const { getTicketCategories } = await import("@/services/categories");
      const data = await getTicketCategories();
      if (data && Array.isArray(data)) {
        setCategories(data);
        if (data.length === 0) {
          console.log("No hay categorías disponibles");
        }
      } else {
        setCategories([]);
      }
    } catch (error: any) {
      console.error("Error loading categories:", error);
      setErrorLoadingCategories(true);
      setCategories([]);
      toast.error("No se pudieron cargar las categorías. Puedes crear el ticket sin categoría.");
    } finally {
      setLoadingCategories(false);
    }
  }

  async function handleCreateCategory(e: React.FormEvent) {
    e.preventDefault();
    
    if (!newCategory.name.trim()) {
      toast.error("Por favor ingresa el nombre de la categoría");
      return;
    }

    setCreatingCategory(true);
    try {
      const created = await createCategory({
        name: newCategory.name.trim(),
        type: newCategory.type.trim() ? newCategory.type.trim().toLowerCase().replace(/\s+/g, '-') : undefined,
        description: newCategory.description.trim() || undefined,
        category_for: 'ticket', // Las categorías creadas desde crear ticket son para tickets
      });
      
      toast.success(`Categoría "${created.name}" creada exitosamente`);
      setNewCategory({ name: "", type: "", description: "" });
      setShowCreateCategory(false);
      await loadCategories();
      
      // Seleccionar automáticamente la categoría recién creada
      reset({
        ...watch(),
        category_id: created.id.toString()
      });
    } catch (error: any) {
      toast.error("Error al crear categoría: " + error.message);
    } finally {
      setCreatingCategory(false);
    }
  }

  const onSubmit: SubmitHandler<Inputs> = async (data) => {
    // Validación de categoría solo si hay categorías disponibles
    if (categories.length > 0 && (!data.category_id || data.category_id === "")) {
      return toast.error("Por favor selecciona una categoría");
    }

    setLoading(true);
    try {
      const result = await createTicket({
        title: data.title.trim(),
        description: data.description.trim(),
        priority: data.priority,
        category_id: data.category_id ? parseInt(data.category_id) : null,
      });

      if (result) {
        toast.success("¡Ticket creado exitosamente!");
        reset();
        setTimeout(() => {
          router.push("/support-center/open-tickets");
        }, 1000);
      }
    } catch (error: any) {
      console.error("Error creating ticket:", error);
      const errorMessage = error.message || "Error desconocido al crear el ticket";
      
      if (errorMessage.includes("no autenticado") || errorMessage.includes("sesión") || errorMessage.includes("autenticado")) {
        toast.error("Tu sesión ha expirado. Redirigiendo al login...");
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } else if (errorMessage.includes("RLS") || errorMessage.includes("policy")) {
        toast.error("Error de permisos. Verifica tu rol de usuario.");
      } else {
        toast.error(`Error al crear ticket: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "high":
        return <FiAlertCircle className="w-4 h-4 text-red-500" />;
      case "medium":
        return <FiInfo className="w-4 h-4 text-yellow-500" />;
      case "low":
        return <FiCheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return null;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300";
      case "medium":
        return "border-yellow-300 dark:border-yellow-600 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300";
      case "low":
        return "border-green-300 dark:border-green-600 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300";
      default:
        return "border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200";
    }
  };

  if (loadingCategories) {
    return (
      <div className="max-w-4xl mx-auto">
        <Loading />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Volver"
          >
            <FiArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <FiFileText className="w-8 h-8 text-orange-500" />
              Crear Nuevo Ticket
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Describe tu problema o consulta y nuestro equipo te ayudará
            </p>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4">
          <h3 className="text-white font-semibold text-lg">Información del Ticket</h3>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Título */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              <FiFileText className="w-4 h-4" />
              Título del Ticket *
            </label>
            <input
              {...register("title", { 
                required: "El título es requerido",
                minLength: {
                  value: 5,
                  message: "El título debe tener al menos 5 caracteres"
                },
                maxLength: {
                  value: 100,
                  message: "El título no puede exceder 100 caracteres"
                }
              })}
              className={`w-full rounded-lg border-2 px-4 py-3 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 ${
                errors.title 
                  ? "border-red-300 dark:border-red-600 focus:border-red-500 dark:focus:border-red-500 focus:ring-2 focus:ring-red-200 dark:focus:ring-red-800" 
                  : "border-gray-300 dark:border-gray-600 focus:border-orange-500 dark:focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:focus:ring-orange-800"
              } outline-none`}
              type="text"
              placeholder="Ej: Problema con el sistema de facturación"
              maxLength={100}
            />
            {errors.title && (
              <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                <FiXCircle className="w-3 h-3" />
                {errors.title.message}
              </p>
            )}
            {watch("title") && !errors.title && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {watch("title").length}/100 caracteres
              </p>
            )}
          </div>

          {/* Categoría y Prioridad */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Categoría */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <FiTag className="w-4 h-4" />
                  Categoría {categories.length > 0 ? "*" : <span className="text-gray-400 dark:text-gray-500 text-xs font-normal">(Opcional)</span>}
                </label>
                {(user?.roll === "admin" || user?.roll === "assistance") && (
                  <button
                    type="button"
                    onClick={() => setShowCreateCategory(!showCreateCategory)}
                    className="text-xs text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 font-semibold flex items-center gap-1 transition-colors"
                  >
                    <FiPlus className="w-3 h-3" />
                    {showCreateCategory ? "Cancelar" : "Crear nueva"}
                  </button>
                )}
              </div>
              
              {showCreateCategory && (user?.roll === "admin" || user?.roll === "assistance") && (
                <div className="mb-4 p-4 bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 border-2 border-orange-200 dark:border-orange-700 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-orange-900 dark:text-orange-200 flex items-center gap-2">
                      <FiPlus className="w-4 h-4" />
                      Crear Nueva Categoría
                    </h4>
                    <button
                      type="button"
                      onClick={() => setShowCreateCategory(false)}
                      className="text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-300"
                    >
                      <FiX className="w-4 h-4" />
                    </button>
                  </div>
                  <form onSubmit={handleCreateCategory} className="space-y-3">
                    <div>
                      <input
                        type="text"
                        value={newCategory.name}
                        onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                        placeholder="Nombre de la categoría *"
                        className="w-full border-2 border-orange-300 dark:border-orange-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400"
                        required
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={newCategory.type}
                        onChange={(e) => setNewCategory({ ...newCategory, type: e.target.value })}
                        placeholder="Tipo/Código (opcional - se genera automáticamente)"
                        className="w-full border-2 border-orange-300 dark:border-orange-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400"
                      />
                      <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">Opcional - Se generará automáticamente si no lo ingresas</p>
                    </div>
                    <div>
                      <textarea
                        value={newCategory.description}
                        onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                        placeholder="Descripción (opcional)"
                        rows={2}
                        className="w-full border-2 border-orange-300 dark:border-orange-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={creatingCategory}
                      className="w-full bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                      {creatingCategory ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Creando...</span>
                        </>
                      ) : (
                        <>
                          <FiCheckCircle className="w-4 h-4" />
                          <span>Crear Categoría</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}
              
              {errorLoadingCategories ? (
                <div className="space-y-2">
                  <select
                    {...register("category_id")}
                    disabled
                    className="w-full bg-gray-100 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 py-3 px-4 rounded-lg text-gray-500 dark:text-gray-400 cursor-not-allowed"
                  >
                    <option value="">Error al cargar categorías</option>
                  </select>
                  <button
                    type="button"
                    onClick={loadCategories}
                    className="text-xs text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 underline"
                  >
                    Reintentar cargar categorías
                  </button>
                </div>
              ) : categories.length === 0 ? (
                <div className="space-y-3">
                  <select
                    {...register("category_id")}
                    disabled
                    className="w-full bg-gray-50 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 py-3 px-4 rounded-lg text-gray-500 dark:text-gray-400 cursor-not-allowed"
                  >
                    <option value="">No hay categorías disponibles</option>
                  </select>
                  <div className="p-4 bg-orange-50 dark:bg-orange-900/30 border-2 border-orange-200 dark:border-orange-700 rounded-lg">
                    <div className="flex items-start gap-2">
                      <FiInfo className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm text-orange-800 dark:text-orange-200 font-medium mb-1">
                          No hay categorías creadas
                        </p>
                        <p className="text-xs text-orange-700 dark:text-orange-300 mb-2">
                          El ticket se creará sin categoría. Puedes continuar normalmente.
                        </p>
                        {(user?.roll === "admin" || user?.roll === "assistance") && (
                          <Link 
                            href="/support-center/category"
                            className="inline-flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-300 font-semibold underline"
                          >
                            <FiPlus className="w-3 h-3" />
                            Crear categorías ahora
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <select
                    {...register("category_id", {
                      required: categories.length > 0 ? "La categoría es requerida" : false,
                    })}
                    className={`w-full border-2 py-3 px-4 rounded-lg transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                      errors.category_id
                        ? "border-red-300 dark:border-red-600 focus:border-red-500 dark:focus:border-red-500 focus:ring-2 focus:ring-red-200 dark:focus:ring-red-800"
                        : "border-gray-300 dark:border-gray-600 focus:border-orange-500 dark:focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:focus:ring-orange-800"
                    } outline-none`}
                  >
                    <option value="">Selecciona una categoría</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name || cat.type}
                      </option>
                    ))}
                  </select>
                  {errors.category_id && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                      <FiXCircle className="w-3 h-3" />
                      {errors.category_id.message}
                    </p>
                  )}
                  {selectedCategory && !errors.category_id && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Categoría seleccionada: {categories.find(c => c.id === parseInt(selectedCategory))?.name}
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Prioridad */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <FiAlertCircle className="w-4 h-4" />
                Prioridad *
              </label>
              <div className="space-y-2">
                {["high", "medium", "low"].map((priority) => (
                  <label
                    key={priority}
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedPriority === priority
                        ? getPriorityColor(priority)
                        : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-700"
                    }`}
                  >
                    <input
                      {...register("priority", { required: true })}
                      type="radio"
                      value={priority}
                      className="sr-only"
                    />
                    {getPriorityIcon(priority)}
                    <span className="flex-1 font-medium text-gray-900 dark:text-gray-100">
                      {priority === "high" ? "Alta" : priority === "medium" ? "Media" : "Baja"}
                    </span>
                    {selectedPriority === priority && (
                      <FiCheckCircle className="w-5 h-5" />
                    )}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              <FiFileText className="w-4 h-4" />
              Descripción del Problema *
            </label>
            <textarea
              {...register("description", {
                required: "La descripción es requerida",
                minLength: {
                  value: 10,
                  message: "La descripción debe tener al menos 10 caracteres",
                },
                maxLength: {
                  value: 2000,
                  message: "La descripción no puede exceder 2000 caracteres"
                }
              })}
              className={`w-full rounded-lg border-2 px-4 py-3 outline-none transition-all resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 ${
                errors.description
                  ? "border-red-300 dark:border-red-600 focus:border-red-500 dark:focus:border-red-500 focus:ring-2 focus:ring-red-200 dark:focus:ring-red-800"
                  : "border-gray-300 dark:border-gray-600 focus:border-orange-500 dark:focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:focus:ring-orange-800"
              }`}
              rows={8}
              placeholder="Describe detalladamente el problema que estás experimentando. Incluye pasos para reproducirlo, mensajes de error, y cualquier información relevante..."
              maxLength={2000}
            />
            {errors.description && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                <FiXCircle className="w-3 h-3" />
                {errors.description.message}
              </p>
            )}
            {watch("description") && !errors.description && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {watch("description").length}/2000 caracteres
              </p>
            )}
          </div>

          {/* Botones */}
          <div className="flex gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Creando ticket...</span>
                </>
              ) : (
                <>
                  <FiCheckCircle className="w-5 h-5" />
                  <span>Crear Ticket</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              disabled={loading}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <FiXCircle className="w-5 h-5" />
              Cancelar
            </button>
          </div>
        </form>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-200 dark:border-blue-700 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <FiInfo className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <p className="font-semibold mb-1">💡 Consejos para crear un buen ticket:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Proporciona un título claro y descriptivo</li>
              <li>Incluye todos los detalles relevantes en la descripción</li>
              <li>Menciona los pasos que llevaron al problema</li>
              <li>Indica la prioridad según la urgencia del problema</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
