import { backupVersion, getAllInspections, getAllRecords, getCompanyProfile, importBackupData } from "./db.js";
import { listHeightWorkPermits, validateHeightWorkPermitBackup } from "./application/heightWorkPermitService.js";
import { initIpevr, refreshIpevrRecords, validateImportedRecord } from "./modules/ipevr.js";
import { initInspections, refreshInspections, serializeInspection, validateImportedInspection } from "./modules/inspections.js";
import { initRes0312, refreshRes0312Profile, validateImportedCompanyProfile } from "./modules/res0312.js";
import { initHeightWorkPermits, refreshWorkPermits } from "./modules/heightWorkPermits.js";

const routeNames = {
  dashboard: "Dashboard",
  matriz: "Matriz IPEVR",
  estandares: "Autoevaluación Res. 0312",
  inspecciones: "Inspecciones",
  permisos: "Permiso de trabajo en alturas",
  ajustes: "Ajustes"
};
const pageTitle = document.querySelector("#page-title");
const views = [...document.querySelectorAll("[data-view]")];
const navigationLinks = [...document.querySelectorAll("[data-route]")];

function renderRoute() {
  const requestedRoute = window.location.hash.slice(1);
  const route = Object.hasOwn(routeNames, requestedRoute) ? requestedRoute : "dashboard";
  if (!window.location.hash || requestedRoute !== route) window.history.replaceState(null, "", `#${route}`);
  pageTitle.textContent = routeNames[route];
  for (const view of views) view.hidden = view.dataset.view !== route;
  for (const link of navigationLinks) {
    if (link.dataset.route === route) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  }
  document.querySelector("#main-content").focus({ preventScroll: true });
}

function updateConnectionStatus() {
  const offline = !navigator.onLine;
  const status = document.querySelector(".connection-status");
  status.classList.toggle("is-offline", offline);
  document.querySelector("#connection-label").textContent = offline ? "Sin conexión · modo local" : "Conectado";
}

function updateMetrics(records) {
  document.querySelector("#metric-total").textContent = String(records.length);
  document.querySelector("#metric-level-one").textContent = String(records.filter((record) => record.level === "I").length);
  document.querySelector("#metric-action").textContent = String(records.filter((record) => record.level === "I" || record.level === "II").length);
}

function downloadBackup(backup) {
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `sg-sst-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function createBackup() {
  const [records, inspections, companyProfile, workPermits] = await Promise.all([
    getAllRecords(),
    getAllInspections(),
    getCompanyProfile(),
    listHeightWorkPermits()
  ]);
  return {
    format: "sg-sst-local-backup",
    version: backupVersion,
    exportedAt: new Date().toISOString(),
    records,
    inspections: await Promise.all(inspections.map(serializeInspection)),
    companyProfile,
    workPermits
  };
}

function setBackupMessage(message, isError = false) {
  const element = document.querySelector("#backup-message");
  element.textContent = message;
  element.classList.toggle("is-error", isError);
}

async function registerServiceWorker() {
  const status = document.querySelector("#pwa-status");
  if (!("serviceWorker" in navigator)) {
    status.textContent = "Este navegador no ofrece soporte para Service Worker; la persistencia local sigue disponible.";
    return;
  }
  if (!window.isSecureContext) {
    status.textContent = "Para habilitar el caché offline, sirve esta carpeta desde localhost o HTTPS. IndexedDB puede requerir un servidor local.";
    return;
  }
  try {
    await navigator.serviceWorker.register("./sw.js?v=16");
    status.textContent = "Shell de la aplicación preparado para uso offline. Los registros, el perfil empresarial y los borradores de permisos se guardan localmente en IndexedDB.";
  } catch (error) {
    console.error("No fue posible registrar el Service Worker.", error);
    status.textContent = "No se pudo activar el caché offline. Revisa la consola del navegador; los registros locales continúan disponibles.";
  }
}

async function initBackup() {
  document.querySelector("#export-backup").addEventListener("click", async () => {
    try {
      downloadBackup(await createBackup());
      setBackupMessage("Backup JSON exportado con matriz, inspecciones, borradores de permisos, perfil empresarial, fotos y firmas.");
    } catch (error) {
      setBackupMessage(error instanceof Error ? error.message : "No fue posible exportar el backup.", true);
    }
  });
  document.querySelector("#import-backup").addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      const backup = JSON.parse(await file.text());
      if (backup?.format !== "sg-sst-local-backup" || ![1, 2, 3, backupVersion].includes(backup.version) || !Array.isArray(backup.records)) {
        throw new TypeError("El archivo no corresponde a un backup SG-SST compatible.");
      }
      const records = backup.records.map(validateImportedRecord);
      if (backup.version >= 2 && !Array.isArray(backup.inspections)) {
        throw new TypeError("El backup no contiene una lista válida de inspecciones.");
      }
      if (backup.version >= 3 && !Object.hasOwn(backup, "companyProfile")) {
        throw new TypeError("El backup no incluye el perfil empresarial requerido por esta versión.");
      }
      if (backup.version === backupVersion && !Array.isArray(backup.workPermits)) {
        throw new TypeError("El backup no contiene una lista válida de permisos de trabajo en alturas.");
      }
      const inspections = backup.version === 1 ? [] : await Promise.all(backup.inspections.map(validateImportedInspection));
      const companyProfile = backup.version >= 3 && backup.companyProfile
        ? validateImportedCompanyProfile(backup.companyProfile)
        : null;
      const workPermits = backup.version === backupVersion
        ? backup.workPermits.map(validateHeightWorkPermitBackup)
        : [];
      await importBackupData(records, inspections, companyProfile, workPermits);
      await refreshIpevrRecords();
      await refreshInspections();
      await refreshRes0312Profile();
      await refreshWorkPermits();
      setBackupMessage(`Importación completada: ${records.length} peligro(s), ${inspections.length} inspección(es) y ${workPermits.length} permiso(s) agregados o actualizados.`);
    } catch (error) {
      setBackupMessage(error instanceof Error ? error.message : "No fue posible importar el backup.", true);
    } finally {
      event.target.value = "";
    }
  });
}

async function main() {
  window.addEventListener("hashchange", renderRoute);
  window.addEventListener("online", updateConnectionStatus);
  window.addEventListener("offline", updateConnectionStatus);
  window.addEventListener("ipevr:records-changed", (event) => updateMetrics(event.detail.records));
  renderRoute();
  updateConnectionStatus();
  await initIpevr();
  await initInspections();
  await initHeightWorkPermits();
  await initRes0312();
  await initBackup();
  await registerServiceWorker();
}

main().catch((error) => {
  console.error("No fue posible iniciar la aplicación.", error);
  const mainContent = document.querySelector("#main-content");
  const message = document.createElement("p");
  message.className = "notice";
  message.setAttribute("role", "alert");
  message.textContent = `No fue posible iniciar la aplicación: ${error.message}`;
  mainContent.prepend(message);
});
