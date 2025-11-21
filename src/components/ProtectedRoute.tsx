"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getUserSession } from "../services/session";
import Loading from "./Loading";
import { toast } from "react-toastify";

export default function ProtectedRoute({ children }: any) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const verifyingRef = useRef(false);
  const retryCountRef = useRef(0);
  const MAX_RETRIES = 3;

  useEffect(() => {
    // Prevenir múltiples verificaciones simultáneas
    if (verifyingRef.current) {
      return;
    }

    async function verify() {
      // Si ya estamos verificando, no hacer nada
      if (verifyingRef.current) {
        return;
      }

      verifyingRef.current = true;
      
      try {
        // Intentar obtener sesión con reintentos
        let session = null;
        let attempts = 0;
        
        while (attempts < MAX_RETRIES && !session) {
          try {
            session = await getUserSession();
            if (session?.user) {
              break;
            }
          } catch (err) {
            attempts++;
            if (attempts < MAX_RETRIES) {
              // Esperar un poco antes de reintentar
              await new Promise(resolve => setTimeout(resolve, 100 * attempts));
            }
          }
        }

        if (!session || !session.user) {
          // Solo redirigir si realmente no hay sesión después de todos los intentos
          console.log("No hay sesión después de", MAX_RETRIES, "intentos, redirigiendo al login");
          if (pathname) {
            sessionStorage.setItem("redirectAfterLogin", pathname);
          }
          router.push("/login");
          return;
        }
        
        // Si hay sesión, permitir acceso
        setAllowed(true);
        retryCountRef.current = 0; // Resetear contador de reintentos
      } catch (error) {
        console.error("Error verificando sesión:", error);
        // No redirigir inmediatamente, dar más oportunidades
        retryCountRef.current++;
        
        if (retryCountRef.current >= MAX_RETRIES) {
          // Solo después de múltiples fallos, redirigir
          toast.error("Error al verificar la sesión. Por favor, inicia sesión nuevamente.");
          if (pathname) {
            sessionStorage.setItem("redirectAfterLogin", pathname);
          }
          router.push("/login");
        } else {
          // Intentar de nuevo después de un breve delay
          setTimeout(() => {
            verifyingRef.current = false;
            verify();
          }, 200);
          return;
        }
      } finally {
        setChecking(false);
        verifyingRef.current = false;
      }
    }
    
    verify();
  }, [router, pathname]);

  if (checking) return <Loading />;

  if (!allowed) return null;

  return children;
}
