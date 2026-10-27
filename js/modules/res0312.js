import { getCompanyProfile, saveCompanyProfile } from "../db.js";

const form = document.querySelector("#res0312-profile-form");
const result = document.querySelector("#res0312-profile-result");
const message = document.querySelector("#res0312-profile-message");

const groups = Object.freeze({
  1: { label: "Grupo 1", standards: 7, article: "Artículo 3", criterion: "Hasta 10 trabajadores y riesgo I, II o III." },
  2: { label: "Grupo 2", standards: 21, article: "Artículo 9", criterion: "De 11 a 50 trabajadores y riesgo I, II o III." },
  3: { label: "Grupo 3", standards: 60, article: "Artículo 16", criterion: "Más de 50 trabajadores o riesgo IV o V." }
});

function setMessage(text, isError = false) {
  message.textContent = text;
  message.classList.toggle("is-error", isError);
}

function node(tag, text, className) {
  const element = document.createElement(tag);
  element.textContent = text;
  if (className) element.className = className;
  return element;
}

export function validateImportedCompanyProfile(profile) {
  if (
    !profile
    || typeof profile !== "object"
    || profile.id !== "saena"
    || !Number.isInteger(profile.workers)
    || profile.workers < 1
    || !Number.isInteger(profile.riskClass)
    || profile.riskClass < 1
    || profile.riskClass > 5
    || typeof profile.savedAt !== "string"
    || Number.isNaN(Date.parse(profile.savedAt))
  ) {
    throw new TypeError("El backup contiene un perfil empresarial inválido para la autoevaluación.");
  }
  return {
    id: "saena",
    workers: profile.workers,
    riskClass: profile.riskClass,
    savedAt: profile.savedAt
  };
}

export function classifyRes0312Profile(profile) {
  const validProfile = validateImportedCompanyProfile(profile);
  if (validProfile.workers > 50 || validProfile.riskClass >= 4) {
    return { group: 3, details: groups[3], provisional: false };
  }
  const group = validProfile.workers <= 10 ? 1 : 2;
  return { group, details: groups[group], provisional: false };
}

function renderClassification(profile) {
  result.replaceChildren();
  const classification = classifyRes0312Profile(profile);
  const { details } = classification;
  result.append(
    node("span", `${details.label} · ${details.standards} estándares`, "profile-group"),
    node("h4", `${details.article} · Resolución 0312 de 2019`),
    node("p", details.criterion),
    node("p", "Clasificación preliminar: el cuestionario y la calificación continúan bloqueados hasta validar el catálogo oficial de este grupo.")
  );
}

function profileFromForm() {
  const workers = Number(form.elements.namedItem("workers").value);
  const riskClass = Number(form.elements.namedItem("riskClass").value);
  if (!Number.isInteger(workers) || workers < 1) {
    throw new TypeError("Ingresa un número entero de trabajadores mayor que cero.");
  }
  if (!Number.isInteger(riskClass) || riskClass < 1 || riskClass > 5) {
    throw new TypeError("Selecciona una clase de riesgo ARL válida entre I y V.");
  }
  return validateImportedCompanyProfile({
    id: "saena",
    workers,
    riskClass,
    savedAt: new Date().toISOString()
  });
}

function showProfile(profile) {
  form.elements.namedItem("workers").value = String(profile.workers);
  form.elements.namedItem("riskClass").value = String(profile.riskClass);
  renderClassification(profile);
}

export async function initRes0312() {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submit = form.querySelector('button[type="submit"]');
    submit.disabled = true;
    try {
      const profile = profileFromForm();
      await saveCompanyProfile(profile);
      showProfile(profile);
      setMessage("Perfil guardado en este dispositivo. El resultado solo identifica el grupo preliminar.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No fue posible guardar el perfil de la empresa.", true);
    } finally {
      submit.disabled = false;
    }
  });

  await refreshRes0312Profile();
}

export async function refreshRes0312Profile() {
  const profile = await getCompanyProfile();
  if (profile) {
    showProfile(validateImportedCompanyProfile(profile));
    return;
  }
  form.reset();
  result.replaceChildren(node("p", "Registra el perfil de la empresa para determinar el grupo.", "empty-state"));
}
