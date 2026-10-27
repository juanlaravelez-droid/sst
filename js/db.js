const DATABASE_NAME = "sg-sst-local";
const DATABASE_VERSION = 4;
const RECORD_STORE = "gtc45_matrix";
const INSPECTION_STORE = "inspections";
const COMPANY_PROFILE_STORE = "company_profile";
const WORK_PERMIT_STORE = "height_work_permits";

let databasePromise;

function openDatabase() {
  if (!("indexedDB" in window)) {
    return Promise.reject(new Error("Este navegador no permite almacenamiento IndexedDB."));
  }
  if (databasePromise) return databasePromise;

  databasePromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(RECORD_STORE)) {
        database.createObjectStore(RECORD_STORE, { keyPath: "id" });
      }
      if (!database.objectStoreNames.contains(INSPECTION_STORE)) {
        database.createObjectStore(INSPECTION_STORE, { keyPath: "id" });
      }
      if (!database.objectStoreNames.contains(COMPANY_PROFILE_STORE)) {
        database.createObjectStore(COMPANY_PROFILE_STORE, { keyPath: "id" });
      }
      if (!database.objectStoreNames.contains(WORK_PERMIT_STORE)) {
        database.createObjectStore(WORK_PERMIT_STORE, { keyPath: "id" });
      }
    };
    request.onsuccess = () => {
      const database = request.result;
      database.onversionchange = () => {
        database.close();
        databasePromise = undefined;
      };
      resolve(database);
    };
    request.onerror = () => {
      databasePromise = undefined;
      reject(request.error ?? new Error("No fue posible abrir la base de datos local."));
    };
    request.onblocked = () => {
      databasePromise = undefined;
      reject(new Error("La base de datos está bloqueada por otra pestaña. Cierra las demás pestañas de SG-SST y vuelve a intentar."));
    };
  });
  return databasePromise;
}

function requestResult(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Falló una operación de almacenamiento local."));
  });
}

function transactionResult(transaction) {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Falló una transacción de almacenamiento local."));
    transaction.onabort = () => reject(transaction.error ?? new Error("Se canceló una transacción de almacenamiento local."));
  });
}

export async function getAllRecords() {
  const database = await openDatabase();
  const transaction = database.transaction(RECORD_STORE, "readonly");
  const completed = transactionResult(transaction);
  const [records] = await Promise.all([requestResult(transaction.objectStore(RECORD_STORE).getAll()), completed]);
  return records;
}

export async function saveRecord(record) {
  const database = await openDatabase();
  const transaction = database.transaction(RECORD_STORE, "readwrite");
  const completed = transactionResult(transaction);
  await Promise.all([requestResult(transaction.objectStore(RECORD_STORE).put(record)), completed]);
}

export async function deleteRecord(id) {
  const database = await openDatabase();
  const transaction = database.transaction(RECORD_STORE, "readwrite");
  const completed = transactionResult(transaction);
  await Promise.all([requestResult(transaction.objectStore(RECORD_STORE).delete(id)), completed]);
}

export async function getAllInspections() {
  const database = await openDatabase();
  const transaction = database.transaction(INSPECTION_STORE, "readonly");
  const completed = transactionResult(transaction);
  const [inspections] = await Promise.all([requestResult(transaction.objectStore(INSPECTION_STORE).getAll()), completed]);
  return inspections;
}

export async function saveInspection(inspection) {
  const database = await openDatabase();
  const transaction = database.transaction(INSPECTION_STORE, "readwrite");
  const completed = transactionResult(transaction);
  await Promise.all([requestResult(transaction.objectStore(INSPECTION_STORE).put(inspection)), completed]);
}

export async function getCompanyProfile() {
  const database = await openDatabase();
  const transaction = database.transaction(COMPANY_PROFILE_STORE, "readonly");
  const completed = transactionResult(transaction);
  const [profile] = await Promise.all([
    requestResult(transaction.objectStore(COMPANY_PROFILE_STORE).get("saena")),
    completed
  ]);
  return profile ?? null;
}

export async function saveCompanyProfile(profile) {
  const database = await openDatabase();
  const transaction = database.transaction(COMPANY_PROFILE_STORE, "readwrite");
  const completed = transactionResult(transaction);
  await Promise.all([requestResult(transaction.objectStore(COMPANY_PROFILE_STORE).put(profile)), completed]);
}

export async function deleteInspection(id) {
  const database = await openDatabase();
  const transaction = database.transaction(INSPECTION_STORE, "readwrite");
  const completed = transactionResult(transaction);
  await Promise.all([requestResult(transaction.objectStore(INSPECTION_STORE).delete(id)), completed]);
}

export async function getAllWorkPermits() {
  const database = await openDatabase();
  const transaction = database.transaction(WORK_PERMIT_STORE, "readonly");
  const completed = transactionResult(transaction);
  const [permits] = await Promise.all([requestResult(transaction.objectStore(WORK_PERMIT_STORE).getAll()), completed]);
  return permits;
}

export async function saveWorkPermit(permit) {
  const database = await openDatabase();
  const transaction = database.transaction(WORK_PERMIT_STORE, "readwrite");
  const completed = transactionResult(transaction);
  await Promise.all([requestResult(transaction.objectStore(WORK_PERMIT_STORE).put(permit)), completed]);
}

export async function deleteWorkPermit(id) {
  const database = await openDatabase();
  const transaction = database.transaction(WORK_PERMIT_STORE, "readwrite");
  const completed = transactionResult(transaction);
  await Promise.all([requestResult(transaction.objectStore(WORK_PERMIT_STORE).delete(id)), completed]);
}

export async function importBackupData(records, inspections, companyProfile = null, workPermits = []) {
  if (!Array.isArray(records) || !Array.isArray(inspections) || !Array.isArray(workPermits)) {
    throw new TypeError("El backup debe incluir listas válidas de peligros, inspecciones y permisos.");
  }
  const database = await openDatabase();
  const transaction = database.transaction([RECORD_STORE, INSPECTION_STORE, COMPANY_PROFILE_STORE, WORK_PERMIT_STORE], "readwrite");
  const completed = transactionResult(transaction);
  const requests = [
    ...records.map((record) => requestResult(transaction.objectStore(RECORD_STORE).put(record))),
    ...inspections.map((inspection) => requestResult(transaction.objectStore(INSPECTION_STORE).put(inspection))),
    ...workPermits.map((permit) => requestResult(transaction.objectStore(WORK_PERMIT_STORE).put(permit)))
  ];
  if (companyProfile) requests.push(requestResult(transaction.objectStore(COMPANY_PROFILE_STORE).put(companyProfile)));
  await Promise.all([...requests, completed]);
}

export const backupVersion = 4;
