import { deleteInspection, getAllInspections, saveInspection } from "../db.js";
import { initCanvasSignature } from "../utils/canvasSignature.js";
import { compressInspectionPhoto } from "../utils/imageCompression.js";

const checklistTemplates = Object.freeze({
  epp: {
    label: "Elementos de protección personal",
    items: [
      "Los EPP corresponden a los peligros y la tarea realizada.",
      "Los elementos se encuentran limpios y en buen estado.",
      "El personal dispone de los EPP requeridos y los utiliza correctamente.",
      "Se identifican elementos dañados o que requieren reposición."
    ]
  },
  extintores: {
    label: "Extintores",
    items: [
      "El extintor está visible, señalizado y con acceso libre.",
      "La tarjeta de inspección y el mantenimiento están vigentes.",
      "El manómetro, el sello y los componentes están en condición adecuada.",
      "La capacidad y el tipo de extintor son adecuados para el área."
    ]
  },
  "orden-aseo": {
    label: "Orden y aseo",
    items: [
      "Las zonas de circulación y salidas se encuentran despejadas.",
      "Los materiales y herramientas están almacenados de forma segura.",
      "No se observan derrames, residuos ni superficies que generen tropiezos.",
      "Los cables, mangueras y extensiones están organizados y protegidos."
    ]
  },
  fotovoltaica: {
    label: "Sistemas fotovoltaicos",
    items: [
      "La actividad y sus peligros cuentan con evaluación, controles y autorización aplicables.",
      "El personal asignado tiene las competencias y el EPP requeridos para la tarea.",
      "El área de trabajo está delimitada y señalizada, con acceso controlado.",
      "Se revisaron las condiciones del sitio y del clima antes de iniciar la actividad.",
      "El manejo y acopio de módulos, herramientas y materiales evita daños y sobreesfuerzos.",
      "Los cables, conectores, canalizaciones e inversores están protegidos frente a daños y condiciones ambientales.",
      "Los peligros eléctricos de circuitos DC y AC, puntos de aislamiento y restricciones de reenergización están identificados en el procedimiento aprobado.",
      "Si hay trabajo en alturas, se verifican los sistemas de acceso, protección contra caídas y medidas de rescate aplicables."
    ]
  },
  alturas: {
    label: "Trabajo en alturas",
    items: [
      "Se verifica el análisis de peligros y los controles definidos para la tarea.",
      "El sistema de acceso y el área de trabajo se encuentran en condiciones seguras.",
      "Los equipos de protección contra caídas están identificados e inspeccionados.",
      "Se verifican los puntos de anclaje y la compatibilidad de los componentes.",
      "Se cuenta con las autorizaciones, competencias y medidas de emergencia aplicables."
    ]
  }
});

const form = document.querySelector("#inspection-form");
const recordsContainer = document.querySelector("#inspection-records");
const formMessage = document.querySelector("#inspection-message");
const photoMessage = document.querySelector("#photo-message");
const signatureMessage = document.querySelector("#signature-message");
const photoList = document.querySelector("#inspection-photo-list");
const photoInput = document.querySelector("#inspection-photos");
const typeInput = document.querySelector("#inspection-type");
const checklistContainer = document.querySelector("#inspection-checklist");
const locationStatus = document.querySelector("#location-status");
const canvas = document.querySelector("#inspection-signature");
const photoObjects = [];
const previewUrls = [];

let inspections = [];
let capturedLocation = null;
const signature = initCanvasSignature(canvas, document.querySelector("#clear-signature"));

function localDateValue() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function setMessage(element, message, isError = false) {
  element.textContent = message;
  element.classList.toggle("is-error", isError);
}

function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function renderChecklist() {
  const template = checklistTemplates[typeInput.value];
  checklistContainer.replaceChildren();

  template.items.forEach((label, index) => {
    const row = element("div", undefined, "checklist-item");
    const itemLabel = element("label", label);
    itemLabel.htmlFor = `check-item-${index}`;
    const select = element("select");
    select.id = itemLabel.htmlFor;
    select.dataset.checklistIndex = String(index);
    select.required = true;
    select.setAttribute("aria-label", `Estado: ${label}`);
    for (const [value, text] of [
      ["", "Selecciona un estado"],
      ["ok", "Conforme"],
      ["action", "Requiere acción"],
      ["na", "No aplica"]
    ]) {
      const option = element("option", text);
      option.value = value;
      select.append(option);
    }
    row.append(itemLabel, select);
    checklistContainer.append(row);
  });
}

function updatePhotoPreviews() {
  for (const url of previewUrls) URL.revokeObjectURL(url);
  previewUrls.length = 0;
  photoList.replaceChildren();

  if (photoObjects.length === 0) {
    photoList.append(element("p", "No se han agregado fotografías.", "empty-state"));
    return;
  }

  photoObjects.forEach((photo, index) => {
    const item = element("div", undefined, "photo-item");
    const url = URL.createObjectURL(photo.blob);
    previewUrls.push(url);
    const image = element("img");
    image.src = url;
    image.alt = `Vista previa: ${photo.name}`;
    const details = element("div");
    details.append(element("strong", photo.name), element("span", `${photo.blob.type} · ${Math.round(photo.blob.size / 1024)} KB`));
    const remove = element("button", "Quitar", "button button-secondary button-small");
    remove.type = "button";
    remove.dataset.photoIndex = String(index);
    remove.setAttribute("aria-label", `Quitar fotografía ${photo.name}`);
    item.append(image, details, remove);
    photoList.append(item);
  });
}

async function addPhotos(files) {
  const selectedFiles = [...files];
  const availableSlots = 3 - photoObjects.length;
  if (selectedFiles.length > availableSlots) {
    setMessage(photoMessage, `Solo puedes adjuntar 3 fotografías. Quedan ${availableSlots} espacio(s) disponible(s).`, true);
    photoInput.value = "";
    return;
  }

  const failures = [];
  for (const file of selectedFiles) {
    try {
      const blob = await compressInspectionPhoto(file);
      photoObjects.push({ name: file.name.slice(0, 180) || "fotografia", type: blob.type, blob });
    } catch (error) {
      failures.push(`${file.name}: ${error instanceof Error ? error.message : "error al procesar"}`);
    }
  }
  updatePhotoPreviews();
  setMessage(photoMessage, failures.length ? failures.join(" ") : `${photoObjects.length} de 3 fotografía(s) agregada(s).`, failures.length > 0);
  photoInput.value = "";
}

function requestLocation() {
  if (!("geolocation" in navigator)) {
    setMessage(signatureMessage, "Este navegador no ofrece geolocalización; puedes guardar la inspección sin GPS.", true);
    return;
  }

  locationStatus.textContent = "Solicitando ubicación al dispositivo…";
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => {
      capturedLocation = {
        latitude: Number(coords.latitude.toFixed(6)),
        longitude: Number(coords.longitude.toFixed(6)),
        accuracyMeters: Math.round(coords.accuracy)
      };
      locationStatus.textContent = `Ubicación agregada · precisión aproximada ${capturedLocation.accuracyMeters} m.`;
      setMessage(signatureMessage, "");
    },
    (error) => {
      capturedLocation = null;
      locationStatus.textContent = "La ubicación no se ha agregado.";
      const message = error.code === error.PERMISSION_DENIED
        ? "Se denegó el permiso de ubicación. Puedes guardar sin GPS."
        : error.code === error.POSITION_UNAVAILABLE
          ? "El dispositivo no pudo obtener la ubicación. Puedes guardar sin GPS."
          : "Se agotó el tiempo para obtener la ubicación. Puedes guardar sin GPS.";
      setMessage(signatureMessage, message, true);
    },
    { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
  );
}

async function digestSignature(blob, capturedAt, location) {
  if (!crypto.subtle) throw new Error("Se requiere localhost o HTTPS para generar el hash de verificación de la firma.");
  const signatureBytes = await blob.arrayBuffer();
  const metadata = new TextEncoder().encode(`${capturedAt}|${location ? `${location.latitude},${location.longitude}` : "sin-gps"}|`);
  const content = new Uint8Array(metadata.length + signatureBytes.byteLength);
  content.set(metadata);
  content.set(new Uint8Array(signatureBytes), metadata.length);
  const digest = await crypto.subtle.digest("SHA-256", content);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function collectChecklist() {
  return [...checklistContainer.querySelectorAll("select")].map((select, index) => ({
    label: checklistTemplates[typeInput.value].items[index],
    status: select.value
  }));
}

async function recordFromForm() {
  if (!signature.hasInk()) throw new TypeError("Agrega la firma de quien inspecciona antes de guardar.");
  const checklist = collectChecklist();
  if (checklist.some((item) => !["ok", "action", "na"].includes(item.status))) {
    throw new TypeError("Selecciona el estado de todos los puntos de la lista de chequeo.");
  }

  const now = new Date().toISOString();
  const signatureBlob = await signature.toBlob();
  const verificationHash = await digestSignature(signatureBlob, now, capturedLocation);
  const type = typeInput.value;
  return {
    id: crypto.randomUUID(),
    title: form.elements.namedItem("title").value.trim(),
    type,
    typeLabel: checklistTemplates[type].label,
    date: form.elements.namedItem("date").value,
    site: form.elements.namedItem("site").value.trim(),
    inspector: form.elements.namedItem("inspector").value.trim(),
    checklist,
    findings: form.elements.namedItem("findings").value.trim(),
    photos: photoObjects.map((photo) => ({ ...photo })),
    signature: {
      blob: signatureBlob,
      capturedAt: now,
      location: capturedLocation,
      hashAlgorithm: "SHA-256",
      verificationHash
    },
    createdAt: now
  };
}

function revokePreviewUrls() {
  for (const url of previewUrls) URL.revokeObjectURL(url);
  previewUrls.length = 0;
}

function appendPhotoGallery(parent, photos, label) {
  if (photos.length === 0) {
    parent.append(element("p", "Sin fotografías adjuntas.", "field-hint"));
    return;
  }
  const gallery = element("div", undefined, "inspection-gallery");
  photos.forEach((photo, index) => {
    const url = URL.createObjectURL(photo.blob);
    previewUrls.push(url);
    const figure = element("figure");
    const image = element("img");
    image.src = url;
    image.alt = `${label}, fotografía ${index + 1}`;
    figure.append(image, element("figcaption", photo.name));
    gallery.append(figure);
  });
  parent.append(gallery);
}

function renderInspection(inspection) {
  const article = element("article", undefined, "inspection-card");
  const header = element("div", undefined, "inspection-card-header");
  const heading = element("div");
  heading.append(element("h4", inspection.title), element("p", `${inspection.typeLabel} · ${inspection.date} · ${inspection.site}`));
  const deleteButton = element("button", "Eliminar", "button button-secondary button-small");
  deleteButton.type = "button";
  deleteButton.dataset.deleteInspection = inspection.id;
  deleteButton.setAttribute("aria-label", `Eliminar inspección ${inspection.title}`);
  header.append(heading, deleteButton);
  article.append(header);

  const details = element("details", undefined, "inspection-details");
  details.append(element("summary", "Ver lista, firma y evidencias"));
  details.append(element("p", `Inspeccionó: ${inspection.inspector}`, "subtext"));

  const checklist = element("ul", undefined, "inspection-checklist-summary");
  for (const item of inspection.checklist) {
    const itemRow = element("li");
    itemRow.append(element("span", item.label));
    const statusText = item.status === "ok" ? "Conforme" : item.status === "action" ? "Requiere acción" : "No aplica";
    itemRow.append(element("strong", statusText, `check-status check-status-${item.status}`));
    checklist.append(itemRow);
  }
  details.append(checklist);
  if (inspection.findings) {
    const findings = element("p", undefined, "inspection-findings");
    findings.append(element("strong", "Observaciones: "), document.createTextNode(inspection.findings));
    details.append(findings);
  }
  const location = inspection.signature.location;
  details.append(element(
    "p",
    location
      ? `GPS: ${location.latitude}, ${location.longitude} · precisión aproximada ${location.accuracyMeters} m`
      : "GPS: no registrado",
    "field-hint"
  ));
  const signatureFigure = element("figure", undefined, "saved-signature");
  const signatureImage = element("img");
  const signatureUrl = URL.createObjectURL(inspection.signature.blob);
  previewUrls.push(signatureUrl);
  signatureImage.src = signatureUrl;
  signatureImage.alt = `Firma de ${inspection.inspector}`;
  signatureFigure.append(signatureImage, element("figcaption", `Firmado ${new Date(inspection.signature.capturedAt).toLocaleString("es-CO")} · Hash SHA-256 ${inspection.signature.verificationHash.slice(0, 16)}…`));
  details.append(signatureFigure);
  appendPhotoGallery(details, inspection.photos, inspection.title);
  article.append(details);
  return article;
}

function renderInspections() {
  revokePreviewUrls();
  document.querySelector("#inspection-count").textContent = String(inspections.length);
  recordsContainer.replaceChildren();
  if (inspections.length === 0) {
    recordsContainer.append(element("p", "Aún no hay inspecciones registradas.", "empty-state"));
    return;
  }
  [...inspections]
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
    .forEach((inspection) => recordsContainer.append(renderInspection(inspection)));
}

async function validateImportedInspection(record) {
  if (!record || typeof record !== "object" || typeof record.id !== "string" || !record.id) {
    throw new TypeError("El backup contiene una inspección sin identificador válido.");
  }
  if (typeof record.title !== "string" || !record.title.trim() || typeof record.site !== "string" || !record.site.trim() || typeof record.inspector !== "string" || !record.inspector.trim()) {
    throw new TypeError("El backup contiene una inspección sin título, lugar o persona responsable.");
  }
  if (!Object.hasOwn(checklistTemplates, record.type) || !Array.isArray(record.checklist) || record.checklist.length !== checklistTemplates[record.type].items.length) {
    throw new TypeError(`La inspección "${record.title}" tiene una lista de chequeo inválida.`);
  }
  const checklist = record.checklist.map((item, index) => {
    const status = item?.status;
    if (!["ok", "action", "na"].includes(status)) throw new TypeError(`La inspección "${record.title}" tiene un estado de lista no válido.`);
    return { label: checklistTemplates[record.type].items[index], status };
  });
  if (!Array.isArray(record.photos) || record.photos.length > 3) {
    throw new TypeError(`La inspección "${record.title}" excede el máximo de 3 fotografías.`);
  }
  if (!record.signature || typeof record.signature.imageDataUrl !== "string" || !/^[a-f\d]{64}$/i.test(record.signature.verificationHash ?? "")) {
    throw new TypeError(`La inspección "${record.title}" no tiene una firma o hash de verificación válido.`);
  }

  const toBlob = (dataUrl, allowedTypes, maxBytes, label) => {
    if (typeof dataUrl !== "string" || dataUrl.length > Math.ceil(maxBytes * 4 / 3) + 64) {
      throw new RangeError(`${label} supera el tamaño máximo admitido en el backup.`);
    }
    const match = /^data:(image\/(?:webp|jpeg|png));base64,([a-z\d+/]+=*)$/i.exec(dataUrl);
    if (!match || !allowedTypes.includes(match[1].toLowerCase())) throw new TypeError(`${label} no tiene un formato de imagen admitido.`);
    const binary = atob(match[2]);
    if (binary.length > maxBytes) throw new RangeError(`${label} supera el tamaño máximo admitido en el backup.`);
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    return new Blob([bytes], { type: match[1].toLowerCase() });
  };

  const photos = record.photos.map((photo) => ({
    name: typeof photo?.name === "string" ? photo.name.slice(0, 180) : "fotografia",
    type: photo?.type,
    blob: toBlob(photo?.dataUrl, ["image/webp", "image/jpeg"], 5 * 1024 * 1024, "Una fotografía")
  }));
  const signatureBlob = toBlob(record.signature.imageDataUrl, ["image/png"], 2 * 1024 * 1024, "La firma");
  const location = record.signature.location;
  let safeLocation = null;
  if (location !== null && location !== undefined) {
    if (
      typeof location !== "object"
      || Array.isArray(location)
      || !Number.isFinite(location.latitude)
      || !Number.isFinite(location.longitude)
      || !Number.isFinite(location.accuracyMeters)
      || Math.abs(location.latitude) > 90
      || Math.abs(location.longitude) > 180
      || location.accuracyMeters < 0
    ) {
      throw new TypeError(`La inspección "${record.title}" contiene coordenadas GPS inválidas.`);
    }
    safeLocation = {
      latitude: location.latitude,
      longitude: location.longitude,
      accuracyMeters: location.accuracyMeters
    };
  }
  const capturedAt = record.signature.capturedAt;
  if (typeof capturedAt !== "string" || Number.isNaN(Date.parse(capturedAt))) {
    throw new TypeError(`La inspección "${record.title}" contiene una fecha de firma no válida.`);
  }
  const expectedHash = record.signature.verificationHash.toLowerCase();
  if (await digestSignature(signatureBlob, capturedAt, safeLocation) !== expectedHash) {
    throw new TypeError(`La firma de la inspección "${record.title}" no coincide con su hash de verificación.`);
  }

  return {
    id: record.id,
    title: record.title.trim().slice(0, 120),
    type: record.type,
    typeLabel: checklistTemplates[record.type].label,
    date: typeof record.date === "string" ? record.date : "",
    site: record.site.trim().slice(0, 120),
    inspector: record.inspector.trim().slice(0, 120),
    checklist,
    findings: typeof record.findings === "string" ? record.findings.slice(0, 1500) : "",
    photos,
    signature: {
      blob: signatureBlob,
      capturedAt,
      location: safeLocation,
      hashAlgorithm: "SHA-256",
      verificationHash: expectedHash
    },
    createdAt: typeof record.createdAt === "string" ? record.createdAt : new Date().toISOString()
  };
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error ?? new Error("No fue posible incluir una imagen en el backup."));
    reader.readAsDataURL(blob);
  });
}

export async function serializeInspection(inspection) {
  return {
    id: inspection.id,
    title: inspection.title,
    type: inspection.type,
    typeLabel: inspection.typeLabel,
    date: inspection.date,
    site: inspection.site,
    inspector: inspection.inspector,
    checklist: inspection.checklist,
    findings: inspection.findings,
    createdAt: inspection.createdAt,
    photos: await Promise.all(inspection.photos.map(async (photo) => ({
      name: photo.name,
      type: photo.blob.type,
      dataUrl: await blobToDataUrl(photo.blob)
    }))),
    signature: {
      capturedAt: inspection.signature.capturedAt,
      location: inspection.signature.location,
      hashAlgorithm: inspection.signature.hashAlgorithm,
      verificationHash: inspection.signature.verificationHash,
      imageDataUrl: await blobToDataUrl(inspection.signature.blob)
    }
  };
}

export async function refreshInspections() {
  inspections = await getAllInspections();
  renderInspections();
}

export async function initInspections() {
  form.elements.namedItem("date").value = localDateValue();
  renderChecklist();
  updatePhotoPreviews();
  typeInput.addEventListener("change", renderChecklist);
  photoInput.addEventListener("change", (event) => addPhotos(event.target.files));
  photoList.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-photo-index]");
    if (!button) return;
    photoObjects.splice(Number(button.dataset.photoIndex), 1);
    updatePhotoPreviews();
    setMessage(photoMessage, `${photoObjects.length} de 3 fotografía(s) agregada(s).`);
  });
  document.querySelector("#capture-location").addEventListener("click", requestLocation);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submit = document.querySelector("#save-inspection");
    submit.disabled = true;
    setMessage(formMessage, "Guardando inspección…");
    try {
      const inspection = await recordFromForm();
      await saveInspection(inspection);
      await refreshInspections();
      form.reset();
      form.elements.namedItem("date").value = localDateValue();
      photoObjects.length = 0;
      capturedLocation = null;
      locationStatus.textContent = "La ubicación no se ha agregado.";
      document.querySelector("#clear-signature").click();
      updatePhotoPreviews();
      renderChecklist();
      setMessage(formMessage, "Inspección guardada en este dispositivo.");
    } catch (error) {
      setMessage(formMessage, error instanceof Error ? error.message : "No fue posible guardar la inspección.", true);
    } finally {
      submit.disabled = false;
    }
  });

  recordsContainer.addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-delete-inspection]");
    if (!button) return;
    const inspection = inspections.find(({ id }) => id === button.dataset.deleteInspection);
    if (!inspection || !window.confirm(`¿Eliminar la inspección "${inspection.title}" de este dispositivo?`)) return;
    try {
      await deleteInspection(inspection.id);
      await refreshInspections();
      setMessage(formMessage, "Inspección eliminada.");
    } catch (error) {
      setMessage(formMessage, error instanceof Error ? error.message : "No fue posible eliminar la inspección.", true);
    }
  });

  await refreshInspections();
}

export { validateImportedInspection };
