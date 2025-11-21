import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import ChangeCustomerRoll from "./ChangeCustomerRoll";
import Loading from "./Loading";
import ModalState from "./Modal";
import { deleteCategory } from "@/services/categories";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import UserTagManager from "./UserTagManager";

type Props = {
  customer?: boolean;
  user?: {
    assign_to?: {
      type: string;
    } | null;
    name: string;
    id: string;
    roll: string;
    email: string;
    department?: string;
    assigned_category_id?: number | null;
  }[];
  categoryLists?: {
    id?: number;
    categoryID?: number;
    type: string;
    name?: string;
    description?: string;
  }[];
  onDelete?: () => void;
};

export default function CategoryList({ customer, user, categoryLists, onDelete }: Props) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [deleting, setDeleting] = useState<number | null>(null);
  const [categoriesMap, setCategoriesMap] = useState<Record<number, { name: string; type: string }>>({});
  
  // Cargar categorías para mapear IDs a nombres
  useEffect(() => {
    if (customer && user && user.length > 0) {
      loadCategoriesForMapping();
    }
  }, [customer, user]);

  async function loadCategoriesForMapping() {
    try {
      const { getAllCategories } = await import("@/services/categories");
      const categories = await getAllCategories();
      const map: Record<number, { name: string; type: string }> = {};
      categories.forEach((cat: any) => {
        map[cat.id] = { name: cat.name || cat.type, type: cat.type };
      });
      setCategoriesMap(map);
    } catch (error) {
      console.log("Error loading categories for mapping:", error);
    }
  }

  async function handleDeleteCategory(categoryId: number) {
    if (!confirm("¿Estás seguro de que quieres eliminar esta categoría?")) {
      return;
    }

    setDeleting(categoryId);
    try {
      await deleteCategory(categoryId);
      toast.success("Categoría eliminada exitosamente");
      if (onDelete) onDelete();
    } catch (error: any) {
      toast.error("Error al eliminar categoría: " + error.message);
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div>
      {/* Vista de Cards para Móviles - Solo para usuarios */}
      {customer && user && user.length > 0 && (
        <div className="block md:hidden space-y-4 mb-6">
          {user.map(({ id, name, email, roll, assign_to, department, assigned_category_id }) => (
            <div key={id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Email</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 break-all">{email || "Sin email"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Nombre</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Rol:</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    roll === "admin" 
                      ? "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300"
                      : roll === "assistance"
                      ? "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300"
                      : roll === "empleado"
                      ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300"
                  } capitalize`}>
                    {roll === "admin" ? "Admin" : 
                     roll === "assistance" ? "Asistente" :
                     roll === "empleado" ? "Empleado" : "Cliente"}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Departamento</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                    {department 
                      ? department.replace(/_/g, ' ')
                      : roll === "empleado" 
                      ? "Sin departamento"
                      : "N/A"}
                  </p>
                </div>
                {roll === "assistance" && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Categoría Asignada</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {assigned_category_id && categoriesMap[assigned_category_id]
                        ? categoriesMap[assigned_category_id].name
                        : "Sin categoría asignada"}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Etiquetas</p>
                  <UserTagManager userId={id} />
                </div>
                <div className="pt-2">
                  {(roll === "customer" || roll === "empleado" || roll === "assistance") ? (
                    <button
                      onClick={() => {
                        setSelectedUser(id);
                        setTimeout(() => {
                          setIsOpen(true);
                        }, 100);
                      }}
                      className="w-full bg-orange-500 dark:bg-orange-600 px-4 py-3 flex justify-center items-center rounded-md text-white font-medium hover:bg-orange-600 dark:hover:bg-orange-700 transition-colors min-h-[44px]"
                    >
                      {roll === "assistance" ? "Editar Asistente" : "Cambiar Rol"}
                    </button>
                  ) : roll === "admin" ? (
                    <span className="text-gray-400 dark:text-gray-500 text-sm">Administrador</span>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col">
        <div className="overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 sm:px-6 lg:px-8">
            <div className="overflow-hidden">
              {/* Tabla oculta en móviles si es lista de usuarios */}
              <table className={`min-w-full text-left text-sm font-light bg-white dark:bg-gray-800 rounded-lg overflow-hidden ${customer && user ? 'hidden md:table' : ''}`}>
                <thead className="border-b font-medium dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                  <tr>
                    {customer ? (
                      <>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nombre</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Rol</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Departamento</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Categoría</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Etiquetas</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acción</th>
                      </>
                    ) : (
                      <>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nombre</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Tipo</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {/* {data?.map((each) => (
                    <TableBody key={each.tiket_id} each={each} />
                  ))} */}
                  {user?.map(({ id, name, email, roll, assign_to, department, assigned_category_id }) => (
                    <tr key={id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {email || "Sin email"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                        {name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          roll === "admin" 
                            ? "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300"
                            : roll === "assistance"
                            ? "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300"
                            : roll === "empleado"
                            ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300"
                        } capitalize`}>
                          {roll === "admin" ? "Admin" : 
                           roll === "assistance" ? "Asistente" :
                           roll === "empleado" ? "Empleado" : "Cliente"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 capitalize">
                        {department 
                          ? department.replace(/_/g, ' ')
                          : roll === "empleado" 
                          ? "Sin departamento"
                          : "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {roll === "assistance" ? (
                          assigned_category_id && categoriesMap[assigned_category_id] ? (
                            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs font-medium">
                              {categoriesMap[assigned_category_id].name}
                            </span>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-500 text-xs">Sin categoría</span>
                          )
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500 text-xs">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <UserTagManager userId={id} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {(roll === "customer" || roll === "empleado" || roll === "assistance") ? (
                          <button
                            onClick={() => {
                              // Establecer el usuario ANTES de abrir el modal
                              setSelectedUser(id);
                              // Pequeño delay para asegurar que el estado se actualizó
                              setTimeout(() => {
                                setIsOpen(true);
                              }, 100);
                            }}
                            className="bg-orange-500 dark:bg-orange-600 px-4 py-2 flex justify-center items-center rounded-md text-white font-medium hover:bg-orange-600 dark:hover:bg-orange-700 transition-colors min-h-[44px]"
                          >
                            {roll === "assistance" ? "Editar Asistente" : "Cambiar Rol"}
                          </button>
                        ) : roll === "admin" ? (
                          <span className="text-gray-400 dark:text-gray-500 text-sm">Administrador</span>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                  {/* Category List */}
                  {categoryLists?.map((category: any) => {
                    const categoryId = category.id || category.categoryID;
                    const categoryName = category.name || category.type;
                    const categoryType = category.type;
                    
                    return (
                      <tr
                        key={categoryId}
                        className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <td className="whitespace-nowrap px-6 py-4 font-medium text-gray-900 dark:text-gray-100">
                          {categoryId}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-gray-100">{categoryName}</div>
                            {category.description && (
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {category.description}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-sm">
                            {categoryType}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleDeleteCategory(categoryId)}
                              disabled={deleting === categoryId}
                              className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded disabled:opacity-50 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                              title="Eliminar categoría"
                            >
                              <FiTrash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {/* End */}
                  {customer && selectedUser && (
                    <ModalState isOpen={isOpen} onClose={() => {
                      setIsOpen(false);
                      // Limpiar selectedUser cuando se cierra el modal
                      setTimeout(() => setSelectedUser(""), 300);
                    }}>
                      <ChangeCustomerRoll
                        selectedUser={selectedUser}
                        data={categoryLists || []}
                        setIsOpen={setIsOpen}
                        onSuccess={() => {
                          setIsOpen(false);
                          // Limpiar selectedUser
                          setSelectedUser("");
                          // Recargar la lista de usuarios
                          if (onDelete) {
                            onDelete();
                          }
                        }}
                      />
                    </ModalState>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
