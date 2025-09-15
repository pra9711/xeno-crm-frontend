"use client";

import * as React from "react";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Ensure light theme only - no dark mode support
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      // Force light theme permanently
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      document.body.classList.remove('dark');
      document.documentElement.removeAttribute('data-theme');
      document.documentElement.setAttribute('data-theme', 'light');
      
  // Remove any dark theme preferences
      localStorage.removeItem('theme');
      localStorage.removeItem('dark-mode');
      sessionStorage.removeItem('theme');
      sessionStorage.removeItem('dark-mode');
      
      // Set light theme preference (flag only; actual colors come from CSS tokens)
      localStorage.setItem('theme', 'light');
    }
  }, []);

  return <>{children}</>;
}
