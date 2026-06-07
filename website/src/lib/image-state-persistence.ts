import { ImageItem } from "@/types/image";

const TERMINAL_STATUSES: Array<ImageItem["status"]> = ["completed", "failed", "error"];

const DB_NAME = "quickbg-image-state";
const DB_VERSION = 1;
const STORE_NAME = "images";

interface PersistedImageRecord {
  id: string;
  order: number;
  name: string;
  type: string;
  lastModified: number;
  file: Blob;
  status: ImageItem["status"];
  result?: Blob;
  error?: string;
  startTime?: number;
  duration?: number;
  dimensions?: ImageItem["dimensions"];
  jobId?: string;
  progress?: number;
  queuePosition?: number | null;
  estimatedWaitSeconds?: number | null;
  waitingReason?: ImageItem["waitingReason"] | null;
  creditResetAt?: number | null;
  queueRetryAt?: number | null;
  terminalAt?: number | null;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("IndexedDB is not available"));
  }

  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "id" });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error("Failed to open IndexedDB"));
    });
  }

  return dbPromise;
}

function waitForTransaction(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("IndexedDB transaction failed"));
    tx.onabort = () => reject(tx.error ?? new Error("IndexedDB transaction aborted"));
  });
}

async function blobFromUrl(url?: string): Promise<Blob | undefined> {
  if (!url) {
    return undefined;
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return undefined;
    }
    return await response.blob();
  } catch {
    return undefined;
  }
}

function toPersistedRecord(image: ImageItem, order: number): PersistedImageRecord {
  return {
    id: image.id,
    order,
    name: image.file.name,
    type: image.file.type,
    lastModified: image.file.lastModified,
    file: image.file,
    status: image.status,
    error: image.error,
    startTime: image.startTime,
    duration: image.duration,
    dimensions: image.dimensions,
    jobId: image.jobId,
    progress: image.progress,
    queuePosition: image.queuePosition ?? null,
    estimatedWaitSeconds: image.estimatedWaitSeconds ?? null,
    waitingReason: image.waitingReason ?? null,
    creditResetAt: image.creditResetAt ?? null,
    queueRetryAt: image.queueRetryAt ?? null,
    terminalAt: image.terminalAt ?? null,
  };
}

function isTerminalStatus(status: ImageItem["status"]): boolean {
  return TERMINAL_STATUSES.includes(status);
}

async function withStore<T>(mode: IDBTransactionMode, handler: (store: IDBObjectStore) => T | Promise<T>): Promise<T> {
  const db = await openDatabase();
  const tx = db.transaction(STORE_NAME, mode);
  const store = tx.objectStore(STORE_NAME);
  const result = await handler(store);
  await waitForTransaction(tx);
  return result;
}

export async function persistImageState(images: ImageItem[]): Promise<void> {
  if (typeof indexedDB === "undefined") {
    return;
  }

  const records: PersistedImageRecord[] = [];

  for (let index = 0; index < images.length; index += 1) {
    const image = images[index];
    const record = toPersistedRecord(image, index);

    if (image.result) {
      record.result = await blobFromUrl(image.result);
    }

    records.push(record);
  }

  await withStore("readwrite", (store) => {
    store.clear();
    records.forEach((record) => {
      store.put(record);
    });
  });
}

export async function restoreImageState(): Promise<ImageItem[]> {
  if (typeof indexedDB === "undefined") {
    return [];
  }

  const records = await withStore("readonly", (store) => {
    return new Promise<PersistedImageRecord[]>((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve((request.result as PersistedImageRecord[]) ?? []);
      request.onerror = () => reject(request.error ?? new Error("Failed to read persisted images"));
    });
  });

  records.sort((left, right) => left.order - right.order);

  return records.map((record) => {
    const file = new File([record.file], record.name, {
      type: record.type,
      lastModified: record.lastModified,
    });

    const restored: ImageItem = {
      id: record.id,
      file,
      preview: URL.createObjectURL(file),
      status: record.status,
      error: record.error,
      startTime: record.startTime,
      duration: record.duration,
      dimensions: record.dimensions,
      jobId: record.jobId,
      progress: record.progress,
      queuePosition: record.queuePosition ?? null,
      estimatedWaitSeconds: record.estimatedWaitSeconds ?? null,
      waitingReason: record.waitingReason ?? null,
      creditResetAt: record.creditResetAt ?? null,
      queueRetryAt: record.queueRetryAt ?? null,
      terminalAt:
        record.terminalAt ??
        (isTerminalStatus(record.status)
          ? record.startTime != null && record.duration != null
            ? record.startTime + record.duration
            : Date.now()
          : null),
    };

    if (record.result) {
      restored.result = URL.createObjectURL(record.result);
    }

    return restored;
  });
}
