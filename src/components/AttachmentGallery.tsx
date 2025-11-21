"use client";

import { useState, useEffect } from "react";
import { getTicketAttachments, getAttachmentUrl, deleteAttachment, Attachment, formatFileSize, isImage } from "@/services/attachments";
import { FiPaperclip, FiDownload, FiTrash2, FiImage, FiFile, FiX } from "react-icons/fi";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";

interface AttachmentGalleryProps {
  ticketId: number;
  onAttachmentsChange?: () => void;
}

export default function AttachmentGallery({ ticketId, onAttachmentsChange }: AttachmentGalleryProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageUrls, setImageUrls] = useState<Record<number, string>>({});
  const [loadingImages, setLoadingImages] = useState<Set<number>>(new Set());
  const user = useSelector((state: RootState) => state.auth.user);
  const isAdmin = user?.roll === "admin" || user?.roll === "assistance";

  useEffect(() => {
    loadAttachments();
  }, [ticketId]);

  async function loadAttachments() {
    setLoading(true);
    try {
      const data = await getTicketAttachments(ticketId);
      setAttachments(data);
      
      // Precargar URLs de imágenes para las miniaturas
      const imageAttachments = data.filter(att => isImage(att.file_type));
      const urlMap: Record<number, string> = {};
      
      await Promise.all(
        imageAttachments.map(async (att) => {
          try {
            const url = await getAttachmentUrl(att);
            urlMap[att.id] = url;
          } catch (err) {
            console.error(`Error cargando URL para attachment ${att.id}:`, err);
          }
        })
      );
      
      setImageUrls(urlMap);
    } catch (error: any) {
      toast.error("Error al cargar adjuntos: " + error.message);
    } finally {
      setLoading(false);
    }
  }
  
  async function loadImageUrl(attachment: Attachment) {
    if (imageUrls[attachment.id]) {
      return imageUrls[attachment.id];
    }
    
    if (loadingImages.has(attachment.id)) {
      return null;
    }
    
    setLoadingImages(prev => new Set(prev).add(attachment.id));
    
    try {
      const url = await getAttachmentUrl(attachment);
      setImageUrls(prev => ({ ...prev, [attachment.id]: url }));
      return url;
    } catch (error) {
      console.error(`Error cargando URL para attachment ${attachment.id}:`, error);
      return null;
    } finally {
      setLoadingImages(prev => {
        const newSet = new Set(prev);
        newSet.delete(attachment.id);
        return newSet;
      });
    }
  }

  async function handleDownload(attachment: Attachment) {
    try {
      const url = await getAttachmentUrl(attachment);
      window.open(url, '_blank');
    } catch (error: any) {
      toast.error("Error al descargar archivo: " + error.message);
    }
  }

  async function handleDelete(attachmentId: number) {
    if (!confirm("¿Estás seguro de que quieres eliminar este adjunto?")) {
      return;
    }

    try {
      await deleteAttachment(attachmentId);
      await loadAttachments();
      if (onAttachmentsChange) onAttachmentsChange();
      toast.success("Adjunto eliminado");
    } catch (error: any) {
      toast.error("Error al eliminar adjunto: " + error.message);
    }
  }

  async function handlePreview(attachment: Attachment) {
    if (isImage(attachment.file_type)) {
      try {
        const url = await getAttachmentUrl(attachment);
        setPreviewUrl(url);
      } catch (error: any) {
        toast.error("Error al cargar imagen: " + error.message);
      }
    }
  }

  if (loading) {
    return <div className="text-sm text-gray-500">Cargando adjuntos...</div>;
  }

  if (attachments.length === 0) {
    return null;
  }

  return (
    <>
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <FiPaperclip className="w-4 h-4" />
          Adjuntos ({attachments.length})
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {attachments.map(attachment => (
            <div
              key={attachment.id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              {isImage(attachment.file_type) ? (
                <div
                  className="aspect-square bg-gray-100 dark:bg-gray-700 rounded cursor-pointer overflow-hidden mb-2 relative"
                  onClick={() => handlePreview(attachment)}
                >
                  {imageUrls[attachment.id] ? (
                    <img
                      src={imageUrls[attachment.id]}
                      alt={attachment.file_name}
                      className="w-full h-full object-cover"
                      onError={async (e) => {
                        // Si falla, intentar recargar la URL
                        const url = await loadImageUrl(attachment);
                        if (url && e.target) {
                          (e.target as HTMLImageElement).src = url;
                        } else {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }
                      }}
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="animate-pulse text-gray-400 text-xs">Cargando...</div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center mb-2">
                  <FiFile className="w-8 h-8 text-gray-400" />
                </div>
              )}
              <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate" title={attachment.file_name}>
                {attachment.file_name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {formatFileSize(attachment.file_size)}
              </p>
              <div className="flex items-center gap-1 mt-2">
                <button
                  onClick={() => handleDownload(attachment)}
                  className="p-1 text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400"
                  title="Descargar"
                >
                  <FiDownload className="w-3 h-3" />
                </button>
                {isImage(attachment.file_type) && (
                  <button
                    onClick={() => handlePreview(attachment)}
                    className="p-1 text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400"
                    title="Vista previa"
                  >
                    <FiImage className="w-3 h-3" />
                  </button>
                )}
                {isAdmin && (
                  <button
                    onClick={() => handleDelete(attachment.id)}
                    className="p-1 text-red-600 dark:text-red-400 hover:text-red-700"
                    title="Eliminar"
                  >
                    <FiTrash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {previewUrl && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewUrl(null)}
        >
          <div className="max-w-4xl max-h-full relative">
            <img
              src={previewUrl}
              alt="Vista previa"
              className="max-w-full max-h-[90vh] object-contain"
              onError={(e) => {
                console.error("Error cargando imagen:", e);
                toast.error("Error al cargar la imagen. Intenta descargarla directamente.");
                setPreviewUrl(null);
              }}
              crossOrigin="anonymous"
            />
          </div>
          <button
            onClick={() => setPreviewUrl(null)}
            className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75 z-10"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>
      )}
    </>
  );
}

