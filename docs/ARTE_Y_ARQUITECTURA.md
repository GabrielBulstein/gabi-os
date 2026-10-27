# Arte y arquitectura de la oficina completa

## Arte original

No se usan emojis, stock, retratos, sprites de terceros, tipografías remotas ni imágenes generadas externamente. El arte es código nativo en `src/art/`: dibujos en Canvas 2D que Phaser carga como texturas. Esos archivos son los originales editables de este piloto.

- Tiles lógicos de 64 × 32 unidades, pintados a media resolución (píxeles de dos unidades) para mantener clusters definidos.
- Ocho personajes de 48 × 64 píxeles con proporciones caricaturescas, contorno, luces y sombras. Cada hoja contiene 288 cuadros: nueve acciones × cuatro orientaciones × ocho cuadros (2304 cuadros en total).
- Las animaciones alteran brazos, piernas, ojos y utilería dentro de los cuadros. La ruta es independiente del ciclo de caminata.
- Paleta beige/madera/salvia/azul apagado. Gabito lleva campera verde deportiva con franjas claras, pantalón oscuro y zapatillas claras.
- El cuadro usa únicamente un motivo propio azul y oro. El escudo de Boca no se reproduce.
- Los atlas se generan una vez al cargar. Al modificar el avatar se reconstruye solo su textura y se libera la anterior.

Cada oficio tiene utilería, ropa, silueta y acción propia: canas/anteojos/libro del Profe, auriculares y cuerpo más ancho de Migue, pelo largo/cardigan de Pame, camisa remangada/CV de Nacho, calvicie/corbata/snacks de Kevin y marcador/suéter mostaza de Dexter. El avatar de Gabi suma variantes de peinado, ropa y accesorios. Las poses de escritorio recortan las piernas para situar al personaje sentado. La revisión visual final del usuario sigue siendo necesaria. Si se migra a Aseprite/PNG + JSON, conservar nombres de animación y anclaje a los pies.

## Mundo y profundidad

La proyección es `x = (col-row)*32`, `y = (col+row)*16`. El suelo y las dos paredes posteriores se dibujan en un plano estático; muebles y personajes se ordenan por profundidad en mundo. No hay física 3D ni controles de avatar: el usuario selecciona acciones desde afuera.

La grilla representa huellas de muebles; A* usa cuatro vecinos y evita cortar esquinas. `Crowd` coordina ocho actores, reserva partida/llegada, asigna destinos diferentes, recalcula y cede paso. Cancelar conserva el paso en curso, sin teletransporte. Las pruebas simulan la llegada del elenco a la reunión verificando reservas sin superposición. Los mostradores largos incorporan una corrección de profundidad para personas justo delante de su huella.

Las escenas contienen participantes, puntos de encuentro y líneas separadas. No comienzan su diálogo hasta terminar el acercamiento; se cancelan si no hay espacio en un tiempo acotado. El usuario puede pausar, avanzar u omitir sin secuestrar la cámara. No existe ninguna línea hablada por Gabi.

## Cámara y entrada

La cámara utiliza las APIs de Phaser. Los gestos se procesan como Pointer Events en el canvas con captura de puntero: umbral de siete píxeles para distinguir arrastre, pinza con dos puntos y zoom alrededor de su centro. Un gesto de pinza no se interpreta luego como tap. Los paneles permanecen en HTML, fuera del canvas.

Phaser calcula el scroll desde el centro sin zoom de su viewport. La limitación del encuadre y la conversión de coordenadas conservan esa convención, incluyendo móvil y zoom menor que uno.

## Rendimiento

Phaser está fijado por el lockfile a la línea 3.90; usa WebGL cuando está disponible y Canvas como alternativa. El perfil liviano limita el loop a 30 FPS y oculta sombras dinámicas; alto/equilibrado lo limita a 60 FPS. Automático selecciona según ancho, no afirma medir capacidades del dispositivo.

El cambio de límite en ejecución usa el campo interno `_limitRate` de Phaser 3.90 al dormir/despertar el loop. Está aislado en `applyPreferences`; verificar ese detalle al actualizar Phaser. La reducción de movimiento detiene ciclos repetidos y próximos recorridos automáticos, permitiendo terminar un paso ya reservado y realizar acciones pedidas expresamente. La visibilidad de página duerme/despierta el loop.

## Contratos futuros

`AmbientEvent` siempre lleva `kind: 'ambient'`. `AgentTask` es un contrato separado, sin adaptador ni productor conectado en este piloto. Ninguna animación escribe tareas, resultados o indicadores de conexión. El estado de animación existe solamente en la escena.

Las preferencias usan `gabi-pixel-office:preferences:v1`; se validan al leer y funcionan en memoria si localStorage está bloqueado. La clave antigua del dashboard queda intacta.

## Luz, horario y audio

`environment` obtiene hora/minutos de Buenos Aires con Intl. El tinte progresa por mañana/día/tarde/noche; las pantallas tienen un plano emisivo propio y las lámparas agregan luz cálida. Durante el cierre disminuye la presencia ambiental; de madrugada se retiran los personajes. Las acciones expresas pueden mostrarlos temporalmente y se rotulan como escena a pedido. Las vistas de prueba de horario se rotulan como tales.

`OfficeAudio` no construye un AudioContext hasta un gesto sobre Activar audio. Compone una melodía/chiptune original y efectos sintetizados; música y efectos usan ganancias separadas. Solo se guardan volúmenes, nunca el estado encendido. Ocultar la página suspende contexto y temporizador; los fallos no bloquean el mapa. No se descargan grabaciones ni se llaman APIs externas.
