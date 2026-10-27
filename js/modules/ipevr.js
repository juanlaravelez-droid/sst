import { calculateRisk, ND_VALUES, NE_VALUES, NC_VALUES } from "../gtc45-engine.js";
import { deleteRecord, getAllRecords, saveRecord } from "../db.js";

const form = document.querySelector("#hazard-form");
const recordsBody = document.querySelector("#records-body");
const formMessage = document.querySelector("#form-message");
const editId = document.querySelector("#record-id");
const saveButton = document.querySelector("#save-button");
const cancelButton = document.querySelector("#cancel-edit");
const input = (name) => form.elements.namedItem(name);

let records = [];

function escapeText(value) {
  return typeof value === "string" ? value : "";
}

function calculateForm() {
  const result = calculateRisk(input("nd").value, input("ne").value, input("nc").value);
  document.querySelector("#np-result").textContent = `${result.np} · ${result.probabilityLevel}`;
  document.querySelector("#nr-result").textContent = String(result.nr);
  document.querySelector("#acceptability-label").textContent = `Nivel ${result.level} · ${result.acceptability}`;
  document.querySelector("#acceptability-result").dataset.level = result.level;
}

function setMessage(message, isError = false) {
  formMessage.textContent = message;
  formMessage.classList.toggle("is-error", isError);
}

function createCell(content, className) {
  const cell = document.createElement("td");
  if (className) cell.className = className;
  if (content instanceof Node) cell.append(content);
  else cell.textContent = content;
  return cell;
}

function createRecordRow(record) {
  const row = document.createElement("tr");
  const title = document.createElement("strong");
  title.textContent = escapeText(record.hazard);
  const date = document.createElement("span");
  date.className = "subtext";
  date.textContent = new Date(record.updatedAt || record.createdAt).toLocaleDateString("es-CO");
  const titleCell = createCell("");
  titleCell.append(title, date);
  row.append(titleCell);

  const category = document.createElement("span");
  category.textContent = escapeText(record.hazardType);
  const site = document.createElement("span");
  site.className = "subtext";
  site.textContent = escapeText(record.site || "Sin sede");
  const categoryCell = createCell("");
  categoryCell.append(category, site);
  row.append(categoryCell);
  row.append(createCell(`${record.nd} · ${record.ne} · ${record.nc}`));
  row.append(createCell(`${record.np} · ${record.probabilityLevel}`));

  const riskBadge = document.createElement("span");
  riskBadge.className = `level-badge level-${record.level}`;
  riskBadge.textContent = `NR ${record.nr} · Nivel ${record.level}`;
  row.append(createCell(riskBadge));

  const actions = document.createElement("div");
  actions.className = "row-actions";
  const edit = document.createElement("button");
  edit.type = "button";
  edit.dataset.action = "edit";
  edit.dataset.id = record.id;
  edit.textContent = "Editar";
  edit.setAttribute("aria-label", `Editar ${record.hazard}`);
  const remove = document.createElement("button");
  remove.type = "button";
  remove.dataset.action = "delete";
  remove.dataset.id = record.id;
  remove.textContent = "Eliminar";
  remove.setAttribute("aria-label", `Eliminar ${record.hazard}`);
  actions.append(edit, remove);
  row.append(createCell(actions));
  return row;
}

function renderRecords() {
  recordsBody.replaceChildren();
  document.querySelector("#record-count").textContent = String(records.length);
  if (records.length === 0) {
    const row = document.createElement("tr");
    const empty = document.createElement("td");
    empty.colSpan = 6;
    empty.className = "empty-state";
    empty.textContent = "Aún no hay peligros registrados.";
    row.append(empty);
    recordsBody.append(row);
  } else {
    [...records]
      .sort((a, b) => String(b.updatedAt || b.createdAt).localeCompare(String(a.updatedAt || a.createdAt)))
      .forEach((record) => recordsBody.append(createRecordRow(record)));
  }
  window.dispatchEvent(new CustomEvent("ipevr:records-changed", { detail: { records } }));
}

function resetForm() {
  form.reset();
  editId.value = "";
  saveButton.textContent = "Guardar peligro";
  cancelButton.hidden = true;
  calculateForm();
}

function recordFromForm() {
  const hazard = input("hazard").value.trim();
  if (!hazard) throw new TypeError("Escribe el peligro identificado.");
  const risk = calculateRisk(input("nd").value, input("ne").value, input("nc").value);
  const existing = records.find(({ id }) => id === editId.value);
  const now = new Date().toISOString();
  return {
    id: existing?.id ?? crypto.randomUUID(),
    hazard,
    hazardType: input("hazardType").value,
    site: input("site").value.trim(),
    activity: input("activity").value.trim(),
    nd: Number(input("nd").value),
    ne: Number(input("ne").value),
    nc: Number(input("nc").value),
    controls: input("controls").value.trim(),
    ...risk,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now
  };
}

async function loadRecords() {
  records = await getAllRecords();
  renderRecords();
}

export async function refreshIpevrRecords() {
  await loadRecords();
}

function startEditing(record) {
  editId.value = record.id;
  input("hazard").value = record.hazard;
  input("hazardType").value = record.hazardType;
  input("site").value = record.site;
  input("activity").value = record.activity;
  input("nd").value = String(record.nd);
  input("ne").value = String(record.ne);
  input("nc").value = String(record.nc);
  input("controls").value = record.controls;
  saveButton.textContent = "Actualizar peligro";
  cancelButton.hidden = false;
  calculateForm();
  form.scrollIntoView({ behavior: "smooth", block: "start" });
  input("hazard").focus();
}

function validateImportedRecord(record) {
  if (!record || typeof record !== "object" || typeof record.id !== "string" || !record.id || typeof record.hazard !== "string" || !record.hazard.trim()) {
    throw new TypeError("El backup contiene un registro sin identificador o sin descripción del peligro.");
  }
  if (![...ND_VALUES].includes(Number(record.nd)) || ![...NE_VALUES].includes(Number(record.ne)) || ![...NC_VALUES].includes(Number(record.nc))) {
    throw new TypeError(`El registro "${record.hazard}" contiene valores ND, NE o NC no válidos.`);
  }
  const risk = calculateRisk(record.nd, record.ne, record.nc);
  return {
    id: record.id,
    hazard: record.hazard.trim().slice(0, 160),
    hazardType: typeof record.hazardType === "string" ? record.hazardType.slice(0, 80) : "Sin clasificar",
    site: typeof record.site === "string" ? record.site.slice(0, 120) : "",
    activity: typeof record.activity === "string" ? record.activity.slice(0, 160) : "",
    controls: typeof record.controls === "string" ? record.controls.slice(0, 1000) : "",
    nd: Number(record.nd),
    ne: Number(record.ne),
    nc: Number(record.nc),
    ...risk,
    createdAt: typeof record.createdAt === "string" ? record.createdAt : new Date().toISOString(),
    updatedAt: typeof record.updatedAt === "string" ? record.updatedAt : new Date().toISOString()
  };
}

export async function initIpevr() {
  for (const selector of ["#nd", "#ne", "#nc"]) {
    document.querySelector(selector).addEventListener("change", calculateForm);
  }
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const record = recordFromForm();
      await saveRecord(record);
      await loadRecords();
      resetForm();
      setMessage("Peligro guardado en este dispositivo.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No fue posible guardar el peligro.", true);
    }
  });
  cancelButton.addEventListener("click", () => {
    resetForm();
    setMessage("");
  });
  recordsBody.addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const record = records.find(({ id }) => id === button.dataset.id);
    if (!record) return;
    if (button.dataset.action === "edit") {
      startEditing(record);
      return;
    }
    if (!window.confirm(`¿Eliminar el registro "${record.hazard}" de este dispositivo?`)) return;
    try {
      await deleteRecord(record.id);
      await loadRecords();
      setMessage("Registro eliminado.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No fue posible eliminar el registro.", true);
    }
  });
  calculateForm();
  await loadRecords();
}

export { validateImportedRecord };
