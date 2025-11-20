"use client";

import { useState, useEffect } from "react";
import { getUserTags, addTagToUser, removeTagFromUser, getUserUserTags, UserTag } from "@/services/userTags";
import { FiTag, FiX } from "react-icons/fi";
import { toast } from "react-toastify";

interface UserTagManagerProps {
  userId: string;
  onTagsChange?: () => void;
}

export default function UserTagManager({ userId, onTagsChange }: UserTagManagerProps) {
  const [availableTags, setAvailableTags] = useState<UserTag[]>([]);
  const [userTags, setUserTags] = useState<UserTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddMenu, setShowAddMenu] = useState(false);

  useEffect(() => {
    loadData();
  }, [userId]);

  async function loadData() {
    setLoading(true);
    try {
      const [allTags, currentTags] = await Promise.all([
        getUserTags(),
        getUserUserTags(userId)
      ]);
      setAvailableTags(allTags);
      setUserTags(currentTags);
    } catch (error: any) {
      toast.error("Error al cargar etiquetas: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddTag(tagId: number) {
    try {
      await addTagToUser(userId, tagId);
      await loadData();
      setShowAddMenu(false);
      if (onTagsChange) onTagsChange();
      toast.success("Etiqueta agregada");
    } catch (error: any) {
      toast.error("Error al agregar etiqueta: " + error.message);
    }
  }

  async function handleRemoveTag(tagId: number) {
    try {
      await removeTagFromUser(userId, tagId);
      await loadData();
      if (onTagsChange) onTagsChange();
      toast.success("Etiqueta removida");
    } catch (error: any) {
      toast.error("Error al remover etiqueta: " + error.message);
    }
  }

  const availableToAdd = availableTags.filter(
    tag => !userTags.some(t => t.id === tag.id)
  );

  if (loading) {
    return (
      <div className="text-xs text-gray-500 dark:text-gray-400 py-1">
        Cargando...
      </div>
    );
  }

  // Si no hay etiquetas disponibles y no hay etiquetas del usuario, mostrar mensaje
  if (availableTags.length === 0 && userTags.length === 0) {
    return (
      <div className="text-xs text-gray-400 dark:text-gray-500 italic">
        Sin etiquetas disponibles
      </div>
    );
  }

  return (
    <div className="space-y-1 min-w-[200px]">
      <div className="flex items-center gap-2 flex-wrap">
        {userTags.length > 0 && userTags.map(tag => (
          <span
            key={tag.id}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white shadow-sm"
            style={{ backgroundColor: tag.color || '#6B7280' }}
          >
            <FiTag className="w-3 h-3" />
            {tag.name}
            <button
              onClick={() => handleRemoveTag(tag.id)}
              className="ml-0.5 hover:bg-white/20 rounded-full p-0.5 transition-colors"
              title="Remover etiqueta"
            >
              <FiX className="w-2.5 h-2.5" />
            </button>
          </span>
        ))}
        {availableToAdd.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setShowAddMenu(!showAddMenu)}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <FiTag className="w-3 h-3" />
              Agregar etiqueta
            </button>
            {showAddMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowAddMenu(false)}
                />
                <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 min-w-[200px] max-h-48 overflow-y-auto">
                  {availableToAdd.length === 0 ? (
                    <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
                      No hay etiquetas disponibles
                    </div>
                  ) : (
                    availableToAdd.map(tag => (
                      <button
                        key={tag.id}
                        onClick={() => handleAddTag(tag.id)}
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
                      >
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: tag.color || '#6B7280' }}
                        />
                        <span className="text-sm">{tag.name}</span>
                      </button>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        )}
        {userTags.length === 0 && availableToAdd.length === 0 && availableTags.length > 0 && (
          <span className="text-xs text-gray-400 dark:text-gray-500 italic">
            Todas las etiquetas asignadas
          </span>
        )}
      </div>
    </div>
  );
}

