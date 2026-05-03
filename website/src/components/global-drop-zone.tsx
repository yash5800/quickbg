"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Image as ImageIcon } from "lucide-react";
import { useImages } from "@/contexts/ImageContext";

export function GlobalDropZone({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { addImages } = useImages();
  const [isDragging, setIsDragging] = useState(false);
  const [, setDragCounter] = useState(0);

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

      const files = Array.from(e.dataTransfer?.files || []).filter((file) =>
        file.type.startsWith("image/")
      );

      if (files.length > 0) {
        addImages(files);
        router.push("/uploads");
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
            className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-lg cursor-copy"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="flex flex-col items-center gap-5 text-center"
            >
              <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-primary to-secondary shadow-xl shadow-primary/20">
                <ImageIcon className="h-12 w-12 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-foreground mb-2">Drop your images here</h2>
                <p className="text-muted-foreground">Release to start removing backgrounds</p>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <div className="flex -space-x-2">
                  <div className="h-7 w-7 rounded-full bg-primary/20 border-2 border-background" />
                  <div className="h-7 w-7 rounded-full bg-secondary/20 border-2 border-background" />
                  <div className="h-7 w-7 rounded-full bg-purple-500/20 border-2 border-background" />
                </div>
                <span>Multiple files supported</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}