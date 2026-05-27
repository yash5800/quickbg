"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Upload } from "lucide-react";
import { useImages } from "@/contexts/ImageContext";

// Pages that should use the global drop zone (ONLY home and remover)
// Tool pages have their own drop handling
const globalDropPages = ["/", "/remover"];

export function GlobalDropZone({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isGlobalDropPage = globalDropPages.some(page => pathname === page);

  if (!isGlobalDropPage) {
    // On tools pages, just render children without global drop
    return <>{children}</>;
  }

  return <GlobalDropZoneInner>{children}</GlobalDropZoneInner>;
}

function GlobalDropZoneInner({ children }: { children: React.ReactNode }) {
  const { addImages } = useImages();
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);
  const dragCounterRef = useRef(0);
  const dropTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.dataTransfer?.types.includes("Files")) {
      dragCounterRef.current++;
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.dataTransfer?.types.includes("Files")) {
      dragCounterRef.current--;
      if (dragCounterRef.current <= 0) {
        setIsDragging(false);
      }
    }
  }, []);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      dragCounterRef.current = 0;

      // Check if drop is inside a tool-specific drop zone
      const dropTarget = e.target as HTMLElement;
      const toolDropZone = dropTarget.closest('[data-drop-zone]');
      if (toolDropZone) {
        // Let the tool handle it
        return;
      }

      // Prevent duplicate drops within 500ms
      if (dropTimeoutRef.current) {
        return;
      }
      dropTimeoutRef.current = setTimeout(() => {
        dropTimeoutRef.current = null;
      }, 500);

      const files = Array.from(e.dataTransfer?.files || []).filter((file) =>
        file.type.startsWith("image/")
      );

      if (files.length > 0) {
        console.log("[GlobalDropZone] Adding files:", files.length);
        addImages(files);
        router.push("/remover");
      }
    },
    [addImages, router]
  );

  useEffect(() => {
    window.addEventListener("dragenter", handleDragEnter);
    window.addEventListener("dragleave", handleDragLeave);
    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("drop", handleDrop);

    return () => {
      window.removeEventListener("dragenter", handleDragEnter);
      window.removeEventListener("dragleave", handleDragLeave);
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("drop", handleDrop);
    };
  }, [handleDragEnter, handleDragLeave, handleDragOver, handleDrop]);

  return (
    <>
      {children}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/78 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.94, y: 18 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.94, y: 18 }}
              className="premium-surface relative mx-4 flex w-full max-w-lg flex-col items-center gap-5 overflow-hidden rounded-[2rem] p-10 text-center"
            >
              <motion.div
                aria-hidden
                className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-300/70 to-transparent"
                animate={{ x: ["-100%", "100%"] }}
                transition={{ duration: 1.7, repeat: Infinity, ease: "easeInOut" }}
              />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl border border-white/10 bg-white text-black shadow-[0_22px_80px_-32px_rgba(255,255,255,0.75)]">
                <motion.span
                  aria-hidden
                  className="absolute inset-0 rounded-3xl border border-sky-300/45"
                  animate={{ scale: [1, 1.35, 1], opacity: [0.8, 0, 0.8] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
                />
                <Upload className="h-9 w-9" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-white">Drop images to start</h2>
                <p className="mt-2 text-sm leading-6 text-white/55">QuickBG will upload, queue, process, and open the remover workspace automatically.</p>
              </div>
              <div className="flex flex-wrap justify-center gap-2 text-xs text-white/55">
                {["PNG", "JPG", "WebP", "TIFF", "HEIC", "AVIF"].map((format) => (
                  <span key={format} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">
                    {format}
                  </span>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
