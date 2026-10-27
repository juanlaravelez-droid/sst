Los componentes críticos y los requisitos de ley que tu sistema de campo debe resolver técnicamente son:

1. El Flujo de Firmas y Roles en Campo

La ley exige que el permiso esté firmado por tres roles específicos antes de iniciar la labor. Tu sistema debe capturar estas firmas de forma electrónica o digital (por ejemplo, mediante pantallas táctiles, códigos PIN únicos o biometría):
• Trabajador(es) autorizado(s): Quienes van a realizar la labor. Debe registrar su nombre, cédula y firma.
• Coordinador de Trabajo en Alturas: Quien evalúa el sitio, verifica los controles de seguridad y avala que el entorno es seguro.
• Emisor / Persona que autoriza: El jefe de área, supervisor o encargado de SST que da el visto bueno final para el inicio de las actividades.

2. Los 18 Datos Obligatorios por Ley (Base de Datos)

El artículo 18 de la Resolución 4272 detalla la información que el permiso debe contener obligatoriamente. Asegúrate de que tu base de datos y tus formularios en campo incluyan estos campos estructurados:
1. Nombre(s) de los trabajadores autorizados.
2. Firmas de los trabajadores y de las personas que autorizan.
3. Fecha y hora de inicio y de terminación de la tarea (el permiso solo dura lo que dure la jornada laboral).
4. Descripción de la tarea a realizar.
5. Altura aproximada a la que se ejecutará la labor.
6. Puntos de anclaje seleccionados para la actividad.
7. Sistemas de acceso a utilizar (andamios, escaleras, plataformas elevadoras, etc.).
8. Equipos de protección contra caídas (EPCC) a emplear.
9. Herramientas y equipos a utilizar en la tarea.
10. Análisis de Trabajo Seguro (ATS) adjunto o integrado.
11. Sistemas de prevención implementados (delimitación, señalización, línea de advertencia).
12. Sistemas de comunicación en campo (radios, silbatos, señas).
13. Plan de rescate específico para la actividad, verificado y disponible en el sitio.
14. Verificación de condiciones de salud del trabajador (auto-reporte de condiciones físicas y psicológicas del día).
15. Nombre y firma del Coordinador de Trabajo en Alturas.
16. Nombres y firmas de los emisores del permiso.
17. Observaciones especiales.
18. Lista de chequeo de inspección de los equipos de protección contra caídas (arnés, eslingas, conectores).

3. Requerimientos Técnicos Clave para una App de Campo

Si estás diseñando la arquitectura del software, integra estas funcionalidades esenciales:
• Modo Offline (Fuera de Línea): El trabajo en alturas suele ocurrir en sótanos, zonas rurales o estructuras de gran altitud donde la señal celular falla. La aplicación debe permitir diligenciar todo el permiso localmente en el dispositivo y sincronizar los datos automáticamente apenas recupere conexión a internet.
• Validación de Vigencia Automatizada: Al ingresar la cédula del trabajador, el sistema debería cruzar datos con el módulo de talento humano o SST para verificar si su certificación de alturas está vigente y si su examen médico ocupacional (aptitud para alturas) sigue válido. Si algo expiró, el sistema debe bloquear la emisión del permiso.
• Evidencia Fotográfica Obligatoria: Agrega un campo en el formulario digital que obligue al coordinador a tomar fotos en tiempo real del punto de anclaje, los andamios o el estado de los arneses. Esto demuestra que la inspección física realmente ocurrió y no se hizo "de escritorio".
