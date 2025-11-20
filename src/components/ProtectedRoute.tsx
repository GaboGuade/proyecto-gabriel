"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getUserSession } from "../services/session";
import Loading from "./Loading";
import { toast } from "react-toastify";

export default function ProtectedRoute({ children }: any) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    async function verify() {
      try {
        const session = await getUserSession();
        if (!session || !session.user) {
          console.log("No hay sesión, redirigiendo al login");
          toast.error("Debes iniciar sesión para acceder a esta página");
          // Guardar la ruta a la que intentaba acceder para redirigir después del login
          if (pathname) {
            sessionStorage.setItem("redirectAfterLogin", pathname);
          }
          router.push("/login");
          return;
        }
        // Si hay sesión, permitir acceso
        setAllowed(true);
      } catch (error) {
        console.error("Error verificando sesión:", error);
        // Solo mostrar error si realmente no hay sesión
        // No redirigir inmediatamente, intentar verificar de nuevo
        const session = await getUserSession();
        if (!session || !session.user) {
          toast.error("Error al verificar la sesión");
          if (pathname) {
            sessionStorage.setItem("redirectAfterLogin", pathname);
          }
          router.push("/login");
        } else {
          // Si hay sesión después del error, permitir acceso
          setAllowed(true);
        }
      } finally {
        setChecking(false);
      }
    }
    verify();
  }, [router, pathname]);

  if (checking) return <Loading />;

  if (!allowed) return null;

  return children;
}
