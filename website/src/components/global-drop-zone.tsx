"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Upload } from "lucide-react";
import { useImages } from "@/contexts/ImageContext";

export function GlobalDropZone({ children }: { children: React.ReactNode }) {
  const { addImages } = useImages();
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);
  const [, setDragCounter] = useState(0);
  const dropTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer?.types.includes("Files")) {
      setDragCounter((prev) => prev + 1);
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer?.types.includes("Files")) {
      setDragCounter((prev) => {
        const newCount = prev - 1;
        if (newCount <= 0) {
          setIsDragging(false);
          return 0;
        }
        return newCount;
      });
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
      setDragCounter(0);

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
        // Navigate to editor
        router.push("/editor");
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          >
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-white">
                <Upload className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Drop images to upload</h2>
                <p className="text-muted-foreground text-sm mt-1">Supports PNG, JPG, WebP</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}