// app/providers.tsx
"use client";

import { SessionProvider } from "next-auth/react";
import { AuthProvider } from "@/components/auth-provider";
import { I18nProvider } from "@/lib/i18n";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  // Detect browser language or use 'es' as default
  const defaultLocale = typeof window !== 'undefined' 
    ? (localStorage.getItem('locale') || 
       (navigator.language.startsWith('es') ? 'es' : 'en')) as 'en' | 'es'
    : 'es'

  return (
    <SessionProvider>
      <AuthProvider>
        <I18nProvider defaultLocale={defaultLocale}>
          {children}
          <Toaster richColors position="top-right" />
        </I18nProvider>
      </AuthProvider>
    </SessionProvider>
  );
}
