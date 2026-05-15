"use client";

import React from "react";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {children}
    </main>
  );
}
