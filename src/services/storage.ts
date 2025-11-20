// src/services/storage.ts
import { supabase } from "../lib/supabaseClient";

// Subir archivo a Supabase Storage
export async function uploadAttachment(file: File): Promise<string | null> {
  try {
    const ext = file.name.split(".").pop();
    const filename = `${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from("attachments")
      .upload(filename, file);

    if (error) throw error;

    const { data } = supabase.storage
      .from("attachments")
      .getPublicUrl(filename);

    return data.publicUrl;
  } catch (err) {
    console.error("Error subiendo archivo", err);
    return null;
  }
}
