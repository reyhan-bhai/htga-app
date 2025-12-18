"use client";

import { ReactNode } from "react";

/**
 * Mobile Layout Wrapper
 * Wraps HTGA pages (login, dashboard, nda, profile, restaurants)
 * with max-w-md constraint for optimal mobile experience
 */
export function MobileLayoutWrapper({ children }: { children: ReactNode }) {
  return (
    <div className="max-w-md mx-auto h-screen overflow-auto">
      {children}
    </div>
  );
}
