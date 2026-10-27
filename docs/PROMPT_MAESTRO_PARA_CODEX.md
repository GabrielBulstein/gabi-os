# Encargo para Codex — GABI OS: The Pixel Office

Quiero transformar mi proyecto **GABI OS**, actualmente publicado en GitHub Pages, en **GABI OS — The Pixel Office**. El producto está completamente definido en el archivo adjunto **`GABI_OS_Documento_Maestro_v1.0.md`**. Léelo entero: sus 19 decisiones, sus ocho personajes, su mapa, las restricciones y la lista de aceptación son requisitos, no ideas sueltas.

## Contexto

La experiencia principal será una **oficina pixel art isométrica**, cálida y cotidiana, con humor de sitcom inspirado en *The Office*. Ocho avatares: **Gabi (usuario), Gabito, el Profe, Migue, Pame, Nacho, Kevin y Dexter**. Gabi tiene escritorio propio pero controla la oficina con clics y gestos, como en un simulador de gestión. El diseño debe ser reconocible y atractivo en iPhone y PC.

## Alcance estricto de la primera entrega: versión 1.0 VISUAL

Quiero un videojuego de oficina dentro de la web, no un dashboard genérico. Incluye mapa original isométrico, sprites auténticos y animados, circulaciones sin atravesar muebles, escritorios característicos, cámara híbrida (vista general, zoom, pan, seguimiento, reset), clic/toque sobre personajes, paneles emergentes minimalistas, siete objetos clave interactivos, avatar personalizable de Gabi, ciclo día/noche, pequeños eventos de sitcom con confesionario y efectos/música opcionales con silencio inicial. Debe ser usable desde iPhone y escritorio y tener opciones de rendimiento y reducción de movimiento.

**No conectar todavía modelos IA, agentes OpenClaw, WhatsApp, calendarios, correo, base de datos operativa ni servicios pagados.** Los personajes de la 1.0 podrán mostrar animaciones ambientales, **pero no deben fingir trabajos de IA ni reportes reales**. Etiquetá las demostraciones como tales. La infraestructura futura debe poder conectarse sin rehacer el mundo visual.

## Proceso que te pido seguir

1. **Inspeccioná primero** el repositorio GABI OS al que tenga acceso esta sesión: stack, estructura, assets, publicación GitHub Pages, deuda técnica, y estado de la versión existente. No asumas tecnología o rutas sin leer el proyecto.
2. Antes de editar, entregame un **diagnóstico breve y un plan de implementación incremental**, indicando tecnología visual recomendada, sistema isométrico, sprites/atlas, navegación táctil, animaciones, arquitectura modular, riesgos, dependencias, validación y estructura de carpetas. Elegí Phaser, PixiJS, canvas o equivalentes **solo después de inspeccionar** la base de código y justificarlo.
3. Priorizá un **vertical slice** demostrable (una porción del mapa, 1–2 sprites animados, cámara y panel) para validar dirección artística y rendimiento antes de generar el mundo completo.
4. Después avanzá por hitos: mapa y ocho sprites originales → movimiento/pathfinding y cámara → paneles/hotspots y avatar → sitcom/ciclo día-noche/audio → optimización, accesibilidad y pruebas.
5. En cada hito entregá qué cambió, cómo probarlo en móvil y PC, y qué puntos del checklist se cumplen. Mantené una vista funcional y control de versiones con posibilidad de revertir.
6. **No publiques ni sobrescribas la web de producción sin mi aprobación explícita**. Trabajá en rama/preview cuando sea posible.

## Restricciones importantes

- Respetar la distribución del Documento Maestro: **Gabi norte semi-central; Gabito cerca; sala de reuniones noreste; el Profe oeste; Migue centro-izquierda; Dexter centro-derecha; Nacho este; Kevin cercano a cafetería; Pame y entrada al sur; cafetería sureste.**
- Gabito debe tener look under/deportivo, **termo «CEO DE ESTE QUILOMBO»** y un cuadro vinculado a Boca Juniors (validar el uso de recursos de marca para publicación).
- El Profe es mayor y todos lo tratan de usted; Migue es regordete/friki; Pame toma inspiración visual en Pam Beesly sin usar una copia no autorizada; Nacho es reclutador; Kevin es contador gracioso pero nunca puede ser impreciso en cálculos reales futuros; Dexter analiza procesos.
- Humor contextual/moderado, con miradas a cámara y confesionario, configurable. Sin secuestro de cámara ni escenas que bloqueen el uso.
- **Arte final original, pixel art consistente y sprites realmente animados.** Evitar mezclar stock incompatible, emojis estáticos o simples imágenes trasladadas como producto final.
- No incluir tokens/API keys ni credenciales en cliente. No inventar integraciones o estados conectados.
- La PC de escritorio futura tendrá Intel Core i5 (generación por confirmar), 32 GB RAM y HDD con 300 GB libres. **Eso no es necesario para servir el frontend de la 1.0**: preservar posibilidad de publicar en GitHub Pages; backend vendrá después.

## Definición de terminado

No dar por finalizada la 1.0 hasta que los criterios de aceptación del Documento Maestro puedan probarse y las limitaciones pendientes estén explícitas. Necesito una oficina pixel que se sienta viva, no una maqueta estática. Primero quiero ver el diagnóstico y el plan; después autorizaremos cada fase de construcción.
