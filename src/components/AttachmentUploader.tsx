"use client";

import { useState, useRef } from "react";
import { uploadAttachment } from "@/services/attachments";
import { FiPaperclip, FiX, FiUpload } from "react-icons/fi";
import { toast } from "react-toastify";

interface AttachmentUploaderProps {
  ticketId?: number;
  messageId?: number;
  onUploadComplete?: () => void;
}

export default function AttachmentUploader({ ticketId, messageId, onUploadComplete }: AttachmentUploaderProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles(prev => [...prev, ...selectedFiles]);
  }

  function removeFile(index: number) {
    setFiles(prev => prev.filter((_, i) => i !== index));
  }

  async function handleUpload() {
    if (files.length === 0) {
      toast.error("Por favor selecciona al menos un archivo");
      return;
    }

    if (!ticketId && !messageId) {
      toast.error("Error: No se puede subir adjuntos sin ticket o mensaje");
      return;
    }

    setUploading(true);
    try {
      await Promise.all(
        files.map(file => uploadAttachment(file, ticketId || undefined, messageId || undefined))
      );
      toast.success(`${files.length} archivo(s) subido(s) exitosamente`);
      setFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      if (onUploadComplete) onUploadComplete();
    } catch (error: any) {
      toast.error("Error al subir archivos: " + error.message);
    } finally {
      setUploading(false);
    }
  }

  function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          id="file-upload"
          accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        />
        <label
          htmlFor="file-upload"
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          <FiPaperclip className="w-4 h-4" />
          Seleccionar archivos
        </label>
        {files.length > 0 && (
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 dark:bg-orange-600 text-white rounded-lg hover:bg-orange-600 dark:hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            <FiUpload className="w-4 h-4" />
            {uploading ? "Subiendo..." : `Subir ${files.length} archivo(s)`}
          </button>
        )}
      </div>

      {files.length > 0 && (
        <div className="space-y-1">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {file.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatFileSize(file.size)}
                </p>
              </div>
              <button
                onClick={() => removeFile(index)}
                className="ml-2 p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

