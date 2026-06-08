"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <main className="premium-grid relative isolate min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_8%,rgba(56,189,248,0.13),transparent_26%),radial-gradient(circle_at_86%_12%,rgba(167,139,250,0.12),transparent_24%),radial-gradient(circle_at_64%_88%,rgba(132,204,22,0.08),transparent_26%)] dark:bg-[radial-gradient(circle_at_18%_8%,rgba(56,189,248,0.13),transparent_26%),radial-gradient(circle_at_86%_12%,rgba(167,139,250,0.12),transparent_24%),radial-gradient(circle_at_64%_88%,rgba(132,204,22,0.08),transparent_26%)]" />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-24 h-56 w-56 rounded-full bg-secondary/10 blur-3xl"
        animate={prefersReducedMotion ? undefined : { x: [0, 24, 0], y: [0, -18, 0] }}
        transition={prefersReducedMotion ? undefined : { duration: 28, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute right-0 top-1/3 h-72 w-72 rounded-full bg-fuchsia-400/10 blur-3xl"
        animate={prefersReducedMotion ? undefined : { x: [0, -26, 0], y: [0, 22, 0] }}
        transition={prefersReducedMotion ? undefined : { duration: 32, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-secondary/8 blur-3xl"
        animate={prefersReducedMotion ? undefined : { scale: [1, 1.08, 1] }}
        transition={prefersReducedMotion ? undefined : { duration: 36, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="relative z-10">
        {children}
      </div>
    </main>
  );
}
