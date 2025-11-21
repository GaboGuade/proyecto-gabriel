"use client";

import Link from "next/link";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { 
  FiFileText, 
  FiClock, 
  FiCheckCircle, 
  FiUsers, 
  FiBarChart2,
  FiShield,
  FiZap,
  FiArrowRight
} from "react-icons/fi";

// Componentes auxiliares definidos antes de Home
function FeatureCard({
  icon,
  title,
  description,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    orange: "bg-orange-100 text-orange-600",
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    purple: "bg-purple-100 text-purple-600",
    yellow: "bg-yellow-100 text-yellow-600",
    red: "bg-red-100 text-red-600",
  };

  const colorClass = colorClasses[color] || colorClasses.orange;

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className={`w-16 h-16 ${colorClass} rounded-lg flex items-center justify-center mb-4`}>
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

function StepCard({
  number,
  title,
  description,
  icon,
}: {
  number: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-500 text-white rounded-full text-2xl font-bold mb-4 relative">
        {number}
        <div className="absolute -top-2 -right-2 w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center">
          {icon}
        </div>
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

export default function Home() {
  const user = useSelector((state: RootState) => state.auth);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setIsAuthenticated(!!session?.user);
      } catch (error) {
        console.error("Error checking auth:", error);
        setIsAuthenticated(false);
      } finally {
        setChecking(false);
      }
    }
    checkAuth();
    
    // Escuchar cambios en la sesión
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session?.user);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section id="inicio" className="bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 text-white">
        <div className="containers py-20 md:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full mb-6">
              <FiFileText className="w-10 h-10" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Sistema de Gestión de Incidencias
            </h1>
            <p className="text-xl md:text-2xl text-orange-50 mb-8 leading-relaxed">
              <span className="font-semibold">Antares Panamericana</span>
            </p>
            <p className="text-lg md:text-xl text-orange-100 mb-10 max-w-2xl mx-auto">
              Gestiona, rastrea y resuelve incidencias de manera eficiente. 
              Plataforma profesional para el control y seguimiento de tickets técnicos.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {!isAuthenticated && (
                <>
                  <Link
                    href="/login"
                    className="bg-white text-orange-600 px-8 py-4 rounded-lg font-semibold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2"
                  >
                    Iniciar Sesión
                    <FiArrowRight className="w-5 h-5" />
                  </Link>
                  <Link
                    href="/register"
                    className="bg-orange-800 text-white px-8 py-4 rounded-lg font-semibold text-lg border-2 border-white/30 hover:bg-orange-900 transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    Crear Cuenta
                  </Link>
                </>
              )}
              {isAuthenticated && (
                <Link
                  href="/support-center"
                  className="bg-white text-orange-600 px-8 py-4 rounded-lg font-semibold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2"
                >
                  Ir al Dashboard
                  <FiArrowRight className="w-5 h-5" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Sistema de Incidencias */}
      <section id="caracteristicas" className="py-20 bg-white">
        <div className="containers">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Gestión Profesional de Incidencias
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Herramientas completas para el control y seguimiento de incidencias técnicas
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<FiFileText className="w-8 h-8" />}
              title="Creación de Tickets"
              description="Registra incidencias de forma rápida y organizada. Sistema intuitivo para reportar problemas técnicos."
              color="orange"
            />
            <FeatureCard
              icon={<FiClock className="w-8 h-8" />}
              title="Seguimiento en Tiempo Real"
              description="Monitorea el estado de tus incidencias en tiempo real. Dashboard completo con estadísticas actualizadas."
              color="blue"
            />
            <FeatureCard
              icon={<FiCheckCircle className="w-8 h-8" />}
              title="Gestión de Estados"
              description="Controla el ciclo de vida de las incidencias: Abierto, Pendiente, Cerrado. Flujo de trabajo optimizado."
              color="green"
            />
            <FeatureCard
              icon={<FiUsers className="w-8 h-8" />}
              title="Asignación de Agentes"
              description="Asigna incidencias a agentes especializados. Sistema de roles: Cliente, Agente y Administrador."
              color="purple"
            />
            <FeatureCard
              icon={<FiBarChart2 className="w-8 h-8" />}
              title="Reportes y Estadísticas"
              description="Analiza el rendimiento con métricas detalladas. Visualiza tendencias y tiempos de resolución."
              color="yellow"
            />
            <FeatureCard
              icon={<FiShield className="w-8 h-8" />}
              title="Seguridad y Control"
              description="Sistema seguro con autenticación robusta. Control de acceso basado en roles de usuario."
              color="red"
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50">
        <div className="containers">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              ¿Cómo Funciona?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Proceso simple y eficiente para gestionar incidencias
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <StepCard
              number="1"
              title="Registra la Incidencia"
              description="Crea un ticket describiendo el problema técnico. Selecciona categoría y prioridad."
              icon={<FiFileText className="w-6 h-6" />}
            />
            <StepCard
              number="2"
              title="Asignación y Seguimiento"
              description="El sistema asigna la incidencia al agente correspondiente. Puedes seguir el progreso en tiempo real."
              icon={<FiClock className="w-6 h-6" />}
            />
            <StepCard
              number="3"
              title="Resolución y Cierre"
              description="Una vez resuelta, la incidencia se cierra. Sistema de feedback para mejorar el servicio."
              icon={<FiCheckCircle className="w-6 h-6" />}
            />
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white">
        <div className="containers">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                  ¿Por qué elegir Antares Panamericana?
                </h2>
                <p className="text-lg text-gray-600 mb-8">
                  Sistema profesional de gestión de incidencias diseñado para equipos técnicos 
                  que necesitan eficiencia y control total sobre sus tickets.
                </p>

                <div className="space-y-4">
                  {[
                    "Sistema completo de gestión de incidencias en tiempo real",
                    "Interfaz intuitiva y fácil de usar",
                    "Asignación automática de tickets a agentes especializados",
                    "Dashboard con métricas y estadísticas en tiempo real",
                    "Sistema de mensajería integrado para comunicación fluida",
                    "Categorización por áreas técnicas (Software, Hardware, Red, etc.)",
                    "Control de prioridades (Alta, Media, Baja)",
                    "Plataforma web moderna y responsive",
                  ].map((benefit, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center mt-0.5">
                        <FiCheckCircle className="w-4 h-4 text-white" />
                      </div>
                      <p className="text-gray-700">{benefit}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-8">
                  {!isAuthenticated ? (
                    <Link
                      href="/login"
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 px-8 py-4 rounded-lg text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      Comenzar Ahora
                      <FiArrowRight className="w-5 h-5" />
                    </Link>
                  ) : (
                    <Link
                      href="/support-center"
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 px-8 py-4 rounded-lg text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      Ir al Dashboard
                      <FiArrowRight className="w-5 h-5" />
                    </Link>
                  )}
                </div>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-8 lg:p-12">
                <div className="space-y-6">
                  <div className="bg-white rounded-lg p-6 shadow-md">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                        <FiZap className="w-6 h-6 text-orange-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Rápido y Eficiente</h3>
                        <p className="text-sm text-gray-600">Resolución de incidencias en tiempo récord</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-6 shadow-md">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FiBarChart2 className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Métricas en Tiempo Real</h3>
                        <p className="text-sm text-gray-600">Seguimiento completo del rendimiento</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-6 shadow-md">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <FiShield className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Seguro y Confiable</h3>
                        <p className="text-sm text-gray-600">Protección de datos y control de acceso</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="contacto" className="py-20 bg-gradient-to-r from-orange-500 to-orange-600 text-white">
        <div className="containers text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            ¿Listo para comenzar?
          </h2>
          <p className="text-xl text-orange-50 mb-8 max-w-2xl mx-auto">
            Únete a nuestro sistema de gestión de incidencias y mejora la eficiencia de tu equipo técnico.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            {!isAuthenticated && (
              <>
                <Link
                  href="/register"
                  className="bg-white text-orange-600 px-8 py-4 rounded-lg font-semibold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                >
                  Crear Cuenta Gratis
                </Link>
                <Link
                  href="/login"
                  className="bg-orange-800 text-white px-8 py-4 rounded-lg font-semibold text-lg border-2 border-white/30 hover:bg-orange-900 transition-all duration-300"
                >
                  Iniciar Sesión
                </Link>
              </>
            )}
            {isAuthenticated && (
              <Link
                href="/support-center"
                className="bg-white text-orange-600 px-8 py-4 rounded-lg font-semibold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
              >
                Ir al Dashboard
              </Link>
            )}
          </div>
          
          {/* Contact Info */}
          <div className="border-t border-orange-400/30 pt-12 mt-12">
            <h3 className="text-2xl font-semibold mb-6">Contacto</h3>
            <div className="flex flex-col md:flex-row items-center justify-center gap-8 text-orange-50">
              <div>
                <p className="font-semibold mb-2">Email de Soporte</p>
                <a 
                  href="mailto:soporte@antarespanamericana.com" 
                  className="text-white hover:text-orange-200 underline transition-colors"
                >
                  soporte@antarespanamericana.com
                </a>
              </div>
              <div>
                <p className="font-semibold mb-2">Sistema de Gestión</p>
                <p className="text-orange-100">Antares Panamericana</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
