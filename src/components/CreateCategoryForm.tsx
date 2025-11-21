"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import { createCategory } from "@/services/categories";
import { useDispatch } from "react-redux";
import { openCategoryForm } from "@/redux/features/category/categorySlice";

type Props = {
  onSuccess: () => void;
};

export default function CreateCategoryForm({ onSuccess }: Props) {
  const dispatch = useDispatch();
  const [name, setName] = useState<string>("");
  const [type, setType] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [categoryFor, setCategoryFor] = useState<'ticket' | 'user'>('ticket');
  const [loading, setLoading] = useState(false);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error("Por favor ingresa el nombre de la categoría");
      return;
    }

    setLoading(true);
    try {
      await createCategory({
        name: name.trim(),
        type: type.trim() ? type.trim().toLowerCase() : undefined,
        description: description.trim() || undefined,
        category_for: categoryFor,
      });
      
      toast.success(`Categoría "${name}" creada exitosamente`);
      setName("");
      setType("");
      setDescription("");
      setCategoryFor('ticket');
      dispatch(openCategoryForm(false));
      onSuccess();
    } catch (error: any) {
      toast.error("Error al crear categoría: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 bg-white p-6 rounded-lg border border-gray-200">
      <h3 className="text-lg font-semibold mb-4">Crear Nueva Categoría</h3>
      <form onSubmit={handleCreateCategory}>
        <div className="mb-4">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Nombre de la Categoría *
          </label>
          <input
            onChange={(e) => setName(e.target.value)}
            type="text"
            id="name"
            value={name}
            className="border w-full py-2 mt-1 rounded-md px-3 outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="Ej: Soporte Técnico"
            required
          />
        </div>

        <div className="mb-4">
          <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
            Tipo/Código <span className="text-gray-400 text-xs">(Opcional)</span>
          </label>
          <input
            onChange={(e) => setType(e.target.value)}
            type="text"
            id="type"
            value={type}
            className="border w-full py-2 mt-1 rounded-md px-3 outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="Ej: technical, billing, account"
          />
          <p className="text-xs text-gray-500 mt-1">Se generará automáticamente si no lo ingresas</p>
        </div>

        <div className="mb-4">
          <label htmlFor="categoryFor" className="block text-sm font-medium text-gray-700 mb-1">
            Tipo de Categoría *
          </label>
          <select
            id="categoryFor"
            value={categoryFor}
            onChange={(e) => setCategoryFor(e.target.value as 'ticket' | 'user')}
            className="border w-full py-2 mt-1 rounded-md px-3 outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
            required
          >
            <option value="ticket">Para Tickets</option>
            <option value="user">Para Usuarios (Asistentes)</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            {categoryFor === 'ticket' 
              ? "Esta categoría se usará para clasificar tickets" 
              : "Esta categoría se asignará a asistentes"}
          </p>
        </div>

        <div className="mb-4">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Descripción (Opcional)
          </label>
          <textarea
            onChange={(e) => setDescription(e.target.value)}
            id="description"
            value={description}
            rows={3}
            className="border w-full py-2 mt-1 rounded-md px-3 outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
            placeholder="Descripción de la categoría..."
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="bg-orange-500 px-6 py-2 rounded-md text-white font-semibold hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Creando..." : "Crear Categoría"}
          </button>
          <button
            type="button"
            onClick={() => dispatch(openCategoryForm(false))}
            className="bg-gray-200 px-6 py-2 rounded-md text-gray-700 font-semibold hover:bg-gray-300 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
