# Motor local de GABI OS

Decisión del usuario del 27/10/2026: ejecutar el funcionamiento en la PC de escritorio. La Philco queda fuera de esta integración. Proveedor elegido: cuenta ChatGPT Plus, mediante autenticación de ChatGPT/Codex en OpenClaw. El acceso OAuth se completó y la comprobación real del proveedor devolvió `status: ok` para `openai/gpt-6-astra`. Esto verifica el proveedor; todavía no una conversación con el personaje Gabito.

## Lo que funciona

- Servidor Node de diagnóstico en `127.0.0.1:8787`, con memoria disponible y comprobación del gateway aislado en `127.0.0.1:18799`.
- Panel **Motor** en la oficina. En desarrollo consulta datos reales; en el sitio estático explica que el backend privado todavía falta.
- Arranque aislado de OpenClaw ya instalado. No utiliza el perfil habitual, no importa claves del entorno, no configura canales de mensajería y no envía tareas.
- Configuración y credenciales en `D:\GABI-OS\data\runtime`, fuera de Git y OneDrive. El token local del gateway se genera automáticamente y nunca llega al navegador.
- Acceso de diagnóstico solo por loopback, métodos de lectura, comprobación de Host/Origin, respuestas sin caché y consultas agrupadas durante cinco segundos.

La salud HTTP confirma que el proceso responde; **no demuestra una respuesta del agente**, autenticación del modelo ni ejecución de trabajo real. La interfaz mantiene esa distinción.

## Ejecutar en la PC

Desde la carpeta del repositorio, usar tres terminales:

```powershell
npm run gateway
```

```powershell
npm run server
```

```powershell
npm run dev
```

Abrir `http://localhost:5173/gabi-os/`, tocar **Motor** y **Consultar servidor local**. El gateway puede tardar en iniciar. Se utiliza el OpenClaw instalado por npm en Windows; para otra instalación definir `GABI_OPENCLAW_ENTRY` con la ruta absoluta de su `openclaw.mjs`.

Detener cada proceso con Ctrl+C. No se instaló un servicio ni inicio automático. El puerto 18799 no reemplaza el puerto habitual de otras instalaciones. El launcher no fuerza ni mata procesos que ocupen un puerto.

## ChatGPT Plus

```powershell
npm run gateway:login
```

Completar personalmente el acceso en el navegador con la cuenta Plus. El comando habilita únicamente el proveedor incluido `openai` en este perfil, guarda una copia local de la configuración anterior y aplica el modelo recomendado por el proveedor. En el siguiente arranque selecciona explícitamente el motor integrado `openclaw` para ese modelo. No usar claves de API ni copiarlas al chat. Reiniciar el proceso `npm run gateway` si hace falta después del acceso.

En esta PC el plugin nativo `codex` falló al capturar dependencias por un error `EEXIST` de enlaces en Windows. Se mantiene deshabilitado y se usa la ruta documentada de OAuth con el motor integrado. No se modificó la instalación global de OpenClaw.

La suscripción tiene límites compartidos con otros usos de ChatGPT/Codex; esta integración no agrega una cuota independiente. La autenticación y la primera respuesta del modelo deben comprobarse antes de rotular un personaje como agente conectado. No hay reemplazo automático por una API paga configurado por este proyecto.

Comprobación breve del proveedor, con salida filtrada para no mostrar credenciales. Primero detener el proceso de GABI OS iniciado con `npm run gateway`: OpenClaw exige propiedad exclusiva del perfil para esta prueba. No usar el comando genérico de detención de servicios si existen otras instalaciones de OpenClaw.

```powershell
npm run gateway:check
```

Esta comprobación sí puede consumir una pequeña cantidad de cuota del plan. No envía mensajes ni ejecuta tareas de oficina. Al terminar, iniciar nuevamente `npm run gateway`.

Fuentes: [OpenAI: autenticación](https://learn.chatgpt.com/docs/auth), [OpenAI: Sign in with ChatGPT](https://learn.chatgpt.com/docs/sign-in-with-chatgpt), [OpenClaw: configuración de OpenAI](https://docs.openclaw.ai/providers/openai/setup), [OpenClaw: salud HTTP](https://docs.openclaw.ai/gateway/health).

## Verificar

```powershell
npm run test:server
npm test
npm run build
npm run test:e2e
```

Las pruebas del servidor usan respuestas controladas; la comprobación manual contra el gateway instalado es independiente. No ejecutan solicitudes al modelo ni consumen cuota de IA.

## Pendiente

Antes de trasladar la operación anterior, conservar recuerdos e historial de Gabito mediante el [inventario y plan de migración](MIGRACION_GABITO.md). El perfil nuevo no los importa automáticamente.

1. Verificar una primera respuesta de Gabito en una conversación controlada; el acceso OAuth y la prueba del proveedor ya pasaron.
2. Implementar conversación con Gabito, almacenamiento de tareas y permisos del lado del servidor, con evidencia de resultados.
3. Conectar los demás especialistas gradualmente, con límites de concurrencia y consumo; los ocho personajes actuales siguen siendo ambientación.
4. Acceso privado desde iPhone/GitHub Pages: HTTPS, autenticación y permisos. El navegador del teléfono no debe apuntar al localhost de la PC. El proxy de desarrollo es exclusivo de desarrollo local.
5. Persistencia operativa: arranque automático, suspensión de Windows, copias de seguridad y monitorización antes de prometer funcionamiento continuo.

Diagnóstico de esta PC: i5-10400F, unos 32 GB RAM, 11 GB libres en C: y 372 GB libres en D: al revisar. WSL solo tiene `docker-desktop`, detenido; Docker no estaba iniciado. Esta etapa usa Node/OpenClaw nativos y no requiere iniciar Docker ni descargar modelos. Conviene elegir D: para almacenamiento voluminoso posterior.

## Ubicación definitiva en D: — 27/10/2026

Por indicación del usuario, el proyecto y sus datos propios se alojan en **D:\GABI-OS**:

- Código y documentos originales: D:\GABI-OS\project\gabi-os y la carpeta project.
- Perfil local autenticado: D:\GABI-OS\data\runtime.
- Respaldos cifrados e informes: D:\GABI-OS\data\migration.
- Ensayo de restauración: D:\GABI-OS\data\recovery.
- Snapshots originales previos al traslado: D:\GABI-OS\data\snapshots.
- OpenClaw 2026.10.1 aislado: D:\GABI-OS\tools\openclaw-2026.10.1.
- Cachés y temporales propios: D:\GABI-OS\cache.

El launcher usa estas rutas de forma predeterminada y no vuelve a AppData como alternativa silenciosa. En Windows GABI_OS_HOME debe apuntar a D:. Los scripts de inventario, respaldo y transferencia comparten esa ubicación. Las herramientas compartidas del sistema, como Node, Git, Windows y las claves de usuario de DPAPI, no se trasladan.

Para abrir la oficina, desde el repositorio:

    .\scripts\start-office.ps1 dev

En terminales separadas, para servidor y gateway:

    .\scripts\start-office.ps1 server
    .\scripts\start-office.ps1 gateway

El iniciador fija también cachés y temporales en D:. La oficina abre en http://localhost:5173/gabi-os/.

Se verificaron las copias por SHA-256 y se creó archive/before-disk-d-move-2026-10-27 antes de retirar los originales. La restauración de ensayo con OpenClaw 2026.10.1 validó SQLite y comparó 129/129 archivos de workspace, 38/38 archivos de memoria y 5/5 documentos de identidad. El verificador admite rutas largas de Windows y todos los formatos de memoria; no se leyeron recuerdos en pantalla ni se activaron WhatsApp o tareas del perfil restaurado. Esto prueba conservación, no integración de sus sesiones al gateway local ni una conversación con Gabito.

Estado de limpieza de C: la revisión automática no autorizó borrar las copias anteriores sin aprobación explícita. Se conservaron como gabi-os.pre-D-20261027, publication.pre-D-20261027 y GabiOS.pre-D-20261027. Las rutas anteriores del repositorio, artefactos y datos son junctions hacia D:, de modo que las referencias existentes usan el contenido activo de D:. La carpeta padre de OneDrive estaba en uso y no se renombró; los documentos originales allí conservados también tienen copias verificadas en D:. Aún no se ha liberado el espacio ocupado por esas copias anteriores.
