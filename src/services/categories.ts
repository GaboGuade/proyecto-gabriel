// src/services/categories.ts
import { supabase } from "../lib/supabaseClient";

// Obtener todas las categorías
export async function getAllCategories() {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw error;
  return data || [];
}

// Obtener una categoría por ID
export async function getCategory(categoryId: number) {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("id", categoryId)
    .single();

  if (error) throw error;
  return data;
}

// Crear categoría (solo admin)
export async function createCategory({ name, type, description }: {
  name: string,
  type?: string,
  description?: string
}) {
  // Si no se proporciona type, generar uno automáticamente basado en el nombre
  const categoryType = type || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  
  const insertData: any = {
    name,
    description: description || null,
  };
  
  // Solo agregar type si la columna existe (manejo de errores)
  try {
    insertData.type = categoryType;
  } catch (err) {
    // Si type no existe, no lo agregamos
    console.log("Type column may not exist, skipping...");
  }
  
  const { data, error } = await supabase
    .from("categories")
    .insert(insertData)
    .select()
    .single();

  if (error) {
    // Si el error es por la columna type, intentar sin ella
    if (error.message?.includes("type") || error.message?.includes("column")) {
      const { data: retryData, error: retryError } = await supabase
        .from("categories")
        .insert({
          name,
          description: description || null,
        })
        .select()
        .single();
      
      if (retryError) throw retryError;
      return retryData;
    }
    throw error;
  }
  
  return data;
}

// Actualizar categoría (solo admin)
export async function updateCategory(categoryId: number, updates: {
  name?: string,
  type?: string,
  description?: string
}) {
  const { data, error } = await supabase
    .from("categories")
    .update(updates)
    .eq("id", categoryId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Eliminar categoría (solo admin)
export async function deleteCategory(categoryId: number) {
  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", categoryId);

  if (error) throw error;
  return true;
}

