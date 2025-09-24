// app/providers.tsx
"use client";

import { SessionProvider } from "next-auth/react";
import { AuthProvider } from "@/components/auth-provider";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthProvider>
        {children}
        <Toaster richColors position="top-right" />
      </AuthProvider>
    </SessionProvider>
  );
}
