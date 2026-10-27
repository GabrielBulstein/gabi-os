# Arte y arquitectura del prototipo

## Arte original

No se usan emojis, stock, retratos, sprites de terceros, tipografías remotas ni imágenes generadas externamente. El arte es código nativo en `src/art/`: dibujos en Canvas 2D que Phaser carga como texturas. Esos archivos son los originales editables de este piloto.

- Tiles lógicos de 64 × 32 unidades, pintados a media resolución (píxeles de dos unidades) para mantener clusters definidos.
- Personajes de 48 × 64 píxeles con proporciones caricaturescas, contorno, luces y sombras. Sus hojas contienen 160 cuadros: cinco acciones × cuatro orientaciones × ocho cuadros.
- Las animaciones alteran brazos, piernas, ojos y utilería dentro de los cuadros. La ruta es independiente del ciclo de caminata.
- Paleta beige/madera/salvia/azul apagado. Gabito lleva campera verde deportiva con franjas claras, pantalón oscuro y zapatillas claras.
- El cuadro usa únicamente un motivo propio azul y oro. El escudo de Boca no se reproduce.
- Los atlas se generan una vez al cargar. Al modificar el avatar se reconstruye solo su textura y se libera la anterior.

El próximo pase artístico debería refinar poses sentadas, profundidad de sillas y monitores, más variedad de mobiliario y expresiones. Si se migra a Aseprite/PNG + JSON, conservar nombres de animación y anclaje a los pies para no reconstruir el comportamiento.

## Mundo y profundidad

La proyección es `x = (col-row)*32`, `y = (col+row)*16`. El suelo y las dos paredes posteriores se dibujan en un plano estático; muebles y personajes se ordenan por profundidad en mundo. No hay física 3D ni controles de avatar: el usuario selecciona acciones desde afuera.

La grilla representa huellas de muebles; A* usa cuatro vecinos y evita cortar esquinas. Durante cada paso se reservan celda de partida y llegada; ante un destino ocupado se espera y replanifica. Este esquema sirve para dos personajes. Antes de ocho conviene ampliar pruebas de congestión y separar muebles grandes por capas cuando sea necesario.

## Cámara y entrada

La cámara utiliza las APIs de Phaser. Los gestos se procesan como Pointer Events en el canvas con captura de puntero: umbral de siete píxeles para distinguir arrastre, pinza con dos puntos y zoom alrededor de su centro. Un gesto de pinza no se interpreta luego como tap. Los paneles permanecen en HTML, fuera del canvas.

Phaser calcula el scroll desde el centro sin zoom de su viewport. La limitación del encuadre y la conversión de coordenadas conservan esa convención, incluyendo móvil y zoom menor que uno.

## Rendimiento

Phaser está fijado por el lockfile a la línea 3.90; usa WebGL cuando está disponible y Canvas como alternativa. El perfil liviano limita el loop a 30 FPS y oculta sombras dinámicas; alto/equilibrado lo limita a 60 FPS. Automático selecciona según ancho, no afirma medir capacidades del dispositivo.

El cambio de límite en ejecución usa el campo interno `_limitRate` de Phaser 3.90 al dormir/despertar el loop. Está aislado en `applyPreferences`; verificar ese detalle al actualizar Phaser. La reducción de movimiento detiene ciclos repetidos y próximos recorridos automáticos, permitiendo terminar un paso ya reservado y realizar acciones pedidas expresamente. La visibilidad de página duerme/despierta el loop.

## Contratos futuros

`AmbientEvent` siempre lleva `kind: 'ambient'`. `AgentTask` es un contrato separado, sin adaptador ni productor conectado en este piloto. Ninguna animación escribe tareas, resultados o indicadores de conexión. El estado de animación existe solamente en la escena.

Las preferencias usan `gabi-pixel-office:preferences:v1`; se validan al leer y funcionan en memoria si localStorage está bloqueado. La clave antigua del dashboard queda intacta.
