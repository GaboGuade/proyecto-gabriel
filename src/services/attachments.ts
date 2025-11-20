import { supabase } from "@/lib/supabaseClient";

export interface Attachment {
  id: number;
  ticket_id?: number;
  message_id?: number;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  uploaded_by: string;
  created_at: string;
}

const BUCKET_NAME = 'ticket-attachments';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
];

// Validar archivo antes de subir
function validateFile(file: File): void {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`El archivo es demasiado grande. Tamaño máximo: ${MAX_FILE_SIZE / 1024 / 1024} MB`);
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error(`Tipo de archivo no permitido. Tipos permitidos: imágenes, PDF, Word, Excel`);
  }
}

// Subir archivo a Supabase Storage
export async function uploadAttachment(
  file: File,
  ticketId?: number,
  messageId?: number
): Promise<Attachment> {
  validateFile(file);

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error("Usuario no autenticado");

  // Crear ruta única para el archivo
  const fileExt = file.name.split('.').pop();
  const fileName = `${session.user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

  // Subir archivo a Storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (uploadError) throw uploadError;

  // Obtener URL pública (si es necesario) o ruta
  const { data: { publicUrl } } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(fileName);

  // Guardar referencia en base de datos
  const { data, error } = await supabase
    .from("attachments")
    .insert({
      ticket_id: ticketId || null,
      message_id: messageId || null,
      file_name: file.name,
      file_path: fileName,
      file_size: file.size,
      file_type: file.type,
      uploaded_by: session.user.id
    })
    .select()
    .single();

  if (error) {
    // Si falla la inserción, eliminar el archivo subido
    await supabase.storage.from(BUCKET_NAME).remove([fileName]);
    throw error;
  }

  return data;
}

// Obtener adjuntos de un ticket
export async function getTicketAttachments(ticketId: number): Promise<Attachment[]> {
  const { data, error } = await supabase
    .from("attachments")
    .select("*")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

// Obtener adjuntos de un mensaje
export async function getMessageAttachments(messageId: number): Promise<Attachment[]> {
  const { data, error } = await supabase
    .from("attachments")
    .select("*")
    .eq("message_id", messageId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

// Obtener URL de descarga del archivo
export async function getAttachmentUrl(attachment: Attachment): Promise<string> {
  const { data } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(attachment.file_path, 3600); // URL válida por 1 hora

  if (!data) throw new Error("No se pudo generar la URL del archivo");
  return data.signedUrl;
}

// Eliminar adjunto
export async function deleteAttachment(attachmentId: number): Promise<void> {
  // Obtener información del adjunto
  const { data: attachment, error: fetchError } = await supabase
    .from("attachments")
    .select("*")
    .eq("id", attachmentId)
    .single();

  if (fetchError) throw fetchError;

  // Eliminar archivo de Storage
  const { error: storageError } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([attachment.file_path]);

  if (storageError) throw storageError;

  // Eliminar registro de base de datos
  const { error: dbError } = await supabase
    .from("attachments")
    .delete()
    .eq("id", attachmentId);

  if (dbError) throw dbError;
}

// Formatear tamaño de archivo
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Verificar si es imagen
export function isImage(fileType: string): boolean {
  return fileType.startsWith('image/');
}

