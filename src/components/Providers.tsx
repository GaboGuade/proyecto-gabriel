"use client";

import { ThemeProvider } from "@/contexts/ThemeContext";
import StoreProvider from "@/redux/StoreProvider";
import { ReactNode } from "react";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <StoreProvider>
        {children}
      </StoreProvider>
    </ThemeProvider>
  );
}

