# GABI OS — The Pixel Office

Una pequeña oficina, un gran quilombo. Prototipo visual **0.1.0** con Gabi y Gabito, construido desde cero con TypeScript, Vite y Phaser. Todo lo que sucede es ambientación local: no hay IA, OpenClaw, WhatsApp ni servicios pagos conectados.

![Vista del episodio piloto en escritorio](docs/previews/desktop.png)

## Ejecutar

Requisito: Node.js 22.12 o posterior (probado con Node 24).

```powershell
cd "C:\Users\gabri\OneDrive\DESCARGAS\Proyecto The Office\gabi-os"
npm ci
npm run dev
```

Abrir **http://localhost:5173/gabi-os/**. Vite también muestra la dirección de la red local para probar desde el teléfono conectado al mismo Wi-Fi. El firewall de Windows debe permitir ese acceso. No hay servidor de agentes que configurar.

Para revisar el resultado compilado:

```powershell
npm run build
npm run preview
```

Abrir **http://localhost:4173/gabi-os/**. `dist/` es el sitio estático listo para un despliegue posterior autorizado.

## Probar el piloto

1. Ver la oficina completa; acercarse con rueda, pinza o botones. Arrastrar con mouse/un dedo. Restablecer vista con el botón de flecha circular o Inicio.
2. Tocar a Gabi o Gabito en el mapa o en sus accesos superiores. Saludar, tomar mate, dar una vuelta, volver al escritorio o hacer una pausa en la cafetería. En móvil la ficha se cierra al ejecutar para dejar ver la animación.
3. Activar seguimiento desde una ficha. Arrastrar para dejar de seguir. Las escenas nunca cambian el encuadre por su cuenta.
4. Inspeccionar escritorio de Gabi, termo de Gabito, cafetería, mesa de reuniones y cuadro reservado. La frase del termo se muestra completa al inspeccionar.
5. Abrir el confesionario desde la ficha de Gabito. Los comentarios se pueden omitir; también se pueden apagar desde Configuración.
6. Cambiar ropa, pelo, tono de piel, barba o anteojos de Gabi. Recargar y comprobar persistencia. Es un aspecto provisional configurable, no una afirmación sobre la apariencia del usuario.
7. Activar reducción de movimiento y probar los perfiles gráficos. Alto/equilibrado: límite de 60 FPS; liviano: 30 FPS y sombras de personajes desactivadas. Automático elige liviano en pantallas de menos de 600 px. Son límites, no garantías de rendimiento.

El piloto empieza y permanece **sin audio**. La ambientación se pausa al ocultar la pestaña y no realiza trabajos con el navegador cerrado. El reloj usa `America/Argentina/Buenos_Aires`; el ciclo visual día/noche aún está pendiente.

## Verificaciones

```powershell
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

En Windows, para usar Edge instalado en lugar de descargar Chromium:

```powershell
$env:PW_CHANNEL = "msedge"
npm run test:e2e
```

Para comprobar la compilación de producción con las mismas pruebas:

```powershell
$env:OFFICE_PREVIEW = "1"
npm run test:e2e
```

Pruebas unitarias: conectividad de cada celda libre, rutas sin atravesar muebles ni esquinas, obstáculos dinámicos, posiciones inválidas y destinos inaccesibles. Pruebas de navegador: arranque, acciones, seguimiento, zoom/reset, arrastre sin selección, persistencia de preferencias, controles de humor/movimiento y pinza táctil nativa mediante CDP. Las pruebas móviles emulan iPhone 13 **en Chromium**, no reemplazan una prueba física en Safari/iPhone.

## Organización

- `src/art/`: arte original dibujado por código, paleta y spritesheets de 160 cuadros por personaje.
- `src/office/`: mapa, grilla, A*, ocupación, personajes, cámara y gestos.
- `src/ui/`: paneles HTML accesibles, controles, confesionario y configuración.
- `src/core/`: preferencias versionadas, eventos ambientales y contratos separados para tareas reales futuras.
- `public/`: favicon y puente para retirar el service worker del dashboard viejo en un futuro despliegue.
- `docs/`: Documento Maestro, prompt de referencia, estado del alcance y decisiones técnicas.

## Rama y recuperación

- Desarrollo: **`dev/pixel-office`**.
- Versión anterior guardada en GitHub ANTES de reconstruir: **`archive/pre-pixel-office-2026-10-27`**.
- Commit anterior: **`43c380ef681730d646b596ead32d528673032bb4`**.

Para inspeccionar la versión anterior sin tocar la rama de trabajo:

```powershell
git fetch origin
git show origin/archive/pre-pixel-office-2026-10-27:index.html
```

La restauración de producción se hará únicamente con autorización. No hay migración de tareas, notas o datos del dashboard; el nuevo código no lee ni borra la clave antigua `gabi-os-v1`.

## Publicación en GitHub Pages: preparada, NO ejecutada

Vite usa `base: '/gabi-os/'`. El workflow de desarrollo solo prueba y genera un artefacto descargable; **no publica**. Se eliminó de esta rama el extractor ZIP que sobrescribía fuentes.

El workflow `pages.yml` es manual, exige la rama `main` y la entrada `PUBLICAR`. No se ha ejecutado ni se ha modificado Settings → Pages. Tras aprobación del propietario, habrá que revisar el cambio, integrar la versión aprobada, configurar Pages para GitHub Actions y recién entonces ejecutar el workflow manual. La entrada manual reduce errores accidentales; no sustituye los permisos de GitHub ni la aprobación humana.

No se registra un service worker nuevo en este piloto. `public/service-worker.js` retira únicamente las cachés `gabi-os-shell-*` del sistema anterior cuando llegue el despliegue autorizado. No toca localStorage ni cachés de otras aplicaciones. El nuevo modo offline/PWA queda pendiente.

## Próximas etapas

Ver [estado y pendientes de la 1.0](docs/ESTADO_PROTOTIPO.md). La versión 0.1 es una prueba funcional de dirección artística e interacción, **no la entrega 1.0 completa**.
