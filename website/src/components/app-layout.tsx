"use client";

import React from "react";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="premium-grid relative min-h-screen overflow-hidden bg-[#050506] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_8%,rgba(56,189,248,0.13),transparent_26%),radial-gradient(circle_at_86%_12%,rgba(167,139,250,0.12),transparent_24%),radial-gradient(circle_at_64%_88%,rgba(132,204,22,0.08),transparent_26%)]" />
      <div className="relative">
      {children}
      </div>
    </main>
  );
}
