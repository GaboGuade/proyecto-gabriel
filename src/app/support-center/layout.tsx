"use client";

import Loading from "@/components/Loading";
import Sidebar from "@/components/Sidebar";
import ProtectedRoute from "@/components/ProtectedRoute";
import { RootState } from "@/redux/store";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { getUserSession } from "@/services/session";
import { supabase } from "@/lib/supabaseClient";

type Props = {
  children: any;
};

export default function DashboardLayout({ children }: Props) {
  const route = useRouter();
  const user = useSelector((state: RootState) => state.auth);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    
    async function checkAuth() {
      try {
        // Intentar obtener sesión con reintentos
        let session = null;
        let attempts = 0;
        const MAX_RETRIES = 3;
        
        while (attempts < MAX_RETRIES && !session && mounted) {
          try {
            session = await getUserSession();
            if (session?.user) {
              break;
            }
          } catch (err) {
            attempts++;
            if (attempts < MAX_RETRIES && mounted) {
              await new Promise(resolve => setTimeout(resolve, 100 * attempts));
            }
          }
        }

        if (!mounted) return;

        if (!session || !session.user) {
          // No redirigir aquí, dejar que ProtectedRoute lo maneje
          // Solo marcar como no cargando
          setLoading(false);
          return;
        }

        // Obtener perfil del usuario (no crítico si falla)
        try {
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .single();
          
          if (!profileError && profile && mounted) {
            setUserProfile(profile);
          }
        } catch (profileErr) {
          console.log("Error obteniendo perfil (no crítico):", profileErr);
          // Continuar aunque falle obtener el perfil
        }

        if (mounted) {
          setLoading(false);
        }
      } catch (error) {
        console.error("Error verificando autenticación:", error);
        // No redirigir automáticamente, dejar que ProtectedRoute maneje esto
        if (mounted) {
          setLoading(false);
        }
      }
    }
    
    checkAuth();
    
    return () => {
      mounted = false;
    };
  }, [route]);

  if (loading) {
    return <Loading />;
  }

  return (
    <ProtectedRoute>
      <section className="w-full min-h-screen pt-16 sm:pt-20 md:pt-24 bg-white dark:bg-gray-900 transition-colors duration-300">
        <div className="containers grid grid-cols-12 gap-4 sm:gap-6">
          <aside className="col-span-12 md:col-span-3 md:sticky md:top-20 md:self-start md:max-h-[calc(100vh-5rem)] md:overflow-y-auto">
            <Sidebar />
            <div className="ml-0 md:ml-5 py-2 px-2 md:px-0 font-semibold text-gray-900 dark:text-gray-100 text-sm sm:text-base">
              <p>
                Account Role:
                <span className="capitalize text-orange-500 dark:text-orange-400 ml-1">
                  {userProfile?.role || user.user?.roll || "customer"}
                </span>
              </p>
              {userProfile && (
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 break-words">
                  {userProfile.full_name || user.user?.name}
                </p>
              )}
            </div>
          </aside>
          <main className="col-span-12 md:col-span-9 pb-8 sm:pb-12 w-full max-w-full overflow-x-hidden">
            <div className="w-full">
              {children}
            </div>
          </main>
        </div>
      </section>
    </ProtectedRoute>
  );
}
