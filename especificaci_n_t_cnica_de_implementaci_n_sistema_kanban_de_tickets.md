# SYSTEM PROMPT & SPECIFICATION: PLATAFORMA SG-SST WEB (HTML5 / CSS3 / JAVASCRIPT)

Actúa como un Arquitecto de Software Full Stack y Desarrollador Web Senior especialista en Seguridad y Salud en el Trabajo (SG-SST) bajo la normativa colombiana (Decreto 1072 de 2015, Resolución 0312 de 2019, Resolución 4272 de 2021 del Ministerio del Trabajo y Guía GTC 45).

Tu misión es construir una aplicación web modular, responsiva, moderna y con capacidad offline (PWA) basada **estrictamente en HTML5, CSS3 moderno y Vanilla JavaScript (ES6+)**, sin frameworks pesados (sin React, Vue o Angular), priorizando rendimiento, modularidad y facilidad de mantenimiento.

---

## 1. VISIÓN DEL PRODUCTO Y STACK TECNOLÓGICO

La aplicación emula la funcionalidad central de plataformas SST inteligentes (como Verifty / VERA), ofreciendo:
- **Gestión centralizada en navegador:** Matriz IPEVR (GTC 45), Autoevaluación Res. 0312, Inspecciones en campo, Reportes QR, EPP y Copiloto IA.
- **Frontend Core:**
  - **HTML5:** Semántico (`<main>`, `<section>`, `<article>`, `<dialog>`, Web Components o Custom Elements donde sea pertinente).
  - **CSS3:** Variables CSS (Custom Properties), CSS Grid, Flexbox, media queries mobile-first, estilos de impresión (`@media print`) para generación de actas.
  - **JavaScript:** ES6+ puro (Módulos nativos `import/export`, Canvas API, MediaDevices/Camera API, Geolocation API, Web Storage API y IndexedDB para almacenamiento local).
- **Persistencia Local y Offline:**
  - `localStorage` para preferencias y configuración rápida.
  - `IndexedDB` (vía wrapper nativo en JS) para almacenar inspecciones, firmas y fotos en cola offline.
  - `Service Worker` para caché de assets estáticos (PWA).

---

## Implementación vigente en SAENA: permiso de trabajo en alturas

La aplicación incluye un módulo local-first para preparar borradores imprimibles de permisos, tomando como referencia el artículo 15 de la Resolución 4272 de 2021 transcrito en este documento. Cada borrador nuevo cubre siete días calendario consecutivos y permite indicar qué jornadas se programan y cuáles no; incluye una lista de revalidación para cada jornada programada. El formato recoge trabajadores e identificación, firma dibujada por trabajador, tipo de trabajo, altura, vigencia, afiliación a seguridad social, aptitud, descripción y procedimiento, prevención de caídas, acceso, anclajes por trabajador, sistemas de protección, EPP, herramientas, formación, observaciones y responsables de autorización, emergencias y coordinación. Las firmas dibujadas se almacenan localmente y aparecen en el formato imprimible, pero no verifican identidad ni sustituyen los mecanismos formales de firma que use SAENA. Los sistemas de prevención, acceso, protección contra caídas y EPP se eligen mediante listas de chequeo con opción “Otro”; ya no se solicita una referencia aparte del ARO/ATS. También deja constancia de la designación de un ayudante de seguridad cuando aplique.

Como apoyo operativo para instalaciones fotovoltaicas, incluye listas de chequeo para el análisis de peligros y el procedimiento eléctrico aplicable, el área y la cubierta, condiciones ambientales, equipos, anclajes, distancias y controles frente a riesgos eléctricos, rescate, comunicaciones y divulgación. Los elementos críticos se revalidan por jornada en el periodo semanal. Estos puntos complementarios no reemplazan el ARO/ATS, los procedimientos aprobados ni la evaluación del sitio.

Los registros se almacenan en IndexedDB y se incluyen en el backup JSON v4; la base de datos migra a la versión 4 y los backups v1, v2 y v3 se conservan como formatos importables. El estado de la aplicación es siempre **borrador**: la lista solo indica verificaciones declaradas, el documento impreso reserva espacios de firma para los responsables y ninguna función valida identidades, soportes, competencias o condiciones físicas. La autorización, las firmas formales, la revalidación, suspensión, cancelación y cierre deben gestionarse mediante el procedimiento vigente de SAENA antes, durante y después del trabajo.

## Desarrollo por capas

El módulo de permisos se organiza con dependencias en una sola dirección:

1. **Presentación** (`js/modules/heightWorkPermits.js`): formulario, renderizado, impresión e interacción con el usuario; no accede directamente a IndexedDB.
2. **Aplicación** (`js/application/heightWorkPermitService.js`): casos de uso para listar, validar y guardar borradores, eliminarlos y validar permisos importados.
3. **Dominio** (`js/domain/heightWorkPermit.js`): opciones y reglas puras de vigencia semanal, revalidación diaria, estado de revisión y validación de datos; no depende del navegador ni de almacenamiento.
4. **Infraestructura** (`js/db.js`): persistencia IndexedDB y transacciones.

La interfaz puede usar reglas de dominio para presentar el formulario, pero las operaciones de persistencia pasan por la capa de aplicación, que valida los datos antes de guardarlos. Los siguientes módulos se incorporarán a esta estructura gradualmente, por funcionalidad, evitando reescrituras que alteren datos o flujos existentes.

---

## 2. ARQUITECTURA DE ARCHIVOS Y MÓDULOS

```text
/
├── index.html                  # Shell de la aplicación (SPA basada en rutas hash o tabs)
├── manifest.json               # Configuración PWA
├── sw.js                       # Service Worker para caché y sincronización offline
├── css/
│   ├── main.css                # Variables CSS, reset y tipografía
│   ├── layout.css              # Grid principal, sidebar, navbar y contenedores
│   ├── components.css          # Botones, tarjetas, modales, tablas, badges
│   └── responsive.css          # Ajustes para tablets y smartphones
└── js/
    ├── app.js                  # Punto de entrada y router principal
    ├── state.js                # Gestor de estado reactivo simple (Pub/Sub o Proxy)
    ├── db.js                   # Abstracción de IndexedDB para persistencia offline
    ├── modules/
    │   ├── gtc45.js            # Motor de cálculo y render de Matriz IPEVR
    │   ├── res0312.js          # Perfil y segmentación preliminar de autoevaluación
    │   ├── inspections.js      # Listas de chequeo con canvas de firma y GPS
    │   ├── qrReporter.js       # Formulario público/rápido de actos y condiciones
    │   ├── epp.js              # Inventario y control de entrega de dotación
    │   └── aiCopilot.js        # Integración con LLM (Gemini API / Claude / OpenAI)
    └── utils/
        ├── canvasSignature.js  # Módulo de captura táctil/ratón de firma digital
        ├── cameraHelper.js     # Captura de fotografías desde `<video>` o `<input capture>`
        └── exportPdf.js        # Generador de reportes visuales o triggers de impresión
```

---

## 3. ESPECIFICACIÓN DETALLADA DE MÓDULOS

### Módulo 1: Matriz IPEVR según GTC 45 (`js/modules/gtc45.js`)
Debe implementar la lógica matemática y cualitativa exacta de la Guía Técnica Colombiana GTC 45:

1. **Fórmulas de Cálculo:**
   - **Nivel de Probabilidad ($NP$):**
     $$NP = ND \times NE$$
     - $ND$ (Deficiencia): $0$ (Aceptable), $2$ (Medio), $6$ (Alto), $10$ (Muy Alto).
     - $NE$ (Exposición): $1$ (Esporádica), $2$ (Ocasional), $3$ (Frecuente), $4$ (Continua).
   - **Interpretación del $NP$:**
     - Muy Alto (MA): $40 - 24$
     - Alto (A): $20 - 10$
     - Medio (M): $8 - 6$
     - Bajo (B): $4 - 2$
   - **Nivel de Riesgo e Intervención ($NR$):**
     $$NR = NP \times NC$$
     - $NC$ (Consecuencia): $10$ (Leve), $25$ (Grave), $60$ (Muy Grave), $100$ (Mortal o Catastrófico).
   - **Aceptabilidad del Riesgo:**
     - **Nivel I ($NR \in [600, 4000]$):** No Aceptable (Situación crítica, suspensión inmediata).
     - **Nivel II ($NR \in [150, 500]$):** No Aceptable o Aceptable con control específico.
     - **Nivel III ($NR \in [40, 120]$):** Mejorable.
     - **Nivel IV ($NR \le 20$):** Aceptable.

2. **UI Requerida:**
   - Formulario dinámico para registrar peligro (Clasificación: Físico, Químico, Biológico, Biomecánico, Psicosocial, Condiciones de Seguridad, Fenómenos Naturales).
   - Selectores interactivos para $ND$, $NE$, $NC$ que actualicen en tiempo real las badges de $NP$, $NR$ y Aceptabilidad con colores semafóricos (Rojo, Naranja, Amarillo, Verde).
   - Jerarquía de controles: Eliminación, Sustitución, Ingeniería, Administrativos y EPP.

---

### Módulo 2: Autoevaluación de Estándares Mínimos - Res. 0312 (`js/modules/res0312.js`)
1. **Filtro por Perfil de Empresa:**
   - 7 Estándares: $\le 10$ trabajadores, Riesgo I, II o III.
   - 21 Estándares: $11$ a $50$ trabajadores, Riesgo I, II o III.
   - 60 Estándares: $> 50$ trabajadores en cualquier riesgo, o empresas con Riesgo IV y V.
2. **Cálculo de Calificación:**
   - Cada ítem contiene un peso porcentual normativo.
   - Opciones por ítem: `Cumple totalmente`, `No cumple`, `No aplica (Justificado)`.
   - La regla de `No aplica` recibida (puntaje completo solo cuando la norma permite justificarlo con soporte; de lo contrario, cero) y los pesos individuales requieren cotejo con el anexo oficial antes de habilitar el puntaje.
   - Cálculo del score total global ($0 - 100\%$):
     - $< 60\%$: Crítico (Plan de mejoramiento inmediato).
     - $60\% - 85\%$: Moderadamente Aceptable.
     - $> 85\%$: Aceptable.
3. **UI Requerida:**
   - Barra de progreso radial o lineal en CSS que responde al cambio de opciones.
   - Generación automática de la tabla de "Plan de Acción de Brechas".

---

### Módulo 3: Inspecciones en Campo y Firmas Táctiles (`js/utils/canvasSignature.js` & `js/modules/inspections.js`)
1. **Canvas de Firma Digital:**
   - Elemento `<canvas>` con soporte para eventos `pointerdown`, `pointermove`, `pointerup` (compatible con mouse, stylus y pantalla táctil).
   - Botón "Limpiar Firma" y exportación a Base64 (`canvas.toDataURL('image/png')`).
   - Sellado de metadatos: Timestamp ISO, geolocalización (latitud, longitud mediante `navigator.geolocation`) y hash simple de verificación.
2. **Listas de Chequeo Dinámicas:**
   - Inspección de EPP, Extintores, Orden y Aseo, Trabajo en Alturas (arnés, eslingas, anclajes) y Sistemas Fotovoltaicos.
   - Las listas son ayudas operativas y no sustituyen procedimientos eléctricos aprobados, evaluación de peligros, permisos ni requisitos normativos aplicables.
   - Posibilidad de capturar foto con la cámara del dispositivo (`<input type="file" accept="image/*" capture="environment">` o MediaStream API).

---

### Módulo 4: Reportes Rápidos QR (Acceso Ligero / Operario) (`js/modules/qrReporter.js`)
1. **Modo Reporte Rápido:**
   - Interfaz simplificada y ultraligera optimizada para pantallas móviles.
   - Tipos de reporte: `Condición Insegura`, `Acto Inseguro`, `Casi Incidente`.
   - Campos: Sede/Lugar, Descripción breve, Fotografía, Nivel de urgencia visual (Alta, Media, Baja).
   - Generador interno de código QR (mediante librería JS liviana o SVG dinámico) que codifica la URL directa al formulario de reporte de esa sede.

---

### Módulo 5: Copiloto de Inteligencia Artificial SST (`js/modules/aiCopilot.js`)
1. **Integración con API LLM:**
   - Cliente fetch asíncrono para consumir API de lenguaje (Gemini / OpenAI / Endpoint personalizado).
   - Entrada de API Key opcional y temporal en memoria durante la sesión; nunca guardarla en `localStorage`, IndexedDB ni en el código fuente.
   - Sin clave, ofrecer datos simulados claramente identificados y conservar el funcionamiento offline.
2. **Casos de Uso Pre-construidos (System Prompts Integrados):**
   - **Generador de Análisis de Trabajo Seguro (ATS):** El usuario ingresa la actividad (ej. "Mantenimiento de luminarias a 6 metros") y el copiloto devuelve los pasos, riesgos y controles sugeridos en formato JSON estructurado.
   - **Auditor de Evidencia:** El usuario pega el texto de una política o procedimiento y el copiloto indica si cumple con el Artículo 2.2.4.6.8 del Decreto 1072.
   - **Asistente de Investigación de Incidentes:** Guía interactiva aplicando la metodología de los 5 Porqués o Árbol de Causas.

---

## 4. GESTIÓN DE DATOS Y PERSISTENCIA (INDEXEDDB)

Estructura de Object Stores recomendada para `db.js`:
- `company_profile`: Número de trabajadores y clase de riesgo ARL para determinar el grupo aplicable a SAENA, empresa de sistemas fotovoltaicos.
- `gtc45_matrix`: Array de objetos con cada fila de peligro identificada.
- `inspections`: Registros de inspección, firmas y fotos como `Blob`; el backup JSON las serializa temporalmente como Data URL.
- El backup JSON v3 incluye el perfil empresarial y conserva compatibilidad de lectura con las versiones 1 y 2.
- `incident_reports`: Reportes generados vía formulario rápido o QR.
- No crear una cola de sincronización hasta que exista un backend y se acuerde el alcance de la sincronización.

---

## 5. REQUERIMIENTOS DE CÓDIGO Y ESTILO

1. **Sin dependencias externas obligatorias:** Todo el core debe funcionar con APIs estándar de los navegadores modernos.
2. **Modularidad Estricta:** Separar responsabilidades usando ES Modules (`import / export`).
3. **Manejo de Errores y Validaciones:** Validar todos los inputs numéricos y sanitizar entradas de texto antes de renderizar en el DOM (evitar XSS mediante `textContent` o plantillas seguras).
4. **Diseño y Accesibilidad (a11y):**
   - Identidad visual SAENA basada en `https://saena.co/`: azul marino (`#1e2438`), verde (`#3d7249`, `#4f8f5e`) y crema (`#feeacf`).
   - Los niveles de severidad y aceptabilidad GTC 45 conservan su propia codificación normativa y no se reemplazan por los colores de marca.
   - Contrastes WCAG AA garantizados.
   - Soporte para navegación por teclado en modales y tablas.

---

## 6. INSTRUCCIÓN DE EJECUCIÓN PARA LA IA

Secuencia y estado de implementación:
1. Genera un prototipo funcional estructurado en un solo archivo interactivo (`index.html` con CSS y JS embebidos o estructurados) o entrega los módulos paso a paso comenzando por:
   - **Paso 1:** Shell visual con barra lateral, navegación por pestañas y dashboard central.
   - **Paso 2:** Módulo interactivo GTC 45 con cálculo en tiempo real y tabla editable.
   - **Implementado:** Inspecciones móviles locales, incluida lista operativa para sistemas fotovoltaicos, captura de firma, ubicación opcional, fotos comprimidas y backup JSON. La aplicación se identifica como SAENA. La paleta visual se basa en la identidad del sitio oficial `https://saena.co/`: azul marino `#1e2438`, verdes `#3d7249` / `#4f8f5e` y crema `#feeacf`; los colores normativos GTC 45 se mantienen independientes.
   - **En curso:** Formulario local para número de trabajadores y riesgo ARL; segmentación preliminar a grupos 1/2/3 y perfil en IndexedDB/backup v3. Cuestionario y puntaje permanecen bloqueados hasta cotejar los IDs exactos de los grupos de 7/21 estándares y los pesos individuales de los 60 estándares con el anexo oficial. La pregunta sobre UPA se excluye porque SAENA es una empresa de sistemas fotovoltaicos y no una unidad de producción agropecuaria.
   - **Futuro:** Reportes QR, módulo de inventario EPP e integración opcional con IA, sujeta a las reglas de manejo temporal de API Keys indicadas arriba.


   --------------------------------------

   Escudo de Bogotá
RÉGIMEN LEGAL DE BOGOTÁ D.C.
© Propiedad de la Secretaría Jurídica Distrital de la Alcaldía Mayor de Bogotá D.C.

Secretaría
Jurídica Distrital
Resolución 4272 de 2021 Ministerio del Trabajo
Fecha de Expedición:
27/12/2021
Fecha de Entrada en Vigencia:
08/08/2022
Medio de Publicación:
Diario oficial No.51.942 del 08 de febrero de 2022.
Temas
Anexos
La Secretaría Jurídica Distrital aclara que la información aquí contenida tiene exclusivamente carácter informativo, su vigencia está sujeta al análisis y competencias que determine la Ley o los reglamentos. Los contenidos están en permanente actualización.


 
 	

RESOLUCIÓN 4272 DE 2021

 

(Diciembre 27)

 

Por la cual se establecen los requisitos mínimos de seguridad para el desarrollo de trabajo en alturas

 

EL MINISTRO DE TRABAJO



En uso de sus facultades legales, especialmente las que confiere el literal a) del artículo 83 de la Ley 9ª de 1979, los numerales 9 y 10 del artículo 2°, los numerales 6 y 7 del artículo 6° del Decreto 4108 del 2011, las conferidas en los artículos 56, 57 y 68 del Decreto ley 1295 de 1994, lo previsto en el Capítulo 6 del Título 4 de la Parte 2 del Libro 2 del Decreto número 1072 de 2015, así como lo expuesto en el artículo 348 del Código Sustantivo del Trabajo, y

 

CONSIDERANDO:

 

Que el artículo 25 de la Constitución Política de Colombia establece que el trabajo es un derecho y una obligación social y goza, en todas sus modalidades, de la especial protección del Estado; además determina que toda persona tiene derecho a un trabajo en condiciones dignas y justas.

 

Que el objetivo básico del Sistema General de Riesgos Laborales es la promoción de la salud ocupacional y la prevención de los riesgos laborales, para evitar accidentes de trabajo y enfermedades laborales.

 

Que conforme a lo previsto en los artículos 348 del Código Sustantivo del Trabajo; 80, 81 y 84 de la Ley 9ª de 1979; 21 del Decreto ley 1295 de 1994; 26 de la Ley 1562 de 2012, el 2° de la Resolución 2400 de 1979 y el Decreto Único Reglamentario 1072 del Sector Trabajo, en los artículos 2.2.4.6.1 y 2.2.4.6.8, expedido por el Ministerio de Trabajo y Seguridad Social, los empleadores son responsables de la seguridad y salud de sus trabajadores y de proveer condiciones seguras de trabajo.

 

Que el artículo 56 del Decreto 1295 de 1994, sobre la prevención de los riesgos laborales indica que, corresponde al Gobierno nacional expedir las normas reglamentarias técnicas tendientes a garantizar la seguridad de los trabajadores y de la población en general, en la prevención de accidentes de trabajo y enfermedades profesionales. Igualmente le corresponde ejercer la vigilancia y control de todas las actividades, para la prevención de los riesgos profesionales.

 

Que el Plan Nacional de Seguridad y Salud en el Trabajo 2013-2021, en una de sus líneas establece el fomento de la transversalidad de la seguridad y la salud en el trabajo en el conjunto de políticas públicas, cuya meta es avanzar en la protección social de los trabajadores, en el marco de una cultura preventiva articulada con las políticas públicas de seguridad y salud en el trabajo y planteó como objetivo específico disponer de instrumentos normativos actualizados sobre la salud de los trabajadores, teniendo en cuenta los convenios internacionales del trabajo pertinentes.

 

Que el trabajo en alturas está considerado como una tarea crítica debido a que las consecuencias de un accidente pueden ser graves o fatales.

 

Que, en virtud de lo anterior, se hace necesario establecer la presente resolución para definir los requisitos mínimos de seguridad para el desarrollo de trabajo en alturas.



En mérito de lo expuesto,

 

RESUELVE:

 

TÍTULO I

 

DISPOSICIONES GENERALES

 

CAPÍTULO I

 

Objeto, Ámbito de Aplicación y Definiciones

 

Artículo 1°. Objeto. Establecer los requisitos mínimos de seguridad para el desarrollo de Trabajos en Alturas (TA), y lo concerniente con la capacitación y formación de los trabajadores y aprendices en los centros de entrenamiento de Trabajo en Alturas (AT).

 

Artículo 2°. Ámbito de aplicación. La presente resolución aplica a todos los empleadores contratantes, contratistas, aprendices y trabajadores de todas las actividades económicas que desarrollen trabajo en alturas, así mismo a las Administradoras de Riesgos Laborales y centros de capacitación y entrenamiento de Trabajo en Alturas (TA).

 

Parágrafo 1°. Se exceptúan de la aplicación de la presente resolución, las siguientes actividades:

 

1. Actividades de atención de emergencias y rescate.

 

2. Operaciones militares y policiales en acciones propias del servicio.

 

3. Actividades deportivas, de alta montaña o andinismo.

 

4. Desarrollo de actos lúdicos o artísticas.

 

5. Actividades realizadas sobre animales.

 

Para realizar las actividades mencionadas, se debe llevar a cabo un proceso de identificación de peligros, valoración de riesgos e implementación de controles, siguiendo estándares nacionales o internacionales, garantizando siempre la seguridad de las personas que realizan la actividad.

 

Parágrafo 2°. Si en el análisis de riesgo que realice el coordinador de trabajo en alturas o el responsable del Sistema de Gestión de la Seguridad y Salud en el Trabajo (SG-SST) de la empresa, se identifican condiciones peligrosas que puedan afectar al trabajador en el momento de una caída, tales como áreas con obstáculos, bordes peligrosos, elementos salientes, puntiagudos, sistemas energizados, máquinas en movimiento, entre otros, incluso en alturas inferiores a las establecidas en la presente resolución, se deberán garantizar las medidas de prevención y protección contra caídas necesaria para proteger al trabajador.

 

Artículo 3°. Definiciones. Para los efectos de la presente resolución, se aplican las siguientes definiciones:

 

Absorbedor de energía: Equipo que hace parte integral de un sistema de detención de caídas, cuya función es disminuir y limitar las fuerzas de impacto en el cuerpo del trabajador o en los puntos de anclaje en el momento de una caída.

 

Actividad o tarea no rutinaria: Actividad que no forma parte de la operación normal de la organización o actividad que la organización ha determinado como no rutinaria por su baja frecuencia de ejecución.

 

Actividad o tarea rutinaria: Actividad que forma parte de la operación normal de la organización, se ha planificado y es estandarizable.

 

Adaptador de anclaje: Un componente o subsistema que funciona como interfaz entre el anclaje y un sistema de detención de caídas, restricción, acceso o posicionamiento con el propósito de acoplar el sistema al anclaje.

 

Anclaje: Punto seguro fijo o móvil al que pueden conectarse adaptadores de anclaje o equipos personales de restricción, posicionamiento, acceso y/o de detención de caídas, capaz de soportar con seguridad las cargas aplicadas por el sistema o subsistema de protección contra caídas. Deben ser diseñados y aprobados por una persona calificada e instalados por una persona competente.

 

Arnés de cuerpo completo: Equipo de protección personal diseñado para contener el torso y distribuir las fuerzas de la detención de caídas en al menos la parte superior de los muslos, la pelvis, el pecho y los hombros. Es fabricado en correas debidamente cosidas y aseguradas entre sí, e incluye elementos para conectar equipos y asegurarse a un punto de anclaje. Debe ser certificado bajo un estándar nacional o internacionalmente aceptado.

 

Autocuidado: Se define como actitud y aptitud para realizar de forma voluntaria y sistemática actividades dirigidas a conservar la salud y prevenir accidentes o enfermedades.

 

Ayudante de seguridad: Trabajador autorizado, debidamente certificado, designado por el empleador para revisar las condiciones de seguridad en el sitio de trabajo y controlar el acceso a las áreas de riesgo de caída de objetos o personas.

 

Baranda: Barrera que se instala al borde de un lugar para prevenir la posibilidad de caída. Debe garantizar una capacidad de carga y contar con un travesaño de agarre superior, una barrera colocada a nivel del suelo para evitar la caída de objetos y un travesaño intermedio o barrera intermedia que prevenga el paso de personas entre el travesaño superior y la barrera inferior.

 

Capacitación: Es toda actividad a corto plazo realizada en una empresa o institución autorizada, con el objetivo de preparar el talento humano mediante un proceso en el cual el participante comprende, asimila, incorpora y aplica conocimientos, habilidades, destrezas que lo hacen competente para ejercer sus labores de TA en el puesto de trabajo.

 

Centro de capacitación y entrenamiento: Espacio destinado y acondicionado, con infraestructura adecuada para desarrollar y fundamentar, el conocimiento y las habilidades necesarias para el desempeño del trabajador y la aplicación de las técnicas relacionadas con el uso de los equipos y la configuración de sistemas de prevención y protección contra caídas para TA.

 

Certificación de competencia laboral: Documento otorgado por un organismo certificador con la autoridad legal para su expedición, donde se reconoce la competencia laboral de una persona para desempeñarse en la actividad que ejerce. Estas certificaciones deben cumplir con lo exigido en las normas nacionales establecidas o la que las modifique o sustituya.

 

Certificación del proceso de capacitación y entrenamiento: Documento expedido por el oferente de capacitación y entrenamiento al final del proceso formativo en el que se da constancia que una persona cursó y aprobó la capacitación y entrenamiento necesario para desempeñar una actividad laboral en TA. Este documento será propiedad del trabajador como constancia de los conocimientos, y desarrollado por el oferente.

 

Certificado de conformidad: Documento emitido de acuerdo con las reglas de un sistema de certificación, en el cual se manifiesta adecuada confianza de que un producto, proceso o servicio debidamente identificado está conforme con una norma técnica u otro documento normativo específico.

 

Competencia: Es la capacidad demostrada para poner en acción conocimientos, habilidades, destrezas y actitudes que hacen posible su desempeño en diversos contextos sociales. Se evidencia a través del logro de los resultados de aprendizaje.

 

Conector: Equipo certificado que permite unir entre sí partes de un sistema personal de detención de caídas, un sistema de posicionamiento o un sistema de restricción.

 

Conocimiento: Es el resultado de la asimilación de información por medio del aprendizaje; acervo de hechos, principios, teorías y prácticas relacionados con un campo de trabajo o estudio concreto.

 

Constancia de formación vocacional: Documento de consulta expedido por la Dirección de Movilidad y Formación para el Trabajo del Ministerio del Trabajo, donde permite validar el reporte del proceso de formación impartido por un oferente inscrito en el registro del Ministerio del Trabajo.

 

Coordinador de trabajo en alturas: Trabajador designado por el empleador, capaz de identificar peligros en el sitio en donde se realiza trabajo en alturas, que tiene autorización para aplicar medidas correctivas inmediatas para controlar los riesgos asociados a dichos peligros. La designación del coordinador de TA no significa la creación de un nuevo cargo, ni aumento en la nómina de la empresa, esta función debe ser llevada a cabo por la persona designada por el empleador y puede ser ejecutada por supervisores o coordinadores de procesos, por el coordinador o ejecutor del Sistema de Gestión de Seguridad y Salud en el Trabajo o cualquier otro trabajador que el empleador considere adecuado para cumplir sus funciones.

 

Cuerdas: Elemento de amarre certificado por el fabricante, componente de un sistema de restricción, posicionamiento, detención de caídas o rescate, con diámetro que garantice la resistencia establecida, fabricado en materiales altamente resistentes a la tensión y a la abrasión.

 

Delimitación del área: Medida de prevención colectiva que tiene por objeto limitar el área o zona de peligro de caída del trabajador o de objetos y prevenir el acercamiento de este a la zona de caída.

 

Destreza: Es la habilidad demostrada por una persona para aplicar conocimientos y utilizar técnicas, con el fin de realizar tareas y resolver problemas en un campo de trabajo o estudio. Moviliza capacidades cognitivas (uso del pensamiento lógico, intuitivo y creativo) y prácticas (destreza manual y uso de métodos, materiales, herramientas e instrumentos).

 

Distancia de desaceleración: Distancia vertical entre el punto donde termina la caída libre y se comienza a activar el absorbedor de energía hasta que este último pare por completo.

 

Distancia de detención: Distancia vertical total requerida para detener una caída, incluyendo la distancia de desaceleración y la distancia de activación.

 

Entrenador en trabajo en alturas: Persona que cumple los requisitos de esta resolución para este rol, y que posee certificado de capacitación y entrenamiento en el nivel entrenador lo que le permite brindar capacitación y entrenamiento en TA.

 

Entrenamiento: Actividad de aprendizaje realizada en un centro de capacitación y entrenamiento autorizado por el Ministerio de Trabajo, cuyo propósito es complementar la etapa teórica desarrollada previamente, mediante un proceso práctico, donde la persona comprende, asimila, incorpora y aplica conocimientos para obtener las habilidades y destrezas requeridas para desarrollar actividades en alturas con técnicas que lo hacen competente para ejercer sus labores en el puesto de trabajo.

 

Equipo certificado: Todo equipo utilizado en protección contra caídas, debe contar como mínimo con un certificado de conformidad de producto expedido por el fabricante.

 

Equipo de entrenamiento: Dispositivos y elementos utilizados por un aprendiz durante la etapa de entrenamiento, en un centro de capacitación y entrenamiento con riesgos controlados.

 

Equipos de rescate: Son los dispositivos, elementos diseñados y destinados para configurar un sistema de rescate en alturas.

 

Equipo de seguridad: Dispositivos, aparatos y elementos utilizados por el aprendiz en el proceso de entrenamiento para protegerse de los riesgos inherentes al trabajo que esté desempeñando.

 

Eslinga de detención de caídas: Equipo certificado, que se compone de un sistema de cuerda, reata, cable u otros materiales que cuenta con un absorbedor de energía, que permiten la unión al arnés del trabajador al punto de anclaje. Su función es detener la caída de una persona, absorbiendo la energía de la caída de modo que al trabajador se le limite la carga máxima que recibe. Debe cumplir los siguientes requerimientos:

 

a) Todos sus componentes deben ser certificados.

 

b) Resistencia mínima de 5.000 libras (22,2 kilo newtons - 2.272 kg).

 

c) Tener un absorbedor de energía; y

 

d) Tener en sus extremos sistemas de conexión certificados.

 

Eslinga de posicionamiento o eslinga de restricción: Equipo certificado compuesto de elementos de cuerda, cintas, cable u otros materiales con resistencia mínima de 5.000 libras (22,2 kilo newtons - 2.272 kg) que puede tener en sus extremos ganchos o conectores que permiten la unión de arnés del trabajador y al punto de anclaje. Todas las eslingas y sus componentes deben ser certificados.

 

Estructura para entrenamiento de trabajo en alturas: Conjunto de partes que forman un cuerpo, que permiten soportar los efectos de las cargas y fuerzas que actúan sobre ella, protegiendo al personal que desarrolle entrenamiento sobre la misma. Debe ser diseñada y avalada con memorias de cálculo firmadas por persona calificada, con el fin de mantener los requisitos de resistencia establecidos en la presente resolución. La estructura debe mantener los diseños originales y cualquier cambio en la estructura o en su uso debe contar con el aval de la persona calificada.

 

Evaluación de competencias laborales para trabajo en alturas: Proceso por medio del cual un organismo con las competencias legales para desarrollar evaluación de competencias laborales recoge de una persona, información sobre su desempeño y conocimiento con el fin de determinar su competencia, para desempeñar una función productiva de acuerdo con la norma técnica de competencia laboral para trabajo en alturas vigente o esquema acreditado.

 

Factor de seguridad: Número multiplicador mayor que uno (1) de la carga real aplicada a un elemento, para determinar la carga a utilizar en el diseño.

 

Gancho: Equipo metálico con resistencia mínima de 5.000 libras (22.2 kilo newtons - 2.272 kg), que es parte integral de los conectores y permite realizar conexiones entre el arnés, las eslingas y los puntos de anclaje, sus dimensiones varían de acuerdo a su uso, los ganchos están provistos de una argolla u ojo al que está asegurado el material del equipo conector (cuerda, reata, cable, cadena, entre otros), y un sistema de apertura y cierre con doble sistema de accionamiento para evitar una apertura accidental, que asegure que el gancho no se salga de su punto de conexión.

 

Hueco: Para efecto de esta norma es el espacio vacío o brecha en una superficie o pared, a través del cual se puede producir una caída de 2,00 metros o más de personas u objetos.

 

Línea de advertencia: Es una medida de prevención de caídas que demarca un área en la que se puede trabajar sin un sistema de protección. Consiste en una línea de acero, cuerda, cadena u otros materiales, la cual debe estar sostenida mediante unos soportes que la mantengan a una altura entre 0,85 metros y 1 metro de altura sobre la superficie de trabajo.

 

Líneas de vida horizontales: Equipos certificados de cables de acero, cuerdas, rieles u otros materiales que debidamente anclados a la estructura donde se realizará el trabajo en alturas, permitan la conexión de los equipos personales de protección contra caídas y el desplazamiento horizontal del trabajador sobre una determinada superficie. La estructura de anclaje debe ser evaluada con métodos de ingeniería.

 

Líneas de vida horizontales fijas: Son aquellas que se encuentran debidamente ancladas a una determinada estructura, fabricadas en cable de acero o rieles metálicos y según su longitud, se soportan por puntos de anclaje intermedios; deben ser diseñadas e instaladas por una persona calificada. Los cálculos estructurales determinarán si se requiere de sistemas absorbentes de energía.

 

Líneas de vida horizontales portátiles: Son equipos certificados y preensamblados, elaborados en cuerda o cable de acero, con sistemas absorbentes de choque, conectores en sus extremos, un sistema tensionador y dispositivos adaptadores de anclaje (si aplican); estas se instalarán por parte de los trabajadores autorizados entre dos puntos de comprobada resistencia y se verificará su instalación por parte del coordinador de trabajo en alturas (cuando los puntos de anclaje se encuentran previamente certificados o aprobados como puntos de anclaje) o de una persona calificada.

 

Líneas de vida verticales: Equipos certificados de cables de acero, cuerdas, rieles u otros materiales que debidamente ancladas en un punto superior a la zona de labor, protegen al trabajador en su desplazamiento vertical (ascenso/descenso). Serán diseñadas por una persona calificada y deben ser instaladas por una persona calificada o por una persona avalada por el fabricante.

 

Máxima Fuerza de Detención (MFD): La máxima fuerza que puede soportar el trabajador sin sufrir una lesión, es 1.800 libras (8 kilo newtons - 816 kg).

 

Medidas activas de protección contra caídas: Son las que involucran la participación del trabajador. Incluyen los siguientes componentes: punto de anclaje, mecanismos de anclaje, conectores, arnés de cuerpo completo y plan de rescate.

 

Medidas colectivas de prevención: Todas aquellas actividades dirigidas a informar o demarcar la zona de peligro y evitar una caída de alturas o ser lesionado por objetos que caigan. Estas medidas, previenen el acercamiento de los trabajadores o de terceros a las zonas de peligro de caídas de personas o de objetos; sirven como barreras informativas y corresponden a medidas de control en el medio.

 

Medidas de prevención contra caídas: Conjunto de acciones individuales o colectivas que se implementan para advertir o evitar la caída de personas y objetos cuando se realizan trabajos en alturas y forman parte de las medidas de control. Dentro de las medidas de prevención contra caídas de trabajo en alturas están la capacitación, los procedimientos, el entrenamiento, la aptitud psicofísica, la vigilancia en salud laboral, los sistemas de ingeniería para prevención de caídas, medidas colectivas de prevención, permiso de trabajo en alturas, listas de chequeo, los análisis de peligros y otros que el administrador del programa o el coordinador de trabajo en alturas establezca como necesarios para aumentar la efectividad del programa y la eficacia de los controles.

 

Medidas de protección contra caídas: Conjunto de acciones individuales o colectivas que se implementan para detener la caída de personas y objetos una vez ocurra o para mitigar sus consecuencias.

 

Medidas pasivas de protección contra caídas: Están diseñadas para detener o capturar al trabajador en el trayecto de su caída, sin permitir impacto contra estructuras o elementos, requieren poca o ninguna intervención del trabajador que realiza el trabajo.

 

Mosquetón: Equipo certificado, metálico en forma de argolla que permite realizar conexiones directas del arnés a los puntos de anclaje. Otro uso es servir de conexión entre equipos de protección contra caídas o rescate a su punto de anclaje. Deben tener una resistencia mínima certificada de 5.000 libras (22,2 kilo newtons - 2.272 kg).

 

Organismo de acreditación: Entidad encargada de acreditar la competencia técnica de los organismos de evaluación de la conformidad.

 

Organismo de evaluación de la conformidad: Organismo que realiza servicios de evaluación de la conformidad.

 

Permiso de trabajo en alturas: Mecanismo administrativo que, mediante la verificación y control previo de todos los aspectos relacionados en la presente resolución, tiene como objeto fomentar la prevención durante la realización de trabajos en alturas.

 

Persona calificada: Según las disposiciones establecidas en la Ley 400 de 1997 relacionado con los profesionales a cargo o la norma que la modifique o sustituya.

 

Persona en proceso de capacitación y entrenamiento: Aprendiz objeto de acciones de capacitación y entrenamiento.

 

Plan de mejora: Documento elaborado por el proveedor inscrito de capacitación y entrenamiento en trabajo en alturas, y presentado para su aprobación ante la Dirección de Movilidad y Capacitación para el Trabajo del Ministerio del Trabajo, que deberá contener las adiciones, aclaraciones destinadas a subsanar las recomendaciones o solicitudes generadas a partir de hallazgos relacionados con el incumplimiento de las condiciones técnicas, operativas y jurídicas conforme a la presente resolución. Según la gravedad de la observación, la Dirección de Movilidad y Capacitación para el Trabajo definirá si el proveedor de capacitación y entrenamiento desarrolla el plan de mejora siguiendo activo o, si de lo contrario, se inactiva su labor.

 

Programa de prevención y protección contra caídas en alturas: Es la planeación, organización, ejecución y evaluación de las actividades identificadas por el empleador como necesarias de implementar en los sitios de trabajo en forma integral e interdisciplinaria, para prevenir la ocurrencia de accidentes y enfermedades laborales por trabajo en alturas y llegado el caso las medidas de protección implementadas para detener la caída una vez ocurra o mitigar sus consecuencias.

 

Proveedor de capacitación y entrenamiento: Organización o persona inscrita en el registro de la Dirección de Movilidad y Capacitación para el Trabajo del Ministerio del Trabajo, que oferta el servicio de capacitación y entrenamiento en trabajo en alturas.

 

Requerimiento de claridad o espacio libre de caída: Distancia vertical requerida por un trabajador en caso de una caída, para evitar que este impacte contra el suelo o contra un obstáculo. El requerimiento de claridad dependerá principalmente de la configuración del sistema de detención de caídas utilizado.

 

Rodapié: Elemento horizontal construido en material rígido, que se instala en el perímetro de una plataforma, en la parte inferior de la baranda de seguridad de protección. Tiene la finalidad de evitar la caída al vacío de herramientas de mano o elementos de trabajo.

 

Señalización del área: Es una medida de prevención que incluye entre otros, avisos informativos que indican con letras o símbolos gráficos el peligro de caída de personas y objetos.

 

Sistema de acceso por cuerdas: Es un sistema con equipos certificados, configurado para que, a través de cuerdas y equipos, un trabajador autorizado pueda acceder, ascender, descender o realizar una progresión a un lugar específico.

 

Sistema de posicionamiento: Sistema con equipos certificados, configurado para ubicar al trabajador en un sitio de trabajo de modo que permanezca parcial o totalmente suspendido de sus equipos, limitando la distancia de caída del trabajador a máximo 60 cm, de modo que pueda utilizar las dos manos para su labor.

 

Sistema de restricción: Sistema con un conjunto de equipos certificados de diferentes longitudes fijas o graduables que también puede permitir la conexión de sistemas de bloqueo o freno. Su función es limitar los desplazamientos del trabajador para que no llegue a un sitio del que pueda caer por un borde o lado desprotegido, huecos o aberturas. No debe ser usado en superficies en las que se camina o trabaja con una inclinación superior de 18.4 grados.

 

Sistemas de ingeniería para prevención de caídas: Son aquellos sistemas relacionados con cambios o modificación en el diseño, montaje, construcción, instalación, puesta en funcionamiento, para eliminar, sustituir o mitigar el riesgo de caída. Se refiere a todas aquellas medidas tomadas para el control en la fuente, desde aquellas actividades destinadas a evitar el trabajo en alturas o el ascenso o descenso del trabajador, hasta la implementación de mecanismos que permitan menor tiempo de exposición.

 

Sistemas de protección de caídas: Sistema con un conjunto de elementos, anclajes y/o equipos certificados, que el empleador dispone para que el trabajador autorizado use para su protección ante una caída y el cual garantiza que reduce las fuerzas sobre el cuerpo al máximo permitido y aprobado por una persona calificada. En ningún momento, el estándar internacional puede ser menos exigente que el nacional.

 

Trabajador autorizado: Trabajador que ha sido designado por la organización para realizar trabajos en alturas, cuya salud fue evaluada y se le consideró apto para trabajo en alturas y que posee la constancia de capacitación y entrenamiento de trabajo en alturas o el certificado de competencia laboral para trabajo en alturas.

 

Trabajo en alturas: Toda actividad que realiza un trabajador que ocasione la suspensión y/o desplazamiento, en el que se vea expuesto a un riesgo de caída, mayor a 2.0 metros, con relación del plano de los pies del trabajador al plano horizontal inferior más cercano a él.

 

Trabajos en suspensión: Tareas en las que el trabajador debe “suspenderse” o colgarse y mantenerse en esa posición, mientras realiza su tarea o mientras es subido o bajado.

 

Unidades Vocacionales de Aprendizaje en Empresas (Uvae): Son mecanismos dentro de las empresas que buscan desarrollar conocimiento en la organización mediante procesos de autoformación, con el fin de preparar, entrenar, reentrenar, complementar y certificar la capacidad del recurso humano para realizar labores seguras en trabajo en alturas dentro de la empresa.

 

TÍTULO II

 

PROGRAMA DE PREVENCIÓN Y PROTECCIÓN CONTRA CAÍDAS DE ALTURAS

 

CAPÍTULO I

 

Contenido del Programa de Prevención y Protección Contra Caídas de Alturas

 

Artículo 4°. Programa de prevención y protección contra caídas de alturas. El empleador debe contar con un programa donde debe identificar las tareas de trabajo en alturas y su ubicación.

 

En el programa de la empresa se debe identificar cada riesgo de caída en el lugar de trabajo, establecer y documentar uno o varios métodos para eliminar el trabajo en alturas a través de sistemas de ingeniería, adaptaciones de procesos, entre otros, o controlar cada riesgo de caída identificado, aplicando especialmente la jerarquización de controles contenida en el artículo 2.2.4.6.24 del Decreto 1072 de 2015 o las normas que lo modifiquen o sustituyan.

 

Artículo 5°. Contenido. El programa de la empresa debe contener como mínimo:

 

a) Objetivo general que establezca los lineamientos básicos para trabajo en alturas.

 

b) Alcance del programa.

 

c) Marco conceptual, marco legal.

 

d) Roles y responsabilidades (se deben considerar como mínimo las responsabilidades y funciones del administrador del programa, la persona calificada, coordinador de trabajo en alturas, trabajador autorizado, ayudantes de seguridad y brigadas de emergencia para rescate en alturas).

 

e) Requisitos de capacitación y entrenamiento para los roles definidos por la organización.

 

f) Cronograma de cumplimiento de las actividades.

 

g) Identificación de peligros.

 

h) Evaluación y valoración de riesgos.

 

i) Inventario de actividades de trabajos en alturas, con su definición de tareas rutinarias y no rutinarias.

 

j) Procedimientos de trabajo documentados y los anexos definidos por el empleador.

 

k) Medidas de prevención.

 

l) Sistemas de acceso para trabajos en alturas.

 

m) Medidas de protección.

 

n) Procedimientos en caso de emergencias.

 

o) Indicadores de gestión específicos alineados al Decreto 1072 de 2015.

 

Artículo 6°. Roles y responsabilidades en el programa de prevención y protección de caídas. El empleador y/o contratante debe garantizar que, dentro del programa de prevención y protección contra caídas de alturas, se establezcan los siguientes roles y responsabilidades, que no necesariamente implican nuevos cargos al interior de la organización:

 

Tabla número 1

 

ROLES Y RESPONSABILIDADES EN EL PROGRAMA DE PREVENCIÓN Y PROTECCIÓN CONTRA CAÍDAS

 

ROL

RESPONSABILIDAD

PERFIL REQUERIDO

Administrador del programa de prevención y protección contra

caídas de altura, de acuerdo al rol que cumple dentro de la empresa.

-Diseñar, administrar y asegurar el programa de prevención y protección contra caídas, conforme con la definición establecida para ello

-Profesional, especialista o magister en SST

-Licencia vigente en seguridad y salud en el trabajo.

-Curso de nivel coordinador de trabajo en alturas.

-Curso de 50 horas en SST y/o 20 horas.

Persona calificada

-Calcular resistencia de materiales, diseñar, analizar, evaluar, autorizar puntos de anclaje y/o estructuras para protección contra caídas.

-Las demás definidas en la presente resolución

-El perfil requerido se encuentra establecido conforme en la Ley 400 de 1997.

Coordinador de trabajo en altura

-Identificar peligros en el sitio en donde se realiza trabajo en alturas.

-Aplicar medidas correctivas inmediatas para controlar los riesgos asociados a dichos peligros.

-Las demás definidas en la presente resolución.

-Curso de nivel coordinador de trabajo en alturas.

Trabajador autorizado

-Realizar las actividades de trabajo en alturas encomendadas por el

empleador y/o contratante, cum-

pliendo las medidas definidas en la presente resolución.

-Las demás definidas en la presente resolución

-Capacitación en el nivel trabajador autorizado, y con

reentrenamiento vigente cuando aplique, de acuerdo con lo

establecido en la presente

resolución

Ayudante de seguridad, de acuerdo con el rol que cumple dentro de la empresa.

-Son los encargados de hacer cumplir que se mantengan las con-

diciones de seguridad en el sitio de

trabajo para controlar el las áreas de riesgo de caída de objetos o personas.

-Las demás definidas en la presente resolución.

-Capacitación en el nivel trabajador autorizado con reentrenamiento vigente.

 

CAPÍTULO II

 

Medidas de Prevención Contra Caídas en Alturas

 

Artículo 7°. Definición de medidas de prevención. El empleador o contratante debe definir, las medidas de prevención a ser utilizadas en cada sitio de trabajo donde se realicen trabajos en alturas ya sea en tareas rutinarias o no rutinarias. Estas medidas deben estar acorde con la actividad económica y tareas que la componen.

 

Artículo 8°. Análisis de otros peligros. El empleador o contratante debe verificar que dentro de su Sistema de Gestión de Seguridad y Salud en el Trabajo, cuente con el análisis de las actividades o trabajos a ejecutar en donde se hayan identificado los peligros y evaluado todos los riesgos asociados a las tareas realizadas en alturas, teniendo en cuenta los peligros que puedan presentarse para realizar una gestión integral de los mismos.

 

Artículo 9°. Capacitación y entrenamiento o certificación de la competencia laboral de trabajadores que realicen trabajo en alturas. Todos los trabajadores que laboren en las condiciones de riesgo de trabajo en alturas deben tener su respectivo certificado de capacitación y entrenamiento para trabajo en alturas o certificación de la competencia laboral.

 

El trabajador que al considerar que, por su experiencia, conocimientos y desempeño en trabajo en alturas, no requiere realizar la capacitación y entrenamiento en trabajo en alturas podrá optar por la evaluación de estos conocimientos y desempeño a través de un organismo certificador de competencias laborales.

 

La vigencia del certificado de competencia laboral en ningún momento exime al trabajador de realizar los reentrenamientos para conservar su calidad de trabajador autorizado.

 

Los procesos de capacitación y entrenamiento y gestión de los centros de entrenamiento se regirán con lo establecido en el Título III de la presente resolución.

 

Parágrafo. Las necesidades y contenidos específicos del Programa de Prevención y Protección contra caídas en alturas deben estar incluidos en los programas de capacitación de la empresa; así mismo, deben ser informados al centro de capacitación y entrenamiento para que se realicen los refuerzos específicos en las temáticas acorde al contenido mínimo que se define en la presente resolución.

 

Artículo 10. Personas objeto de la capacitación y entrenamiento. Se deben capacitar y entrenar en trabajo en alturas los siguientes roles:

 

Tabla número 2

 

CAPACITACIÓN Y ENTRENAMIENTO DE ACUERDO CON LOS ROLES

 

ROL

PERSONAL OBJETO

DURACIÓN

Jefes de área para trabajos en alturas

Personas que tomen decisiones administrativas en relación con la aplicación de esta resolución en

empresas en las que se haya identificado como prioritario el riesgo de caída por trabajo en altura.

Mínimo 8 horas

Trabajador autorizado

Trabajadores que realizan trabajo en alturas y aprendices de las instituciones de capacitación y edu-

cación para el trabajo y el SENA, quienes deben ser formados y

entrenados por la misma institución, cuando cursen programas

cuya práctica implique riesgo de caída en alturas.

Mínimo 32 horas

Coordinador de trabajo en alturas

Personal encargado de controlar los riesgos en los lugares de

trabajo donde se realiza trabajo en alturas.

Mínimo 80 horas

Entrenador en trabajo en alturas

Encargado de entrenar jefes de área para trabajos en alturas,

trabajadores autorizados, coordinadores de trabajo en alturas y entrenadores de trabajo en alturas.

Mínimo 130 horas

 

Parágrafo 1°. Los aprendices de las instituciones de educación y el Sena deberán ser capacitados y certificados en trabajo en alturas por la misma institución, cuando cursen programas cuya práctica implique riesgo de caída en alturas. Así mismo, serán certificados simultáneamente en la capacitación académica específica impartida.

 

Parágrafo 2°. La capacitación y entrenamiento de nivel coordinador permite cubrir los requisitos iniciales de capacitación y entrenamiento para realizar tareas del nivel de trabajador autorizado, por lo tanto, para continuar desempeñándose como persona autorizada deberá cumplir los reentrenamientos en las periodicidades y situaciones contempladas en la presente resolución.

 

Parágrafo 3°. Cuando una persona de nivel entrenador, en cumplimiento de actividades distintas al entrenamiento de trabajo en alturas, deba ejercer los roles de trabajador autorizado o coordinador de trabajo en alturas se entenderá que su nivel de formación le permite cubrir estos roles, por lo tanto, para continuar desempeñándose como persona autorizada deberá cumplir los reentrenamientos en las periodicidades y situaciones contempladas en la presente resolución.

 

Artículo 11. Oferta de capacitación y entrenamiento en trabajo en alturas. Los programas de capacitación y entrenamiento para trabajo en alturas, en los niveles jefes de área para trabajos en alturas, trabajador autorizado y coordinador de TA, se podrán ofertar por las siguientes instituciones, observando los requisitos aquí establecidos:

 

a) El Servicio Nacional de Aprendizaje (Sena).

 

b) Empleadores o empresas, utilizando el mecanismo de capacitación de las Unidades Vocacionales de Aprendizaje (Uvae).

 

c) Instituciones de Educación Superior debidamente aprobadas por el Ministerio de Educación Nacional.

 

d) Personas Naturales y Jurídicas con Licencia en Seguridad y Salud en el Trabajo.

 

e) Instituciones de Formación para el Trabajo y Desarrollo Humano con certificación en sistemas de gestión de la calidad para instituciones de formación para el trabajo y,

 

f) Cajas de Compensación Familiar.

 

Los proveedores del servicio de capacitación y entrenamiento de trabajo en alturas deben contar con entrenadores de trabajo en alturas debidamente capacitados y entrenados conforme a la normatividad vigente.

 

Parágrafo. Todas las empresas o los gremios en convenio con estas podrán implementar, a través de Unidades Vocacionales de Aprendizaje (UVAE), procesos de capacitación y entrenamiento para trabajo en alturas, en el nivel que corresponda a las labores a desempeñar. Las empresas o los gremios en convenio con estas deben informar al Ministerio de Trabajo, a la Dirección de Movilidad y Capacitación para el Trabajo o quien haga sus veces, la creación de las unidades.

 

Artículo 12. Sistemas de ingeniería para prevención de caídas. El empleador debe documentar y tener fundamentado dentro del Programa de prevención y protección contra caídas en alturas del Sistema de Gestión de la Seguridad y Salud en el Trabajo SG-SST, la aplicación de los controles que consideró viables y aplicables para dar cumplimiento a la jerarquía de controles definida en el Decreto 1072 de 2015, o la norma que lo sustituya, modifique o adicione, y todos los asociados con los sistemas de ingeniería para prevención de caídas.

 

Parágrafo. Para eliminar o mitigar el riesgo y prevención de caídas, se aplicarán los sistemas de ingeniería relacionados con cambios o modificación en el diseño, montaje, construcción, instalación y puesto en funcionamiento.

 

Artículo 13. Medidas colectivas de prevención. Su selección e implementación depende del tipo de actividad económica y de la viabilidad técnica de su utilización en el medio y según la tarea específica a realizar.

 

Cuando por razones del desarrollo de la labor, el trabajador deba ingresar al área o zona de peligro demarcada con riesgo de caída en alturas, es obligatorio el uso de equipos de protección personal y aplicar los controles necesarios para su protección.

 

Siempre se debe informar, entrenar y capacitar a los trabajadores sobre cualquier medida que se aplique.

 

Dentro de las principales medidas colectivas de prevención están:

 

a) Delimitación del área: La delimitación de la zona de peligro de caída del trabajador se hará mediante cuerdas, cables, vallas, cadenas, cintas, reatas, bandas, conos, balizas, mallas escombreras, redes o banderas, de cualquier tipo de material, de color amarillo y negro combinados. Se debe garantizar su visibilidad de día y de noche.

 

En las áreas de trabajo en alturas en donde no sea viable un mecanismo de delimitación, deben adoptarse otras medidas de prevención y/o protección contra caída dispuestas en la presente Resolución.

 

Para la prevención de caídas de objetos, se deben delimitar áreas para paso peatonal y mallas escombreras. Así mismo, evitar que las personas ingresen a zonas con peligro de caída de objetos.

 

b) Línea de advertencia: Debe cumplir con los siguientes requisitos:

 

i) Debe ser colocada a lo largo de todos los lados desprotegidos.

 

ii) Debe estar colocada a 1,80 metros de distancia del borde desprotegido o más.



iii) Debe resistir fuerzas horizontales de mínimo 8 kg, y 



iv) Debe contar con banderines de colores visibles separados a intervalos inferiores a 1,80 metros.

 

Se debe garantizar la debida supervisión del área con un ayudante de seguridad, que impida que algún trabajador traspase la línea de advertencia sin protección de caídas. El ayudante de seguridad debe estar en la misma superficie de trabajo y en una posición que le permita vigilar a los trabajadores y con la capacidad de advertirles del riesgo, utilizando los medios que sean necesarios.

 

c) Señalización del área: Medida de prevención que incluye entre otros, avisos informativos que indican con letras o símbolos gráficos el peligro de caída de personas y objetos; también debe incluir un sistema de demarcación que rodee completamente el perímetro, excepto en las entradas y salidas según sea necesario para el ingreso y salida de personas o materiales. La señalización debe estar visible para cualquier persona, en idioma español y en el idioma de los trabajadores extranjeros que ejecuten labores en la empresa.

 

d) Barandas: Medida de prevención que pueden ser portátiles o fijas y también, ser permanentes o temporales según la tarea que se desarrolle. Las barandas fijas siempre deben quedar ancladas a la estructura propia del área de trabajo en alturas.



Las barandas fijas y portátiles siempre deben estar identificadas y cumplir como mínimo, con los requerimientos establecidos en la siguiente tabla:

 

Tabla número 3

 

REQUERIMIENTOS MÍNIMOS PARA BARANDAS COMO MEDIDAS COLECTIVAS DE PREVENCIÓN EN TRABAJOS EN ALTURAS

 

TIPO DE REQUERIMIENTO

MEDIDA

Resistencia estructural de la baranda

Mínimo 200 libras (90,8 kg) de carga puntual en el punto medio del travesaño superior de la baranda aplicada en cualquier dirección sin presentar falla.

Alturas de la baranda (Desde la superficie en donde se camina y/o trabaja, hasta el borde superior del travesaño superior).

1 metro mínimo sobre la superficie de trabajo.

Ubicación de travesaños intermedios horizontales.

Deben ser ubicados a máximo 48 cm entre sí.

Separación entre soportes verticales

Aquella que garantice la resistencia mínima solicitada.

Alturas de los rodapiés

De mínimo 9 cm, medidos desde la superficie en donde se camina y/o trabaja. Si hay materiales

acumulados cuya altura exceda la del rodapié y puedan caer al vacío, se debe instalar una red,

lona, entre otros, asegurada a la baranda, con la resistencia suficiente para prevenir efectivamente la caída de los objetos.

 

Las barandas deben ser de material con características de agarre, libre de riesgos cortantes o punzantes. Cuando las barandas sean utilizadas como medida de restricción, deben ser fijas. El material y disposición de las barandas, debe asegurar la protección indicada en la presente Resolución.

 

Las barandas nunca deben ser usadas como puntos de anclajes para detención de caídas, ni para izar cargas.

 

Cuando en una superficie en donde se camina y/o trabaja, se determine instalar barandas, estas deben colocarse a lo largo del borde que presenta el peligro de caída de personas y objetos.

 

Las barandas pueden ser reemplazadas por cualquier otro sistema que garantice las condiciones estructurales y de seguridad establecidas en esta Resolución.

 

e) Control de acceso: Se realiza por medio de mecanismos operativos o administrativos que controlan el acceso a la zona de peligro de caída.

 

Deben formar parte de los procedimientos de trabajo y pueden ser como mínimo: Medidas de vigilancia, seguridad con guardas, uso de tarjetas de seguridad, dispositivos de seguridad para el acceso, permisos de trabajo en alturas, listas de chequeo, sistemas de alarmas u otro tipo de señalización.

 

f) Control en superficies con huecos o aberturas: Se deben demarcar, señalizar y/o cubrir orificios (huecos o aberturas) que se encuentran en la superficie donde se trabaja o camina.

 

Siempre que se encuentre el peligro de caída de alturas debido a la existencia de orificios (huecos o aberturas) cercanos o dentro de la zona de trabajo, se deben utilizar como mínimo: Barandas provisionales, cubiertas de protección tales como rejillas de cualquier material, tablas o tapas, con una resistencia mínima de dos veces la carga máxima prevista que pueda llegar a soportar (trabajadores, materiales, equipos, entre otras), colocadas sobre el orificio (hueco o abertura), delimitadas y señalizadas según lo dispuesto en la presente Resolución para las medidas de prevención. También se puede considerar usar redes certificadas para este tipo de usos.

 

Todas las cubiertas de huecos deben estar aseguradas cuando se instalen para evitar el desplazamiento accidental por el viento, el equipo o los empleados; adicionalmente estas tapas o cubiertas deben indicar con un aviso la presencia de un hueco o agujero para advertir sobre el peligro.

 

Esta disposición no se aplica a las tapas de alcantarilla, redes o ductos de servicios públicos ni a las rejillas de diferentes materiales utilizadas en calles o carreteras.

 

g) Manejo de desniveles: Se deben demarcar, señalizar y/o cubrir desniveles que se encuentran en la superficie donde se trabaja o camina.

 

En estructuras, cuando se diseñen sistemas para tránsito entre desniveles se deben utilizar medidas que permitan la comunicación entre ellos, disminuyendo el riesgo de caída, tales como rampas con un ángulo de inclinación de 15° a 30°, o escaleras con medida mínima de huella y de contrahuella según su ángulo de inclinación, conforme a lo establecido en la Tabla No 4; deben ser de superficies antideslizantes:

 

Tabla número 4

 

MEDIDAS MÍNIMAS PARA HUELLA Y CONTRAHUELLA SEGÚN ÁNGULO DE INCLINACIÓN DE ESCALERA

 

ANGULO/HORIZONTAL

MEDIDA CONTRAHUELLA

EN CENTÍMETROS

MEDIDA HUELLA

CENTÍMETROS

30 Grados

16.51

27.94

32 Grados

17.14

27.3

33 Grados

17.78

26.67

35 Grados

18.41

26.03

36 Grados

19.05

25.4

38 Grados

19.68

24.76

40 Grados

20.32

24.13

41 Grados

20.95

23.49

43 Grados

21.59

22.86

45 Grados

22.22

22.22

46 Grados

22.86

21.59

48 Grados

23.49

20.95

49 Grados

24.13

20.32

 

Cuando se realicen trabajos sobre planos inclinados, se deberá garantizar que la resistencia en la superficie por donde se transitará sea de mínimo dos (2) veces la carga máxima prevista que pueda llegar a soportar, y de su grado de inclinación dependerá el equipo de protección a utilizar.

 

El trabajo realizado sobre tejados, cubiertas o superficies inclinadas de 15° a 45 se deberá implementar un sistema individual de protección contra caídas que permita al trabajador desarrollar los desplazamientos controlados y de forma segura.

 

Todas las medidas de manejo de desniveles deben contar con una protección del borde o bordes desprotegidos en áreas donde se supere una altura de 1,5 metros.

 

h) Ayudante de seguridad: Se podrá asignar un ayudante de seguridad, como medida complementaria a las medidas anteriormente enunciadas, con el fin de apoyar, advertir y controlar los peligros y riesgos existentes en el sitio donde se desarrollen trabajos en alturas.

 

Artículo 14. Procedimientos. El empleador o contratante debe documentar los procedimientos de trabajo seguro para cada una de las tareas que se vayan a desarrollar en alturas, teniendo en cuenta los siguientes aspectos:

 

a) Para los efectos de la presente Resolución, se entiende por procedimiento de trabajo seguro la forma específica, detallada y segura de llevar a cabo una actividad o un proceso.

 

b) Estos procedimientos deben ser divulgados a todos los trabajadores involucrados previamente a la realización del trabajo.

 

c) Estos procedimientos deben ser revisados y ajustados cuando cambien las condiciones de trabajo, ocurra algún incidente o accidente, se modifiquen las normas que puedan afectar a los mismos y/o los indicadores de gestión así lo definan.

 

d) Los procedimientos para utilizar en tareas rutinarias deben ser aprobados y validados por el coordinador de TA y contar con una lista chequeo.

 

Artículo 15. Permiso de trabajo en alturas. Todos los trabajos en alturas deben obedecer a una acción planificada, organizada y ejecutada por trabajadores autorizados que debe verse reflejada en los controles administrativos como el Permiso de trabajo o sus anexos.

 

Siempre que un trabajador ingrese a una zona de peligro, debe contar con la debida autorización y si requiere exponerse al riesgo de caídas, debe contar con un aval a través de un permiso de trabajo en alturas acompañado de una lista de chequeo, más aún en caso de que no haya barandas, sistemas de control de acceso, demarcación o sistemas de barreras físicas que cumplan con las especificaciones descritas en la presente Resolución.

 

El empleador o contratante debe implementar un procedimiento para los permisos de trabajo, previo al inicio del trabajo en alturas.

 

El formato de permiso de trabajo debe contener como mínimo lo siguiente:

 

Nombre(s) del(los) trabajador(es).

 

1. Tipo de trabajo.

 

2. Altura aproximada a la cual se va a desarrollar la actividad.

 

3. Fecha y hora de inicio y de terminación de la tarea.

 

4. Verificación de la afiliación vigente a la seguridad social.

 

5. Requisitos del trabajador (requerimientos de aptitud).

 

6. Descripción y procedimiento de la tarea.

 

7. Sistema de prevención contra caídas.

 

8. Equipos, sistema de acceso para trabajo en alturas.

 

9. Verificación de los puntos de anclaje por cada trabajador.

 

10. Sistemas de restricción, posicionamiento o detención de caídas a utilizar.

 

11. Elementos de protección personal seleccionados por el empleador teniendo en cuenta los riesgos y requerimientos propios de la tarea, conforme a lo dispuesto en la presente Resolución.

 

12. Herramientas para utilizar.

 

13. Constancia de capacitación o certificado de competencia laboral para prevención para caídas en trabajo en alturas.

 

14. Observaciones.

 

15. Nombres y apellidos, firmas, clase de documento y número de los documentos de identificación de los trabajadores.

 

16. Nombre, apellido y firma de la persona que autoriza el trabajo.

 

17. Nombre y firma de la persona responsable de activar el plan de emergencias y,

 

18. Nombre, apellido y firma del coordinador de trabajos en alturas (cuando es diferente de la persona que autoriza el trabajo).

 

Cuando se designe un ayudante de seguridad como medida de prevención dentro de un trabajo, en el permiso de trabajo se debe evidenciar esta designación.



El permiso de trabajo en alturas debe tener en cuenta las medidas para garantizar que se mantenga una distancia segura entre el trabajo y líneas o equipos eléctricos energizados y que se cuente con los elementos de protección necesarios, acordes con el nivel de riesgo (escaleras dieléctricas, parrillas, EPP dieléctrico, arco eléctrico, entre otros.).

 

De igual manera el permiso de trabajo debe tener en cuenta el análisis de los demás riesgos del trabajo y las condiciones medioambientales externas que pueden cambiar el desarrollo de las mismas. Lo anterior debe verse reflejado en un formato de análisis de peligros por actividad (ARO, ATS, o cualquier otra metodología)

 

El procedimiento debe contemplar los mecanismos de revalidación del permiso de trabajo (cuando hay cambios de turno, cambios de coordinador, cambios de trabajadores autorizados, cambios de autoridades que validen el permiso, cambios de las condiciones iniciales del trabajo, entre otros), la cancelación, suspensión y cierre del mismo. De igual manera el procedimiento debe contemplar las responsabilidades de contratantes y contratistas cuando los trabajos sean realizados por estos últimos.

 

Parágrafo 1°. El empleador debe implementar las estrategias, medios o mecanismos técnicos o tecnológicos que considere pertinentes para evitar el incumplimiento de la expedición del permiso de trabajo en alturas y sus respectivas validaciones o firmas conforme a lo establecido en la presente Resolución.

 

Parágrafo 2°. El coordinador de trabajo en alturas podrá obrar como trabajador autorizado cubierto bajo la misma autorización cuando las condiciones particulares de un trabajo así lo requieran o cuando su trabajo implique la exposición al riesgo de caídas. Para tal fin el Coordinador debe cumplir los requisitos definidos en la presente Resolución para trabajador autorizado.

 

Parágrafo 3°. Este permiso de trabajo en alturas debe ser diligenciado, por el(los) trabajador(es) o por el empleador y debe ser revisado y suscrito por el coordinador de trabajo en alturas en cada evento.

 

CAPÍTULO III.

 

Sistemas de Acceso y de Trabajo

 

Artículo 16. Sistemas de acceso para trabajo en alturas. Se consideran como sistemas de acceso para trabajo en alturas: los andamios, las escaleras, los elevadores de personal, y todos aquellos medios cuya finalidad sea permitir el acceso y/o soporte de trabajadores a lugares para desarrollar trabajo en alturas.



Todo sistema de acceso para trabajo en alturas y sus componentes, debe cumplir las siguientes condiciones o requisitos para su selección y uso:

 

1. Deben ser certificados acordes al estándar específico aplicable para el sistema de acceso seleccionado y el fabricante debe proveer información en español, sobre las principales características del sistema, un manual y/o catálogo de partes con sus características de ingeniería, recomendaciones de almacenamiento, mantenimiento, inspección y medidas de seguridad en su arme y desarme (cuando aplique), uso y operación.

 

2. Ser inspeccionados debidamente conforme a lo regulado en el Decreto 1072 de 2015 o la norma que lo modifique o sustituya.

 

3. Los sistemas elevadores de personas también deben ser inspeccionados mínimo una vez al año por una persona avalada por el fabricante o una persona calificada conforme a las recomendaciones del fabricante o las normas nacionales o internacionales vigentes.

 

4. Si existen no conformidades, el sistema debe retirarse de servicio y enviarse a mantenimiento (si aplica) por parte del fabricante o de una persona avalada por el fabricante o que el mantenimiento sea aprobado por una persona calificada, o eliminarse si no admite mantenimiento

 

5. Ser seleccionados de acuerdo con las necesidades específicas de la actividad económica, la tarea a desarrollar y los peligros identificados por el responsable del SGSST, el administrador del programa de prevención y protección contra caídas y/o el coordinador de trabajo en alturas.

 

6. Ser compatibles entre sí, en tamaño, figura, materiales, forma, diámetro y estas características deben ser avaladas por el coordinador de trabajo en alturas y en caso de dudas, deben ser aprobados por una persona calificada o por una persona avalada por el (los) fabricantes.

 

7. Todo sistema de acceso debe garantizar la resistencia en todos sus componentes a las cargas con un factor de seguridad, que garantice la seguridad de la operación, de acuerdo con la máxima fuerza a soportar, cumpliendo con los criterios mínimos de auto estabilidad y auto soportabilidad, acorde con los requisitos establecidos por el fabricante o en las normas nacionales y/o internacionales, incluyendo protección por corrosión o desgaste por sustancias o elementos que deterioren la estructura del mismo.

 

8. En el caso de sistemas suspendidos por cables (andamios o canastas para transporte de personal), del tipo eléctrico, neumático o manual, lo correspondiente a cables, conectores, poleas, y cualquier otro componente del sistema, debe ser certificado, o hacer parte original de un sistema de andamios certificado y/o, contar con diseños de ingeniería. El equipo y sus partes deben garantizar un factor de seguridad que garantice la seguridad de la operación, en caso de dudas, estos sistemas deben ser aprobados por una persona calificada.

 

9. En el caso de sistemas suspendidos por cables (andamios o canastas para transporte de personal), del tipo eléctrico, neumático o manual, los contrapesos usados deben ser instalados acorde a los manuales del fabricante y/o contar con diseños de ingeniería aprobados por una persona calificada, en caso de plataformas que no usen contrapesos, el sistema de soporte debe contar con diseños de ingeniería aprobados por una persona calificada.

 

10. Se debe tener una hoja de vida de los equipos elevadores de personas, escaleras, y andamios en los cuales sus partes cuentan con un solo diseño, donde estén consignados como mínimo los datos de: marca, serial, fecha de fabricación, tiempo de vida útil, historial de uso, registros de inspección, registros de mantenimiento, ficha técnica, certificación del fabricante y observaciones. En sistemas de acceso que se encuentren por partes, donde no es posible tener hojas de vida, y el empleador los usa en diferentes configuraciones, se deben tener identificadas las partes de diferentes marcas y/o referencias y mantener los registros de inspección. En sistemas de acceso alquilados el proveedor debe suministrar esta información para la trazabilidad de su uso e inspecciones durante el uso por parte del tenedor.

 

11. El mantenimiento de los sistemas de acceso deberá ser realizado de acuerdo con las especificaciones del fabricante y registrados en la hoja de vida del equipo.

 

12. El montaje y operación de todo sistema de acceso para trabajo en alturas, debe garantizar una distancia segura entre este y las líneas o equipos eléctricos energizados de acuerdo al Reglamento Técnico de Instalaciones Eléctricas (RETIE).

 

Parágrafo. Aunque esta Resolución incluye solo elementos certificados, los pretales para el acceso a postes no caben en esta categoría; se permitirá su uso como la última opción para acceso a postes y con previa autorización del Administrador del programa de prevención y protección contra caídas de altura, siempre y cuando no sea posible la utilización de otros sistemas de acceso, con la condición que para su uso se empleen sistemas certificados de protección contra caídas para el tránsito vertical y la seguridad del trabajador. De ninguna forma se consideran los pretales como un sistema de protección contra caídas.

 

Si se hace indispensable la utilización de los pretales, deberá usarse un pretal como mecanismo de anclaje portátil de uso esternal al poste o anclaje portátil regulable certificado que permita abrazar el poste y los otros dos pretales para maniobra de ascenso y descenso.

 

Artículo 17. Lineamientos de uso de escaleras verticales fijas. Las escaleras que sean utilizadas para trabajo seguro en alturas deberán contar con las certificaciones y sistemas de protección de caídas que se ajusten a estas, sobre el particular dispongan las respectivas comisiones de seguridad y salud en el trabajo por sector económico del Ministerio de Trabajo las cuales serán emitidas conforme a la actividad económica de cada comisión.

 

Siempre el empleador deberá velar por las medidas de prevención y protección contra caídas que garanticen la seguridad del trabajador en la utilización de esta clase de equipos.

 

Artículo 18. Lineamientos para el uso seguro de estructuras modulares de acceso para trabajo en alturas. El montaje y/u operación de toda estructura de acceso para trabajo en alturas, debe ser inspeccionado por el coordinador de trabajo en alturas una persona avalada conforme a las instrucciones dadas por el fabricante o una persona calificada, atendiendo las normas nacionales o en su defecto las internacionales y de acuerdo con las disposiciones de prevención y protección establecidas en la presente Resolución, su armado deberá cumplir con las condiciones técnicas y de seguridad con previa capacitación y certificación de armado expedida por el fabricante.

 

Se debe garantizar completa estabilidad y seguridad del sistema de acceso para trabajo en alturas, de tal forma que este no sufra volcamiento o caída, incluyendo verificar la estabilidad del suelo para la carga a aplicar. Para las estructuras que superen en altura el nivel de auto estabilidad (definido por el fabricante o una norma nacional o internacional aplicable) y acorde a las condiciones de uso (interiores o exteriores), esta verificación debe hacer parte integral del permiso de trabajo y debe responder a un diseño realizado por una persona calificada considerando los parámetros consignados en los manuales entregados por el fabricante.

 

Todo sistema de acceso para trabajo en alturas debe ser instalado de manera que se respete su relación de esbeltez para una configuración auto soportada o debe estar debidamente asegurado en forma vertical y/u horizontal, conforme a las especificaciones de uso descritas por el fabricante.

 

El uso de equipos de izaje de cargas sobre sistemas de acceso debe ser avalada por el fabricante o por una persona calificada, que garantice la estabilidad y resistencia de este para evitar volcamiento.

 

El sistema de acceso que cuente con una plataforma debe cubrir la totalidad de la superficie de trabajo y contar con sistema de barandas que cumpla con las disposiciones establecidas en la presente Resolución.

 

Cuando se usen torres de andamios móviles (andamios sobre ruedas) se cumplirán las recomendaciones e instrucciones del fabricante para los traslados. Esta operación debe ser evidenciable en el alcance de los permisos de trabajo y ser supervisada por el coordinador de trabajo en alturas garantizando que nunca se realiza con personas sobre el andamio.

 

El trabajo en sistemas de acceso debe incluir el análisis de riesgos para determinar los sistemas de prevención y protección contra caídas aplicables, considerando para su selección la compatibilidad de las conexiones al sistema de acceso y las instrucciones de los fabricantes.

 

El trabajador que tenga la función de realizar el armado y desarmado de andamios y el trabajador que opere equipos para elevación de personas deben contar con capacitación especifica enfocada en la seguridad durante las operaciones y atendiendo las instrucciones de los fabricantes y/o las normas nacionales o internacionales aplicables.

 

Artículo 19. Trabajo en suspensión. Los trabajos en suspensión deben ser realizados utilizando una silla para trabajo en alturas, que esté conectada a la argolla del arnés indicada por el fabricante y al sistema de descenso certificado.

 

Todos los componentes del sistema de acceso por cuerdas, sistemas de ascenso, descenso y posicionamiento prearmados o motorizados deben estar certificados de acuerdo con las normas nacionales o internacionales aplicables.

 

Adicionalmente, el trabajador estará asegurado a un segundo sistema de seguridad (ejemplo un sistema de línea de vida vertical portátil), instalado con un anclaje independiente.

 

Parágrafo. Los planos inclinados mayor a 45°, por su grado de inclinación se considera un trabajo en suspensión, por lo que deberán cumplir con los lineamientos establecidos en este artículo y que permita al trabajador desarrollar los desplazamientos controlados y de forma segura.

 

CAPÍTULO IV

 

Otros Sistemas

 

Artículo 20. Sistemas de restricción. Deben contar con anclaje(s) capaces de soportar una fuerza mínima de 1.000 libras por persona conectada (4,5 kilo newtons - 459 kgf) o si están diseñados por una persona calificada, como parte de un sistema completo de restricción plenamente identificado, deben ser capaces de soportar la fuerza estática equivalente al doble de la fuerza prevista. Su ubicación y diseño evita que el trabajador se acerque al borde garantizando como mínimo una distancia de 60 cm entre el borde y el trabajador.

 

Los conectores para restricción de caídas tienen como función asegurar al trabajador a un punto de anclaje sin permitir que este se acerque a menos de 60 cm de un borde desprotegido. Estos conectores podrán ser de fibra sintética, cuerda, cable de acero u otros materiales con una resistencia mínima de 5.000 libras (22,2 kilo newtons - 2.272 kg) y debe ser certificado.

 

Artículo 21. Sistemas de posicionamiento. Deben contar con anclaje(s) o estructuras capaces de soportar una fuerza mínima de 3.000 libras por persona conectada (13.3 kilo newtons - 1.356 kgf) o si están diseñados por una persona calificada, como parte de un sistema de posicionamiento plenamente identificado, deben ser capaces de soportar la fuerza estática equivalente al doble de la fuerza prevista. Su uso evita que el trabajador pueda tener una caída superior a 60 cm.

 

Cuando los riesgos de caída están presentes, los sistemas de posicionamiento deben ser usados en conjunto con sistemas personales de detención de caídas anclados independientemente.

 

Los conectores de posicionamiento tienen la finalidad de permitir que el trabajador se ubique en un punto específico a desarrollar su labor, evitando que la caída libre sea de más de 60 cm y deben estar certificados. Los conectores de posicionamiento deben tener una resistencia mínima de 5.000 libras (22,2 kilo newtons - 2.272 kg). Estos conectores podrán ser de cuerda, banda de fibra sintética, cadenas, mosquetones de gran apertura u otros materiales que garanticen una resistencia mínima de 5.000 libras (22,2 kilo newtons - 2.272 kg).

 

CAPÍTULO V

 

Medidas de Protección Contra Caídas en Alturas

 

Artículo 22. Medidas de protección contra caídas en alturas. El empleador o contratante debe definir las medidas de protección a ser utilizadas en cada sitio de trabajo donde exista por lo menos una persona trabajando en alturas ya sea de manera rutinaria o no rutinaria, estas medidas deben estar acordes con la actividad económica y tareas que la componen.

 

El uso de medidas de protección no exime al empleador de su obligación de implementar medidas de prevención previas. Deben estar identificadas y deben ser incorporadas al programa de prevención y protección contra caídas y estar acorde con los requisitos establecidos en la presente Resolución. El conjunto de acciones individuales o colectivas que se implementan para detener la caída de personas y objetos deberán cumplir como mínimo con las siguientes características:

 

1. Los elementos o equipos de los sistemas de protección contra caídas deben ser certificados y compatibles entre sí en tamaño, figura, materiales, forma, diámetro.

 

2. Los equipos de protección contra caídas se deben seleccionar y usar según las necesidades determinadas para un trabajador, las condiciones, tipo de la tarea y los sistemas de acceso a utilizar. Todo sistema seleccionado debe: garantizar la seguridad del trabajador al momento de una caída, permitir la distribución de fuerza, amortiguar la fuerza de impacto, garantizar la resistencia de los componentes y estar protegido ante la corrosión o ser aislantes eléctricos, antiestáticos o ignífugos cuando se requieran brindando las demás protecciones a los riesgos asociados que sean requeridas.

 

3. Los equipos de protección personal para trabajos en alturas se seleccionarán tomando en cuenta los peligros identificados y los riesgos valorados del SG-SST y en el programa de prevención y protección contra caídas que sean propios de la labor y sus características, tales como condiciones atmosféricas, presencia de sustancias químicas, espacios confinados, posibilidad de incendios o explosiones, contactos eléctricos, superficies calientes o abrasivas, trabajos con soldaduras, entre otros. Igualmente, se debe tener en cuenta las condiciones fisiológicas del individuo con relación a la tarea y su estado de salud en general. Se deben proteger contra agentes externos que puedan afectar su integridad tales como bordes, filos, cortes, abrasiones, fuentes químicas o de calor excesivo o chispas, entre otros.

 

Parágrafo 1°. Todo sistema y/o equipo sometido a una caída debe ser retirado de la operación y no podrá volver a ser utilizado hasta que sea avalado por el fabricante o por una persona calificada; en el caso de los dispositivos retráctiles u otros equipos cuya restauración está prevista en las normas técnicas nacionales o en su defecto, en las normas internacionales y/o de acuerdo con las recomendaciones del fabricante podrán ser enviados a reparación por el fabricante o uno de sus representantes autorizados para tal fin.

 

Parágrafo 2. Los sistemas de protección contra caídas y puntos de anclaje diseñados por una persona calificada, entre otros, deben contar con todos los soportes documentales que justifiquen sus condiciones de operación.

 

Artículo 23. Clasificación de las medidas de protección contra caídas. Son aquellas implementadas para detener la caída, una vez ocurra, o mitigar sus consecuencias.



Para los fines de esta Resolución, las medidas de protección se clasifican en pasivas y activas:

 

1. Medidas pasivas de protección contra caídas: Los sistemas de red de seguridad para la detención de caídas tienen el propósito de detener la caída del trabajador y objetos evitando lesiones.

 

La red para detención de escombros debe ser independiente a la red para personas y cumplir con las especificaciones de instalación, uso, inspección y mantenimiento del fabricante.

 

La red de seguridad debe ser certificada e instalada para soportar el impacto de la caída del trabajador según su diseño. Así mismo, debe ser instalada bajo la aprobación de una persona calificada quien verificará las condiciones de seguridad establecidas por el fabricante, el diseño de la red y las distancias de caída.

 

Todos los componentes del sistema de red de seguridad deben estar certificados y el diseño para su instalación debe ser realizado por una persona calificada o suministrado por el fabricante.

 

La instalación, mantenimiento e inspección deben ser realizados por una persona avalada por el fabricante o por una persona calificada.

 

Todo sistema de red de seguridad debe tener una hoja de vida en donde estén consignados los datos de: fecha de fabricación, usos anteriores, registros de inspecciones, certificaciones, antes de ponerlo en funcionamiento.

 

El uso de las redes debe ser realizado acorde a las indicaciones del fabricante.

 

2. Medidas activas de protección contra caídas:

 

Todos los elementos y equipos de protección contra caídas deben ser inspeccionados antes de cada uso por parte del trabajador y garantizar su buen estado durante el trabajo. Deben contar con una hoja de vida, deben ser certificados y deben ser resistentes a la fuerza, al envejecimiento, a la abrasión, la corrosión y al calor. Dentro de las principales medidas activas de protección, se tienen:

 

a) Anclaje: Elementos diseñados para la conexión de adaptadores de anclaje o directamente un equipo de protección contra caídas, deben ser capaces de soportar mínimo 5.000 libras (22,2 kilo newtons - 2.272 kg) por persona conectada o si están diseñados por una persona calificada como parte de un sistema completo de protección personal contra caídas plenamente identificado, deben ser capaces de soportar la fuerza máxima de la caída manteniendo como mínimo un factor de seguridad de dos (2) teniendo en cuenta todas las condiciones normales de uso del anclaje. Máximo se puede conectar dos trabajadores a un mismo mecanismo de anclaje fijo, caso en los cuales deberá poseer el doble de la capacidad exigida certificada.

 

Los puntos de anclaje deben ser seleccionados o instalados de modo que la persona no se golpee contra el nivel inferior o se golpee con estructuras derivadas del efecto de péndulo.

 

Cuando un anclaje responde a un diseño de ingeniería, después de instalado, debe ser probado por una persona calificada, a través de una metodología probada por autoridades nacionales o internacionales reconocidas emitiendo un documento donde se certifique la realización de dicha prueba, deberá contar con los planos y memorias de cálculo firmados por una persona calificada que garanticen el cumplimiento de lo establecido en la presente Resolución y demás normas nacionales o internacionales aplicables.

 

b) Dispositivos de anclaje portátiles o adaptadores de anclaje portátiles: Dispositivos de tipo portátil que abrazan o se ajustan a una determinada estructura y que deben ser capaces de resistir mínimo 5.000 libras (22,2 kilo newtons - 2.272 kg); tienen como función ser puntos seguros de acoplamiento para los ganchos de los conectores, cuando estos últimos no puedan conectarse directamente a la estructura de anclaje.

 

c) Líneas de vida horizontales: Podrán ser fijas o portátiles. Las líneas de vida horizontales fijas deben ser diseñadas y aprobadas en su instalación por una persona calificada la cual debe considerar para su diseño un factor de seguridad no menor que dos (2) en todos sus componentes y podrán o no contar con sistemas absorbentes de energía de acuerdo con los cálculos de ingeniería. Cuando se trate de líneas de vida horizontales fijas, el instalador deberá contar con el aval del fabricante.

 

Deben contar con deslizadores como: anillos, poleas, carros, u otros sistemas certificados definidos por el fabricante o diseñador para conectar ganchos, mosquetones u otros dispositivos de conexión de los equipos de restricción y/o detención de caídas. En su selección y uso se considerará su aplicabilidad teniendo en cuenta los requerimientos de claridad descritos por el fabricante.

 

La línea de vida horizontal portátil debe cumplir con lo siguiente:

 

i) Cuando la persona calificada determine que se requiere dentro del diseño el uso de absorbedor de energía, podrá ser instalado por un trabajador autorizado, conforme a las recomendaciones del fabricante.

 

ii) Sus componentes deben estar certificados;

 

iii) Debe ser instalada entre puntos de anclaje que cumplan con la resistencia mínima indicada por el fabricante acorde al número de usuarios permitidos en la línea;

 

iv) No debe ser sobre tensionada, y

 

v) Máximo se pueden conectar dos personas a la misma línea.

 

La línea de vida horizontal fija debe cumplir con lo siguiente:

 

i) En el diseño de líneas de vida horizontales, se debe asegurar que no se supere la resistencia de la estructura.

 

ii) El cable a emplear para líneas de vida horizontales, debe ser en acero con alma de acero de diámetro nominal igual o mayor a 5/16” (7,9 mm). En caso de tener líneas de vida temporales, pueden ser en acero con alma de acero y diámetro nominal igual o mayor a 5/16” (7,9 mm), o ser en materiales sintéticos que cumplan con la resistencia mínima de 5.000 lb (22,2 kilo newtons - 2.272 kg) por persona conectada.

 

iii) Si la línea de vida horizontal fija es instalada en un ambiente donde pueda ser afectada por corrosión, el empleador debe garantizar como mínimo una revisión anual conforme con las condiciones y recomendaciones establecidas por el fabricante.

 

iv) El sistema será diseñado por una persona calificada, y deben ser instaladas por una persona avalada por el fabricante.

 

Para proteger la línea de vida y la estructura (punto de anclaje), la persona calificada debe considerar si se requiere o no un absorbedor de energía en estos casos, su longitud posterior a la activación debe ser tenida en cuenta en los cálculos del requerimiento de claridad.

 

Los sistemas de riel deben ser certificados por el fabricante o la persona calificada que lo diseña;

 

d) Líneas de vida verticales: Son sistemas certificados anticaídas, fabricados en materiales con resistencia mínima de 5.000 lb (22,2 kilo newtons - 2.272 kg) por persona conectada, y que, debidamente anclados en un punto superior a la zona de labor, protegen al trabajador en su desplazamiento vertical (ascenso/descenso).



La línea de vida vertical fija debe cumplir con lo siguiente:

 

i) Se instalan en estructuras donde el ascenso vertical debe ser protegido y este es el mecanismo seleccionado.

 

ii) Deberán contar con puntos intermedios según recomendaciones del fabricante y la persona calificada.

 

iii) Cuando la persona calificada determine que se requiere dentro del diseño el uso de absorbedor de impacto para evitar sobrecargar en el anclaje que puede estar en el sistema, en el arrestador de caídas o en ambos.

 

iv) Él o los puntos de fijación del sistema en la parte superior deben cumplir con las

especificaciones de carga y tensión definidos por el fabricante.

 

v) El sistema será diseñado por una persona calificada, y deben ser instaladas por una persona avalada por el fabricante.

 

La línea de vida vertical portátil debe cumplir con lo siguiente:

 

i) Deben ser en cable de acero de diámetro nominal entre 5/16” (7,9 mm) a 3/8” (9,5 mm) o de cuerda entre 11 mm y 16 mm que cumplan con la resistencia mínima de 5.000 lb (22,2 kilo newtons - 2.272 kg).

 

ii) Las líneas de vida en cuerda no deben tener nudos en el extremo de su anclaje.

 

iii) Sus componentes deben estar certificados, y

 

iv) Deben ser instaladas en anclajes (puede ser uno o más de uno) que permitan la resistencia necesaria de acuerdo con esta Resolución.

 

Los elementos o equipos de las líneas de vida vertical deben ser compatibles entre sí, en tamaño, figura, materiales, forma, diámetro y garantizar que en una caída generen fuerzas de arrestamiento inferiores a la MFD definida en la presente Resolución. Compatibles no significa necesariamente que sean de la misma marca; Los anclajes que responden a un diseño de ingeniería, las líneas de vida horizontales fijas y verticales fijas deben poseer un sistema de identificación que indique como mínimo:

 

- Fecha de instalación y última inspección.

 

- Resistencia.

 

- Marca, referencia y serial.

 

- Uso (restricción, posicionamiento, detención).

 

- Número de usuarios permitido.

 

Los anclajes que responden a un diseño de ingeniería, las líneas de vida horizontales y verticales fijas deben poseer una hoja de vida donde se indique como mínimo:

 

- Tipo de anclajes (detención, restricción, línea de vida vertical u horizontal).

 

- Marca, referencia y serial.

 

- Instalador.

 

- Resistencia.

 

- Ubicación.

 

- Fecha de instalación.

 

- Persona calificada que lo aprobó.

 

- Registro de inspecciones y/o pruebas.

 

Los anclajes que responden a un diseño de ingeniería, las líneas de vida horizontales fijas y verticales fijas deben ser inspeccionadas y mantenidas de acuerdo a los parámetros del fabricante, de la norma de certificación que cumpla, o de la presente norma, dejando registros de las mismas.

 

e) Conectores: Existen diferentes conectores dependiendo el tipo de tarea a realizar; deben ser certificados y se deben seleccionar conforme a la siguiente clasificación:

 

i) Ganchos de seguridad: Equipos que cuentan con un sistema de cierre de doble seguridad, para evitar su apertura involuntaria, con resistencia mínima de 5.000 libras (22.2 kilo newtons - 2.272 kg). Están provistos de una argolla u ojo al que está asegurado al equipo conector y permiten unir el arnés al punto de anclaje. No deben tener bordes filosos o rugosos que puedan cortar o desgastar por fricción, los cabos o las correas o lastimar al trabajador. La dimensión del gancho se seleccionará acorde a la compatibilidad con el punto de anclaje al que será conectado.

 

ii) Conectores o ganchos especiales: Equipos que pueden contar con un sistema de cierre de doble seguridad u otro sistema para evitar su apertura involuntaria, con resistencia mínima de 5.000 libras (22.2 kilo newtons - 2.272 kg). Se dimensionarán para que sean compatibles con el elemento o sistema de seguridad al que están conectados. Están provistos de una argolla u ojo al que está asegurado al equipo conector y permiten unir el arnés al punto de anclaje.

 

iii) Mosquetones: Deben tener cierre de bloqueo automático que requieren al menos dos movimientos consecutivos separados para abrirse para aplicaciones de trabajo en alturas, deben ser certificados, con una resistencia mínima certificada de 5.000 libras (22,2 kilo newtons - 2.272 kg). El uso de mosquetones roscados queda prohibido en los sistemas de protección contra caídas.

 

iv) Conectores para detención de caídas: Equipos que incorporan un sistema absorbedor de energía o mecanismos que disminuyen la fuerza de impacto, reduciendo la probabilidad de lesiones provocadas por la misma. Estos conectores, sin importar su longitud están clasificados en:

 

- Eslingas con absorbedor de energía Tienen una longitud máxima de 1,8 m según su uso, y al activarse por efecto de la caída, permiten una elongación del absorbedor acorde a la distancia de caída libre máxima para la cual fue diseñado amortiguando los efectos de la caída. Tienen la capacidad de reducir las fuerzas de impacto al cuerpo del trabajador, a máximo el MFD definido en la presente norma.

 

- Dispositivos retráctiles: Equipos certificados cuya longitud de conexión es variable, permitiendo movimientos verticales del trabajador y en planos horizontales que no superen las especificaciones de diseño del equipo.

 

v) Conectores para Tránsito Vertical (Frenos): Aplican exclusivamente sobre líneas de vida vertical, y se clasifican en:

 

- Freno arrestador para líneas de vida fijas: Deben ser compatibles con el diseño y diámetro de la línea de vida vertical y para su conexión al arnés, deben contar con un gancho de doble seguro o un mosquetón de cierre automático con resistencia mínima de 5.000 libras (22,2 kilo newtons - 2.272 kg). Los Frenos para líneas de vida fijas y todos sus componentes deben ser certificados, y

 

- Freno arrestador para líneas de vida portátiles: Se debe garantizar una compatibilidad con los diámetros de la línea de vida vertical y los separadores intermedio. Los frenos podrán integrar un sistema absorbedor de energía y para su conexión al arnés, debe contar con un gancho de doble seguro o un mosquetón de cierre automático con resistencia mínima de 5.000 libras (22,2 kilo newtons - 2.272 kg). Los frenos para líneas de vida portátiles y todos sus componentes deben estar certificados.

 

Bajo ninguna circunstancia los frenos se podrán utilizar como puntos de anclaje para otro tipo de conectores, salvo los diseñados por el fabricante. No se admiten nudos como reemplazo de los frenos.

 

f) Arnés cuerpo completo: El arnés debe ser certificado y tener una capacidad de mínimo 140 kg incluyendo uniforme, equipos y cualquier herramienta de trabajo del trabajador. El arnés debe contar con argollas acorde a las necesidades de uso. El ancho de las correas que sujetan al cuerpo durante y después de detenida la caída, será mínimo de 1- 5/8 pulgadas (41 mm).

 

El arnés y sus herrajes deben cumplir con los requerimientos de marcación conforme con las normas nacionales e internacionales vigentes.

 

Parágrafo. En el caso de que un sistema haya sufrido el impacto de una caída, se debe retirar inmediatamente de servicio y solo podrán ser utilizados de nuevo, cuando todos sus componentes sean inspeccionados y evaluados por una persona avalada por el fabricante de los mismos, o una persona calificada, para determinar si deben retirarse de servicio o pueden ser puestos en operación.

 

Artículo 24. Elementos de protección personal para trabajo en alturas. Los elementos de protección personal son el último control y deben ser usados en conjunto con otras medidas de prevención y control de acuerdo con la jerarquización de controles aplicables a la prevención y la protección contra caídas establecida por el Decreto 1072 de 2015 y la presente Resolución. Los elementos de protección personal deben estar certificados (cuando existan normas que apliquen al EPP específico) y suministrados por el empleador. Serán seleccionados de acuerdo con lo establecido en el Sistema de Seguridad y Salud en el Trabajo, incluidos los protocolos de bioseguridad definidos en los programas de vigilancia epidemiológica.



Los equipos y EPP que correspondan deberían poseer como mínimo:

 

- Registro inspección pre uso.

 

- Ficha técnica.

 

- Hoja de vida.

 

- Certificado de conformidad.

 

Artículo 25. Medidas para evitar la caída de objetos. El empleador suministrará los elementos necesarios que permitan portar, transportar y asegurar herramientas, materiales, equipos y objetos que puedan caer y estos deben estar documentados dentro del programa de prevención y protección contra caídas.

 

Artículo 26. Plan de emergencias. Todo empleador y/o contratante que dentro de sus riesgos cotidianos tenga incluido el de caída por trabajo en alturas, debe incluir dentro del plan de prevención, preparación y respuesta ante emergencias establecido en el numeral 12 del artículo 2.2.4.6.12 y el artículo 2.2.4.6.25 del Decreto 1072 de 2015, un capítulo escrito de trabajo en alturas que debe ser practicado y verificado, acorde con las actividades que se ejecuten y que garantice una respuesta organizada y segura ante cualquier incidente o accidente que se pueda presentar en el sitio de trabajo, incluido un plan de rescate; para su ejecución puede hacerlo con recursos propios o contratados. Se debe garantizar que el personal destinado para la atención de emergencias en cada actividad haya participado en la práctica de simulacros y la verificación del mismo.

 

En el plan de rescate, diseñado acorde con los riesgos de la actividad en alturas desarrollada, se deben asignar equipos de rescate certificados para toda la operación y contar con brigadistas o personal capacitados para tal fin.

 

Se dispondrá para la atención de emergencias y para la prestación de primeros auxilios de: botiquín, elementos para inmovilización y atención de heridas, hemorragias y demás elementos que el empleador considere necesarios de acuerdo con el nivel de riesgo.

 

El empleador debe asegurar que el trabajador que desarrolla trabajo en alturas cuente con una persona de apoyo disponible para que, de ser necesario, reporte de inmediato y active el plan de emergencias.

 

Parágrafo. Las empresas podrán compartir recursos para implementar el plan de emergencias dentro de los planes de ayuda mutua.

 

TÍTULO III.

 

PROCESOS DE CAPACITACIÓN, ENTRENAMIENTO Y GESTIÓN DE LOS CENTROS DE ENTRENAMIENTO

 

CAPÍTULO I

 

Disposiciones Generales de Capacitación y Entrenamiento

 

Artículo 27. Contenidos de los programas de capacitación. Los programas de capacitación y entrenamiento en protección contra caídas para trabajo en alturas hacen parte integral de la capacitación para la seguridad industrial y del programa de capacitación del SG-SST de la empresa, por lo tanto, se regirán por las normas establecidas en el Ministerio del Trabajo.

 

El programa de capacitación es el documento estructurado y organizado que describe un conjunto de actividades de aprendizaje teórico-práctico de trabajo en alturas, con el fin de proporcionar conocimiento y desarrollar habilidades en una persona (aprendiz). Los programas de capacitación y entrenamiento en protección contra caídas para trabajo en alturas hacen parte integral de la formación complementaria del trabajador y fortalecen el proceso de inducción y reinducción dentro de la empresa, proporcionan oportunidades a los trabajadores para obtener el conocimiento, la destreza, la práctica y las habilidades requeridas por la organización para mejorar su productividad y estimulan el autocuidado en los trabajadores.

 

El contenido mínimo de los programas será el siguiente:

 

1. Programas de capacitación para jefes de área: Serán diseñados para las personas que tomen decisiones administrativas en relación con la aplicación de esta Resolución que impliquen la exposición de trabajadores al riesgo de caída por trabajos en alturas.

 

Su intensidad será de ocho (8) horas con el cien por ciento (100%) en actividades de capacitación teórica. Se deben desarrollar como mínimo los siguientes temas:

 

a) Requisitos legales en protección contra caídas para trabajo en alturas.

 

b) Responsabilidad civil, penal, laboral y administrativa.

 

c) Sistema de Gestión de Seguridad y Salud en el Trabajo, en específico la administración y control del Programa de prevención y protección contra caídas en alturas.

 

d) Marco conceptual sobre prevención y protección contra caídas para trabajo en

alturas, permisos de trabajo y procedimiento de activación del plan de emergencias.

 

Esta capacitación puede ser presencial o virtual y debe actualizarse cuando se modifique la presente norma o cuando el administrador del programa de prevención y protección contra caídas lo considere necesario acorde a los cambios en el programa.

 

2. Programas de capacitación y entrenamiento para coordinador de trabajo en alturas: Este programa se impartirá de forma presencial y debe tener un mínimo de 80 horas de intensidad, sesenta por ciento (60%) del tiempo en actividades de entrenamiento práctico y cuarenta por ciento (40%) restante para actividades de capacitación teórica. Incluirán por lo menos los siguientes temas:

 

a) Definición de SG-SST, programa de prevención y protección contra caídas.

 

b) Naturaleza de peligros y, metodología de identificación y valoración de riesgos en trabajo en alturas para su control. Factores de riesgo conexos a los trabajos en alturas acorde al sector (por ejemplo; trabajos eléctricos, factores climáticos, etc.).

 

c) Fomento del autocuidado de las personas.

 

d) Metodología de identificación de peligros de caída.

 

e) Requisitos legales en protección contra caídas para trabajo en alturas, de acuerdo a la actividad económica.

 

f) Responsabilidad laboral, civil, penal, laboral y administrativa.

 

g) Conceptos técnicos de protección contra caídas para trabajo en alturas.

 

h) Medidas de prevención y protección contra caídas en trabajo desarrollados en alturas.

 

i) Programa de prevención y protección contra caídas de alturas.

 

j) Procedimientos de trabajo en alturas.

 

k) Listas de chequeo.

 

l) Procedimientos para manipular, almacenar, seleccionar, compatibilidad, inspección y reposición de equipos utilizados para protección contra caídas.

 

m) Sistemas de acceso para trabajo en alturas y uso seguro de los mismos.

 

n) Equipos de protección personal contra caídas (selección, compatibilidad y reposición) y sistemas de anclaje.

 

o) Limitantes y posibles restricciones en el uso de sistemas o equipos de protección contra caídas.

 

p) Efectos en el organismo de la detención de una caída y la suspensión posterior.

 

q) Fundamentos de primeros auxilios.

 

r) Conceptos básicos de auto rescate, rescate, y plan rescate.

 

s) Elaboración del permiso de trabajo en alturas y,

 

t) Técnicas de inspección de equipos de protección contra caídas.

 

3. Programas de capacitación y entrenamiento para trabajadores autorizados: Los contenidos incluirán, por lo menos:

 

a) Naturaleza de peligros y metodología de identificación y valoración de riesgos en trabajo en alturas para su control. Factores de riesgo conexos a los trabajos en alturas acorde al sector económico.

 

b) Requisitos legales en protección contra caídas para trabajo en alturas, de acuerdo a la actividad económica.

 

c) Desarrollo y fomento del autocuidado de las personas.

 

d) Medidas de prevención y protección contra caídas en trabajo desarrollado en alturas.

 

e) Planeación del trabajo en altura, permisos de trabajo y listas de chequeo.

 

f) Procedimientos para seleccionar, manipular y almacenar equipos y materiales utilizados para protección contra caídas.

 

g) Técnicas de trabajo en alturas aplicables en los diferentes sectores económicos.

 

h) Limitantes y posibles restricciones en el uso del sistemas o equipos de protección contra caídas.

 

i) Efectos en el organismo de la detención de una caída y la suspensión posterior.

 

j) Uso seguro de sistemas de acceso acorde a la actividad (andamios, torres móviles y auto soportados y escaleras).

 

k) Conceptos básicos de auto rescate, rescate y fundamentos de primeros auxilios asociados al peligro de trabajo en alturas.

 

l) Permiso de trabajo en alturas.

 

El programa de capacitación y entrenamiento para trabajadores autorizados en alturas se deberá impartir en modalidad presencial y deberá ser de mínimo treinta y dos (32) horas de intensidad; de las cuales el sesenta por ciento (60%) del tiempo se destinará en actividades de entrenamiento práctico y el cuarenta por ciento (40%) restante en actividades de capacitación teórica.

 

4. Reentrenamiento de trabajadores en alturas: Proceso de formación complementaria con el propósito de reforzar el conocimiento, las habilidades y las destrezas en el desarrollo de trabajo en alturas, todos los trabajadores autorizados deben ser reentrenados por el empleador o contratante.

 

El reentrenamiento se realizará una vez el trabajador se vincule nuevo a la empresa o proyecto, la responsabilidad de su capacitación y entrenamiento estará a cargo del empleador o contratante como parte de la inducción laboral. No podrá exigirse al trabajador el reentrenamiento por su cuenta. El costo estará a cargo del empleador o contratante.

 

El empleador o contratante, deberá reportar a su respectiva ARL, el nombre, documento de identidad de los trabajadores reentrenados, fecha del reentrenamiento y el oferente de capacitación y entrenamiento que realizó la formación.

 

El reentrenamiento no será otro nivel de formación, pero sí un requisito del empleador para mantener activo a los trabajadores que se desempeñan en trabajo en altura. El reentrenamiento se realizará cuando se presente alguna de las siguientes condiciones:

 

a) Cuando cambien las condiciones técnicas, tecnológicas o laborales del trabajador o cuando dentro de la empresa donde labora cambie:

 

- Su actividad de trabajo en altura.

 

- Los procedimientos.

 

- Las técnicas de trabajo o la tecnología de los equipos o los procesos.

 

- Las actividades laborales del trabajador que se desempeña en altura.

 

- También aplica cuando ingrese como nuevo trabajador a la empresa.

 

En estos casos el empleador, como parte de la re-inducción, previo al inicio de la nueva actividad, deberá capacitar al trabajador con un oferente autorizado por el Ministerio del Trabajo, de forma presencial con una duración mínima de 8 horas, de ellas el 20% será teórica y el 80% práctica. Este programa incluirá las modificaciones que se realicen en el SG-SST de la empresa y el programa de prevención y protección contra caídas y podrá ser impartido por el empresario en sus instalaciones con los equipos y elementos reales que el trabajador va a utilizar.



b) Reentrenamiento como medida de actualización de trabajadores: Se impartirá a un trabajador certificado como trabajador autorizado, habiendo laborado dentro de la misma empresa, ni cambiado de actividad, en los últimos Dieciocho (18) meses.



Este reentrenamiento tendrá una duración de mínimo 8 horas, de las cuales el 20% serán de teoría y el 80% de práctica. El programa debe incluir:

 

a) El refuerzo a las observaciones de los informes del coordinador o el encargado del SG-SST de la empresa.

 

b) Debe estar focalizado en el sector económico al cual pertenece el trabajador.

 

c) Se deberá impartir con modalidad presencial.

 

d) En el caso de que exista la guía de trabajo en altura para el sector económico, establecida por el Ministerio del Trabajo, se deberá incluir en el programa de capacitación.

 

Los diseños de las acciones de reentrenamiento se enfocarán en las necesidades del empleador o contratante, deberá incluir el SG-SST de la empresa, así como las falencias observadas en el trabajador según el tipo de trabajo en altura que desarrolla. Los programas de reentrenamiento incluirán, por lo menos el repaso de los temas contenidos en el programa de trabajador autorizado, relacionados con el sector al cual pertenece la empresa en que está contratado.

 

Los programas de reentrenamiento podrán ser cofinanciados con las cajas de compensación dentro del programa de capacitación.

 

En ambos casos la lista del personal capacitado será reportada a la ARL y cargada por el oferente autorizado al aplicativo de la Dirección de Movilidad y Formación para el Trabajo (DMFT) o quien haga sus veces. El oferente que imparta el reentrenamiento debe registrar previamente el/los programas diseñados con el empleador al aplicativo del Ministerio.

 

Como actividad para la prevención de riesgos el empleador o contratante podrá realizar una evaluación a los trabajadores que hayan tenido observaciones del coordinador de trabajo en alturas. Cuando detecte fallas en la aplicación de medidas de prevención y el uso de sistemas de protección contra caídas por parte del trabajador, este deberá realizar un reentrenamiento inmediato. Esta medida debe ser reportada a la ARL para su seguimiento y asesoría.

 

5. Programas de capacitación y entrenamiento para entrenadores de trabajo en altura. Diseñados para el aspirante a ser facilitador en prevención y protección contra caídas en trabajo en altura, mediante el uso herramientas que permitan enseñar, desarrollar destrezas y habilidades en prevención y protección contra caídas a trabajadores operativos, coordinadores, y jefes de áreas, en el marco de lo establecido en la presente Resolución o la que la modifique o sustituya.

 

Este programa presencial debe tener un mínimo de ciento treinta (130) horas de intensidad, de las cuales, cuarenta (40) horas serán en actividades de capacitación, cincuenta (50) horas de formación pedagógica básica y cuarenta (40) horas restantes en actividades de entrenamiento práctico e incluirán por lo menos, los siguientes temas:

 

a) Naturaleza de los peligros de caída de personas y objetos en el área de trabajo y desarrollo y fomento del autocuidado de las personas. Factores de riesgo conexos a los trabajos en alturas.

 

b) Metodología de identificación de peligros de caída.

 

c) Requisitos legales en protección contra caídas para trabajo en alturas, de acuerdo con la normatividad legal vigente.

 

d) Normas y estándares internacionales aplicables a la protección contra caídas.

 

e) Conceptos de responsabilidad laboral, civil, penal, administrativa y social.

 

f) Conceptos técnicos de protección contra caídas para trabajo en alturas.

 

g) Medidas de prevención y protección contra caídas en trabajo desarrollados en alturas.

 

h. Diseño y conceptualización del programa de prevención y protección contra caídas de alturas.

 

i) Procedimientos de trabajo en alturas.

 

j) Listas de chequeo.

 

k) Procedimientos para manipular y almacenar equipos y materiales utilizados para protección contra caídas.

 

l) Equipos de protección personal contra caídas de alturas; concepto, fundamentos, tipos (selección, compatibilidad, inspección y reposición) y sistemas de anclaje.

 

m) Sistemas de acceso para trabajo en alturas y uso seguro de los mismos.

 

n) Fundamentos generales de primeros auxilios asociados al trabajo en alturas.

 

o) Efectos en el organismo de la detención de una caída y la suspensión posterior.

 

p) Conceptos básicos de auto rescate, rescate, y plan de rescate.

 

q) Elaboración del permiso de trabajo en alturas.

 

r) Técnicas de inspección de equipos de protección contra caídas.

 

s) Planificación y organización en: estrategias, recursos, desarrollo y evaluación de procesos de aprendizaje.

 

t) Direccionamiento de equipos de trabajo, liderazgo.

 

u) Utilización de herramientas tecnológicas como apoyo al proceso de aprendizaje.

 

v) Manejo en herramientas de gestión de calidad, metodologías de tratamiento de fallas, análisis y solución de problemas, auditoría de estándares y gestión de mejora continua.

 

w) Aplicación de técnicas y métodos para una pedagogía efectiva.

 

Parágrafo 1°. Los certificados de capacitación en cualquiera de los niveles, que hayan sido expedidos antes de la presente Resolución, mantendrán su vigencia y validez. Un trabajador con certificado de nivel avanzado podrá seguir desempeñando sus funciones de trabajador autorizado hasta el cumplimiento de los términos y requisitos para que deba ser reentrenado.

 

Parágrafo 2°. La intensidad horaria definida se empezará a aplicar seis (6) meses después de la expedición de la presente Resolución. Los oferentes de capacitación y entrenamiento deberán radicar en el aplicativo del Ministerio del Trabajo los programas de capacitación y entrenamiento para iniciar su oferta.

 

Parágrafo 3°. Todos los coordinadores de trabajo en altura deberán actualizarse en la presente norma dentro de un término máximo de doce (12) meses a partir de la expedición de la presente Resolución. Los oferentes deberán diseñar el programa de actualización de coordinadores y registrarlo previamente en el aplicativo de la Dirección de Movilidad y Formación para el Trabajo (DMFT). El programa de actualización de coordinadores tendrá una duración de mínima de 16 horas.

 

Todos los entrenadores de trabajo en altura deberán actualizarse en esta norma, dentro de un término máximo doce (12) meses a partir de la expedición de la presente Resolución.

 

Los oferentes deberán diseñar el programa de actualización de entrenadores y registrarlo previamente en el aplicativo de la Dirección de Movilidad y Formación para el Trabajo (DMFT). El programa de actualización de entrenadores tendrá una duración de mínima de 32 horas.

 

Artículo 28. Entidades y requisitos para desarrollar procesos de evaluación de la competencia laboral para trabajo en alturas. El SENA y todas las entidades acreditadas por el Organismo Nacional de Acreditación de Colombia (ONAC) como organismos certificadores de personas podrán formar evaluadores y certificar trabajadores en competencias laborales en trabajo en alturas.

 

Los evaluadores de competencias laborales deben cumplir con los siguientes requisitos:

 

a) Tener certificado de competencia laboral vigente en trabajo en alturas.

 

b) Ser entrenador de trabajo en alturas y contar como mínimo con 12 meses de experiencia demostrada en trabajo en altura y 12 meses de experiencia demostrada como entrenador de trabajo en alturas.

 

c) Tener certificado de evaluador de competencias laborales.

 

Artículo 29. Proveedores del servicio de capacitación y entrenamiento para entrenadores y formador de entrenadores. Estos programas podrán ser impartidos por:

 

a) Las Instituciones de Educación Superior con programas en salud ocupacional o Seguridad y Salud en el Trabajo debidamente aprobados y reconocidos oficialmente por el Ministerio de Educación Nacional, que ofrezcan programas de capacitación en Protección contra Caídas en Trabajo en Alturas.

 

b) El Servicio Nacional de Aprendizaje SENA

 

Para la obtención del certificado de capacitación y entrenamiento como entrenador de trabajo en alturas, el aspirante deberá cumplir previamente mínimo con los siguientes requisitos:

 

a) Título de profesional o tecnólogo en Seguridad y Salud en el Trabajo o profesional con posgrado (especialización, maestría y doctorado) en Seguridad y Salud en el Trabajo o algunas de sus áreas afines.

 

b) Licencia vigente en salud ocupacional o Seguridad y Salud en el Trabajo conforme al campo de acción para educación dispuesto por la Resolución 0754 de 2021 expedida por el Ministerio de Salud y Protección Social o la norma que modifique o sustituya.

 

c) Experiencia certificada mínima de dieciocho (18) meses en funciones específicas y relacionadas con el desarrollo de actividades Seguridad y Salud en el Trabajo y diseño y ejecución en el Sistema de Gestión de la Seguridad y Salud en el Trabajo (SG-SST).

 

d) Experiencia certificada mínima de dieciocho (18) meses en funciones específicas y relacionadas con trabajo en alturas y la implementación del programa de prevención y protección contra caídas en empresas que por su naturaleza realicen actividades de exposición a trabajos en alturas.

 

e) Contar con certificado de competencia laboral o de culminación y aprobación del proceso de capacitación y entrenamiento en trabajo en alturas, nivel trabajador autorizado (o el anteriormente denominado nivel avanzado) anexando el reentrenamiento vigente si aplica.

 

Parágrafo 1°. Los certificados de capacitación y entrenamiento en el nivel de entrenador de trabajo en altura, emitidos previamente a la expedición de la presente Resolución a tecnólogos en SST, profesionales en SST y profesionales con postgrado en SST que cumplan con los requisitos definidos por esta Resolución, mantendrán su validez y deberán actualizarse en un plazo no mayor a doce (12) meses posteriores a la expedición de la presente Resolución.

 

Parágrafo 2°. Para el caso de técnicos en SST que se desempeñen como entrenadores de trabajo seguro en alturas en organizaciones aprobadas por el Ministerio de Trabajo para impartir formación de trabajo seguro en alturas antes de la expedición de la presente Resolución y que hubieran sido formados y certificados por las instituciones legalmente avaladas en la Resolución 1409 de 2012, podrán seguir ejerciendo su labor como entrenadores hasta la acreditación del cumplimiento de los requisitos definidos para el nivel entrenador en un plazo no mayor a doce (12) meses posteriores a la expedición de la presente Resolución.

 

Artículo 30. Perfil del formador de entrenadores para trabajo en alturas. Las instituciones autorizadas para la capacitación de entrenadores de trabajo en alturas deben contar con formadores de entrenadores de trabajo en alturas con el siguiente perfil:

 

a) Título de profesional en Seguridad y Salud en el Trabajo o profesional con posgrado (especialización, maestría o doctorado) en Seguridad y Salud en el Trabajo o algunas de sus áreas.

 

b) Contar con licencia vigente en salud ocupacional o Seguridad y Salud en el Trabajo conforme al campo de acción para educación dispuesto por la Resolución 0754 de 2021 expedida por el Ministerio de Salud y Protección Social o la norma que la modifique o sustituya.

 

c) Certificado de capacitación y entrenamiento de entrenador de trabajo en alturas.

 

d) Experiencia certificada mínima de veinticuatro (24) meses desarrollando procesos capacitación y entrenamiento en trabajo en alturas, en oferentes de capacitación y entrenamiento inscritos en el registro autorizado de la Dirección de Movilidad y Formación para el Trabajo del Ministerio del Trabajo o quien haga las veces.

 

e) Experiencia certificada mínima de treinta y seis (36) meses en funciones específicas relacionadas con el desarrollo de actividades de higiene, seguridad, medicina del trabajo, diseño y ejecución en el Sistema de Gestión de la Seguridad y Salud en el Trabajo (SGSST).

 

f) Constancia que acredite capacitación o formación en pedagogía, procesos de educación o temáticas homologables con una intensidad mínima de 120 horas.

 

Parágrafo 1°. Los oferentes que pueden impartir capacitación y entrenamiento para formador de entrenadores deberán estar autorizados por el Ministerio de Trabajo y los programas diseñados deberán estar reportados en el aplicativo de la Dirección de Movilidad y Formación para el Trabajo (DMFT).

 

Parágrafo 2°. Los programas de actualización de entrenadores a los que hace referencia la presente Resolución podrán ser impartidos por entrenadores de trabajo en altura que cumplan el perfil de formador de entrenadores en oferentes autorizados para impartir capacitación y entrenamiento para entrenadores.

 

CAPÍTULO II.

 

Lineamientos para la Capacitación y Entrenamiento

 

Artículo 31. Requisitos de funcionamiento de los centros de capacitación y entrenamiento. Los proveedores del servicio de capacitación y entrenamiento en protección contra caídas en trabajo en altura, deberán cumplir con los siguientes requisitos mínimos para su funcionamiento:

 

1. Estar inscritos y aceptados como proveedores de este servicio en el aplicativo diseñado para tal fin por la Dirección de Movilidad y Formación para el Trabajo del Ministerio del Trabajo.

 

2. Contar con un seguro de accidentes que garantice las prestaciones económicas y asistenciales para los aprendices, en caso de presentarse un evento derivado del proceso de capacitación.

 

3. Contar con un procedimiento para el tratamiento de los datos personales en cumplimiento de las disposiciones legales vigentes.

 

4. Contar con los espacios destinados para la capacitación y entrenamiento, que cuente con la infraestructura adecuada (instalaciones locativas, estructuras, equipos, etc.) que permita desarrollar los procesos de formación sin poner en riesgo a los aprendices, ajustada a los requerimientos establecidos en la presente resolución.

 

5. Contar con el talento humano necesario y formalizado, en los cargos misionales requeridos para ejercer su actividad económica, conforme a lo establecido en la presente resolución y demás normatividad nacional aplicable.

 

6. Contar con un código de buen comportamiento alineado conforme lo establecido en la presente resolución.

 

7. Contar con programas de capacitación y entrenamiento en trabajo en alturas aprobados conforme a lo establecido en la presente resolución.

 

8. Establecer el enfoque pedagógico y metodológico que utilizarán; en todo caso, debe ser acorde con las características de la capacitación ofrecida, los conocimientos y habilidades a desarrollar y los programas de capacitación y entrenamiento de trabajo en alturas.

 

Parágrafo 1°. Los diseños de los programas de capacitación y entrenamiento a impartir, deberán tener en cuenta: alcance, estructura curricular y énfasis en una actividad o actividades específicas, conforme a lo establecido en la presente resolución o norma que la modifique, adicione o complemente.

 

Parágrafo 2°. Los proveedores del servicio de capacitación y entrenamiento autorizados por esta resolución para ofertar el servicio de capacitación en trabajo en alturas, deben contar con programas especialmente diseñados para trabajadores que no saben leer ni escribir.

 

Parágrafo 3°. Los proveedores del servicio de capacitación y entrenamiento en protección contra caídas en trabajo en alturas, contarán para su funcionamiento con un centro de capacitación y entrenamiento legalmente constituido que cumpla con los requisitos de la normatividad vigente, que atienda las responsabilidades derivadas de la capacitación y fallas en la operación durante el desarrollo de las actividades, así como las estructuras y equipos del anexo de la presente resolución. Los centros de capacitación y entrenamiento de las UVAES tendrán la infraestructura necesaria que les permita cumplir los programas de capacitación específica de su actividad económica; los equipos e infraestructura deben cumplir los requisitos establecidos en el Título III Capítulos II y III de la presente resolución.

 

Artículo 32. Requisitos previos a la prestación del servicio de capacitación y entrenamiento en trabajo en alturas. El proveedor del servicio de capacitación y entrenamiento, previo a prestar el servicio debe asegurar y verificar que el aspirante o solicitante entregue la siguiente información:

 

a) Datos personales (nombre, identificación, empresa, labor que desarrolla), nivel de lectoescritura, nivel de formación, hemoclasificación (grupo sanguíneo y factor RH), alergias, consumo reciente de medicamentos, lesiones recientes, enfermedades actuales, persona de contacto en caso de emergencia.

 

b) Afiliación vigente al Sistema de Seguridad Social en Salud en cualquiera de sus regímenes, o a un régimen exceptuado o especial en salud. En todo caso, los trabajadores dependientes e independientes deben certificar su afiliación y pago a los sistemas de seguridad social que correspondan según la normatividad vigente.

 

c) Copia del certificado de aptitud médica que certifique que el trabajador o aprendiz cumple con las condiciones de salud para desarrollar trabajo en alturas y conforme a lo establecido en las Resoluciones 2346 de 2007 y 1918 de 2009 expedidas por el Ministerio de la Protección Social o las normas que las modifiquen, sustituyan o adicionen.

 

d) Cuando se trate de procesos de reentrenamiento, el oferente deberá solicitar al empleador, último pago de seguridad social vigente, copia del certificado de aptitud médica realizado al trabajador y copia del certificado del proceso de capacitación y entrenamiento de trabajador autorizado (o anterior nivel avanzado). Asegurando que estos hacen parte del cumplimiento normativo por parte del empleador.

 

e) Demás establecidos por el centro de capacitación y entrenamiento.

 

Artículo 33. Etapa de capacitación. Durante el proceso de capacitación el proveedor del servicio debe incluir actividades orientadas a desarrollar conocimientos teóricos frente a las habilidades requeridas para trabajar en altura, de acuerdo con el grado de lectoescritura de las personas.

 

La proporción de aprendices para cada curso, durante el desarrollo del componente teórico del programa de formación, deberá ser un máximo de treinta (30) aprendices por un (1) entrenador.

 

En la etapa de capacitación, el proveedor del servicio de capacitación y entrenamiento, podrá utilizar los servicios de personal de apoyo para el desarrollo de algunos módulos o temas contenidos en el programa de formación, como por ejemplo; abogados, personas calificadas, etc.

 

Parágrafo 1°. El uso de personal idóneo de apoyo debe estar bajo acompañamiento y presencia permanente del entrenador de trabajo seguro en alturas responsable del proceso.

 

Parágrafo 2°. Cuando se disponga de personal de apoyo, deberá quedar registro de la actividad realizada, en el informe del supervisor de formación asignado y en la documentación de soporte del cumplimiento del 100% del plan de estudio.

 

Parágrafo 3°. En ningún caso el uso de personal de apoyo debe exceder el 20% de la intensidad horaria, de la capacitación teórica, dispuesta en los programas de capacitación y entrenamiento por la presente resolución.

 

Artículo 34. Etapa de entrenamiento. Durante el proceso de entrenamiento el prestador del servicio debe fomentar el desarrollo de conocimientos mediante ejercicios prácticos, maniobras y técnicas que permitan adquirir habilidades y destrezas para desarrollar trabajos en alturas incluyendo:

 

1. Ascenso y descenso.

 

2. Desplazamientos.

 

3. Posicionamiento.

 

4. Suspensión.

 

5. Restricción.

 

6. Manejo de trauma por suspensión, y

 

7. Procedimientos respecto a medidas de prevención, inspección de equipos y conocimientos básicos de primeros auxilios.

 

La proporción de aprendices para cada curso, durante el desarrollo del componente practico del programa de formación, deberá ser de máximo diez (10) aprendices por un (1) entrenador, durante el entrenamiento y en todo caso, máximo cuatro (4) personas en actividades simultáneas con exposición a caídas de diferente nivel por un (1) entrenador con personal de apoyo.

 

En la etapa de entrenamiento, el proveedor del servicio de capacitación y entrenamiento, podrá utilizar adicionalmente los servicios de personal de apoyo para el desarrollo de algunos módulos prácticos contenidos en el programa de formación demostrando que los mismos son competentes en el aspecto de la formación asignado. Por ejemplo, personas calificadas, rescatistas, profesionales en salud para temas de primeros auxilios entre otros.

 

Parágrafo 1°. El uso de personal de apoyo en cualquiera de las etapas de entrenamiento, debe estar bajo acompañamiento y presencia permanente del entrenador de trabajo en alturas responsable del proceso.

 

Parágrafo 2°. Cuando se disponga de personal de apoyo en cualquiera de las etapas de formación, deberá quedar registro de la actividad realizada en el informe del supervisor de formación asignado y en la documentación de soporte del cumplimiento del 100% del plan de estudio.

 

Parágrafo 3°. La etapa de entrenamiento contará con acompañamiento permanente de una (1) persona de apoyo, con capacidad de operar el plan de emergencia, labores de rescate, vigilar las actividades realizadas por los aprendices en entrenamiento y brindar soporte en la atención de primeros auxilios.

 

Artículo 35. Evaluación del perfil de ingreso y egreso del proceso de capacitación y entrenamiento. El proveedor del servicio de capacitación y entrenamiento en protección contra caídas en trabajo en alturas, establecerá el perfil de ingreso y egreso para las personas a formar. El primero incluirá la evaluación del conocimiento, las habilidades básicas y aptitudes que requiera el programa en que se formará, y el perfil de egreso, deberá evaluar si la persona formada adquirió los conocimientos y habilidades definidas en el programa de formación, aplicables a la actividad económica que desarrolla la empresa donde se va a desempeñar. Las evaluaciones deberán incluir:

 

1. Los conocimientos, habilidades y objetivos a desarrollar, de acuerdo con el grado de capacitación y entrenamiento.

 

2. El enfoque pedagógico, metodológico y el marco jurídico de trabajo en alturas.

 

La evaluación considerará la evidencia de los conocimientos requeridos para demostrar las habilidades y destrezas a desarrollar y la aplicación de esos conocimientos en un escenario que represente un espacio real.

 

Artículo 36. Mecanismo de evaluación de la satisfacción del servicio. El proveedor del servicio de capacitación y entrenamiento diseñará e implementará un mecanismo de evaluación de la satisfacción para las personas que recibieron el servicio de capacitación y entrenamiento en el centro de capacitación y entrenamiento y contará con un procedimiento para el análisis de la evaluación que incluya planes de mejora acorde a los hallazgos, los cuales deben ser reportados al aplicativo del Ministerio del Trabajo.

 

CAPÍTULO III

 

Medidas de Seguridad para la Formación

 

Artículo 37. Peligros asociados a la capacitación y al entrenamiento. El proveedor de servicios de capacitación y entrenamiento debe identificar, analizar, evaluar, controlar y documentar en cada programa a ofertar en el centro de capacitación y entrenamiento, los peligros asociados a la infraestructura, estructuras para entrenamiento, equipos y tecnologías requeridas, así como las actividades a desarrollar, lo cual debe hacer parte de su Sistema de Gestión de la Seguridad y Salud en el Trabajo SG-SST, enmarcado en la normatividad nacional aplicable.



El centro de capacitación y entrenamiento debe implementar medidas individuales, grupales, pasivas y activas como mecanismos para proteger y prevenir que los aprendices sufran lesiones o accidentes respecto a los diferentes peligros a que están expuestos durante el entrenamiento.

 

Artículo 38. Programa de inspección y mantenimiento. El centro de capacitación y entrenamiento debe diseñar, implementar y documentar un programa permanente de inspección y mantenimiento de las estructuras, equipos, infraestructura y demás elementos destinados para la capacitación y el entrenamiento, necesarias para:

 

1. Impartir la capacitación relacionada con la protección contra caídas.

 

2. Impartir el entrenamiento.

 

3. Proteger a la persona durante el entrenamiento y prevenir lesiones (medidas individuales y grupales / pasivas y activas), y

 

4. Aplicar procedimientos de rescate.

 

Parágrafo. La estructura o equipo que evidencie daño, deterioro o haya sufrido impacto de caída será plenamente identificado y marcado, evitando su uso hasta ser inspeccionado por una persona calificada, quien determinará la medida correctiva, incluyendo su disposición final. El supervisor dejará constancia documentada de la inspección y medidas adoptadas en la hoja de vida de la estructura.

 

CAPÍTULO IV

 

Espacios y Estructuras para los Procesos de Capacitación y Entrenamiento

 

Artículo 39. Espacios generales. El proveedor del servicio de capacitación y entrenamiento, para realizar actividades de formación adecuará como mínimo los siguientes espacios:

 

1. Ambiente para la capacitación.

 

2. Ambiente para el entrenamiento.

 

3. Área de sanitarios para los aprendices.

 

4. Área de hidratación y de bienestar (zona de alimentación).

 

5. Área de mantenimiento, inspección y almacenamiento de equipos, y

 

6. Área administrativa.

 

Parágrafo 1°. Los espacios relacionados en el presente artículo estarán identificados, señalizados y acondicionados para cumplir el objeto del programa a impartir, e impedir el acceso a personas ajenas al desarrollo de las actividades para las cuales están destinados.

 

Parágrafo 2°. El proveedor del servicio de capacitación y entrenamiento debe asegurar que los espacios cumplan con los parámetros de área, bioseguridad, iluminación, ergonomía, temperatura y acústica necesarios para que en los procesos de capacitación y entrenamiento se garantice la salud y seguridad de las personas.

 

Parágrafo 3°. El proveedor del servicio de capacitación y entrenamiento debe asegurar que el área de almacenamiento de equipos cuente con el espacio y las condiciones ambientales y de seguridad necesarias para guardar los equipos y demás elementos, de acuerdo con las recomendaciones del fabricante para garantizar su funcionalidad y asegurar el acceso únicamente al personal autorizado.

 

Artículo 40. Diseño, construcción y/o ensamblaje de estructura. El diseño, construcción y/o ensamble de las estructuras necesarias para impartir los programas de capacitación y entrenamiento deben:

 

1. Contar con las memorias de cálculos, planos estructurales, diseños de cimentación, planos isométricos y manual de mantenimiento acorde a las normas nacionales aplicables.

 

2. Estar diseñadas, de acuerdo con las disposiciones establecidas en la presente resolución y teniendo en cuenta las normas nacionales, internacionales y prácticas de ingeniería aplicables.

 

3. Deben ser fabricadas con materiales acorde a lo definido en las memorias de cálculo y ensambladas acorde a las recomendaciones del diseñador y fabricante.

 

4. Representar el ambiente real donde los aprendices en entrenamiento estarán trabajando (exposición a la altura, tipo e inclinación de la superficie de trabajo y los métodos de acceso y/o protección contra caídas, incluido el grado de soporte suministrado).

 

5. Determinar la altura de las estructuras, de acuerdo con el tipo de prácticas a desarrollar, de modo que permita a los entrenadores el control constante de las personas en entrenamiento. Las estructuras deben permitir la visibilidad completa y comunicación de las personas en entrenamiento durante las prácticas.

 

6. Permitir que los aprendices en entrenamiento simulen progresivamente situaciones reales a las cuales se enfrentarán con los posibles riesgos del trabajo en alturas.

 

7. Prever zonas para tránsito vertical u horizontal, evitando elementos salientes, atravesados, cables, cercanía a líneas eléctricas energizadas o cualquier otro elemento peligroso que pueda afectar la integridad de las personas en entrenamiento y entrenadores durante la trayectoria de una caída.

 

8. Incluir señalización de los espacios de capacitación y de entrenamiento y de los peligros y controles necesarios.

 

9. Contar con una estructura en andamios multidireccional certificado para entrenamiento en armado, desarme y desplazamientos sobre estos. Contar con su plano de configuración y disponer de las fichas técnicas del fabricante. Este andamio no podrá remplazar las otras estructuras.

 

10. Asegurar que los puntos de anclaje se ubiquen sobre la línea de ascenso o sobre el sitio de prácticas, de tal forma que reduzca el efecto de péndulo.

 

11. Incluir sistemas de acceso seguros a las plataformas de trabajo (escaleras verticales que incluyan sistemas de protección contra caídas o escaleras inclinadas con barandas) que le permitan al aprendiz y al entrenador el tránsito seguro entre los niveles de la estructura.

 

12. Garantizar la seguridad durante la práctica en los tránsitos verticales, horizontales y diagonales; incluir medidas de prevención o protección contra caídas adicionales e independientes a los equipos de entrenamiento requeridos para la protección contra caídas durante los desplazamientos en las prácticas programadas. El diseño de la estructura debe asegurar su completa estabilidad ante esfuerzos de todo tipo (verticales, horizontales, diagonales) en cualquiera de sus lados.

 

13. Contar con plataformas con materiales antideslizantes, drenantes y contar con rodapiés acorde a lo definido en la presente resolución.

 

14. Rotular o marcar claramente el número máximo de personas que pueden estar sobre la estructura.

 

15. Cumplir los estándares, en relación con las plataformas de trabajo o barandas, cuando se requieran.

 

Parágrafo 1°. El diseño, construcción y/o ensamble, así como las condiciones de uso de la estructura quedarán documentadas en planos, soportes, memorias de cálculo o cualquier otro documento que adicione información y contará con la firma de la persona calificada que realizó el diseño estructural, quien debe estar debidamente matriculado. Estos deberán cumplir con los requisitos dispuestos por las normas nacionales aplicables para este efecto.

 

Parágrafo 2°. Las estructuras deben utilizarse de acuerdo con las condiciones de su diseño; cualquier modificación debe ser avalada por la persona calificada e informada oportunamente al Ministerio de Trabajo a través del aplicativo de la DMFT.

 

Artículo 41. Equipos para el entrenamiento. El proveedor del servicio de capacitación y entrenamiento debe disponer en el sitio destinado para la capacitación y entrenamiento, equipos que permitan:

 

1. Desarrollar las habilidades y destrezas requeridas por el programa.

 

2. Proteger a la persona en entrenamiento.

 

3. Asegurar que el desarrollo de la actividad de entrenamiento sea seguro.

 

4. Rescatar en caso de presentarse un accidente.

 

Artículo 42. Suministro de equipos. El proveedor de capacitación y entrenamiento debe proporcionar a las personas en etapa práctica (entrenamiento) como mínimo sistemas de respaldo de detención de caídas que permitan una mayor seguridad y control del riesgo de caída. Estos sistemas son adicionales a los utilizados como equipo de entrenamiento para la práctica designada.

 

El centro de capacitación y entrenamiento deberá contar con los certificados de calidad de todos los equipos de protección contra caídas que utilice, cumpliendo con las pruebas que garanticen el funcionamiento de los puntos de anclaje instalados y utilizados en los sistemas de protección contra caídas implementadas en su centro.

 

El centro de capacitación y entrenamiento en protección contra caídas para trabajo en alturas debe contar con puntos de anclaje fijo, móvil o dispositivos (adaptadores) de anclaje portátiles, siempre y cuando el sitio donde se aseguren cumpla con la resistencia requerida y las disposiciones legales vigentes. El diseño de los puntos de anclaje depende de la configuración del sitio.

 

Artículo 43. Equipos personales, equipos de acceso y equipos adicionales. El proveedor de capacitación y entrenamiento suministrará a sus entrenadores y a cada aprendiz los equipos personales, equipos de acceso, equipos de rescate y demás equipos adicionales que estos requieran para desarrollar la etapa práctica (entrenamiento), del proceso de formación.

 

Parágrafo. El proveedor de capacitación y entrenamiento deberá asegurar la compatibilidad entre los sistemas de protección contra caídas que suministre.

 

CAPÍTULO V

 

Talento Humano para la Formación

 

Artículo 44. Designación del talento humano. El proveedor del servicio de capacitación y entrenamiento debe contar con personal técnico, idóneo y suficiente para garantizar las condiciones de seguridad y calidad durante el desarrollo del componente teórico y práctico de la formación, que le permita cumplir los objetivos establecidos en los programas y la normativa aplicable y asegurar que su personal tenga la capacitación requerida, las responsabilidades claramente definidas, establecidas, comunicadas y comprendidas.

 

El proveedor del servicio de capacitación y entrenamiento deberá contar en el centro como mínimo con un supervisor del proceso de capacitación y entrenamiento, entrenador(es), un director de operaciones y una persona capacitada que active el plan de emergencias.

 

El talento humano anteriormente citado y necesario, deberá estar laboralmente formalizado, en los cargos misionales requeridos para ejercer su actividad económica, conforme a la normatividad nacional aplicable.

 

Artículo 45. Supervisor de formación. El supervisor de capacitación debe cumplir con los requisitos del nivel entrenador, de acuerdo con lo definido en la presente resolución.

 

El supervisor de capacitación tendrá las siguientes responsabilidades:

 

1. Controlar y asegurar que el material, equipos, estructuras y demás elementos necesarios para cumplir con los objetivos de la capacitación y entrenamiento estén disponibles, de acuerdo con lo establecido en la presente resolución.

 

2. Controlar y asegurar que el material, equipos, estructuras y demás elementos necesarios para la capacitación y el entrenamiento sean inspeccionados y se les realice mantenimiento, de acuerdo con el programa de inspección y mantenimiento establecido para asegurar que se mantengan las condiciones de seguridad.

 

3. Actualizar y controlar los materiales, equipos, estructuras y demás elementos necesarios para la capacitación y entrenamiento.

 

4. Verificar que las áreas de entrenamiento estén restringidas durante los periodos de descanso.

 

5. Constatar que la información suministrada por los aspirantes y/o el empleador solicitante de formación sea verídica y completa.

 

6. Verificar que las condiciones de asistencia y evaluación establecidas para cada curso de capacitación se cumplan, previo a la expedición del documento que acredite la culminación y aprobación del proceso de capacitación y entrenamiento en el nivel cursado.

 

7. Generar y mantener evidencia del desarrollo de las actividades anteriores, y

 

8. Asegurar la actualización y la evaluación periódica de los entrenadores.

 

Parágrafo 1°. El supervisor deberá dejar informe con las observaciones del cumplimiento del 100% de los tiempos de capacitación y contenido de los programas de capacitación y entrenamiento que se realicen en el centro de capacitación y entrenamiento conforme a lo establecido en el presente artículo.

 

Parágrafo 2°. Para el caso del SENA, la supervisión será ejercida por los coordinadores de formación establecidos en cada centro.

 

Artículo 46. Entrenador encargado de la formación. El entrenador será responsable de:



1. Preparar los temas establecidos en los programas a impartir conforme a lo registrado ante el Ministerio del Trabajo, por el centro de capacitación y entrenamiento en protección contra caídas en trabajo en alturas.

 

2. Definir los materiales necesarios para la capacitación y entrenamiento y asegurar la inspección de los equipos y elementos requeridos antes del inicio de la formación.

 

3. Socializar el análisis de riesgo asociado, previo a cualquier actividad de capacitación y entrenamiento. Los riesgos deben ser comunicados al personal del centro y a las personas en capacitación y entrenamiento.

 

4. Impartir la capacitación y el entrenamiento de acuerdo con los programas establecidos por el centro velando por el cumplimiento de los tiempos de capacitación y la calidad de estos.

 

5. Responder las inquietudes de las personas en formación.

 

6. Vigilar las condiciones de seguridad y salud de los participantes durante la capacitación y entrenamiento.

 

7. Dejar evidencia y entregar al supervisor los resultados de cada curso.

 

8. Evaluar los conocimientos y las habilidades alcanzadas por las personas que participan en cada curso, según los criterios de aprobación establecidos.

 

9. Aplicar los mecanismos de evaluación para determinar la satisfacción de cada curso.

 

10. Desarrollar procesos de actualización periódicos, tanto teóricos como prácticos, relacionados con el trabajo en alturas.

 

Artículo 47. Dirección de la operación. El director de operaciones es la persona designada por el representante legal del oferente inscrito como proveedor del servicio de capacitación y entrenamiento en trabajo en alturas. El director de operación tendrá las siguientes responsabilidades:

 

1. Gestionar ante el representante legal la adquisición de los recursos necesarios para implementar lo establecido en la presente resolución.

 

2. Evaluar y presentar anualmente ante su empleador y el responsable del Sistema de Gestión de la Seguridad y Salud en el Trabajo SG-SST, el desempeño del centro de capacitación y entrenamiento.

 

3. Garantizar el cumplimiento de los requisitos establecidos en la presente resolución.

 

4. Asegurar la disponibilidad de la información referente al centro de capacitación y entrenamiento, cuando el Ministerio del Trabajo lo requiera, especialmente la expedición de los documentos que acrediten la culminación y aprobación de los procesos de capacitación y entrenamiento.

 

5. Comunicar cualquier modificación del centro de capacitación y entrenamiento relacionada con esta norma al Ministerio del Trabajo: cambios de representación legal, ubicación, entrenadores, infraestructura para entrenamiento e infraestructura locativa.

 

Parágrafo. El representante legal, será el máximo responsable del cumplimiento de las condiciones técnicas, jurídicas, operativas y administrativas del centro de capacitación y entrenamiento para trabajo en alturas, conforme a lo establecido en la presente resolución y demás normatividad nacional aplicable.

 

CAPÍTULO VI

 

Proceso de Registro del Centro de Capacitación y Entrenamiento de los Proveedores de Capacitación en Protección Contra Caídas en Trabajo en Alturas

 

Artículo 48. Remisión de documentos del organismo certificador. Dentro de los cinco (5) días hábiles siguientes a su expedición, el organismo certificador remitirá al Ministerio del Trabajo o quien haga sus veces, copia de la certificación o recertificación expedida según la norma técnica colombiana correspondiente, emitida al Proveedor de capacitación para el respectivo registro.

 

Artículo 49. Registro. El registro de proveedores de capacitación y entrenamiento en Protección contra Caídas en Trabajo en Alturas tiene por objeto reunir la información relevante relacionada con los prestadores autorizados de servicios de capacitación y entrenamiento en esta materia, que le permita al Ministerio del Trabajo realizar el seguimiento y evaluación de las condiciones de los centros de capacitación y entrenamiento, los programas ofertados y las personas certificadas.



Toda institución, persona natural o jurídica, u otra reglamentada por la presente resolución aspirante a proveer el servicio de capacitación y entrenamiento en protección contra caída en Trabajo en Alturas, y evaluación de la competencia de Trabajo en Alturas, deberá registrarse como proveedor de dicha formación ante el Ministerio del Trabajo, en el aplicativo diseñado para tal fin.

 

El representante legal de todo proveedor de capacitación en trabajo en alturas, podrá realizar y tramitar su inscripción en el registro a través del aplicativo diseñado para tal fin, completando las etapas incluidas, y radicando a través de este los siguientes documentos:

 

a) Solicitud, indicando la dirección donde funcionará, teléfono, correo electrónico de contacto, nivel(es) de capacitación que desea impartir, sede(s) donde se ofrecerá el servicio de capacitación y entrenamiento. Los oferentes de capacitación y entrenamiento no podrán compartir estructuras, ni funcionar en la misma dirección. En el caso de las UVAE con cobertura nacional, estas podrán realizar convenios con otros oferentes para compartir estructuras. Los certificados serán expedidos y reportados por la UVAE.

 

b) Documento con el código de buen comportamiento.

 

c) Certificado de existencia y representación legal con fecha de expedición no mayor

a treinta (30) días.

 

d) Copia del documento de identidad del representante legal de la institución, persona natural o jurídica, u otra reglamentada por la presente resolución.

 

e) Documento de póliza de seguro contra accidentes para los trabajadores en capacitación. Para el caso de las UVAE, debe reportar la afiliación a la ARL.

 

f) Documento de estudios de cálculo de las estructuras y sus condiciones de uso acompañado de los planos firmados por las personas calificadas incluyendo la matrícula profesional.

 

g) Programas de capacitación a impartir, de conformidad con lo establecido en la presente resolución y demás normas que la sustituya, modifique o aclare. Cada programa debe especificar como mínimo: nivel de capacitación a impartir, requisitos de ingreso, mecanismos de evaluación donde se identifiquen los resultados esperados, plan de seguimiento y tiempo de duración, entre otros.

 

h) Licencia en Seguridad y Salud en el Trabajo, para las personas naturales y jurídicas.

 

i) Copia de los contratos de los entrenadores y supervisores de trabajo en alturas.

 

j) Certificado capacitación y entrenamiento del entrenador de trabajo en alturas, conforme a lo establecido en la presente resolución.

 

k) Certificación de la Administradora de Riesgos Laborales, donde conste que su Sistema de Gestión de la Seguridad y Salud en el Trabajo, incluye el Programa de Protección Contra Caídas, y verificando mediante visita que los espacios, equipos y sistemas a utilizar cumplen con los requisitos de seguridad, de acuerdo con lo estipulado en la presente Resolución

 

l) Certificación de calidad en la norma técnica colombiana correspondiente, expedida por un organismo debidamente acreditado por el Organismo Nacional de Acreditación de Colombia (ONAC) cuando aplique.

 

Parágrafo. Los proveedores del servicio de capacitación y entrenamiento que ya se encuentran registrados ante la Dirección de Movilidad y Formación para el Trabajo del Ministerio de Trabajo, tendrán un período de transición de seis (6) meses, a partir de la expedición de la presente resolución para ajustar sus programas acordes a los nuevos requisitos. Si transcurrido este período no se realizan los ajustes técnicos, jurídicos y operativos necesarios conforme a lo establecido en la presente resolución se procederá a inhabilitar el registro, previa su comunicación por parte de la Dirección de Movilidad y Formación para el Trabajo.

 

Artículo 50. Trámite de inscripción. Radicados los documentos para la inscripción, la Dirección de Movilidad y Capacitación para el Trabajo del Ministerio del Trabajo o quien haga sus veces, dentro de los quince (15) días hábiles siguientes emitirá la comunicación respectiva y si es del caso, solicitará las adiciones o aclaraciones que se consideren necesarias.

 

A partir del envío de la comunicación el peticionario contará con un (1) mes para realizar los ajustes solicitados. Transcurrido el término anterior sin que el peticionario satisfaga el requerimiento, se entenderá desistida la solicitud y se ordenará el archivo.

 

Artículo 51. Inscripción en el registro. Verificado el cumplimiento de los requisitos exigidos, la Dirección de Movilidad y Formación para el Trabajo (DMFT) del Ministerio del Trabajo o quien haga sus veces, procederá a su inscripción en el registro de proveedores de capacitación en protección contra caídas en trabajo en altura y comunicará lo pertinente al representante legal del proveedor.

 

Los proveedores de capacitación y entrenamiento únicamente podrán ofertar los programas de capacitación y expedir las certificaciones correspondientes conforme con la cobertura territorial presentada por el oferente y autorizada por el Ministerio del Trabajo para el efecto, desde la fecha de inscripción en el Registro de Proveedores de Capacitación y entrenamiento.

 

Artículo 52. Permanencia en el registro. Para permanecer en el registro, los proveedores de capacitación y entrenamiento, deben mantener las condiciones jurídicas, operativas y técnicas señaladas en la presente resolución.

 

La Dirección de Movilidad y Formación para el Trabajo del Ministerio del Trabajo, podrá suspender de forma inmediata el registro como proveedor inscrito del servicio de capacitación y entrenamiento en trabajo en alturas, cuando se establezca mediante auditoría por parte de la ARL, del organismo certificador de calidad o autoridad competente un hallazgo que comprometa la seguridad y salud de los entrenadores y los aprendices, o se incumplan los requisitos mínimos del proceso de capacitación y entrenamiento, se imparta capacitación fuera de la jurisdicción autorizada por el Ministerio, entre otros. Si no se subsana el hallazgo, la Dirección de Movilidad y Formación para el Trabajo retirará el registro definitivamente.

 

Artículo 53. Plan de mejora. Si la Dirección de Movilidad y Formación para el Trabajo (DMFT) al realizar la visita técnica de verificación al proveedor de capacitación y entrenamiento de trabajo en altura, encuentra incumplimiento en las condiciones referidas en esta resolución, otorgará un plazo no mayor a treinta (30) días calendario, para presentar el plan de mejora.

 

La gravedad del incumplimiento por parte del proveedor se determinará según afecte la salud y la vida de los trabajadores a capacitar o se incumpla lo establecido en el Decreto 472 de 2015, o la norma modifique o sustituya, la Dirección de Movilidad y Formación para el Trabajo (DMFT) de acuerdo con la gravedad detectada establecerá el estado de activo o inactivo del proveedor de capacitación.



Para el caso de las Direcciones Territoriales u oficinas especiales del Ministerio del Trabajo, cuando se realicen visitas preventivas de carácter general y se detecte la inobservancia de la normatividad en Seguridad y Salud en el Trabajo, los inspectores de trabajo podrán imponer las medidas de cierre y suspensión establecidas en el Decreto 472 de 2015. Estas medidas harán parte del plan de mejora que debe presentar el proveedor de capacitación y entrenamiento a la Dirección de Movilidad y Formación para el Trabajo (DMFT). El registro del oferente permanecerá inactivo hasta cuando se levante la medida por parte de la Dirección Territorial u oficina especial correspondiente.

 

La expedición de certificados sin haber cursado el programa se tomará como una falta grave y el oferente se colocará inmediatamente en estado inactivo.

 

Cumplido el plazo sin la materialización de las acciones de mejora, la Dirección de Movilidad y Formación para el Trabajo o quien haga sus veces, inhabilitará el registro, previa comunicación dirigida al representante legal del proveedor.

 

Cuando el proveedor de Capacitación y Entrenamiento certifique ante la Dirección de Movilidad y Formación para el Trabajo (DMFT), o quien haga sus veces, el cumplimiento de las condiciones consignadas en el plan de mejora se habilitará nuevamente su registro. Si el proveedor incurre nuevamente en la falta será retirado definitivamente del registro.

 

Artículo 54. Publicación del registro. Para conocimiento de los ciudadanos en general, la Dirección de Movilidad y Formación para el Trabajo o quien haga sus veces, publicará en su página web el registro de los proveedores de capacitación y entrenamiento inscritos y habilitados para ofertar los diferentes programas de capacitación y entrenamiento, así como las personas reportadas por estos, que cursaron y aprobaron los diferentes niveles de capacitación.

 

CAPÍTULO VII.

 

Seguimiento y Vigilancia a Proveedores de Capacitación y Entrenamiento

 

Artículo 55. Seguimiento y vigilancia a la calidad de los proveedores de capacitación y entrenamiento. Cuando el organismo certificador de calidad remita a la Dirección de Movilidad y Formación para el Trabajo del Ministerio del Trabajo (DMFT), o quien haga sus veces, información de suspensión o retiro de la certificación de calidad otorgada inicialmente al proveedor del servicio de capacitación y entrenamiento, en algunas de sus sedes, por el incumplimiento de condiciones técnicas, operativas o jurídicas enmarcadas en la presente resolución, el proveedor de capacitación deberá presentar copia del plan de mejoramiento a la Dirección de Movilidad y Formación para el Trabajo del Ministerio del Trabajo (DMFT) bajo los lineamientos establecidos en la presente resolución.

 

El informe de la auditoría de la visita será remitido a más tardar dentro de los quince (15) días hábiles siguientes a la Dirección de Movilidad y Formación para el Trabajo (DMFT) del Ministerio del Trabajo, o quien haga sus veces, con el fin de hacer el seguimiento a las recomendaciones de acciones correctivas o preventivas a que haya lugar.

 

Artículo 56. Visita técnica. El Ministerio del Trabajo realizará visita técnica de verificación y seguimiento a los centros de capacitación y entrenamiento dispuestos por los proveedores de capacitación y entrenamiento, con el fin de verificar el cumplimiento de las disposiciones señaladas en la presente resolución y las normas que la sustituyan, modifiquen o adicionen.

 

Artículo 57. Auditoría al aplicativo del Ministerio del Trabajo. La Dirección de Movilidad y Capacitación para el Trabajo (DMFT), auditará permanentemente los procesos de capacitación y entrenamiento reportados por los proveedores de capacitación y entrenamiento, así como la documentación técnica y jurídica radicada. Si encontrara inconsistencias en los procesos reportados y/o documentos vencidos sin actualizar por parte de la organización inscrita, procederá a informar y solicitar a través del aplicativo las observaciones o plan de mejoramiento que dieran a lugar a aclarar o subsanar el hallazgo, en los términos establecidos en el Plan de mejora.

 

Artículo 58. Consulta del registro de certificación de capacitación y entrenamiento. Para conocimiento del público en general, la DMFT o quien haga sus veces, garantizará la herramienta virtual donde el interesado pueda consultar permanentemente las personas certificadas por los proveedores, en la página institucional del Ministerio del Trabajo.

 

CAPÍTULO VIII

 

Certificación de la Capacitación y Entrenamiento

 

Artículo 59. Certificación del proceso de capacitación y entrenamiento para trabajo en altura. El proveedor del servicio de capacitación y entrenamiento deberá dejar constancia y enviar al empleador o contratante un documento donde acredite que el aprendiz, cursó y aprobó la capacitación y entrenamiento para trabajo en altura.



El documento que expidan los proveedores de capacitación y entrenamiento, deberán contener como mínimo los siguientes campos:

 

1. Denominación: “Certificado de capacitación y entrenamiento para Trabajo en Altura”.

 

2. Enunciar el correspondiente nivel de capacitación.

 

3. Nombre y apellidos de la persona certificada.

 

4. Número del documento de identificación de la persona capacitada y entrenada.

 

5. Nombre y número de registro del proveedor que realizó la capacitación y entrenamiento.

 

6. Dirección e identificación del área geográfica autorizada por el Ministerio del Trabajo de la sede donde se impartió el proceso de capacitación y entrenamiento.

 

7. Nombres, apellidos y firma del representante legal del centro de formación de trabajo en altura, inscrito como proveedor de capacitación y entrenamiento.

 

8. Nombre, apellido, firma del entrenador y número de la licencia de Seguridad y Salud en el Trabajo.

 

9. Ciudad y fecha donde se realizó la capacitación y entrenamiento o la evaluación y certificación de la competencia laboral.

 

10. Ciudad y fecha de expedición del certificado de capacitación y entrenamiento o certificado de competencia laboral.

 

11. Nombre del organismo certificador del centro de formación para trabajo en altura y código de acreditación.

 

12. Número de radicado expedido por el Ministerio de Trabajo y que lo acredita como proveedor inscrito del servicio de capacitación y entrenamiento en protección contra caída en trabajo en alturas.

 

13. Nombre e identificación de la empresa y su representante legal, empleador o contratante que envía al trabajador a capacitación y entrenamiento.

 

14. Nombre de la Administradora de Riesgos Laborales (ARL) a la que se encuentra afiliado el trabajador.

 

Parágrafo 1°. Los certificados de capacitación y entrenamiento que no cumplan con los anteriores requisitos estarán sujetos a las sanciones establecidas en la normatividad vigente.

 

Parágrafo 2°. Los certificados de culminación y aprobación de los procesos de capacitación y entrenamiento que expidan los proveedores del servicio de capacitación y entrenamiento en trabajo en altura no deberán contener logos o logotipos del Ministerio del Trabajo.

 

Parágrafo 3°. El SENA podrá seguir expidiendo los certificados según lo establecido en su programa de registro.

 

Artículo 60. Registro de procesos de capacitación y entrenamiento en trabajo en alturas. Todos los proveedores de capacitación y entrenamiento en protección contra caídas en trabajo en altura que culminen procesos de capacitación y entrenamiento, deberán registrar ante el Ministerio del Trabajo - Dirección de Movilidad y Formación para el Trabajo (DMFT) o quien haga sus veces, el listado con la información pertinente respecto de las personas que cursaron y aprobaron los programas respectivos.

 

El registro se hará dentro de los cinco (5) días hábiles siguientes a la finalización del curso.

 

En el caso del reentrenamiento el empleador deberá informar a su respectiva ARL los nombres y número de identificación de los trabajadores enviados capacitación dentro de los cinco (5) días hábiles siguientes al reporte por parte del empleador o contratante.

 

Parágrafo 1°. El proceso de capacitación y entrenamiento terminado que no se encuentre registrado ante la Dirección de Movilidad y Formación para el Trabajo (DMFT), no podrá ser acreditado por el Ministerio de Trabajo y en ese caso, el proveedor del servicio de capacitación y entrenamiento asumirá la responsabilidad por los perjuicios que lleguen a ocasionarse al trabajador por esta omisión.

 

Parágrafo 2°. El proceso de capacitación y entrenamiento o competencia laboral en trabajo en altura tendrá validez a partir de la fecha de expedición del certificado y dicha fecha de expedición del certificado no podrá ser mayor a cinco (5) días siguientes a la terminación del proceso de capacitación y entrenamiento o evaluación de competencia laboral.

 

TÍTULO IV

 

OBLIGACIONES Y DISPOSICIONES FINALES

 

CAPÍTULO I

 

Obligaciones



Artículo 61. Obligaciones del empleador. Todo empleador que tenga trabajadores que realicen tareas de trabajo en altura como mínimo debe:

 

a) Enviar al trabajador a las evaluaciones médicas ocupacionales conforme a lo establecido en la normatividad vigente.

 

b) Incluir en el Sistema de Gestión de la Seguridad y Salud en el Trabajo (SG-SST), el programa de prevención y protección contra caídas en altura de conformidad con lo establecido en la presente resolución.

 

c) Disponer y mantener un administrador del programa de prevención y protección contra caídas de altura y un coordinador de trabajo en alturas.

 

d) Suministrar al trabajador que realice actividades de trabajo en altura, los elementos necesarios y la capacitación requerida para el cumplimiento de sus funciones, roles y responsabilidades conforme a lo establecido en esta resolución, en ningún caso se podrá generar costo al trabajador.

 

e) Verificar que los procesos de capacitación y entrenamiento sean realizados por proveedores autorizados por el Ministerio del Trabajo y que estos cumplan con la intensidad horaria establecida en los programas de formación, conforme con lo establecido en la presente resolución.

 

f) Garantizar la divulgación de las actividades y/o los procedimientos de trabajo en alturas, a todo trabajador que las vaya a realizar. La divulgación deberá ser antes de iniciar labores.

 

g) Constatar que los equipos y sistemas usados en prevención y protección contra caídas sean inspeccionados por lo menos una vez al año o con la periodicidad indicada por el fabricante, conforme a lo establecido en esta resolución.

 

h) Conservar los registros de las revisiones y del mantenimiento que se practiquen a los sistemas o equipos utilizados para la realización de trabajos en altura.

 

i) Desarrollar los planes de prevención, preparación y respuesta ante emergencias y procedimientos de rescate en alturas documentados y disponer de recursos humanos, técnicos y equipos, necesarios para asegurar la respuesta en eventos de emergencia acorde a lo establecido en la presente resolución.

 

j) Garantizar que los menores de edad y las mujeres embarazadas en cualquier tiempo de gestación no realicen trabajo en altura.

 

k) Verificar que sus contratistas cumplan con lo establecido en la presente resolución, incluyendo su Sistema de Gestión de la Seguridad y Salud en el Trabajo SG-SST. Supervisar la aplicación de los procedimientos, las medidas de seguridad y salud de los trabajadores y contratistas. El empleador será solidario en los accidentes que se llegaran a ocasionar por la no implementación de las medidas descritas por parte de sus contratistas.

 

l) Exigir a los fabricantes y proveedores de equipos de protección contra caídas que las fichas técnicas, manuales de usuario o de mantenimiento y procedimientos estén en idioma español.

 

m) Asegurar que las fichas técnicas y manuales de usuario sean comprendidos por los trabajadores a quienes van dirigidos.

 

n) En casos de construcciones nuevas, es responsabilidad del constructor realizar durante las etapas de diseño y planeación, la adopción de estrategias de prevención y protección contra caídas y asegurarse que al entregar al servicio nuevas construcciones, estas cuentan con las facilidades para la seguridad en materia de trabajos en alturas para las futuras actividades de mantenimiento.

 

o) Asegurar la compatibilidad de los componentes del sistema de protección contra caídas; para ello debe evaluar o probar completamente si el cambio o modificación de un sistema cumple con el estándar a través del coordinador de trabajo en alturas o si hay duda, debe ser informada al responsable del sistema de gestión de la seguridad y salud en el trabajo SG-SST para gestionar la aprobación por parte de una persona calificada.

 

p) Cualquier empleador que requiera contratar actividades de trabajo en altura, deberá asumir el costo de la correspondiente capacitación del trabajador, dando aviso a la ARL a la cual se encuentra afiliado.

 

Artículo 62. Obligaciones de los trabajadores. Cualquier trabajador que desempeñe labores en altura debe:

 

a) Asistir y aprobar a las capacitaciones y reentrenamientos programadas por el empleador o contratante.

 

b) Cumplir todos los procedimientos de Seguridad y Salud en el Trabajo establecidos por el empleador o contratante.

 

c) Informar al empleador o contratante a través de quien haya sido designado, sobre cualquier condición de salud que le pueda generar restricciones, antes de realizar cualquier tipo de trabajo en altura.

 

d) Utilizar las medidas de prevención y protección contra caídas que sean implementadas por el empleador o contratante y que cumplan con lo establecido en la presente resolución.

 

e) Reportar al coordinador de trabajo en altura el deterioro, mal estado, o daño de los sistemas individuales o colectivos de prevención y protección contra caídas.

 

f) Participar en la elaboración y el diligenciamiento del permiso de trabajo en altura, así como acatar las disposiciones del mismo.

 

g) Conocer los peligros y controles que se han definido para realizar el trabajo en altura, así como las acciones requeridas en caso de emergencia.

 

h) Garantizar su seguridad y salud y la de otras personas que puedan verse afectadas por sus actos u omisiones en el trabajo.

 

Artículo 63. Obligaciones de las Administradoras de Riesgos Laborales (ARL). Las Administradoras de Riesgos Laborales, que tengan afiliadas empresas en las que exista el riesgo de caída por trabajo en altura, dentro de las obligaciones que le confiere los artículos 56, 59 y 80 del Decreto 1295 de 1994 o normas aplicables, deberán:

 

a) Realizar actividades de prevención, asesoría y evaluación de riesgos de trabajo en altura de acuerdo a la presente resolución.

 

b) Llevar registros de todos los trabajadores afiliados a la ARL, que son expuestos al riesgo de caída por trabajo en alturas, por sus aportantes.

 

c) Llevar registros de la accidentalidad que se genere por trabajos en alturas, de todos los afiliados a esta, por los aportantes de distintos sectores y reportarlo al Ministerio del Trabajo.

 

d) Ejercer la vigilancia y control en la prevención de los riesgos de trabajo en alturas conforme a lo establecido en la presente resolución.

 

e) Participar, en la investigación de accidentes de trabajo de sus afiliados, relacionados con trabajos en alturas que, por su complejidad y consecuencia grave en el trabajador, requiera la revisión de la competencia obtenida por este, a través del proceso de capacitación y entrenamiento en trabajo en alturas impartido por el oferente y que debió ser verificado por su aportante.

 

f) Asesorar a los empleadores, en la compra y adquisición de los elementos requeridos para la protección personal para trabajo en altura.

 

g) Elaborar, publicar y divulgar guías técnicas por actividades económicas para la aplicación de la presente resolución, las cuales deben ser revisadas y autorizadas por el Ministerio del Trabajo.

 

Parágrafo 1°. Las Administradoras de Riesgos Laborales podrán establecer mecanismos, programas y acciones para la asesoría en gestión para el control efectivo de los riesgos en trabajo en altura.

 

Parágrafo 2°. Cuando la Administradora de Riesgos Laborales participe en la investigación de accidente de trabajo y establezca el eventual incumplimiento del contenido e intensidad horaria del programa de capacitación y entrenamiento por parte del Proveedor de capacitación de trabajo en altura, deberá proceder a informar a la Dirección de Movilidad y Formación para el Trabajo (DMFT) y a la Dirección territorial del Ministerio del Trabajo.

 

Artículo 64. Obligaciones de los Proveedores del servicio de capacitación y entrenamiento en trabajo en alturas. Las personas naturales y jurídicas con licencia en Seguridad y Salud en el Trabajo, las Instituciones de Educación para el Trabajo y Desarrollo Humano, las Instituciones de Educación Superior, el SENA y las Unidades Vocacionales de Aprendizaje en Empresa (UVAE), que estén inscritas en el registro del Ministerio del Trabajo, como Proveedores del servicio de capacitación y entrenamiento en protección contra caída en trabajo en altura, deberán:

 

Estar inscritos en el registro de la Dirección de Movilidad y Formación para el Trabajo (DMFT) del Ministerio del Trabajo.

 

a) Llevar el registro de todas las personas capacitadas y entrenadas en trabajo de conformidad con lo establecido en la presente resolución.

 

b) Llevar registros del cumplimiento del 100%, de los contenidos e intensidad horaria, de todos los temas y/o módulos de los programas de formación que se impartan a trabajadores de empresas solicitantes del servicio de conformidad con lo establecido en la presente resolución.

 

c) Cumplir con las medidas de prevención y protección contra caídas, tendientes a garantizar la seguridad y salud de sus trabajadores, entrenadores y aprendices en etapa de capacitación y entrenamiento, conforme a la normatividad nacional aplicable.

 

d) Garantizar la disponibilidad permanente del 100% de las estructuras, equipos e instalaciones necesarias para impartir los programas de capacitación y entrenamiento, y que estas se encuentren en óptimas condiciones.

 

e) Mantener las condiciones técnicas, operativas y jurídicas con las que fue inscrito como proveedor del servicio de capacitación y entrenamiento en protección contra caída en trabajo en altura, conforme lo establecido en la presente resolución.

 

f) Entregar a las personas o trabajadores el certificado de aprobación del curso en los términos señalados por la presente resolución.

 

Parágrafo 1°. Cuando se presente un accidente de alguno de los aprendices en etapa de capacitación o entrenamiento, el proveedor de capacitación deberá informar a su aseguradora y al empleador de este para reportar ante la ARL al que estuviera afiliado el accidentado.

 

CAPÍTULO II

 

Disposiciones Finales

 

Artículo 65. Casos especiales. Cuando para un sector o actividad económica se demuestre que uno o varios aspectos contenidos en el Título II, Capítulo II y Capítulo V de la presente resolución no pueden ser aplicados, se diseñarán guías técnicas especializadas enfocadas en brindar la seguridad necesaria y equivalente en los aspectos específicos que no se pueden cumplir, sin perjuicio del cumplimiento de las demás disposiciones descritas en la presente resolución.

 

Estas guías podrán ser desarrolladas tanto por las Administradoras de Riesgos Laborales, los gremios, las comisiones sectoriales y en todo caso, requerirán la revisión y aprobación de la Dirección de Riesgos Laborales del Ministerio del Trabajo.

 

Artículo 66. Inspección Vigilancia y Control. Corresponderá a la Dirección de Inspección Vigilancia y Control, por medio de las Direcciones Territoriales, Oficinas Especiales e Inspecciones Municipales, la verificación del cumplimiento de las disposiciones señaladas en la presente resolución.

 

Artículo 67. Vigencia. La presente resolución comenzará a regir a los seis (6) meses de su publicación, tiempo durante el cual las empresas, empleadores, contratistas y oferentes de capacitación, implementarán los ajustes necesarios para su cumplimiento.

 

Artículo 68. Derogatoria. La presente resolución deroga las disposiciones que le sean contrarias, en especial, las siguientes Resoluciones: Resolución 1409 de 2012, Resolución 1903 de 2013, Resolución 3368 de 2014, Resolución 1178 de 2017 y Resolución 1248 de 2020.

 

PUBLÍQUESE Y CÚMPLASE.

 

Dada en Bogotá, D.C., a los 27 días del mes de diciembre del año 2021.

 

El Ministro del Trabajo

 

ÁNGEL CUSTODIO CABRERA BÁEZ.



Nota: Ver norma original y Anexos en Anexos. 

 