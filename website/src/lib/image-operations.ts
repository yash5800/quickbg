const API_BASE = "/api";

export interface ResizeOptions {
  width?: number;
  height?: number;
  fit?: "cover" | "contain" | "fill" | "inside" | "outside";
  position?: "top" | "right" | "bottom" | "left" | "center";
}

export interface CompressOptions {
  quality?: number;
  format?: "png" | "jpeg" | "webp" | "avif";
}

export interface FiltersOptions {
  brightness?: number;
  contrast?: number;
  saturation?: number;
  grayscale?: boolean;
  blur?: number;
  sharpen?: number;
  rotate?: number;
  flip?: boolean;
  flop?: boolean;
}

export interface WatermarkOptions {
  text: string;
  fontSize?: number;
  color?: string;
  opacity?: number;
  position?: "center" | "bottom-right" | "bottom-left" | "top-right" | "top-left";
  margin?: number;
}

export interface BorderOptions {
  width?: number;
  color?: string;
}

export type ImageOperation = "resize" | "compress" | "filters" | "watermark" | "border" | "convert";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function processImage(
  operation: ImageOperation,
  file: File,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params: Record<string, any>
): Promise<Blob> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("operation", operation);

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      formData.append(key, String(value));
    }
  }

  const response = await fetch(`${API_BASE}/image/process`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Processing failed" }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.blob();
}

export async function resizeImage(file: File, options: ResizeOptions): Promise<Blob> {
  return processImage("resize", file, options);
}

export async function compressImage(file: File, options: CompressOptions): Promise<Blob> {
  return processImage("compress", file, {
    quality: options.quality || 80,
    format: options.format || "png",
  });
}

export async function applyFilters(file: File, options: FiltersOptions): Promise<Blob> {
  return processImage("filters", file, options);
}

export async function addWatermark(file: File, options: WatermarkOptions): Promise<Blob> {
  return processImage("watermark", file, options);
}

export async function addBorder(file: File, options: BorderOptions): Promise<Blob> {
  return processImage("border", file, options);
}

export async function convertFormat(
  file: File,
  format: "png" | "jpeg" | "webp" | "avif",
  quality: number = 80
): Promise<Blob> {
  return processImage("convert", file, { format, quality });
}

export async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function downloadBlob(blob: Blob, filename: string): Promise<void> {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}