"use client";

import { useEffect, useRef } from "react";
import { ImageItem } from "@/types/image";

const ACTIVE_STATUSES: Array<ImageItem["status"]> = ["pending", "uploading", "queued", "running", "processing"];

function getFaviconLink(): HTMLLinkElement | null {
  return document.querySelector<HTMLLinkElement>('link[rel="icon"], link[rel="shortcut icon"]');
}

function createBadgedFavicon(): string {
  const canvas = document.createElement("canvas");
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "/favicon-32x32.png";

  ctx.fillStyle = "#0f172a";
  ctx.beginPath();
  ctx.roundRect(2, 2, 28, 28, 8);
  ctx.fill();

  ctx.fillStyle = "#84cc16";
  ctx.beginPath();
  ctx.arc(23, 9, 7, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2.25;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(19.5, 9);
  ctx.lineTo(22, 11.5);
  ctx.lineTo(27, 6.5);
  ctx.stroke();

  ctx.fillStyle = "#ffffff";
  ctx.font = "700 15px sans-serif";
  ctx.fillText("Q", 9, 22);

  return canvas.toDataURL("image/png");
}

export function useProcessingCompleteNotification(images: ImageItem[]) {
  const originalTitleRef = useRef<string | null>(null);
  const originalFaviconRef = useRef<string | null>(null);
  const hadActiveWorkRef = useRef(false);
  const lastReadyCountRef = useRef(0);

  useEffect(() => {
    if (typeof document === "undefined") return;

    originalTitleRef.current ??= document.title;
    originalFaviconRef.current ??= getFaviconLink()?.href ?? "/favicon.ico";

    const resetTab = () => {
      if (document.visibilityState !== "visible") return;
      if (originalTitleRef.current) {
        document.title = originalTitleRef.current;
      }
      const link = getFaviconLink();
      if (link && originalFaviconRef.current) {
        link.href = originalFaviconRef.current;
      }
      lastReadyCountRef.current = 0;
    };

    document.addEventListener("visibilitychange", resetTab);
    window.addEventListener("focus", resetTab);

    return () => {
      document.removeEventListener("visibilitychange", resetTab);
      window.removeEventListener("focus", resetTab);
    };
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const activeCount = images.filter((image) => ACTIVE_STATUSES.includes(image.status)).length;
    const completedCount = images.filter((image) => image.status === "completed" && image.result).length;

    if (activeCount > 0) {
      hadActiveWorkRef.current = true;
      return;
    }

    if (!hadActiveWorkRef.current || completedCount === 0 || completedCount === lastReadyCountRef.current) {
      return;
    }

    hadActiveWorkRef.current = false;
    lastReadyCountRef.current = completedCount;

    if (document.visibilityState === "hidden") {
      document.title = `QuickBG - ${completedCount} ${completedCount === 1 ? "image" : "images"} ready`;
      const link = getFaviconLink();
      if (link) {
        link.href = createBadgedFavicon();
      }

      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("QuickBG images ready", {
          body: `${completedCount} ${completedCount === 1 ? "image is" : "images are"} ready for download.`,
          icon: "/android-chrome-192x192.png",
        });
      }
    }
  }, [images]);
}
