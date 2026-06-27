"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";

/**
 * SSR-safe variant of framer-motion's `useReducedMotion`.
 *
 * `useReducedMotion()` reads the media query synchronously in its state
 * initializer, so it returns `null` on the server but the real value on the
 * client's first render. Branching render output (structure or inline style) on
 * that value therefore produces a hydration mismatch on reduced-motion devices.
 *
 * This hook always reports `false` until after mount, so the server render and
 * the client's first render agree. The real preference is applied on the next
 * commit, which is safely after hydration.
 */
export function useReducedMotionSafe(): boolean {
  const prefersReducedMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted ? Boolean(prefersReducedMotion) : false;
}
