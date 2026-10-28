# Inicio automático y oficina privada

La tarea de Windows GABI OS - Pixel Office inicia el supervisor al entrar en la cuenta de Windows actual, sin contraseña almacenada y con permisos limitados. Los procesos no necesitan terminales abiertas.

El supervisor comprueba los puertos cada 15 segundos, reconoce los procesos de GABI OS y recupera los que se cierran. No mata procesos ajenos ni intenta ocupar un puerto que ya pertenece a otra aplicación. Un mutex evita supervisores duplicados. El gateway puede tardar aproximadamente un minuto en arrancar.

Servicios:

- 5173: oficina de desarrollo; conserva la visita local y la vista LAN.
- 8787: servidor del chat, solo loopback.
- 18799: gateway, solo loopback.
- 8790: oficina privada compilada y puente autenticado, solo loopback.

El cuarto servicio se inicia cuando existe D:\GABI-OS\data\run\private-access.json. Tailscale Serve publica únicamente esa oficina dentro de la red privada, mediante HTTPS. No se configuró Funnel ni se publicaron cambios en GitHub Pages.

## Acceso desde el iPhone

Conectar Tailscale en el iPhone a la misma cuenta de la PC. La dirección está en el campo host de D:\GABI-OS\data\run\private-access.json; abrir https://HOST/gabi-os/ en Safari. Desde Gabito, pulsar Conversar con Gabito. El usuario confirmó una respuesta real desde ese chat en su iPhone.

El servidor exige que Tailscale Serve identifique al mismo usuario propietario de esta PC. Compartir la máquina con otra cuenta de Tailscale no concede acceso a la oficina. El puente exige el host esperado, el origen HTTPS correcto para envíos y la sesión efímera del chat; limita rutas y tamaño de mensajes. El token del gateway continúa fuera del navegador. Las solicitudes sin identidad se rechazan.

La PC debe permanecer encendida, con esta sesión iniciada y sin suspensión. No se cambió el plan de energía. Las cuentas y credenciales de la Philco no se sustituyeron. WhatsApp y automatizaciones siguen en su instancia anterior.

## Archivos y registros

Todo el código, los builds, los recuerdos, el historial, el instalador descargado y los registros de GABI OS están en D:\GABI-OS. Tailscale se instaló en D:\GABI-OS\tools\tailscale; Windows conserva sus registros de instalación y metadatos del servicio como componentes del sistema.

- D:\GABI-OS\data\run\supervisor-status.json: estado actual.
- D:\GABI-OS\data\run\autostart.json: registro del inicio automático.
- D:\GABI-OS\data\logs\supervisor.jsonl: cambios de estado.
- D:\GABI-OS\data\logs: salidas de cada arranque.
- D:\GABI-OS\data\run\private-access.json: host y usuario autorizado, fuera de Git.

## Mantenimiento

Desde D:\GABI-OS\project\gabi-os:

    powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/install-office-startup.ps1

Es idempotente. Utiliza una tarea con disparador de inicio de sesión, ejecución oculta y sin límite de duración. Si Windows no permite registrar tareas nuevas, admite una entrada de inicio del usuario actual. No modifica la tarea OpenClaw Gateway ya existente.

Para desactivar futuros inicios automáticos:

    powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/install-office-startup.ps1 -Remove

Esto no apaga deliberadamente las sesiones actuales. Para consultar la tarea:

    Get-ScheduledTask -TaskName "GABI OS - Pixel Office"
    Get-Content D:\GABI-OS\data\run\supervisor-status.json

Para recompilar la oficina privada después de cambios:

    powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/start-office.ps1 build:private

El build privado va a dist-private, ignorado por Git. El build normal para GitHub Pages conserva el chat deshabilitado y no contiene la configuración privada.

Si se necesita volver a configurar Serve:

    node scripts/enable-private-access.mjs

El script deriva host y usuario de la sesión local de Tailscale. Rechaza configuraciones Serve ajenas y configuraciones Funnel activas. Conserva una copia de la configuración previa. Puede requerir consentimiento local para habilitar HTTPS.

Para desactivar únicamente el acceso HTTPS privado:

    D:\GABI-OS\tools\tailscale\tailscale.exe serve --https=443 off

## Verificación realizada

- Tarea de inicio instalada y ejecutándose.
- Supervisor duplicado rechazado.
- Recuperación automática del servidor comprobada después de una interrupción controlada.
- Cuatro servicios reconocidos y en escucha.
- HTTPS privado, identidad, página, sesión e historial verificados sin llamadas adicionales al modelo.
- Interfaz móvil revisada con datos ficticios, sin desbordamiento horizontal.
- Prueba física confirmada por el usuario: Gabito respondió desde el chat de la oficina en el iPhone.
- No se forzó un reinicio ni cierre de sesión de Windows; queda pendiente observar el primer arranque real tras el próximo inicio de sesión.

Referencias: [instalación MSI oficial](https://tailscale.com/docs/install/windows/msi), [Serve e identidad](https://tailscale.com/docs/features/tailscale-serve), [persistencia de Serve](https://tailscale.com/docs/reference/tailscale-cli/serve).
