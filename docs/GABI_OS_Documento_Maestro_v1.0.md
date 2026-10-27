# GABI OS — THE PIXEL OFFICE
## Documento Maestro definitivo de producto y diseño

**Edición:** 1.0 — concepto aprobado  
**Fecha:** 27 de octubre de 2026  
**Estado:** especificación conceptual lista para entregar a Codex. **No se ha programado ni modificado el repositorio durante esta etapa.**  
**Idioma de la experiencia:** español argentino.  
**Producto base:** evolución del GABI OS ya publicado; no comenzar una aplicación ajena sin inspeccionar la base existente.

---

## 1. Visión del producto

GABI OS — *The Pixel Office* es una oficina virtual **pixel art isométrica**, cálida, cotidiana y levemente caótica, inspirada en el ritmo cómico de una sitcom laboral al estilo *The Office*. El usuario es el fundador y tiene un avatar y un escritorio dentro del escenario, pero administra todo **desde afuera, mediante clics y gestos táctiles**: no necesita manejar su avatar con controles de videojuego.

El producto combina dos capas que deben mantenerse diferenciadas:

1. **Mundo visual:** sprites, escenarios, movimientos, diálogos ficticios, sonidos, exploración y humor.
2. **Trabajo real de especialistas IA (versiones posteriores):** agentes, tareas persistentes, memoria, autorizaciones, informes y automatizaciones.

**Objetivo de la versión 1.0:** un pequeño videojuego de oficina plenamente visual e interactivo, disfrutable desde iPhone y computadora. Las integraciones reales no son requisito de aceptación del primer lanzamiento. Una animación de alguien tipeando **no equivale a una tarea de IA en ejecución**.

### Principios irrenunciables
- La oficina debe verse viva sin resultar molesta ni abrumadora.
- Los ocho personajes deben ser reconocibles por silueta, ropa, accesorio y comportamiento.
- Prioridad absoluta a la versión móvil y a la posibilidad de explorar cómodamente el mapa.
- Humor moderado, contextual y optativo: la sitcom nunca bloquea una acción útil.
- Acciones y datos ficticios siempre identificados como ambientación o demostración; jamás inventar trabajos terminados, resultados de IA ni notificaciones reales.
- Código modular y extensible, preparado para conectar un motor de agentes sin reconstruir la interfaz.
- Aprovechar lo existente, con costos controlados y sin exponer credenciales.

---

## 2. Registro de las 19 decisiones aprobadas

| Nº | Decisión firme |
|---|---|
| 01 | Gabi tiene avatar y escritorio, pero gobierna desde fuera haciendo clic (modelo híbrido). |
| 02 | Escritorio de Gabi en la zona superior semi-central, destacado pero integrado al equipo. |
| 03 | Oficina en **pixel art isométrico**, vista diagonal con profundidad; sin LEGO ni estética JARVIS. |
| 04 | Personajes pixelados **caricaturescos y expresivos**, cabezas algo grandes, gestos legibles. |
| 05 | **Cámara híbrida:** panorámica inicial, zoom, desplazamiento, seguimiento y botón de restablecer vista. |
| 06 | Comunicación futura híbrida: trato directo con especialistas o coordinación de Gabito; bandeja unificada. |
| 07 | Autonomía futura supervisada: ejecución de trabajos previamente autorizados; acciones sensibles requieren aprobación. |
| 08 | Memoria futura mixta: memoria individual + conocimiento común + permisos de intercambio. |
| 09 | Notificaciones futuras inteligentes: avisos normales agrupados; aprobaciones en bandeja; urgencias críticas inmediatas. |
| 10 | Ciclo día/noche **visual realista** con oficina que se vacía y horas extra si hay tareas reales; sin restringir automatizaciones. |
| 11 | Gestión futura asistida: Gabi plantea objetivos, Gabito propone plan y responsables, Gabi aprueba, equipo ejecuta. |
| 12 | Servidor principal futuro: **PC de escritorio propia**, Core i5 (generación pendiente), 32 GB RAM, HDD con aprox. 300 GB libres; diseñada para poder migrar. |
| 13 | **Primera entrega visual**, dejando IA, memoria operativa y automatizaciones para próximas versiones. |
| 14 | **Oficina abierta con sectores**, un solo mapa: escritorios, recepción, cafetería y sala de reuniones. |
| 15 | **Interactividad media:** personajes y objetos clave; la mayoría de los accesorios son decorativos. |
| 16 | Sonidos ambientales y música instrumental pixel art opcionales, controles separados; **silencio de inicio**. |
| 17 | Avatar de Gabi con personalización básica de pelo, barba, ropa y accesorios. |
| 18 | Interfaz retro **minimalista** con paneles emergentes, sin barra lateral permanente. |
| 19 | Calidad gráfica **adaptable**, con ajuste manual y opción de reducir movimiento. |

Decisiones complementarias también aprobadas: humor **sitcom interactiva con frecuencia moderada**, entrevistas/confesionario y miradas a cámara; elenco definitivo de ocho figuras; personalidades y relaciones de los personajes; sistema conceptual de permisos, trazabilidad y proyectos.

---

## 3. Reparto definitivo: ocho personajes

Los siete especialistas son identidades narrativas y, en versiones posteriores, posibles perfiles/agentes funcionales. **Gabi no es un agente de IA.** Todo sprite debe ser diseñado de forma coherente y original en un mismo lenguaje artístico; las referencias a series son inspiración, no instrucciones de usar retratos, fotogramas o sprites de terceros sin derechos.

### 01. Gabi — fundador, avatar del usuario
- **Ubicación:** escritorio propio al norte, semi-central.
- **Aspecto:** casual, cercano; configurable en pelo, barba, vestimenta y accesorios. No imponer rasgos físicos no provistos.
- **Objetos:** computadora, mate y algunos detalles personales discretos (guiño a panadería opcional).
- **Animaciones:** estar sentado, revisar, aprobar con pulgar, saludar, participar en reunión.
- **Interacción:** toca su escritorio para acceder a bandeja, tablero y controles; no emite diálogos automáticos fingiendo ser el usuario.

### 02. Gabito — gerente general y coordinador
- **Aspecto:** estilo **under/deportivo**, campera o ropa deportiva retro, zapatillas, actitud canchera; abandonar camisa ejecutiva y corbata.
- **Objetos imprescindibles:** **termo con la leyenda exacta «CEO DE ESTE QUILOMBO»** y **cuadrito con el escudo de Boca Juniors** en su zona. Verificar derechos de uso del escudo antes de incorporar un archivo gráfico oficial en una web pública; reservar el cuadro mientras tanto.
- **Personalidad:** humor frecuente, ironía, humor negro ocasional apropiado, iniciativa y comentarios estoicos/motivadores cuando corresponda, sin saturar.
- **Animaciones:** recorrer la oficina, delegar gesticulando, tomar mate, acercarse al escritorio de Gabi, recibir informes.
- **Relación:** mano derecha de Gabi; discute presupuestos con Kevin; trata al Profe de usted.

### 03. El Profe — educación
- **Aspecto:** varón entrado en años, canoso, anteojos, cardigan y señales claras de experiencia.
- **Personalidad:** autoridad tranquila, paciente pero exigente; **todos los personajes lo tratan de usted**.
- **Zona:** rincón académico a la izquierda, biblioteca y pizarrón.
- **Animaciones:** leer, escribir en el pizarrón, acomodarse los lentes, señalar libros.

### 04. Migue (Miguel) — programación
- **Aspecto:** algo regordete, friki, ropa cómoda o remera gamer, auriculares; detalles de cansancio simpático.
- **Zona:** centro-izquierda, dos monitores, teclado, cables y pequeños coleccionables.
- **Personalidad:** apasionado por tecnología, ingenioso, discutidor de bugs, algo caótico.
- **Animaciones:** tecleo, error visual, agarrarse la cabeza, mini festejo, café.
- **Relación:** debate técnico permanente y amistoso con Dexter; recibe bromas de Pame.

### 05. Pame — secretaria y recepcionista
- **Aspecto:** inspiración cercana en **Pam Beesly** de *The Office*: pelo castaño, cardigan, ropa de oficina sencilla, gestos expresivos; producir diseño propio sin reproducir una imagen/identidad fotográfica de la actriz.
- **Zona:** recepción junto a la entrada sur.
- **Personalidad:** observadora, práctica, humor seco, más sensata que muchos compañeros.
- **Animaciones:** recibir, archivar, teléfono, expresar incredulidad, **mirar a cámara**.
- **Función futura:** agenda, bandeja, clasificación de notificaciones.

### 06. Nacho (Ignacio) — reclutador IT
- **Aspecto:** informal profesional, camisa remangada, jean y zapatillas; notebook y carpetas de CVs.
- **Zona:** lateral este, próximo a área administrativa.
- **Personalidad:** entusiasta, realista respecto del mercado IT, carisma para negociar.
- **Animaciones:** consultar ofertas, revisar CV, atender teléfono y festejar hallazgos.

### 07. Kevin — finanzas y contabilidad
- **Inspiración:** **Kevin Malone** de *The Office*, recreado como sprite original: regordete, camisa celeste, corbata desalineada y expresión distraída.
- **Zona:** lateral este/sureste, cerca de la cafetería.
- **Objetos:** calculadora, facturas, pantalla de planillas y golosinas.
- **Personalidad narrativa:** bonachón, glotón y distraído en bromas; **los cálculos y datos financieros reales deberán ser rigurosos y verificables**.
- **Animaciones:** calculadora, comer snacks, revisar cifras, reacción cómica ante gastos.

### 08. Dexter — análisis de sistemas y procesos
- **Aspecto:** ropa funcional, suéter mostaza o camisa verde oliva, marcador, documentos y tablero con diagramas.
- **Zona:** centro-derecha, próximo a Migue.
- **Personalidad:** lógico, observador, metódico, obsesionado con entender procesos.
- **Animaciones:** diagramar, pensar, mover notas, gesto de descubrimiento.

### Relaciones recurrentes de sitcom
Gabito ↔ Kevin: presupuesto y discusiones; Pame ↔ Migue: bromas; Migue ↔ Dexter: improvisación frente a análisis; Gabito ↔ El Profe: respeto con trato de usted; Nacho ↔ Kevin: oportunidades frente a costos; Pame ↔ Gabito: ironías y miradas a cámara.

---

## 4. Mapa isométrico: distribución espacial aprobada

**Un solo escenario**, oficina mediana, abierta pero sectorizada. No habitaciones separadas que obliguen a cambiar de pantalla. Delimitar con muebles, alfombras, tabiques bajos y suelos; preservar líneas visuales.

### Zonificación por posición conceptual
- **Norte semi-central:** escritorio de Gabi, destacado pero accesible, con área libre para reportes.
- **Norte contiguo a Gabi:** Gabito, fácilmente conectado con pasillos centrales.
- **Noreste alto:** sala de reuniones semiabierta, mesa para encuentros de equipo y pizarra/pantalla.
- **Oeste:** El Profe, espacio de estudio tranquilo, estantería y pizarrón.
- **Centro-izquierda:** Migue, entorno técnico, doble monitor.
- **Centro-derecha:** Dexter y tablero de diagramas, cercano a Migue.
- **Este medio/inferior:** Nacho, CVs, tablón de empleo y escritorio.
- **Este/sureste:** Kevin, cercano al sector de café pero con puesto contable propio.
- **Sur izquierda / acceso:** mostrador de Pame y fotocopiadora.
- **Sur central:** puerta principal, alfombra, entrada de avatar en escenas de bienvenida.
- **Sureste:** cafetería/kitchenette, cafetera, heladera, microondas y pequeña mesa.

### Tránsito y accesibilidad del mapa
- Eje principal norte-sur: dirección ↔ recepción/entrada.
- Eje oeste-este: El Profe ↔ Migue ↔ Dexter ↔ administración.
- Ruta perimetral accesible hacia reuniones y cafetería.
- Reservar espacios de encuentro/hotspots: delante del escritorio de Gabi; entre Migue y Dexter; recepción; cafetería; sala de reuniones.
- Los personajes caminan por superficies transitables, evitan muebles y no atraviesan paredes o escritorios. Preparar puntos de destino para escritorio, café, reunión y conversación.
- Mantener pasillos legibles al nivel normal de zoom en pantallas móviles.

La posición visual concreta y la grilla técnica podrán ajustarse durante la producción artística, **sin alterar estas relaciones espaciales aprobadas**.

---

## 5. Apariencia y arte

- Estilo **pixel art isométrico coherente**, evitando mezclar resoluciones, perspectivas o assets de estilos incompatibles.
- Proporciones caricaturescas, cabezas ligeramente sobredimensionadas, siluetas distinguibles y animación por sprites (no limitarse a desplazar imágenes estáticas).
- Paleta de oficina cálida y vivida: beiges, grises cálidos, marrones, verdes apagados y azul desaturado; sin estética cyberpunk/neón JARVIS.
- Texturas de alfombra, madera, archivadores, cables, papeles, plantas, reloj, ventilación, ventanas y pequeños guiños cómicos.
- Identidad reconocible incluso desde vista panorámica; al hacer zoom aparecen detalles secundarios.
- Una escena de noche con lámparas y monitores encendidos, y gradación visual durante día/tarde/noche/madrugada, siguiendo **America/Argentina/Buenos_Aires** como zona del ciclo ambiental.
- Evitar replicar comercialmente imágenes, personajes o marcas protegidas; usar material original/licenciado cuando se publique. El usuario desea especialmente la referencia visual a Pame/Pam, Kevin/Kevin Malone y el cuadro de Boca.

---

## 6. Cámara y navegación

**Cámara híbrida:** entrar con vista general del mapa; permitir zoom y desplazamiento libre, seguir a un personaje de forma optativa, y botón visible para volver a vista general. La cámara **no secuestra el control** ante escenas espontáneas ni notificaciones.

- **iPhone/táctil:** toque para seleccionar; arrastre de un dedo para panorámica; pinza para zoom; distinguir arrastre de tap.
- **PC:** clic para seleccionar; arrastre para mover; rueda o controles para zoom.
- Centrar personaje seleccionado si el usuario lo solicita y posibilidad de dejar de seguirlo.
- Límites razonables de zoom/desplazamiento para evitar perder mapa o ver sprites ilegibles.
- Paneles superpuestos o cajones livianos que dejen visible la oficina de fondo; cierre claro y botón de restablecer cámara.

---

## 7. Interactividad de versión 1.0

**Ocho personajes tocables**, cada uno con una ficha original que incluya nombre, rol, breve personalidad, acciones disponibles en la maqueta y animación/diálogo contextual. No prometer conversación con IA si aún no está conectada.

**Siete objetos clave interactivos**:
1. Escritorio de Gabi → bandeja del jefe y tablero **demostrativo** / configuración.
2. Sala de reuniones → escenas cortas de reunión.
3. Cafetería → escena ambiental o animación de pausa.
4. Pizarrón del Profe → vista de materias **de ejemplo**.
5. Fotocopiadora → evento cómico de atasco de papel.
6. Recepción de Pame → agenda y novedades **de demostración**.
7. Termo de Gabito → easter egg cómico; visible la frase «CEO DE ESTE QUILOMBO» al inspeccionar, aunque la etiqueta del sprite no se lea completa a zoom normal.

Los demás muebles pueden reaccionar visualmente al pasar o ser decorativos, sin prometer funcionalidades inexistentes.

### Cinco superficies de interfaz
1. La oficina — pantalla principal.
2. Ficha de personaje — panel lateral/flotante o inferior en móvil.
3. Escritorio de Gabi — bandeja y controles.
4. Confesionario — diálogo/escena de falso documental.
5. Configuración — audio, humor, gráficos, movimiento y navegación.

**Diseño UI:** retro minimalista, tipografía legible, estructura adaptativa, sin barra permanente que robe pantalla en iPhone.

---

## 8. Rutinas, eventos y sitcom

**Aproximación:** ambientación animada local de bajo costo, sin llamadas a IA para que los muñecos vivan. Acciones: reposo, caminar, trabajar *ambientalmente*, conversar, descanso, reaccionar, sentarse, entrar/salir de reunión. Animaciones exclusivas por oficio.

**Sitcom interactiva moderada:** conversaciones breves, humor de oficina argentino, caras de reacción, miradas a cámara, y confesionario opcional. Una escena debe poder omitirse sin bloquear la navegación. Configuración para bajar frecuencia o apagar humor.

Eventos prototípicos:
- Gabito y Kevin discuten por gastos de café.
- Pame mira a cámara tras una frase de Gabito.
- Migue y Dexter discuten sobre construir antes de diagramar.
- La impresora se atasca y Migue protesta.
- El Profe pone orden y todos le hablan de usted.
- Reunión de equipo y presentación humorística de un hito **simulado claramente como demo**.

El libreto debe ser breve y variado, evitando repeticiones molestas y bromas hirientes. **Nunca usar indicadores «tarea real ejecutándose», «informe real terminado» o «agente conectado» sin integración efectiva.**

### Ciclo de oficina
- 06:00–12:00: luz de mañana, inicio ambiental.
- 12:00–19:00: mayor actividad y cruces sociales.
- 19:00–00:00: luz cálida, movimiento decreciente.
- 00:00–06:00: luces tenues, oficina casi vacía.

Estas franjas son propuestas ambientales; el backend futuro podrá mostrar horas extra únicamente con evidencia de un trabajo real. La capa visual se detiene cuando la página se cierra; ningún loop de animación debe correr obligatoriamente en segundo plano.

### Entrada del jefe
Pequeña secuencia opcional y omisible al abrir sesión: avatar de Gabi entra, Pame reacciona, Gabito saluda; como máximo una vez por sesión, configurable.

---

## 9. Sonido y controles

- SFX: pasos, teclados, impresora, cafetera, murmullo tenue y efectos ocasionales cómicos.
- BGM: música instrumental retro/pixel art opcional y de uso autorizado, sin dependencia de música con copyright no licenciada.
- **Inicio siempre silenciado**; activación explícita mediante el usuario, compatible con restricciones de reproducción automática del navegador.
- Dos volúmenes independientes (música y efectos), botones de silenciar y preferencias persistentes localmente.
- Modo reducido de movimiento y control de frecuencia de humor.

---

## 10. Rendimiento, accesibilidad y dispositivos

- Escalado adaptable para escritorio y iPhone; controles táctiles grandes y paneles legibles.
- Perfiles gráficos auto / alto / equilibrado / liviano, además de ajustes manuales para detalles y efectos.
- Sprite sheets y atlas optimizados, minimizando carga de imágenes, repintados y colisiones.
- Priorizar movimiento estable y respuesta táctil sobre efectos decorativos; fijar métricas realistas al probar hardware concreto.
- Soporte preferente para contraste legible, controles de teclado donde corresponda y reducción de movimiento.
- La app no debe romperse ni quedarse inutilizable si un recurso de audio no carga.
- La web publicada debe ser utilizable **sin servidor de agentes** en la 1.0.

---

## 11. Fuera de alcance de la 1.0 (pero requisitos futuros)

### 1.5 — Trabajadores conectados
- Comunicación directa con cada especialista o mediante Gabito, con bandeja común.
- Conectar de modo seguro al motor real de OpenClaw, tras estudiar la arquitectura existente.
- Tareas reales con IDs, estados, historial, responsables, errores y resultados verificables.
- Separar eventos decorativos de acciones reales en UX y modelo de datos.

### 2.0 — Oficina autónoma supervisada
- Motor persistente para rutinas autorizadas aunque el navegador esté cerrado.
- Aprobaciones obligatorias para gastar dinero, enviar mensajes/postulaciones, borrar información o modificar sistemas reales.
- Proyectos: Gabi plantea objetivo, Gabito propone etapas, propietarios, dependencias y plan, Gabi aprueba, equipo ejecuta dentro de permisos.
- Memoria mixta: base general compartida y recuerdos de especialidad; permisos y controles de consulta, corrección y eliminación.
- Notificaciones inteligentes: informes agrupados, aprobaciones en bandeja y alertas inmediatas solo si son críticas.
- Continuidad tras cortes, sin ejecuciones duplicadas, topes de costo/uso, pausa y auditoría.

**No diseñar una «simulación» que oculte ausencia de IA.** Si todavía no hay backend, indicar «vista conceptual», «escena ambiental» o «próximamente» en elementos relacionados.

---

## 12. Infraestructura prevista, no requerida en 1.0

- Interfaz: mantener posible despliegue estático del GABI OS actual en **GitHub Pages**.
- Motor futuro: PC de escritorio del usuario (Intel Core i5; generación no confirmada, 32 GB RAM, HDD con ~300 GB libres), conectada de forma segura.
- Philco con Gabito/OpenClaw existente: conservar como sistema anterior/pruebas hasta una migración cuidadosamente planificada; evitar dos instancias enviando acciones por el mismo WhatsApp.
- Procesamiento de modelos preferentemente remoto, sin asumir que un plan ChatGPT cubre uso de API.
- Seguridad futura: autenticación, HTTPS, control de permisos, secretos solo en servidor, preferencia por acceso remoto privado; **jamás insertar tokens o contraseñas en JavaScript público**.
- Aislamiento de procesos del PC personal, monitorización, copias de seguridad y arranque automático antes de operar 24/7.
- Arquitectura desacoplada para migrar el backend a la nube sin rehacer el motor visual. HDD suficiente como punto de partida; SSD aconsejable posteriormente.
- La 1.0 no exige levantar servicio local, vincular WhatsApp, crear base de datos de producción ni pagar API.

---

## 13. Criterios de aceptación — lanzamiento 1.0

**Arte y mapa**
- [ ] Se carga un mapa original isométrico de oficina abierta con todos los sectores aprobados.
- [ ] Hay ocho avatares distintos, incluidos Gabi y siete especialistas, coherentes entre sí.
- [ ] Cada escritorio refleja visualmente el personaje y los accesorios definidos.
- [ ] Gabito luce deportivo/under, termo rotulado y cuadro de Boca (o espacio claramente reservado si se requiere validar derechos del recurso gráfico).
- [ ] El Profe se ve mayor; Migue es regordete/friki; Pame recuerda a la referencia; Kevin tiene carácter cómico; Nacho y Dexter son distinguibles.

**Juego e interacción**
- [ ] Sprites con animaciones reales de reposo, caminar y rutinas propias; no solo una imagen estática movida.
- [ ] Caminos sin atravesar paredes ni muebles y sin bloqueo permanente de personajes.
- [ ] Cámara inicia en vista general, admite zoom, desplazamiento, seguimiento optativo y restablecimiento.
- [ ] El gesto de arrastre no selecciona accidentalmente un personaje en móvil.
- [ ] Las ocho fichas y los siete hotspots principales abren su interacción correspondiente.
- [ ] Existe al menos un conjunto breve de escenas cómicas de trabajo, pausa y confesionario, con opción de omitirlas.
- [ ] Ciclo ambiental día/noche sincronizado con horario de Buenos Aires.

**UI, sonido y estabilidad**
- [ ] Interfaz retro minimalista con paneles que no impiden explorar la oficina.
- [ ] Inicio silencioso y volúmenes independientes de BGM y SFX.
- [ ] Avatar de Gabi con editor básico funcional de pelo, barba, ropa y accesorios; cambios visibles y preferencias persistentes en el navegador.
- [ ] Perfiles gráficos adaptables y reducción de movimiento.
- [ ] Experiencia comprobada en iPhone y navegador de escritorio; sin superposición grave, scroll indeseado ni controles demasiado pequeños.
- [ ] Estados y tareas de ejemplo están claramente identificados como ficticios/demostrativos.
- [ ] La 1.0 funciona sin OpenClaw ni conexión a agentes reales.
- [ ] Se puede compilar/publicar sin secretos en frontend y sin romper funcionalidad existente; cambios probados antes del despliegue.

---

## 14. Plan de ejecución que recibirá Codex (no ejecutar ahora)

**Paso 0 — Inspección responsable.** Revisar repo y despliegue actuales; describir estructura, tecnologías, dependencias y riesgos. No sobrescribir archivos ni publicar sin entender el estado actual.

**Paso 1 — Propuesta técnica y arte.** Recomendar motor/librerías tras inspección (sin asumir Phaser/PixiJS u otro). Definir tamaños de sprites y atlas, grid/pathfinding isométrico, pipeline de assets originales y estrategia móvil. Mostrar un plan para aprobación.

**Paso 2 — Vertical slice.** Una sección pequeña de oficina, cámara, uno o dos personajes con animaciones y una ficha; validación visual y táctil.

**Paso 3 — Mundo completo.** Los ocho personajes, escenarios, rutas y estados ambientales.

**Paso 4 — Sistemas 1.0.** Hotspots, paneles, personalización de Gabi, escenas de sitcom, confesionario, ciclo día/noche y sonido opcional.

**Paso 5 — Calidad.** Ajustes gráficos, accesibilidad, mediciones, pruebas en móvil/escritorio, documentación y despliegue controlado.

Cada paso debe dejar un estado funcional revisable. Trabajar en rama separada o entorno de prueba; conservar posibilidad de revertir. Pedir confirmación antes de publicar o reemplazar el sitio productivo.

---

## 15. No negociables para Codex

1. **No convertir el proyecto en un dashboard genérico.** La experiencia principal es el mapa pixel art animado.
2. **No usar sprites de emojis como arte final** ni imágenes ajenas de calidad desigual como sustitución definitiva.
3. **No crear conversaciones o tareas reales falsas.** Los eventos de sitcom se distinguen de resultados verificables.
4. **No conectar APIs, WhatsApp, OpenClaw ni credenciales en la etapa visual 1.0**, salvo autorización específica posterior.
5. **No romper ni sobreescribir la versión publicada**; inspeccionar, planificar, construir progresivamente, probar y solicitar aprobación del despliegue.
6. **No prometer trabajo continuo de agentes** antes de implementar y comprobar el motor persistente.
7. Conservar la identidad de personajes, el castellano argentino y el humor moderado.

**Resultado esperado:** GABI OS 1.0 es una oficina pixel art isométrica que se siente viva, es agradable de explorar y está preparada para incorporar los agentes reales por fases posteriores.
