"use client";

import CategoryList from "@/components/CategoryList";
import CreateCategoryForm from "@/components/CreateCategoryForm";
import Search from "@/components/Search";
import { RootState } from "@/redux/store";
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { getAllCategories } from "@/services/categories";
import Loading from "@/components/Loading";
import { supabase } from "@/lib/supabaseClient";
import { FiUsers } from "react-icons/fi";

type Props = {};

export default function Category({}: Props) {
  const isOpen = useSelector((state: RootState) => state.category.isOpen);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    setLoading(true);
    try {
      // Cargar todas las categorías (tickets y usuarios)
      const data = await getAllCategories();
      
      // Enriquecer categorías con información de asistentes asignados
      const enrichedCategories = await Promise.all(
        data.map(async (category: any) => {
          try {
            const { data: assistants } = await supabase
              .from("profiles")
              .select("id, full_name, email")
              .eq("role", "assistance")
              .eq("assigned_category_id", category.id);
            
            return {
              ...category,
              assignedAssistants: assistants || [],
              assignedCount: assistants?.length || 0
            };
          } catch (err) {
            console.log("Error loading assistants for category:", err);
            return {
              ...category,
              assignedAssistants: [],
              assignedCount: 0
            };
          }
        })
      );
      
      setCategories(enrichedCategories);
    } catch (error: any) {
      toast.error("Error al cargar categorías: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  const filteredCategories = categories.filter((cat) =>
    (cat.name || cat.type || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
          Gestión de Categorías
        </h2>
      </div>

      <Search 
        level="Lista de Categorías" 
        category 
        isOpen={isOpen}
        onSearch={(query) => setSearchQuery(query)}
      />

      {!isOpen ? (
        <>
          {loading ? (
            <Loading />
          ) : filteredCategories.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg border border-gray-200 dark:border-gray-700 text-center">
              <p className="text-gray-600 dark:text-gray-400">
                {searchQuery
                  ? "No se encontraron categorías con ese criterio"
                  : "No hay categorías. Crea una nueva categoría para comenzar."}
              </p>
            </div>
          ) : (
            <>
              <CategoryList 
                categoryLists={filteredCategories} 
                onDelete={loadCategories}
              />
              
              {/* Información de Asistentes por Categoría */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <FiUsers className="w-5 h-5 text-orange-500" />
                  Asistentes por Categoría
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredCategories.map((category: any) => (
                    <div 
                      key={category.id} 
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-700/50"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                          {category.name || category.type}
                        </h4>
                        <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full text-xs font-medium">
                          {category.assignedCount || 0} asistente{(category.assignedCount || 0) !== 1 ? 's' : ''}
                        </span>
                      </div>
                      {category.assignedAssistants && category.assignedAssistants.length > 0 ? (
                        <div className="space-y-1 mt-2">
                          {category.assignedAssistants.map((assistant: any) => (
                            <div 
                              key={assistant.id}
                              className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1"
                            >
                              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                              {assistant.full_name || assistant.email?.split("@")[0] || "Asistente"}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                          Sin asistentes asignados
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </>
      ) : (
        <CreateCategoryForm onSuccess={loadCategories} />
      )}
    </div>
  );
}
