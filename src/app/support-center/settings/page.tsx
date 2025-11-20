"use client";

import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "react-toastify";
import { FiUser, FiMail, FiShield, FiSave } from "react-icons/fi";

export default function Settings() {
  const user = useSelector((state: RootState) => state.auth.user);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    setLoading(true);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", authUser.id)
          .single();

        if (error) throw error;

        setProfile(data);
        setFullName(data.full_name || "");
        setEmail(data.email || authUser.email || "");
      }
    } catch (error: any) {
      toast.error("Error al cargar perfil: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error("Usuario no autenticado");

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
        })
        .eq("id", authUser.id);

      if (error) throw error;

      toast.success("Perfil actualizado exitosamente");
      await loadProfile();
    } catch (error: any) {
      toast.error("Error al actualizar perfil: " + error.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-600">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-800">Configuración</h2>
        <p className="text-gray-600 mt-1">Gestiona tu perfil y preferencias</p>
      </div>

      {/* Profile Settings */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
          <FiUser />
          <span>Información del Perfil</span>
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre Completo
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Tu nombre completo"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center space-x-2">
              <FiMail />
              <span>Email</span>
            </label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">
              El email no se puede cambiar desde aquí
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center space-x-2">
              <FiShield />
              <span>Rol</span>
            </label>
            <input
              type="text"
              value={profile?.role || user?.roll || "customer"}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed capitalize"
            />
            <p className="text-xs text-gray-500 mt-1">
              El rol solo puede ser cambiado por un administrador
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center space-x-2 bg-orange-500 text-white px-6 py-2 rounded-md hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <FiSave />
            <span>{saving ? "Guardando..." : "Guardar Cambios"}</span>
          </button>
        </div>
      </div>

      {/* Account Info */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Información de la Cuenta</h3>
        <div className="space-y-2 text-sm text-gray-600">
          <p>
            <span className="font-semibold">ID de Usuario:</span>{" "}
            {profile?.id?.substring(0, 8)}...
          </p>
          <p>
            <span className="font-semibold">Cuenta creada:</span>{" "}
            {profile?.created_at
              ? new Date(profile.created_at).toLocaleDateString("es-ES")
              : "N/A"}
          </p>
        </div>
      </div>
    </div>
  );
}
