export const checklistItems = Object.freeze([
  { id: "procedure", label: "Procedimiento seguro aprobado, vigente y divulgado; ARO/ATS disponible." },
  { id: "site", label: "Área delimitada y acceso previsto; cubierta, estructura y superficie evaluadas." },
  { id: "environment", label: "Clima y condiciones ambientales revisados para la tarea y su duración." },
  { id: "equipment", label: "Sistemas de acceso y equipos contra caídas inspeccionados y compatibles." },
  { id: "anchors", label: "Puntos de anclaje verificados para cada trabajador y la configuración prevista." },
  { id: "electrical", label: "Riesgos eléctricos fotovoltaicos, equipos/líneas energizados, distancias y controles definidos en el procedimiento eléctrico aplicable." },
  { id: "ppe", label: "EPP, herramientas y materiales seleccionados e inspeccionados para los riesgos de la tarea." },
  { id: "rescue", label: "Plan y medios de rescate/emergencia disponibles; responsable de activación informado." },
  { id: "communications", label: "Medios de comunicación y coordinación de la cuadrilla comprobados." },
  { id: "briefing", label: "Trabajadores informados sobre la tarea, controles, cambios y criterios de suspensión." }
]);

export const dailyRevalidationItems = Object.freeze([
  { id: "weather", label: "Clima y condiciones ambientales de la jornada aptos para ejecutar la tarea." },
  { id: "team", label: "Trabajadores, afiliación, aptitud y competencias corresponden a lo previsto." },
  { id: "access", label: "Área, cubierta, accesos, equipos y sistemas de protección inspeccionados." },
  { id: "anchors", label: "Anclajes y compatibilidad del sistema verificados para esta jornada." },
  { id: "electrical", label: "Riesgos eléctricos, aislamientos/distancias y controles fotovoltaicos verificados." },
  { id: "rescue", label: "Comunicaciones, responsable y medios de emergencia/rescate disponibles." }
]);

export const selectionOptions = Object.freeze({
  fallPrevention: Object.freeze([
    ["collective-protection", "Barandas u otra protección colectiva"],
    ["access-control", "Control de acceso a la zona de trabajo"],
    ["demarcation", "Delimitación y señalización"],
    ["movement-restraint", "Sistema de restricción de desplazamiento"],
    ["safety-helper", "Ayudante de seguridad designado"],
    ["safety-net", "Red de seguridad"]
  ]),
  accessEquipment: Object.freeze([
    ["fixed-ladder", "Escalera fija"],
    ["portable-ladder", "Escalera portátil (incluida dieléctrica, si aplica)"],
    ["scaffold", "Andamio"],
    ["work-platform", "Plataforma elevadora de trabajo"],
    ["walkway", "Pasarela o camino de acceso"],
    ["roof-ladder", "Escalera para cubierta"],
    ["other-access", "Otro equipo de acceso"]
  ]),
  fallSystem: Object.freeze([
    ["restraint", "Sistema de restricción"],
    ["positioning", "Sistema de posicionamiento"],
    ["fall-arrest", "Sistema de detención de caídas"],
    ["horizontal-lifeline", "Línea de vida horizontal"],
    ["vertical-lifeline", "Línea de vida vertical"],
    ["anchorage", "Anclaje o dispositivo de anclaje"],
    ["connectors", "Conectores y elementos de amarre"]
  ]),
  ppe: Object.freeze([
    ["full-body-harness", "Arnés de cuerpo completo"],
    ["chinstrap-helmet", "Casco con barbuquejo"],
    ["safety-footwear", "Calzado de seguridad"],
    ["gloves", "Guantes definidos para la tarea"],
    ["eye-protection", "Protección visual"],
    ["protective-clothing", "Ropa de protección"],
    ["electrical-protection", "EPP para riesgo eléctrico, si aplica"]
  ])
});

export function addCalendarDays(value, days) {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function getWeeklyDates(startDate) {
  return Array.from({ length: 7 }, (_, index) => addCalendarDays(startDate, index));
}

export function normalizeSelection(groupName, value) {
  const options = selectionOptions[groupName];
  if (!options) throw new TypeError(`El grupo de selección "${groupName}" no es válido.`);
  if (typeof value === "string") {
    return { selected: value.trim() ? ["other"] : [], other: value.trim().slice(0, 1000) };
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { selected: [], other: "" };
  }
  const validValues = new Set([...options.map(([optionValue]) => optionValue), "other"]);
  const selected = Array.isArray(value.selected)
    ? [...new Set(value.selected.filter((entry) => validValues.has(entry)))]
    : [];
  return {
    selected,
    other: typeof value.other === "string" ? value.other.trim().slice(0, 1000) : ""
  };
}

function validateSelection(groupName, value, permitId) {
  const options = selectionOptions[groupName];
  if (!options) throw new TypeError(`El permiso "${permitId}" contiene un grupo inválido: ${groupName}.`);
  if (typeof value === "string") {
    const other = value.trim().slice(0, 1000);
    if (!other) throw new TypeError(`El permiso "${permitId}" no contiene opciones válidas para ${groupName}.`);
    return { selected: ["other"], other };
  }
  const allowed = new Set([...options.map(([optionValue]) => optionValue), "other"]);
  if (!value || typeof value !== "object" || Array.isArray(value)
      || !Array.isArray(value.selected)
      || value.selected.length === 0
      || value.selected.some((entry) => typeof entry !== "string" || !allowed.has(entry))
      || new Set(value.selected).size !== value.selected.length
      || (typeof value.other !== "string" && value.other !== undefined)) {
    throw new TypeError(`El permiso "${permitId}" contiene opciones inválidas en ${groupName}.`);
  }
  const selection = {
    selected: value.selected,
    other: typeof value.other === "string" ? value.other.trim().slice(0, 1000) : ""
  };
  if (selection.selected.includes("other") && !selection.other) {
    throw new TypeError(`El permiso "${permitId}" debe especificar la opción “Otro” en ${groupName}.`);
  }
  return selection;
}

function validateWeeklySchedule(value, permitId, startAt, endAt) {
  if (value === undefined || value === null) return null;
  const expectedDates = getWeeklyDates(startAt.slice(0, 10));
  if (!Array.isArray(value) || value.length !== 7
      || value.some((day, index) => day?.date !== expectedDates[index])) {
    throw new TypeError(`El permiso "${permitId}" debe tener una programación de siete días consecutivos.`);
  }
  if (endAt.slice(0, 10) !== expectedDates[6]) {
    throw new TypeError(`El permiso "${permitId}" no termina en el séptimo día de vigencia.`);
  }
  return value.map((day) => {
    if (typeof day.workPlanned !== "boolean" || !Array.isArray(day.checks) || day.checks.length !== dailyRevalidationItems.length) {
      throw new TypeError(`El permiso "${permitId}" contiene una jornada semanal inválida.`);
    }
    const checks = dailyRevalidationItems.map((expected) => {
      const check = day.checks.find((item) => item?.id === expected.id);
      const allowedStatuses = day.workPlanned ? ["verified", "pending", ""] : ["not-scheduled", "verified", "pending", ""];
      if (!check || !allowedStatuses.includes(check.status)) {
        throw new TypeError(`El permiso "${permitId}" contiene una revalidación diaria inválida.`);
      }
      return {
        id: expected.id,
        label: expected.label,
        status: day.workPlanned ? check.status : "not-scheduled"
      };
    });
    return { date: day.date, workPlanned: day.workPlanned, checks };
  });
}

export function getReadyState(workers, checklist, selections, weeklySchedule) {
  return Array.isArray(weeklySchedule)
    && workers.length > 0
    && workers.every((worker) => worker.socialSecurityStatus === "verified"
      && worker.fitnessStatus === "verified"
      && worker.trainingReference.trim()
      && worker.anchorReference.trim()
      && worker.signatureDataUrl)
    && checklist.length === checklistItems.length
    && checklist.every((item) => item.status === "verified")
    && weeklySchedule.some((day) => day.workPlanned)
    && weeklySchedule.filter((day) => day.workPlanned)
      .every((day) => day.checks.length === dailyRevalidationItems.length
        && day.checks.every((check) => check.status === "verified"))
    && Object.keys(selectionOptions).every((groupName) => {
      const selection = selections[groupName];
      return selection && selection.selected.length > 0
        && (!selection.selected.includes("other") || Boolean(selection.other));
    });
}

export function validateImportedPermit(record) {
  if (!record || typeof record !== "object" || typeof record.id !== "string" || !record.id.trim() || record.status !== "draft") {
    throw new TypeError("El backup contiene un permiso sin identificador válido o con un estado no admitido.");
  }
  const requiredText = ["site", "workType", "taskDescription", "tools", "authorizer", "authorizerId", "emergencyLead", "emergencyLeadId"];
  for (const key of requiredText) {
    if (typeof record[key] !== "string" || !record[key].trim()) {
      throw new TypeError(`El permiso "${record.id}" tiene incompleto el campo ${key}.`);
    }
  }
  if (!Number.isFinite(record.heightMeters) || record.heightMeters <= 0
      || typeof record.startAt !== "string" || Number.isNaN(new Date(record.startAt).getTime())
      || typeof record.endAt !== "string" || Number.isNaN(new Date(record.endAt).getTime())
      || new Date(record.startAt).getTime() >= new Date(record.endAt).getTime()) {
    throw new TypeError(`El permiso "${record.id}" tiene una altura o vigencia inválida.`);
  }
  if (!Array.isArray(record.workers) || record.workers.length === 0 || record.workers.length > 50) {
    throw new TypeError(`El permiso "${record.id}" debe incluir entre 1 y 50 trabajadores.`);
  }
  const workers = record.workers.map((worker) => {
    if (!worker || typeof worker.name !== "string" || !worker.name.trim()
        || !["CC", "CE", "PP", "PEP", "Otro"].includes(worker.documentType)
        || typeof worker.documentNumber !== "string" || !worker.documentNumber.trim()
        || !["verified", "pending"].includes(worker.socialSecurityStatus)
        || !["verified", "pending"].includes(worker.fitnessStatus)
        || typeof worker.trainingReference !== "string" || !worker.trainingReference.trim()
        || typeof worker.anchorReference !== "string" || !worker.anchorReference.trim()) {
      throw new TypeError(`El permiso "${record.id}" contiene datos incompletos de un trabajador.`);
    }
    const signatureDataUrl = worker.signatureDataUrl ?? null;
    if (signatureDataUrl !== null
        && (typeof signatureDataUrl !== "string"
          || signatureDataUrl.length > 1_000_000
          || !/^data:image\/png;base64,[A-Za-z\d+/]+={0,2}$/i.test(signatureDataUrl))) {
      throw new TypeError(`El permiso "${record.id}" contiene una firma de trabajador inválida o demasiado grande.`);
    }
    return {
      name: worker.name.trim().slice(0, 160),
      documentType: worker.documentType,
      documentNumber: worker.documentNumber.trim().slice(0, 60),
      socialSecurityStatus: worker.socialSecurityStatus,
      fitnessStatus: worker.fitnessStatus,
      trainingReference: worker.trainingReference.trim().slice(0, 240),
      anchorReference: worker.anchorReference.trim().slice(0, 240),
      signatureDataUrl
    };
  });
  if (!Array.isArray(record.checklist) || record.checklist.length !== checklistItems.length) {
    throw new TypeError(`El permiso "${record.id}" no contiene la lista de chequeo requerida.`);
  }
  const checklist = checklistItems.map((expected) => {
    const item = record.checklist.find((entry) => entry?.id === expected.id);
    if (!item || !["verified", "pending"].includes(item.status)) {
      throw new TypeError(`El permiso "${record.id}" contiene una verificación inválida.`);
    }
    return { id: expected.id, label: expected.label, status: item.status };
  });
  const selections = Object.fromEntries(Object.keys(selectionOptions).map((groupName) => [
    groupName,
    validateSelection(groupName, record[groupName], record.id)
  ]));
  const weeklySchedule = validateWeeklySchedule(record.weeklySchedule, record.id, record.startAt, record.endAt);
  const coordinatorIsAuthorizer = record.coordinatorIsAuthorizer === true;
  const helperAssigned = record.helperAssigned === true;
  const coordinator = typeof record.coordinator === "string" ? record.coordinator.trim() : "";
  const coordinatorId = typeof record.coordinatorId === "string" ? record.coordinatorId.trim() : "";
  const helperName = typeof record.helperName === "string" ? record.helperName.trim() : "";
  const helperId = typeof record.helperId === "string" ? record.helperId.trim() : "";
  if ((!coordinatorIsAuthorizer && (!coordinator || !coordinatorId)) || (helperAssigned && (!helperName || !helperId))) {
    throw new TypeError(`El permiso "${record.id}" tiene datos incompletos de responsables designados.`);
  }
  const createdAt = typeof record.createdAt === "string" && !Number.isNaN(Date.parse(record.createdAt))
    ? record.createdAt
    : new Date().toISOString();
  const permit = {
    id: record.id.trim().slice(0, 100),
    status: "draft",
    site: record.site.trim().slice(0, 160),
    workType: record.workType.trim().slice(0, 160),
    heightMeters: record.heightMeters,
    startAt: record.startAt,
    endAt: record.endAt,
    weeklySchedule,
    workers,
    taskDescription: record.taskDescription.trim().slice(0, 2000),
    ...selections,
    tools: record.tools.trim().slice(0, 1000),
    checklist,
    authorizer: record.authorizer.trim().slice(0, 160),
    authorizerId: record.authorizerId.trim().slice(0, 60),
    emergencyLead: record.emergencyLead.trim().slice(0, 160),
    emergencyLeadId: record.emergencyLeadId.trim().slice(0, 60),
    coordinatorIsAuthorizer,
    coordinator: coordinator.slice(0, 160),
    coordinatorId: coordinatorId.slice(0, 60),
    helperAssigned,
    helperName: helperName.slice(0, 160),
    helperId: helperId.slice(0, 60),
    observations: typeof record.observations === "string" ? record.observations.slice(0, 2000) : "",
    createdAt,
    updatedAt: typeof record.updatedAt === "string" && !Number.isNaN(Date.parse(record.updatedAt)) ? record.updatedAt : createdAt
  };
  permit.reviewReady = getReadyState(workers, checklist, selections, weeklySchedule);
  return permit;
}
