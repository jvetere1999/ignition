"use client";

/**
 * Minimal offline mutation queue using IndexedDB.
 * Stores non-GET requests when offline and replays them when back online.
 */

type Mutation = {
  id?: number;
  url: string;
  method: string;
  body?: string;
  headers?: Record<string, string>;
};

const DB_NAME = "ignition-offline";
const STORE_NAME = "mutations";
export const OFFLINE_QUEUE_EVENT = "offline-queue-updated";

function notifyQueueChange(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(OFFLINE_QUEUE_EVENT));
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function enqueueMutation(mutation: Mutation): Promise<void> {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.objectStore(STORE_NAME).add(mutation);
  });
  notifyQueueChange();
}

async function listMutations(): Promise<Mutation[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result as Mutation[]);
    req.onerror = () => reject(req.error);
  });
}

async function deleteMutation(id?: number): Promise<void> {
  if (id === undefined) return;
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.objectStore(STORE_NAME).delete(id);
  });
  notifyQueueChange();
}

export async function getQueueCount(): Promise<number> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.count();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function replayQueue(): Promise<void> {
  if (!navigator.onLine) return;
  const mutations = await listMutations();
  for (const mutation of mutations) {
    try {
      const run = async () => {
        await fetch(mutation.url, {
          method: mutation.method,
          body: mutation.body,
          headers: mutation.headers,
          credentials: "include",
        });
        await deleteMutation(mutation.id);
      };
      if ("locks" in navigator && (navigator as any).locks?.request) {
        await (navigator as any).locks.request("offline-queue", run);
      } else {
        await run();
      }
    } catch (err) {
      console.warn("[offline-queue] replay failed, will retry later", err);
      return;
    }
  }
  notifyQueueChange();
}

export function startOfflineQueueWorker(): void {
  if (typeof window === "undefined") return;
  if (!("locks" in navigator)) {
    console.warn("[offline-queue] navigator.locks not available; continuing without lock");
  }
  window.addEventListener("online", () => {
    replayQueue().catch((err) => console.error("[offline-queue] replay error", err));
  });
}
