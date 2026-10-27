# GABI OS — The Pixel Office · 1.0.0-rc.1

Ampliación funcional completa solicitada por el usuario. Referencia: Documento Maestro v1.0. La oficina completa y el selector derecho fueron publicados con aprobación; el usuario confirmó su funcionamiento en iPhone. La rama `dev/pixel-office` incorpora ahora una etapa posterior de infraestructura local, documentada en [Servidor de escritorio](SERVIDOR_ESCRITORIO.md), todavía sin publicar.

## Implementación

Ajuste aprobado posteriormente por el usuario: selector del elenco en columna vertical sobre el borde derecho, con desplazamiento vertical cuando es necesario y fichas ubicadas a su izquierda. Esta preferencia posterior prevalece sobre la disposición del piloto.

| Área | Entrega |
| --- | --- |
| Elenco | Gabi, Gabito, El Profe, Migue, Pame, Nacho, Kevin y Dexter con diseño original y ficha propia. |
| Animaciones | Reposo, caminar, saludar, mate, escritorio, oficio, reacción, diálogo y mirada a cámara; cuatro orientaciones y cuadros distintos. |
| Mapa | Escritorios personalizados, biblioteca/pizarrón, doble monitor y cables, diagramas, CVs, calculadora/snacks, recepción/fotocopiadora, sala, kitchenette y entrada. |
| Circulación | A*, reservas coordinadas, ocho destinos de reunión, espera, recálculo y cesión de paso; sin saltos al cancelar. |
| Cámara | Panorámica, zoom, pinza, seguimiento optativo y reset; ninguna escena cambia el encuadre. |
| Siete lugares | Escritorio de Gabi, reuniones, cafetería, pizarrón, fotocopiadora, recepción y termo. Cuadro reservado como inspección adicional. |
| Superficies demo | Bandeja/tablero, materias y agenda con etiquetas explícitas de demostración; no se ejecutan acciones reales. |
| Sitcom | Café/presupuesto, Migue/Dexter, atasco, Profe, reclutamiento, reunión de ocho, más bienvenida opcional. Pausa, siguiente y omisión. |
| Confesionarios | Siete textos individuales; Gabi no tiene frases ficticias que suplanten al usuario. |
| Avatar | Colores, pelo corto/rulos/largo, suéter/buzo/camisa, barba, anteojos, gorra y auriculares; persistencia local. |
| Horario | Ciclo de Buenos Aires, cierre gradual, madrugada sin personal, pantallas emisivas y lámparas; vistas previas rotuladas. |
| Audio | Música original procedural, efectos sintetizados, controles independientes y silencio en cada carga. |
| Preferencias | Humor apagable, frecuencia baja/moderada, bienvenida por sesión, calidad automática/manual, detalles y reducción de movimiento. |
| Agentes | Ninguna conexión real; contratos de eventos ambientales separados de tareas futuras. |

## Criterios pendientes de aceptación final

- Revisar y aprobar la apariencia del elenco completo, las animaciones y la densidad del escenario. El arte es original por código; no se usaron emojis, sprites de terceros ni retratos.
- Probar Safari en un iPhone físico: gestos, audio, rotación, consumo de memoria y respuesta sostenida. La emulación de Chromium ayuda, pero no confirma esos resultados.
- Medir rendimiento sostenido en los dispositivos del usuario; 30/60 FPS son límites configurados y objetivos, no garantías.
- El escudo oficial de Boca sigue reservado hasta validar su recurso. El Documento Maestro admite esa reserva.
- Autorizar una nueva publicación cuando la RC sea revisada. No se actualiza producción al subir esta rama.

## Verificación

La suite cubre conectividad completa del mapa, ocho actores en reunión sin colisiones, destinos alternativos, cancelación, horario de Buenos Aires, compatibilidad de preferencias, perfiles/confesionarios/hotspots, escenas y omisión, audio por gesto y sus fallos, volúmenes separados, bienvenida y cámara/táctil. Ejecutar `npm test`, `npm run build` y `npm run test:e2e` para resultados reproducibles. Las capturas actualizadas están en `docs/previews/`.

Validación local del 27 de octubre de 2026: once pruebas unitarias aprobadas; veintitrés casos de navegador aprobados en escritorio y emulación iPhone 13; un caso de pinza omitido en escritorio por ser exclusivo de móvil. Compilación TypeScript/Vite correcta y auditoría npm sin vulnerabilidades conocidas en ese momento. No se confunde esa emulación con Safari físico.

## Publicación y recuperación

El piloto publicado corresponde a `584afc15b29d5b9307852bf662487e08f4958c7c`. La aplicación previa al rediseño sigue guardada en `archive/pre-pixel-office-2026-10-27`, commit `43c380ef681730d646b596ead32d528673032bb4`. Pages ya usa Actions; el despliegue nuevo continúa siendo manual y requiere la autorización del usuario.

## Fuera de alcance

OpenClaw, WhatsApp, modelos, memoria operativa, tareas persistentes, correo, calendarios y aprobaciones reales corresponden a 1.5/2.0. Esta ampliación no modifica equipos remotos ni contrata servicios. El soporte offline/PWA nuevo puede tratarse después y no es requisito para usar la oficina visual online.
