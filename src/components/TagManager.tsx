"use client";

import { useState, useEffect } from "react";
import { getTags, addTagToTicket, removeTagFromTicket, getTicketTags, Tag } from "@/services/tags";
import { FiTag, FiX } from "react-icons/fi";
import { toast } from "react-toastify";

interface TagManagerProps {
  ticketId: number;
  onTagsChange?: () => void;
}

export default function TagManager({ ticketId, onTagsChange }: TagManagerProps) {
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [ticketTags, setTicketTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddMenu, setShowAddMenu] = useState(false);

  useEffect(() => {
    loadData();
  }, [ticketId]);

  async function loadData() {
    setLoading(true);
    try {
      const [allTags, currentTags] = await Promise.all([
        getTags(),
        getTicketTags(ticketId)
      ]);
      setAvailableTags(allTags);
      setTicketTags(currentTags);
    } catch (error: any) {
      toast.error("Error al cargar etiquetas: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddTag(tagId: number) {
    try {
      await addTagToTicket(ticketId, tagId);
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
      await removeTagFromTicket(ticketId, tagId);
      await loadData();
      if (onTagsChange) onTagsChange();
      toast.success("Etiqueta removida");
    } catch (error: any) {
      toast.error("Error al remover etiqueta: " + error.message);
    }
  }

  const availableToAdd = availableTags.filter(
    tag => !ticketTags.some(t => t.id === tag.id)
  );

  if (loading) {
    return <div className="text-sm text-gray-500">Cargando etiquetas...</div>;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        {ticketTags.map(tag => (
          <span
            key={tag.id}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-white"
            style={{ backgroundColor: tag.color }}
          >
            <FiTag className="w-3 h-3" />
            {tag.name}
            <button
              onClick={() => handleRemoveTag(tag.id)}
              className="ml-1 hover:bg-white/20 rounded-full p-0.5"
            >
              <FiX className="w-3 h-3" />
            </button>
          </span>
        ))}
        {availableToAdd.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setShowAddMenu(!showAddMenu)}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
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
                  {availableToAdd.map(tag => (
                    <button
                      key={tag.id}
                      onClick={() => handleAddTag(tag.id)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                    >
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="text-sm">{tag.name}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

