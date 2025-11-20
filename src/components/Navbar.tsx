"use client";

import { logOut } from "@/redux/features/auth/authSlice";
import { RootState } from "@/redux/store";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { FaBars, FaTimes } from "react-icons/fa";
import { FiMoon, FiSun, FiUser, FiSettings, FiLogOut, FiHome, FiInfo, FiMail, FiFileText } from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import { useTheme } from "@/contexts/ThemeContext";
import Logo from "./Logo";
import NotificationBell from "./NotificationBell";

const Navbar = () => {
  const [toggle, setToggle] = useState<Boolean>(false);
  const [scrolled, setScrolled] = useState(false);
  const dispatch = useDispatch();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const user = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      const { logout } = await import("@/services/auth");
      await logout();
      dispatch(logOut());
      router.push("/login");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      dispatch(logOut());
      router.push("/login");
    }
  };

  return (
    <nav
      className={`sticky top-0 left-0 w-full transition-all duration-300 z-50 ${
        scrolled ? "shadow-lg" : "shadow-md"
      } bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700`}
    >
      <div className="containers mx-auto">
        <div className="flex items-center justify-between py-3 sm:py-4">
          {/* Nombre de la Empresa */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            <Link 
              href={"/"} 
              className="flex items-center space-x-3 group transition-transform hover:scale-105"
            >
              <div className="hidden sm:block">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white group-hover:text-orange-500 dark:group-hover:text-orange-400 transition-colors">
                  Antares Panamericana
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Sistema de Tickets
                </p>
              </div>
            </Link>
          </div>

          {/* Navegación Desktop */}
          <div className="hidden lg:flex items-center space-x-1">
            <Link
              href={"/#inicio"}
              scroll={false}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 font-medium hover:text-orange-500 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-gray-700 rounded-lg transition-all duration-200"
            >
              <FiHome className="w-4 h-4" />
              <span>Inicio</span>
            </Link>
            <Link
              href={"/caracteristicas"}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 font-medium hover:text-orange-500 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-gray-700 rounded-lg transition-all duration-200"
            >
              <FiInfo className="w-4 h-4" />
              <span>Características</span>
            </Link>
            <Link
              href={"/#contacto"}
              scroll={false}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 font-medium hover:text-orange-500 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-gray-700 rounded-lg transition-all duration-200"
            >
              <FiMail className="w-4 h-4" />
              <span>Contacto</span>
            </Link>
          </div>

          {/* Acciones del Usuario */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Toggle Modo Oscuro */}
            <button
              onClick={toggleTheme}
              className="p-2 sm:p-2.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-orange-100 dark:hover:bg-orange-900 hover:text-orange-600 dark:hover:text-orange-400 transition-all duration-200"
              title={theme === "light" ? "Activar modo oscuro" : "Activar modo claro"}
            >
              {theme === "light" ? (
                <FiMoon className="w-5 h-5" />
              ) : (
                <FiSun className="w-5 h-5" />
              )}
            </button>

            {user.accessToken ? (
              <>
                {/* Notification Bell */}
                <NotificationBell />
                
                {/* Dashboard Link */}
                <Link
                  href={"/support-center"}
                  className="hidden sm:flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <FiFileText className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>
                
                {/* Settings Button */}
                <Link
                  href={"/support-center/settings"}
                  className="hidden sm:flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 font-medium bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-all duration-200"
                  title="Configuración"
                >
                  <FiSettings className="w-4 h-4" />
                  <span className="hidden lg:inline">Configuración</span>
                </Link>
                
                {/* User Menu Desktop */}
                <div className="hidden md:flex items-center space-x-2">
                  <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <FiUser className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 max-w-[120px] truncate">
                      {user.user?.name || user.user?.email || "Usuario"}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 text-red-600 dark:text-red-400 font-medium bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-all duration-200"
                  >
                    <FiLogOut className="w-4 h-4" />
                    <span className="hidden lg:inline">Cerrar Sesión</span>
                  </button>
                </div>

                {/* Mobile Menu Button */}
                <button
                  onClick={() => setToggle(!toggle)}
                  className="lg:hidden p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  {toggle ? <FaTimes size={20} /> : <FaBars size={20} />}
                </button>
              </>
            ) : (
              <>
                <Link
                  className="hidden sm:flex items-center gap-2 rounded-lg bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700 px-4 sm:px-6 py-2 font-medium text-white whitespace-nowrap text-sm transition-all duration-200 shadow-sm hover:shadow-md"
                  href={"/login"}
                >
                  <FiUser className="w-4 h-4" />
                  <span>Iniciar Sesión</span>
                </Link>
                <button
                  onClick={() => setToggle(!toggle)}
                  className="lg:hidden p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  {toggle ? <FaTimes size={20} /> : <FaBars size={20} />}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {toggle && (
          <div className="lg:hidden border-t border-gray-200 dark:border-gray-700 py-4">
            <div className="flex flex-col space-y-2">
              <Link
                href={"/#inicio"}
                scroll={false}
                onClick={() => setToggle(false)}
                className="flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-gray-300 font-medium hover:text-orange-500 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-gray-700 rounded-lg transition-all"
              >
                <FiHome className="w-5 h-5" />
                <span>Inicio</span>
              </Link>
              <Link
                href={"/caracteristicas"}
                onClick={() => setToggle(false)}
                className="flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-gray-300 font-medium hover:text-orange-500 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-gray-700 rounded-lg transition-all"
              >
                <FiInfo className="w-5 h-5" />
                <span>Características</span>
              </Link>
              <Link
                href={"/#contacto"}
                scroll={false}
                onClick={() => setToggle(false)}
                className="flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-gray-300 font-medium hover:text-orange-500 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-gray-700 rounded-lg transition-all"
              >
                <FiMail className="w-5 h-5" />
                <span>Contacto</span>
              </Link>
              {user.accessToken ? (
                <>
                  <Link
                    href={"/support-center"}
                    onClick={() => setToggle(false)}
                    className="flex items-center gap-3 px-4 py-3 bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700 text-white font-semibold rounded-lg transition-all"
                  >
                    <FiFileText className="w-5 h-5" />
                    <span>Dashboard</span>
                  </Link>
                  <Link
                    href={"/support-center/settings"}
                    onClick={() => setToggle(false)}
                    className="flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-gray-300 font-medium bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-all"
                  >
                    <FiSettings className="w-5 h-5" />
                    <span>Configuración</span>
                  </Link>
                  <div className="flex items-center gap-3 px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <FiUser className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {user.user?.name || user.user?.email || "Usuario"}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      handleLogout();
                      setToggle(false);
                    }}
                    className="flex items-center gap-3 px-4 py-3 text-red-600 dark:text-red-400 font-medium bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-all"
                  >
                    <FiLogOut className="w-5 h-5" />
                    <span>Cerrar Sesión</span>
                  </button>
                </>
              ) : (
                <Link
                  className="flex items-center gap-3 rounded-lg bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700 px-4 py-3 font-medium text-white transition-all"
                  href={"/login"}
                  onClick={() => setToggle(false)}
                >
                  <FiUser className="w-5 h-5" />
                  <span>Iniciar Sesión</span>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
