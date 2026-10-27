import {
  listHeightWorkPermits,
  removeHeightWorkPermit,
  saveHeightWorkPermit
} from "../application/heightWorkPermitService.js";
import {
  addCalendarDays,
  checklistItems,
  dailyRevalidationItems,
  getReadyState,
  getWeeklyDates,
  normalizeSelection,
  selectionOptions
} from "../domain/heightWorkPermit.js";
import { initCanvasSignature } from "../utils/canvasSignature.js";

const workerStatusOptions = [
  ["", "Selecciona un estado"],
  ["verified", "Verificado por responsable"],
  ["pending", "Pendiente de verificar"]
];
const checklistStatusOptions = [
  ["", "Selecciona un estado"],
  ["verified", "Verificado"],
  ["pending", "Pendiente"]
];
const selectionGroups = Object.freeze({
  fallPrevention: {
    container: "permit-fall-prevention-options",
    otherInput: "permit-fall-prevention-other",
    options: selectionOptions.fallPrevention
  },
  accessEquipment: {
    container: "permit-access-equipment-options",
    otherInput: "permit-access-equipment-other",
    options: selectionOptions.accessEquipment
  },
  fallSystem: {
    container: "permit-fall-system-options",
    otherInput: "permit-fall-system-other",
    options: selectionOptions.fallSystem
  },
  ppe: {
    container: "permit-ppe-options",
    otherInput: "permit-ppe-other",
    options: selectionOptions.ppe
  }
});

const form = document.querySelector("#permit-form");
const workersContainer = document.querySelector("#permit-workers");
const checklistContainer = document.querySelector("#permit-checklist");
const weeklyScheduleContainer = document.querySelector("#permit-weekly-schedule");
const recordsContainer = document.querySelector("#permit-records");
const printPreview = document.querySelector("#permit-print-preview");
const formMessage = document.querySelector("#permit-message");
const workerSignatureControllers = new WeakMap();
let permits = [];

function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function setMessage(message, isError = false) {
  formMessage.textContent = message;
  formMessage.classList.toggle("is-error", isError);
}

function createField(container, labelText, name, options = {}) {
  const wrapper = element("div");
  const id = `permit-worker-${crypto.randomUUID()}`;
  const label = element("label", labelText);
  label.htmlFor = id;
  let input;
  if (options.choices) {
    input = element("select");
    for (const [value, text] of options.choices) {
      const option = element("option", text);
      option.value = value;
      input.append(option);
    }
  } else {
    input = element("input");
    input.type = options.type ?? "text";
    if (options.maxLength) input.maxLength = options.maxLength;
    if (options.autocomplete) input.autocomplete = options.autocomplete;
  }
  input.id = id;
  input.name = name;
  input.required = true;
  if (options.value !== undefined) input.value = options.value;
  wrapper.append(label, input);
  container.append(wrapper);
  return input;
}

function addWorker(worker = {}) {
  const workers = workersContainer.querySelectorAll(".permit-worker");
  if (workers.length >= 50) {
    setMessage("Un permiso admite hasta 50 trabajadores en este formulario.", true);
    return;
  }
  const fieldset = element("fieldset", undefined, "permit-worker");
  const heading = element("div", undefined, "permit-worker-heading");
  const title = element("span", `Trabajador ${workers.length + 1}`);
  const remove = element("button", "Quitar", "button button-secondary button-small");
  remove.type = "button";
  remove.dataset.removePermitWorker = "";
  remove.setAttribute("aria-label", `Quitar trabajador ${workers.length + 1}`);
  heading.append(title, remove);
  fieldset.append(heading);

  const name = createField(fieldset, "Nombre y apellidos", "workerName", { maxLength: 160, autocomplete: "name", value: worker.name });
  name.classList.add("permit-worker-name");
  const documentRow = element("div", undefined, "field-row");
  createField(documentRow, "Clase de documento", "workerDocumentType", {
    choices: [["CC", "Cédula de ciudadanía"], ["CE", "Cédula de extranjería"], ["PP", "Pasaporte"], ["PEP", "Permiso especial de permanencia"], ["Otro", "Otro"]],
    value: worker.documentType ?? "CC"
  });
  createField(documentRow, "Número de documento", "workerDocumentNumber", { maxLength: 60, value: worker.documentNumber });
  fieldset.append(documentRow);

  const verificationRow = element("div", undefined, "field-row");
  createField(verificationRow, "Afiliación vigente a seguridad social", "workerSocialSecurity", {
    choices: workerStatusOptions,
    value: worker.socialSecurityStatus
  });
  createField(verificationRow, "Requisitos de aptitud verificados", "workerFitness", {
    choices: workerStatusOptions,
    value: worker.fitnessStatus
  });
  fieldset.append(verificationRow);

  const qualificationRow = element("div", undefined, "field-row");
  createField(qualificationRow, "Constancia / certificado de formación (referencia)", "workerTraining", { maxLength: 240, value: worker.trainingReference });
  createField(qualificationRow, "Verificación del punto de anclaje (referencia)", "workerAnchor", { maxLength: 240, value: worker.anchorReference });
  fieldset.append(qualificationRow);

  const signatureFieldset = element("fieldset", undefined, "permit-worker-signature");
  signatureFieldset.append(element("legend", "Firma del trabajador"));
  const signatureHint = element("p", "Firma aquí. Puede firmar con el dedo, el lápiz digital o el ratón.", "field-hint");
  const signatureCanvas = element("canvas", undefined, "signature-canvas");
  signatureCanvas.width = 960;
  signatureCanvas.height = 260;
  signatureCanvas.setAttribute("role", "img");
  signatureCanvas.setAttribute("aria-label", `Área de firma de ${worker.name || `trabajador ${workers.length + 1}`}`);
  const clearSignature = element("button", "Limpiar firma", "button button-secondary button-small");
  clearSignature.type = "button";
  signatureFieldset.append(signatureHint, signatureCanvas, clearSignature);
  fieldset.append(signatureFieldset);
  workersContainer.append(fieldset);
  const signatureController = initCanvasSignature(signatureCanvas, clearSignature);
  workerSignatureControllers.set(signatureCanvas, signatureController);
  if (worker.signatureDataUrl) {
    signatureController.restore(worker.signatureDataUrl).catch((error) => {
      setMessage(error instanceof Error ? error.message : "No fue posible restaurar una firma guardada.", true);
    });
  }
}

function renderChecklist(items = []) {
  checklistContainer.replaceChildren();
  for (const item of checklistItems) {
    const row = element("div", undefined, "permit-check-row");
    const id = `permit-check-${item.id}`;
    const label = element("label", item.label);
    label.htmlFor = id;
    const select = element("select");
    select.id = id;
    select.name = `check-${item.id}`;
    select.required = true;
    select.setAttribute("aria-label", `Verificación: ${item.label}`);
    for (const [value, text] of checklistStatusOptions) {
      const option = element("option", text);
      option.value = value;
      select.append(option);
    }
    select.value = items.find((entry) => entry.id === item.id)?.status ?? "";
    row.append(label, select);
    checklistContainer.append(row);
  }
}

function renderSelectionGroup(groupName, value = null) {
  const definition = selectionGroups[groupName];
  const container = document.getElementById(definition.container);
  const selection = normalizeSelection(groupName, value);
  container.replaceChildren();
  for (const [optionValue, labelText] of definition.options) {
    const row = element("label", undefined, "permit-option");
    const checkbox = element("input");
    checkbox.type = "checkbox";
    checkbox.name = groupName;
    checkbox.value = optionValue;
    checkbox.checked = selection.selected.includes(optionValue);
    row.append(checkbox, element("span", labelText));
    container.append(row);
  }
  const other = element("label", undefined, "permit-option");
  const otherCheckbox = element("input");
  otherCheckbox.type = "checkbox";
  otherCheckbox.name = groupName;
  otherCheckbox.value = "other";
  otherCheckbox.checked = selection.selected.includes("other");
  other.append(otherCheckbox, element("span", "Otro"));
  container.append(other);
  document.getElementById(definition.otherInput).value = selection.other;
  updateOtherRequirement(groupName);
}

function updateOtherRequirement(groupName) {
  const definition = selectionGroups[groupName];
  const otherSelected = [...form.querySelectorAll(`input[name="${groupName}"]`)]
    .some((checkbox) => checkbox.checked && checkbox.value === "other");
  const otherInput = document.getElementById(definition.otherInput);
  otherInput.required = otherSelected;
  otherInput.disabled = !otherSelected;
}

function readSelectionGroup(groupName, formData) {
  const definition = selectionGroups[groupName];
  const selected = formData.getAll(groupName).map(String);
  if (selected.length === 0) {
    throw new TypeError(`Selecciona al menos una opción en "${document.querySelector(`#${definition.container}`).closest("fieldset").querySelector("legend").textContent}".`);
  }
  const other = String(formData.get(`${groupName}Other`) ?? "").trim();
  if (selected.includes("other") && !other) {
    throw new TypeError("Especifica la opción marcada como “Otro”.");
  }
  return { selected, other };
}

function formatSelection(groupName, value) {
  const definition = selectionGroups[groupName];
  const selection = normalizeSelection(groupName, value);
  const labels = selection.selected.map((selected) => {
    if (selected === "other") return selection.other ? `Otro: ${selection.other}` : "Otro";
    return definition.options.find(([optionValue]) => optionValue === selected)?.[1] ?? selected;
  });
  return labels.length ? labels.join(", ") : "No registrado";
}

function localDateValue(date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

function formatWeekDay(value) {
  const date = new Date(`${value}T12:00:00`);
  return date.toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function renderWeeklySchedule(schedule = []) {
  const previous = new Map(schedule.map((day) => [day.date, day]));
  const startDate = document.querySelector("#permit-start-date").value;
  weeklyScheduleContainer.replaceChildren();
  if (!startDate) return;

  for (const date of getWeeklyDates(startDate)) {
    const saved = previous.get(date);
    const card = element("fieldset", undefined, "permit-day-card");
    const legend = element("legend", formatWeekDay(date));
    const row = element("label", undefined, "checkbox-label permit-day-off");
    const dayOff = element("input");
    dayOff.type = "checkbox";
    dayOff.checked = saved ? !saved.workPlanned : false;
    dayOff.dataset.dayOff = date;
    row.append(dayOff, document.createTextNode("No se programa trabajo este día"));
    card.append(legend, row);
    const checks = element("div", undefined, "permit-day-checks");
    for (const item of dailyRevalidationItems) {
      const checkRow = element("div", undefined, "permit-check-row");
      const id = `permit-daily-${date}-${item.id}`;
      const label = element("label", item.label);
      label.htmlFor = id;
      const select = element("select");
      select.id = id;
      select.dataset.dayDate = date;
      select.dataset.dailyCheck = item.id;
      select.setAttribute("aria-label", `${formatWeekDay(date)}: ${item.label}`);
      for (const [value, text] of checklistStatusOptions) {
        const option = element("option", text);
        option.value = value;
        select.append(option);
      }
      select.value = saved?.checks?.find((check) => check.id === item.id)?.status ?? "";
      select.disabled = dayOff.checked;
      checkRow.append(label, select);
      checks.append(checkRow);
    }
    card.append(checks);
    weeklyScheduleContainer.append(card);
  }
}

function updateWeeklyEndDate() {
  const startDate = document.querySelector("#permit-start-date").value;
  document.querySelector("#permit-end-date").value = startDate ? addCalendarDays(startDate, 6) : "";
  const schedule = readWeeklySchedule();
  renderWeeklySchedule(schedule);
}

function readWeeklySchedule() {
  return [...weeklyScheduleContainer.querySelectorAll(".permit-day-card")].map((card) => {
    const date = card.querySelector("[data-day-off]").dataset.dayOff;
    const workPlanned = !card.querySelector("[data-day-off]").checked;
    const checks = dailyRevalidationItems.map((item) => ({
      id: item.id,
      label: item.label,
      status: workPlanned
        ? card.querySelector(`[data-day-date="${date}"][data-daily-check="${item.id}"]`).value
        : "not-scheduled"
    }));
    return { date, workPlanned, checks };
  });
}

function legacyWeeklySchedule(startAt) {
  const firstDate = startAt.slice(0, 10);
  return getWeeklyDates(firstDate).map((date, index) => ({
    date,
    workPlanned: index === 0,
    checks: dailyRevalidationItems.map((item) => ({
      id: item.id,
      label: item.label,
      status: "pending"
    }))
  }));
}

function permitFromForm() {
  const data = new FormData(form);
  const startDate = String(data.get("startDate"));
  const endDate = String(data.get("endDate"));
  const startAt = `${startDate}T${String(data.get("startTime"))}`;
  const endAt = `${endDate}T${String(data.get("endTime"))}`;
  if (endDate !== addCalendarDays(startDate, 6)) {
    throw new TypeError("El permiso debe cubrir siete días calendario consecutivos.");
  }
  if (new Date(startAt).getTime() >= new Date(endAt).getTime()) {
    throw new TypeError("La fecha y hora de terminación deben ser posteriores al inicio.");
  }
  const workers = [...workersContainer.querySelectorAll(".permit-worker")].map((row) => ({
    name: row.querySelector('[name="workerName"]').value.trim(),
    documentType: row.querySelector('[name="workerDocumentType"]').value,
    documentNumber: row.querySelector('[name="workerDocumentNumber"]').value.trim(),
    socialSecurityStatus: row.querySelector('[name="workerSocialSecurity"]').value,
    fitnessStatus: row.querySelector('[name="workerFitness"]').value,
    trainingReference: row.querySelector('[name="workerTraining"]').value.trim(),
    anchorReference: row.querySelector('[name="workerAnchor"]').value.trim(),
    signatureDataUrl: (() => {
      const canvas = row.querySelector("canvas.signature-canvas");
      const signature = workerSignatureControllers.get(canvas);
      return signature?.hasInk() ? canvas.toDataURL("image/png") : null;
    })()
  }));
  if (workers.length === 0) throw new TypeError("Agrega al menos un trabajador al permiso.");

  const checklist = checklistItems.map((item) => ({
    id: item.id,
    label: item.label,
    status: data.get(`check-${item.id}`)
  }));
  const fallPrevention = readSelectionGroup("fallPrevention", data);
  const accessEquipment = readSelectionGroup("accessEquipment", data);
  const fallSystem = readSelectionGroup("fallSystem", data);
  const ppe = readSelectionGroup("ppe", data);
  const weeklySchedule = readWeeklySchedule();
  if (weeklySchedule.length !== 7) throw new TypeError("No fue posible preparar las siete jornadas del permiso.");
  const coordinatorIsAuthorizer = data.get("coordinatorIsAuthorizer") === "on";
  const helperAssigned = data.get("helperAssigned") === "on";
  const selections = { fallPrevention, accessEquipment, fallSystem, ppe };
  const record = {
    id: data.get("permitId") || crypto.randomUUID(),
    status: "draft",
    site: String(data.get("site")).trim(),
    workType: String(data.get("workType")).trim(),
    heightMeters: Number(data.get("heightMeters")),
    startAt,
    endAt,
    weeklySchedule,
    workers,
    taskDescription: String(data.get("taskDescription")).trim(),
    fallPrevention,
    accessEquipment,
    fallSystem,
    ppe,
    tools: String(data.get("tools")).trim(),
    checklist,
    authorizer: String(data.get("authorizer")).trim(),
    authorizerId: String(data.get("authorizerId")).trim(),
    emergencyLead: String(data.get("emergencyLead")).trim(),
    emergencyLeadId: String(data.get("emergencyLeadId")).trim(),
    coordinatorIsAuthorizer,
    coordinator: coordinatorIsAuthorizer ? "" : String(data.get("coordinator")).trim(),
    coordinatorId: coordinatorIsAuthorizer ? "" : String(data.get("coordinatorId")).trim(),
    helperAssigned,
    helperName: helperAssigned ? String(data.get("helperName")).trim() : "",
    helperId: helperAssigned ? String(data.get("helperId")).trim() : "",
    observations: String(data.get("observations")).trim(),
    createdAt: permits.find((permit) => permit.id === data.get("permitId"))?.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  if (!Number.isFinite(record.heightMeters) || record.heightMeters <= 0) {
    throw new TypeError("La altura aproximada debe ser un valor mayor que cero.");
  }
  record.reviewReady = getReadyState(workers, checklist, selections, weeklySchedule);
  return record;
}

function formatDateTime(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("es-CO");
}

function appendPrintField(parent, label, value) {
  const line = element("p");
  line.append(element("strong", `${label}: `), document.createTextNode(value || "No registrado"));
  parent.append(line);
}

function appendPrintSection(parent, title, entries) {
  parent.append(element("h3", title));
  const grid = element("div", undefined, "permit-print-grid");
  for (const [label, value] of entries) appendPrintField(grid, label, value);
  parent.append(grid);
}

function signatureLine(name, documentNumber, role) {
  const line = element("div", undefined, "permit-signature-line");
  line.append(element("span", `${name}${documentNumber ? ` · Documento ${documentNumber}` : ""} · ${role}`));
  return line;
}

function renderPrintPreview(permit) {
  printPreview.replaceChildren();
  printPreview.hidden = false;
  const header = element("header", undefined, "permit-print-header");
  const title = element("div");
  title.append(element("p", "SAENA · SG-SST", "eyebrow"), element("h2", "Permiso de trabajo en alturas"));
  const status = element("span", "BORRADOR · NO AUTORIZA EL INICIO", "permit-print-status");
  header.append(title, status);
  printPreview.append(header);
  const reviewReady = Array.isArray(permit.weeklySchedule) && permit.reviewReady;
  appendPrintField(printPreview, "Identificador", permit.id);
  appendPrintField(printPreview, "Estado de preparación", reviewReady ? "Verificaciones declaradas completas; pendiente de revisión y firma" : "Tiene verificaciones pendientes; no está listo para autorización");
  appendPrintSection(printPreview, "Datos del trabajo", [
    ["Lugar / proyecto", permit.site],
    ["Tipo de trabajo", permit.workType],
    ["Altura aproximada", `${permit.heightMeters} m`],
    ["Inicio previsto", formatDateTime(permit.startAt)],
    ["Terminación prevista", formatDateTime(permit.endAt)]
  ]);
  appendPrintSection(printPreview, "Descripción, procedimiento y controles", [
    ["Tarea / procedimiento", permit.taskDescription],
    ["Sistema de prevención contra caídas", formatSelection("fallPrevention", permit.fallPrevention)],
    ["Equipos y sistema de acceso", formatSelection("accessEquipment", permit.accessEquipment)],
    ["Restricción, posicionamiento o detención", formatSelection("fallSystem", permit.fallSystem)],
    ["Elementos de protección personal", formatSelection("ppe", permit.ppe)],
    ["Herramientas y materiales", permit.tools],
    ["Observaciones · riesgos eléctricos y ambientales", permit.observations]
  ]);

  printPreview.append(element("h3", "Revalidación previa por jornada (7 días)"));
  if (!Array.isArray(permit.weeklySchedule)) {
    printPreview.append(element("p", "Borrador anterior al formato semanal: no conserva agenda ni revalidaciones por jornada. Edítelo para establecer una vigencia semanal y completar sus verificaciones.", "permit-print-warning"));
  } else {
    const dailyTable = element("table", undefined, "permit-print-table");
    const dailyHeader = element("tr");
    for (const label of ["Fecha", "Jornada", "Verificaciones del día"]) dailyHeader.append(element("th", label));
    dailyTable.append(dailyHeader);
    for (const day of permit.weeklySchedule) {
      const row = element("tr");
      const dateCell = element("td", formatWeekDay(day.date));
      const workCell = element("td", day.workPlanned ? "Trabajo programado" : "No programado");
      const checksCell = element("td");
      checksCell.textContent = day.workPlanned
        ? day.checks.map((check) => `${check.label}: ${check.status === "verified" ? "Verificado" : "PENDIENTE"}`).join(" · ")
        : "No aplica; no hay trabajo programado.";
      row.append(dateCell, workCell, checksCell);
      dailyTable.append(row);
    }
    printPreview.append(dailyTable);
  }

  printPreview.append(element("h3", "Trabajadores, verificaciones y firmas"));
  const workerTable = element("table", undefined, "permit-print-table");
  const workerHead = element("thead");
  const workerHeaderRow = element("tr");
  for (const label of ["Nombre e identificación", "Seguridad social", "Aptitud", "Formación", "Anclaje por persona", "Firma"]) {
    workerHeaderRow.append(element("th", label));
  }
  workerHead.append(workerHeaderRow);
  workerTable.append(workerHead);
  const workerBody = element("tbody");
  for (const worker of permit.workers) {
    const row = element("tr");
    const values = [
      `${worker.name} · ${worker.documentType} ${worker.documentNumber}`,
      worker.socialSecurityStatus === "verified" ? "Verificado por responsable" : "PENDIENTE",
      worker.fitnessStatus === "verified" ? "Verificado por responsable" : "PENDIENTE",
      worker.trainingReference,
      worker.anchorReference
    ];
    for (const value of values) row.append(element("td", value));
    const signatureCell = element("td");
    if (worker.signatureDataUrl) {
      const signatureImage = element("img", undefined, "permit-worker-signature-image");
      signatureImage.src = worker.signatureDataUrl;
      signatureImage.alt = `Firma de ${worker.name}`;
      signatureCell.append(signatureImage);
    } else {
      signatureCell.append(element("div", undefined, "permit-worker-signature-line"));
    }
    row.append(signatureCell);
    workerBody.append(row);
  }
  workerTable.append(workerBody);
  printPreview.append(workerTable);

  printPreview.append(element("h3", "Lista de chequeo previa"));
  const checklistTable = element("table", undefined, "permit-print-table");
  for (const [heading, value] of [["Verificación", "Estado"], ...permit.checklist.map((item) => [item.label, item.status === "verified" ? "Verificado" : "PENDIENTE"])]) {
    const row = element("tr");
    row.append(element(heading === "Verificación" ? "th" : "td", heading), element(heading === "Verificación" ? "th" : "td", value));
    checklistTable.append(row);
  }
  printPreview.append(checklistTable);
  appendPrintSection(printPreview, "Responsables", [
    ["Persona que autoriza", `${permit.authorizer} · Documento ${permit.authorizerId}`],
    ["Responsable de activar emergencias", `${permit.emergencyLead} · Documento ${permit.emergencyLeadId}`],
    ["Coordinador de trabajo en alturas", permit.coordinatorIsAuthorizer ? "La misma persona que autoriza" : `${permit.coordinator} · Documento ${permit.coordinatorId}`],
    ["Ayudante de seguridad", permit.helperAssigned ? `${permit.helperName} · Documento ${permit.helperId}` : "No designado en este formato"]
  ]);
  const signatures = element("div", undefined, "permit-signatures");
  signatures.append(
    signatureLine(permit.authorizer, permit.authorizerId, "Persona que autoriza"),
    signatureLine(permit.emergencyLead, permit.emergencyLeadId, "Responsable de activar emergencias")
  );
  if (!permit.coordinatorIsAuthorizer) signatures.append(signatureLine(permit.coordinator, permit.coordinatorId, "Coordinador de trabajo en alturas"));
  printPreview.append(signatures);
  printPreview.append(element(
    "p",
    "BORRADOR DE APOYO: debe revisarse, completarse con las firmas y autorizaciones requeridas y tramitarse bajo el procedimiento de SAENA antes de iniciar. Los estados registrados son declaraciones y no validaciones automáticas. Revalidar, suspender, cancelar o cerrar según las condiciones reales y el procedimiento aplicable.",
    "permit-print-warning"
  ));
  const printButton = element("button", "Imprimir / guardar PDF", "button button-primary");
  printButton.type = "button";
  printButton.addEventListener("click", () => window.print());
  printPreview.prepend(printButton);
}

function renderPermit(permit) {
  const article = element("article", undefined, "inspection-card");
  const header = element("div", undefined, "inspection-card-header");
  const heading = element("div");
  const startDate = permit.startAt.slice(0, 10);
  const endDate = permit.endAt.slice(0, 10);
  heading.append(element("h4", permit.workType), element("p", `${permit.site} · ${formatWeekDay(startDate)} a ${formatWeekDay(endDate)}`));
  const remove = element("button", "Eliminar", "button button-secondary button-small");
  remove.type = "button";
  remove.dataset.deletePermit = permit.id;
  remove.setAttribute("aria-label", `Eliminar borrador del permiso para ${permit.site}`);
  header.append(heading, remove);
  article.append(header);
  const reviewReady = Array.isArray(permit.weeklySchedule) && permit.reviewReady;
  const statusText = Array.isArray(permit.weeklySchedule)
    ? reviewReady ? "Borrador · verificaciones semanales declaradas completas" : "Borrador · revalidación diaria pendiente"
    : "Borrador anterior · agenda semanal pendiente";
  article.append(element("span", statusText, `permit-card-status${reviewReady ? " is-ready" : ""}`));
  const actions = element("div", undefined, "form-actions");
  const edit = element("button", "Editar borrador", "button button-secondary button-small");
  edit.type = "button";
  edit.dataset.editPermit = permit.id;
  const print = element("button", "Ver / imprimir", "button button-primary button-small");
  print.type = "button";
  print.dataset.printPermit = permit.id;
  actions.append(edit, print);
  article.append(actions);
  return article;
}

function renderPermits() {
  recordsContainer.replaceChildren();
  document.querySelector("#permit-count").textContent = String(permits.length);
  if (permits.length === 0) {
    recordsContainer.append(element("p", "Aún no hay borradores de permisos.", "empty-state"));
    printPreview.replaceChildren();
    printPreview.hidden = true;
    return;
  }
  [...permits]
    .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))
    .forEach((permit) => recordsContainer.append(renderPermit(permit)));
}

async function refreshWorkPermits() {
  permits = await listHeightWorkPermits();
  renderPermits();
}

function populateForm(permit) {
  for (const [name, value] of Object.entries(permit)) {
    const control = form.elements.namedItem(name);
    if (control instanceof HTMLInputElement && control.type === "checkbox") control.checked = value;
    else if (control && (typeof value === "string" || typeof value === "number")) control.value = String(value);
  }
  form.elements.namedItem("permitId").value = permit.id;
  document.querySelector("#permit-start-date").value = permit.startAt.slice(0, 10);
  document.querySelector("#permit-start-time").value = permit.startAt.slice(11, 16);
  document.querySelector("#permit-end-time").value = permit.endAt.slice(11, 16);
  document.querySelector("#permit-end-date").value = addCalendarDays(permit.startAt.slice(0, 10), 6);
  workersContainer.replaceChildren();
  permit.workers.forEach(addWorker);
  for (const groupName of Object.keys(selectionGroups)) {
    renderSelectionGroup(groupName, permit[groupName]);
  }
  if (!Array.isArray(permit.weeklySchedule)) {
    setMessage("Este borrador anterior no tenía agenda semanal. Al guardarlo se actualizará a siete días consecutivos con su lista diaria de revalidación.");
  }
  renderWeeklySchedule(permit.weeklySchedule ?? legacyWeeklySchedule(permit.startAt));
  renderChecklist(permit.checklist);
  updateConditionalFields();
  document.querySelector("#permit-form-heading").textContent = "Editar borrador";
  document.querySelector("#save-permit").textContent = "Guardar cambios";
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function updateConditionalFields() {
  const coordinatorSame = form.elements.namedItem("coordinatorIsAuthorizer").checked;
  const coordinatorFields = document.querySelector("#permit-coordinator-fields");
  coordinatorFields.hidden = coordinatorSame;
  form.elements.namedItem("coordinator").required = !coordinatorSame;
  form.elements.namedItem("coordinatorId").required = !coordinatorSame;
  const helperAssigned = form.elements.namedItem("helperAssigned").checked;
  const helperFields = document.querySelector("#permit-helper-fields");
  helperFields.hidden = !helperAssigned;
  form.elements.namedItem("helperName").required = helperAssigned;
  form.elements.namedItem("helperId").required = helperAssigned;
}

function resetForm() {
  form.reset();
  form.elements.namedItem("permitId").value = "";
  workersContainer.replaceChildren();
  addWorker();
  renderChecklist();
  for (const groupName of Object.keys(selectionGroups)) updateOtherRequirement(groupName);
  const now = new Date();
  const startTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  document.querySelector("#permit-start-date").value = localDateValue(now);
  document.querySelector("#permit-start-time").value = startTime;
  document.querySelector("#permit-end-time").value = "23:59";
  document.querySelector("#permit-end-date").value = addCalendarDays(localDateValue(now), 6);
  renderWeeklySchedule();
  document.querySelector("#permit-form-heading").textContent = "Datos del trabajo";
  document.querySelector("#save-permit").textContent = "Guardar borrador";
  updateConditionalFields();
}

async function initHeightWorkPermits() {
  for (const groupName of Object.keys(selectionGroups)) {
    renderSelectionGroup(groupName);
    document.getElementById(selectionGroups[groupName].container).addEventListener("change", () => updateOtherRequirement(groupName));
    document.getElementById(selectionGroups[groupName].otherInput).addEventListener("input", () => updateOtherRequirement(groupName));
  }
  renderChecklist();
  addWorker();
  document.querySelector("#permit-start-date").addEventListener("change", updateWeeklyEndDate);
  weeklyScheduleContainer.addEventListener("change", (event) => {
    const dayOff = event.target.closest("[data-day-off]");
    if (!dayOff) return;
    const card = dayOff.closest(".permit-day-card");
    card.querySelectorAll("[data-daily-check]").forEach((select) => {
      select.disabled = dayOff.checked;
    });
  });
  const now = new Date();
  const startTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  document.querySelector("#permit-start-date").value = localDateValue(now);
  document.querySelector("#permit-start-time").value = startTime;
  document.querySelector("#permit-end-date").value = addCalendarDays(localDateValue(now), 6);
  document.querySelector("#permit-end-time").value = "23:59";
  renderWeeklySchedule();
  updateConditionalFields();
  document.querySelector("#add-permit-worker").addEventListener("click", () => addWorker());
  workersContainer.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-remove-permit-worker]");
    if (!button) return;
    if (workersContainer.querySelectorAll(".permit-worker").length <= 1) {
      setMessage("El permiso debe conservar al menos un trabajador.", true);
      return;
    }
    button.closest(".permit-worker").remove();
    workersContainer.querySelectorAll(".permit-worker-heading span").forEach((title, index) => {
      title.textContent = `Trabajador ${index + 1}`;
    });
  });
  form.elements.namedItem("coordinatorIsAuthorizer").addEventListener("change", updateConditionalFields);
  form.elements.namedItem("helperAssigned").addEventListener("change", updateConditionalFields);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submit = document.querySelector("#save-permit");
    submit.disabled = true;
    setMessage("Guardando borrador…");
    try {
      const permit = permitFromForm();
      await saveHeightWorkPermit(permit);
      await refreshWorkPermits();
      renderPrintPreview(permit);
      resetForm();
      setMessage("Borrador guardado en este dispositivo. Aún requiere revisión, firmas y autorización según el procedimiento de SAENA.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No fue posible guardar el borrador.", true);
    } finally {
      submit.disabled = false;
    }
  });

  recordsContainer.addEventListener("click", async (event) => {
    const target = event.target.closest("button");
    if (!target) return;
    const permit = permits.find(({ id }) => id === target.dataset.deletePermit
      || id === target.dataset.editPermit
      || id === target.dataset.printPermit);
    if (!permit) return;
    if (target.dataset.deletePermit) {
      if (!window.confirm(`¿Eliminar el borrador del permiso para "${permit.site}" de este dispositivo?`)) return;
      try {
        await removeHeightWorkPermit(permit.id);
        await refreshWorkPermits();
        setMessage("Borrador eliminado.");
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "No fue posible eliminar el borrador.", true);
      }
    } else if (target.dataset.editPermit) {
      populateForm(permit);
    } else if (target.dataset.printPermit) {
      renderPrintPreview(permit);
      printPreview.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
  await refreshWorkPermits();
  resetForm();
}

export { initHeightWorkPermits, refreshWorkPermits };
