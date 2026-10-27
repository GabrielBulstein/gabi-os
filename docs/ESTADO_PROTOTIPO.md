# Estado del episodio piloto 0.1

Registro histórico del piloto. Para la ampliación actual, consultar `ESTADO_VERSION_1.0.md`. El piloto fue publicado posteriormente con autorización del usuario.

Referencia: `GABI_OS_Documento_Maestro_v1.0.md`. La autorización posterior del usuario permite reconstrucción completa y elimina la obligación de conservar/migrar herramientas anteriores. El resto del Documento Maestro sigue vigente.

## Implementado

- Base TypeScript/Vite/Phaser y compilación estática bajo `/gabi-os/`.
- Rama remota de recuperación creada antes de reemplazar archivos; desarrollo separado de main.
- Oficina original isométrica, suelo texturado, paredes en corte, ventanas con skyline, biblioteca, alfombras, escritorios, plantas, sala, recepción y cafetería como base espacial ampliable.
- Gabi en el sector superior semi-central y Gabito cerca; reuniones al noreste, cafetería al sureste y recepción hacia el sur. Las estaciones vacías son reservas de escenario, no personajes/agentes activos.
- Dos sprites originales con cuatro orientaciones y cinco animaciones de ocho cuadros: reposo, caminar, saludar, mate y rutina de escritorio. El movimiento cambia cuadros, no solo posiciones.
- Rutas A* sobre grilla, huellas bloqueadas, reservas de celdas entre personajes y reintento de recorridos.
- Vista general inicial, zoom, panorámica, pinza, seguimiento opcional, límites y restablecimiento. Arrastrar cancela seguimiento; gestos no disparan selección accidental.
- Dos fichas, acciones ambientales, cinco puntos de inspección y confesionario escrito de Gabito.
- Termo con frase exacta visible en su inspección. Cuadro original azul y oro reservado, sin escudo oficial.
- Personalización inicial de Gabi: ropa, pelo, piel, barba, anteojos; preferencias locales versionadas.
- Humor omisible/configurable y tratamiento explícito como ambientación. Sin diálogos automáticos que suplanten a Gabi.
- Inicio silencioso, reducción de movimiento, límites 30/60 FPS y pausa por pestaña oculta.
- Paneles adaptativos, controles HTML y de teclado, foco visible y diálogos nativos.
- Workflow de comprobación/artefacto y workflow de publicación manual restringido a main. Ningún despliegue nuevo ejecutado.

## Pendiente para 1.0

- El Profe, Migue, Pame, Nacho, Kevin y Dexter: diseños originales, fichas, animaciones y rutinas individuales.
- Completar el escenario y sus accesorios específicos: rincón académico, doble monitor y cables de Migue, diagramas de Dexter, CVs, puesto contable de Kevin, fotocopiadora y entrada del jefe.
- Ajustar arte final con aprobación del usuario: siluetas, variedad de muebles, poses de trabajo, expresiones y más detalle ambiental. El arte por código actual es original y editable; no reemplaza una revisión artística cuadro por cuadro.
- Los siete hotspots completos: faltan el pizarrón del Profe, fotocopiadora y recepción funcional; escritorio y reuniones tienen inspección conceptual, todavía no bandeja/tablero ni escenas completas.
- Reuniones de equipo y escenas de sitcom entre personajes, miradas a cámara y bienvenida opcional una vez por sesión.
- Ciclo visual día/tarde/noche/madrugada y vaciado ambiental coherente. El reloj actual sí muestra Buenos Aires; la iluminación del piloto permanece diurna.
- Música y efectos originales/licenciados, activación explícita y volúmenes independientes. El piloto es silencioso y no expone controles que finjan audio disponible.
- Más variantes de pelo/ropa/accesorios; actual editor permite colores, barba y anteojos.
- Optimización medida en hardware real, revisión de accesibilidad completa, Safari/iPhone físico y orientación horizontal.
- Nuevo soporte PWA/offline, pruebas del retiro del worker viejo con una instalación previa y verificación del checklist íntegro del Documento Maestro.

## Fuera de este prototipo y de la 1.0 visual

IA real, OpenClaw, WhatsApp, agendas/correo, memoria operativa, permisos de ejecución, tareas persistentes, notificaciones reales y backend. No se configuró infraestructura remota ni se gastó en APIs.

## Validación registrada

Validación local del 27 de octubre de 2026: compilación TypeScript/Vite correcta; cinco pruebas unitarias aprobadas; nueve casos de navegador aprobados sobre el build de producción, con un caso de pinza omitido en escritorio por corresponder solo a móvil. Auditoría npm sin vulnerabilidades conocidas al momento de ejecutar. Navegador: Edge/Chromium, escritorio 1440 × 960 y emulación iPhone 13.

Consultar los resultados actuales ejecutando `npm test`, `npm run build` y `npm run test:e2e`. Las capturas y resultados locales se escriben en `test-results/`, que no se versiona. No confundir emulación Chromium con validación de Safari en un teléfono real.
