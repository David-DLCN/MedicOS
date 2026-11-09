/**
 * Browser-only storage (IndexedDB) for files uploaded in the demo.
 *
 * There is no backend yet, so uploads live only in this browser. The real
 * implementation will use private, access-controlled storage per doctor
 * (e.g. Supabase Storage with row-level security) and encryption at rest.
 */
import type { PatientDocument } from "@/lib/domain/types";

export type StoredDocument = PatientDocument & { blob: Blob };

const DB_NAME = "medicos-demo";
const STORE = "patient-documents";

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") return reject(new Error("IndexedDB no disponible"));
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const store = request.result.createObjectStore(STORE, { keyPath: "id" });
      store.createIndex("patientId", "patientId");
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function run<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDatabase().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        const request = action(tx.objectStore(STORE));
        tx.oncomplete = () => {
          db.close();
          resolve(request.result);
        };
        tx.onerror = () => {
          db.close();
          reject(tx.error);
        };
      }),
  );
}

export function listStoredDocuments(patientId: string) {
  return run<StoredDocument[]>("readonly", (store) => store.index("patientId").getAll(patientId));
}

export function saveStoredDocument(document: StoredDocument) {
  return run("readwrite", (store) => store.put(document));
}

export function deleteStoredDocument(id: string) {
  return run("readwrite", (store) => store.delete(id));
}
