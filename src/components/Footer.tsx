"use client";

import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";

interface FooterProps {}

const Footer: React.FC<FooterProps> = () => {
  const user = useSelector((state: RootState) => state.auth);
  const isAuthenticated = !!user.accessToken;

  return (
    <>
      <div className="bg-gradient-to-r from-gray-900 to-gray-800">
        <div className="containers py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-white text-2xl font-bold mb-4">Antares Panamericana</h3>
              <p className="text-sm text-gray-400">
                Sistema de gestión de tickets profesional. Escala y optimiza tu servicio
                al cliente de manera eficiente y mejora la experiencia de tus clientes.
              </p>
            </div>
            <div>
              <h4 className="text-white text-lg font-semibold mb-4">Enlaces Rápidos</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="/" className="hover:text-orange-500 transition-colors">Inicio</a></li>
                {!isAuthenticated && (
                  <>
                    <li><a href="/login" className="hover:text-orange-500 transition-colors">Iniciar Sesión</a></li>
                    <li><a href="/register" className="hover:text-orange-500 transition-colors">Registrarse</a></li>
                  </>
                )}
                <li><a href="/support-center" className="hover:text-orange-500 transition-colors">Dashboard</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white text-lg font-semibold mb-4">Contacto</h4>
              <p className="text-sm text-gray-400 mb-2">
                <a href="mailto:soporte@antarespanamericana.com" className="hover:text-orange-500 transition-colors">
                  soporte@antarespanamericana.com
                </a>
              </p>
              <p className="text-sm text-gray-400">
                Sistema de Gestión de Tickets
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-black">
        <div className="containers">
          <p className="text-xs py-4 text-gray-500 text-center">
            Copyright © {new Date().getFullYear()} Antares Panamericana - Sistema de Gestión de Tickets
          </p>
        </div>
      </div>
    </>
  );
};

export default Footer;
