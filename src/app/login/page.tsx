"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { login } from "@/services/auth";
import { useDispatch } from "react-redux";
import { login as loginAction } from "@/redux/features/auth/authSlice";
import { toast } from "react-toastify";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: loginError } = await login({ email, password });
      
      // Log para debugging
      console.log("Login response:", { data, error: loginError });
      
      if (loginError) {
        // Manejar errores específicos
        let errorMessage = loginError.message;
        
        if (loginError.message?.includes("Email not confirmed") || 
            loginError.message?.includes("email_not_confirmed") ||
            loginError.message?.includes("Email not verified")) {
          errorMessage = "Por favor verifica tu email. Revisa tu bandeja de entrada y haz clic en el enlace de verificación.";
        } else if (loginError.message?.includes("Invalid login credentials") ||
                   loginError.message?.includes("invalid_credentials")) {
          errorMessage = "Email o contraseña incorrectos. Por favor verifica tus credenciales.";
        }
        
        throw new Error(errorMessage);
      }

      // Si no hay sesión pero hay datos, intentar obtener la sesión actual
      if (!data?.session) {
        console.log("No session in response, trying to get current session...");
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Session error:", sessionError);
        }
        
        if (sessionData?.session) {
          // Si encontramos una sesión, usar esos datos
          const { data: userData } = await supabase.auth.getUser();
          
          if (userData?.user) {
            // Continuar con el login usando la sesión encontrada
            const profileResult = await supabase
              .from("profiles")
              .select("*")
              .eq("id", userData.user.id)
              .single();
            
            dispatch(loginAction({
              accessToken: sessionData.session.access_token,
              user: {
                email: userData.user.email || email,
                name: profileResult.data?.full_name || userData.user.user_metadata?.full_name || email.split("@")[0] || "Usuario",
                roll: profileResult.data?.role || "customer",
                subject: "",
              }
            }));
            
            toast.success("Sesión iniciada correctamente");
            // Redirigir a la ruta guardada o al dashboard por defecto
            const redirectPath = sessionStorage.getItem("redirectAfterLogin") || "/support-center";
            sessionStorage.removeItem("redirectAfterLogin");
            router.push(redirectPath);
            return;
          }
        }
        
        // Si aún no hay sesión, verificar el estado del usuario
        const { data: userCheck } = await supabase.auth.getUser();
        if (userCheck?.user) {
          console.log("User found but no session:", {
            email_confirmed_at: userCheck.user.email_confirmed_at,
            confirmation_sent_at: userCheck.user.confirmation_sent_at
          });
          
          if (!userCheck.user.email_confirmed_at) {
            throw new Error("Por favor verifica tu email. Revisa tu bandeja de entrada y haz clic en el enlace de verificación.");
          }
        }
        
        throw new Error("No se pudo crear la sesión. Por favor intenta de nuevo o contacta al administrador.");
      }

      if (data?.session && data?.user) {
        console.log("User data:", {
          id: data.user.id,
          email: data.user.email,
          email_confirmed_at: data.user.email_confirmed_at,
          confirmation_sent_at: data.user.confirmation_sent_at
        });
        
        // Verificar si el email está confirmado
        if (!data.user.email_confirmed_at && data.user.confirmation_sent_at) {
          setError("Por favor verifica tu email antes de iniciar sesión. Revisa tu bandeja de entrada.");
          toast.error("Email no verificado. Por favor verifica tu correo electrónico.");
          setLoading(false);
          return;
        }

        // Obtener perfil del usuario desde Supabase
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", data.user.id)
          .single();

        // Si no hay perfil, crear uno básico
        if (profileError && profileError.code === 'PGRST116') {
          const { data: newProfile, error: insertError } = await supabase
            .from("profiles")
            .insert({
              id: data.user.id,
              email: data.user.email,
              full_name: data.user.user_metadata?.full_name || email.split("@")[0],
              role: "customer",
            })
            .select()
            .single();
          
          if (insertError) {
            console.error("Error creating profile:", insertError);
          }
          
          // Dispatch a Redux
          dispatch(loginAction({
            accessToken: data.session.access_token,
            user: {
              email: data.user.email || email,
              name: newProfile?.full_name || email.split("@")[0] || "Usuario",
              roll: newProfile?.role || "customer",
              subject: "",
            }
          }));
        } else if (profileError) {
          console.error("Error getting profile:", profileError);
          // Continuar con el login aunque haya error al obtener el perfil
          dispatch(loginAction({
            accessToken: data.session.access_token,
            user: {
              email: data.user.email || email,
              name: data.user.user_metadata?.full_name || email.split("@")[0] || "Usuario",
              roll: "customer",
              subject: "",
            }
          }));
        } else {
          // Dispatch a Redux con perfil existente
          dispatch(loginAction({
            accessToken: data.session.access_token,
            user: {
              email: data.user.email || email,
              name: profile?.full_name || data.user.user_metadata?.full_name || email.split("@")[0] || "Usuario",
              roll: profile?.role || "customer",
              subject: "",
            }
          }));
        }

        toast.success("Sesión iniciada correctamente");
        // Redirigir a la ruta guardada o al dashboard por defecto
        const redirectPath = sessionStorage.getItem("redirectAfterLogin") || "/support-center";
        sessionStorage.removeItem("redirectAfterLogin");
        router.push(redirectPath);
      } else {
        throw new Error("No se pudo obtener la información del usuario");
      }
    } catch (err: any) {
      const errorMessage = err.message || "Error al iniciar sesión";
      setError(errorMessage);
      toast.error(errorMessage);
      console.error("Login error details:", {
        message: err.message,
        error: err,
        stack: err.stack
      });
      
      // Si es un error de verificación, mostrar ayuda adicional
      if (errorMessage.includes("verifica tu email") || errorMessage.includes("verificación")) {
        console.log("Email verification issue detected. User should check their email.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleResendVerification() {
    if (!email) {
      toast.error("Por favor ingresa tu email primero");
      return;
    }

    setResendingEmail(true);
    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (resendError) throw resendError;

      toast.success("Correo de verificación reenviado. Revisa tu bandeja de entrada.");
    } catch (err: any) {
      toast.error("Error al reenviar correo: " + (err.message || "Error desconocido"));
    } finally {
      setResendingEmail(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-orange-50"
    >
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md border border-gray-100">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Antares Panamericana
          </h1>
          <p className="text-sm text-gray-600">Sistema de Gestión de Tickets</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Correo electrónico
            </label>
            <input
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <input
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded-md transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
            type="submit"
          >
            {loading ? "Ingresando..." : "Iniciar sesión"}
          </button>
        </form>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded">
            <p className="font-semibold mb-1">Error al iniciar sesión</p>
            <p className="text-sm">{error}</p>
            {error.includes("verifica tu email") && (
              <div className="mt-3 space-y-2">
                <p className="text-xs text-red-600">
                  💡 Tip: Revisa tu carpeta de spam si no encuentras el correo de verificación.
                </p>
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={resendingEmail}
                  className="text-xs text-orange-600 hover:text-orange-700 underline disabled:opacity-50"
                >
                  {resendingEmail ? "Reenviando..." : "¿No recibiste el correo? Reenviar verificación"}
                </button>
              </div>
            )}
          </div>
        )}

        <p className="mt-6 text-center text-sm text-gray-600">
          ¿No tienes cuenta?{" "}
          <Link href="/register" className="text-orange-500 hover:text-orange-600 font-semibold">
            Regístrate aquí
          </Link>
        </p>
      </div>
    </div>
  );
}

