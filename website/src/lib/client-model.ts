"use client";

import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-webgl";

const MODEL_URL = "";

const CACHE_NAME = "testbgremover-model-cache";
const CACHE_VERSION = "v1";

let model: tf.LayersModel | null = null;
let isModelLoading = false;
let loadPromise: Promise<void> | null = null;

export async function initTensorFlow(): Promise<void> {
  await tf.setBackend("webgl");
  await tf.ready();
  console.log("[ClientModel] TF.js ready, backend:", tf.getBackend());
}

export async function loadClientModel(): Promise<void> {
  if (model) return;
  if (isModelLoading && loadPromise) return loadPromise;

  isModelLoading = true;
  loadPromise = (async () => {
    try {
      await initTensorFlow();

      if ("caches" in window) {
        try {
          const cache = await caches.open(`${CACHE_NAME}-${CACHE_VERSION}`);
          const cachedResponse = await cache.match(MODEL_URL);
          
          if (cachedResponse) {
            console.log("[ClientModel] Loading from cache...");
            const url = cachedResponse.url;
            model = await tf.loadLayersModel(url);
            console.log("[ClientModel] Model loaded from cache!");
            return;
          }
        } catch {
          console.log("[ClientModel] Cache check failed, loading from network");
        }
      }

      console.log("[ClientModel] Loading model from network...");
      model = await tf.loadLayersModel(MODEL_URL);
      console.log("[ClientModel] Model loaded!");

      if ("caches" in window) {
        try {
          const cache = await caches.open(`${CACHE_NAME}-${CACHE_VERSION}`);
          await cache.add(MODEL_URL);
          console.log("[ClientModel] Model cached for offline use");
        } catch {
          console.log("[ClientModel] Could not cache model");
        }
      }
    } catch (error) {
      console.error("[ClientModel] Failed to load model:", error);
      model = null;
      throw error;
    } finally {
      isModelLoading = false;
    }
  })();

  return loadPromise;
}

export function isModelReady(): boolean {
  return model !== null;
}

export async function removeBackgroundClientSide(
  imageElement: HTMLImageElement,
  onProgress?: (progress: number) => void
): Promise<string> {
  if (!model) {
    throw new Error("Model not loaded. Call loadClientModel() first.");
  }

  console.log("[ClientModel] Processing image...");
  onProgress?.(10);

  const tensor = tf.browser.fromPixels(imageElement);
  const [height, width] = tensor.shape.slice(0, 2);

  onProgress?.(30);

  const normalized = tf.tidy(() => {
    const float32 = tensor.toFloat();
    return float32.div(255.0).expandDims(0);
  });

  onProgress?.(50);

  const prediction = model.predict(normalized) as tf.Tensor;
  
  onProgress?.(70);

  const mask = tf.tidy(() => {
    const squeezed = prediction.squeeze();
    const sigmoid = tf.div(1, tf.add(1, tf.exp(tf.neg(squeezed))));
    return tf.mul(sigmoid, 255);
  });

  onProgress?.(85);

  const originalNormalized = tf.tidy(() => {
    return tf.squeeze(normalized);
  });

  const mask3Ch = tf.tidy(() => {
    return tf.tile(mask.expandDims(-1), [1, 1, 3]);
  });

  const result = tf.tidy(() => {
    return tf.div(tf.mul(originalNormalized, mask3Ch), 255);
  });

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get canvas context");

  const imgData = ctx.createImageData(width, height);
  
  const maskData = await mask.array() as number[][];
  const origData = await originalNormalized.array() as number[][][];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha = maskData[y][x];
      const idx = (y * width + x) * 4;
      
      imgData.data[idx] = Math.round(origData[y][x][0] * alpha);
      imgData.data[idx + 1] = Math.round(origData[y][x][1] * alpha);
      imgData.data[idx + 2] = Math.round(origData[y][x][2] * alpha);
      imgData.data[idx + 3] = alpha;
    }
  }

  ctx.putImageData(imgData, 0, 0);

  tensor.dispose();
  normalized.dispose();
  prediction.dispose();
  mask.dispose();
  originalNormalized.dispose();
  mask3Ch.dispose();
  result.dispose();

  onProgress?.(100);
  console.log("[ClientModel] Done!");

  return canvas.toDataURL("image/png");
}

export function disposeModel(): void {
  if (model) {
    model.dispose();
    model = null;
    console.log("[ClientModel] Model disposed");
  }
}