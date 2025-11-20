"use client";

import Link from "next/link";
import { 
  FiFileText, 
  FiClock, 
  FiCheckCircle, 
  FiUsers, 
  FiBarChart2,
  FiShield,
  FiZap,
  FiArrowRight,
  FiTag,
  FiMessageSquare,
  FiBell,
  FiSearch,
  FiFilter,
  FiTrendingUp,
  FiLock,
  FiInfo
} from "react-icons/fi";

export default function CaracteristicasPage() {
  const features = [
    {
      icon: <FiFileText className="w-8 h-8" />,
      title: "Gestión de Tickets",
      description: "Crea, gestiona y rastrea tickets de soporte de manera eficiente. Organiza todas tus incidencias en un solo lugar.",
      color: "orange"
    },
    {
      icon: <FiUsers className="w-8 h-8" />,
      title: "Múltiples Roles",
      description: "Sistema de roles flexible: Administradores, Asistentes y Clientes. Cada uno con permisos y funcionalidades específicas.",
      color: "blue"
    },
    {
      icon: <FiTag className="w-8 h-8" />,
      title: "Categorización",
      description: "Organiza tus tickets por categorías personalizables. Facilita la búsqueda y el seguimiento de incidencias.",
      color: "green"
    },
    {
      icon: <FiMessageSquare className="w-8 h-8" />,
      title: "Sistema de Mensajería",
      description: "Comunícate directamente con los clientes a través de mensajes en tiempo real dentro de cada ticket.",
      color: "purple"
    },
    {
      icon: <FiSearch className="w-8 h-8" />,
      title: "Búsqueda Avanzada",
      description: "Encuentra tickets rápidamente usando nuestro sistema de búsqueda que filtra por título, descripción, categoría y cliente.",
      color: "yellow"
    },
    {
      icon: <FiBarChart2 className="w-8 h-8" />,
      title: "Dashboard Analítico",
      description: "Visualiza estadísticas en tiempo real: tickets abiertos, cerrados, por prioridad y más métricas importantes.",
      color: "red"
    },
    {
      icon: <FiFilter className="w-8 h-8" />,
      title: "Filtros Inteligentes",
      description: "Filtra tickets por estado (abierto, pendiente, cerrado), prioridad (alta, media, baja) y categoría.",
      color: "orange"
    },
    {
      icon: <FiBell className="w-8 h-8" />,
      title: "Notificaciones",
      description: "Mantente informado sobre actualizaciones de tickets, nuevos mensajes y cambios de estado importantes.",
      color: "blue"
    },
    {
      icon: <FiShield className="w-8 h-8" />,
      title: "Seguridad",
      description: "Protección de datos con autenticación segura y políticas de acceso basadas en roles (RLS).",
      color: "green"
    },
    {
      icon: <FiTrendingUp className="w-8 h-8" />,
      title: "Seguimiento de Progreso",
      description: "Monitorea el progreso de cada ticket desde su creación hasta su resolución final.",
      color: "purple"
    },
    {
      icon: <FiLock className="w-8 h-8" />,
      title: "Control de Acceso",
      description: "Los clientes solo ven sus propios tickets, mientras que los administradores tienen acceso completo al sistema.",
      color: "yellow"
    },
    {
      icon: <FiZap className="w-8 h-8" />,
      title: "Rápido y Eficiente",
      description: "Interfaz optimizada para una experiencia de usuario fluida y rápida en todas las operaciones.",
      color: "red"
    }
  ];

  const benefits = [
    {
      title: "Ahorro de Tiempo",
      description: "Reduce el tiempo de gestión de incidencias con herramientas automatizadas y flujos de trabajo optimizados."
    },
    {
      title: "Mejor Organización",
      description: "Mantén todos tus tickets organizados y fáciles de encontrar con nuestro sistema de categorización."
    },
    {
      title: "Comunicación Eficiente",
      description: "Comunícate directamente con los clientes sin necesidad de emails externos o herramientas adicionales."
    },
    {
      title: "Visibilidad Completa",
      description: "Ten una visión completa del estado de todos los tickets y métricas importantes en tiempo real."
    }
  ];

  const colorClasses: Record<string, string> = {
    orange: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
    blue: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    green: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
    purple: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
    yellow: "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400",
    red: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 pt-20">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 text-white py-16 md:py-24">
        <div className="containers mx-auto">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full mb-6">
              <FiInfo className="w-10 h-10" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Características del Sistema
            </h1>
            <p className="text-xl md:text-2xl text-orange-50 mb-8 leading-relaxed">
              Descubre todas las funcionalidades que hacen de nuestro sistema la mejor solución para gestión de tickets
            </p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 md:py-24">
        <div className="containers mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Funcionalidades Principales
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Herramientas poderosas diseñadas para optimizar la gestión de incidencias y mejorar la experiencia del cliente
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const colorClass = colorClasses[feature.color] || colorClasses.orange;
              return (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1"
                >
                  <div className={`w-16 h-16 ${colorClass} rounded-lg flex items-center justify-center mb-4`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 md:py-24 bg-gray-50 dark:bg-gray-800">
        <div className="containers mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Beneficios Clave
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Ventajas que obtendrás al usar nuestro sistema de gestión de tickets
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-700 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-600"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                    <FiCheckCircle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      {benefit.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24">
        <div className="containers mx-auto">
          <div className="max-w-4xl mx-auto bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-8 md:p-12 text-center text-white shadow-xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              ¿Listo para comenzar?
            </h2>
            <p className="text-xl text-orange-50 mb-8">
              Únete a nuestro sistema y comienza a gestionar tus tickets de manera profesional
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/login"
                className="bg-white text-orange-600 px-8 py-4 rounded-lg font-semibold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2"
              >
                Iniciar Sesión
                <FiArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/#contacto"
                className="bg-white/10 backdrop-blur-sm text-white border-2 border-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white/20 transition-all duration-300 flex items-center justify-center gap-2"
              >
                Contactar
                <FiMessageSquare className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

