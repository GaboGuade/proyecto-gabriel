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
      const data = await getAllCategories();
      setCategories(data);
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
        <h2 className="text-2xl font-semibold text-gray-800">
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
            <div className="bg-white p-8 rounded-lg border border-gray-200 text-center">
              <p className="text-gray-600">
                {searchQuery
                  ? "No se encontraron categorías con ese criterio"
                  : "No hay categorías. Crea una nueva categoría para comenzar."}
              </p>
            </div>
          ) : (
            <CategoryList 
              categoryLists={filteredCategories} 
              onDelete={loadCategories}
            />
          )}
        </>
      ) : (
        <CreateCategoryForm onSuccess={loadCategories} />
      )}
    </div>
  );
}
