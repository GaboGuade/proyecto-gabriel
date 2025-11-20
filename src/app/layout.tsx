import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import Providers from "@/components/Providers";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <title>Antares Panamericana - Sistema de Gestión de Tickets</title>
        <meta name="description" content="Sistema de gestión de tickets Helpdesk de Antares Panamericana" />
      </head>
      <body>
        <Providers>
          <Navbar />
          <main className="min-h-screen pt-0 bg-white dark:bg-gray-900 transition-colors duration-300">{children}</main>
          <Footer />
          <ToastContainer 
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="colored"
          />
        </Providers>
      </body>
    </html>
  );
}
