import { deleteWorkPermit, getAllWorkPermits, saveWorkPermit } from "../db.js";
import { validateImportedPermit } from "../domain/heightWorkPermit.js";

export async function listHeightWorkPermits() {
  return getAllWorkPermits();
}

export async function saveHeightWorkPermit(permit) {
  const validatedPermit = validateImportedPermit(permit);
  await saveWorkPermit(validatedPermit);
  return validatedPermit;
}

export async function removeHeightWorkPermit(id) {
  if (typeof id !== "string" || !id.trim()) {
    throw new TypeError("El permiso que se desea eliminar no tiene un identificador válido.");
  }
  await deleteWorkPermit(id);
}

export function validateHeightWorkPermitBackup(record) {
  return validateImportedPermit(record);
}
