# Conversación real de Gabito en la PC

La oficina permite abrir un chat real desde la ficha de Gabito. El modelo configurado es openai/gpt-6-sol, con thinkingDefault low, sin modelos alternativos. Usa la autenticación ChatGPT que ya se inició localmente. No necesita claves en el navegador.

## Ejecutar

En tres terminales PowerShell, desde D:\GABI-OS\project\gabi-os:

    powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/start-office.ps1 gateway
    powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/start-office.ps1 server
    powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/start-office.ps1 dev

Abrir http://localhost:5173/gabi-os/ en esta PC. Seleccionar Gabito en la columna derecha y pulsar Conversar con Gabito. Enviar un mensaje consume una consulta de la cuenta; abrir la ficha, consultar el historial y usar escenas no llama al modelo.

## Datos conservados

- Perfil autenticado de esta PC: D:\GABI-OS\data\runtime.
- Copia activa del workspace de Gabito: D:\GABI-OS\data\runtime\gabito-workspace.
- Índice local: D:\GABI-OS\data\knowledge\documents.json.
- Conversación nueva: D:\GABI-OS\data\chat\conversation.json.
- Respaldo del perfil previo: D:\GABI-OS\data\snapshots\before-real-chat-1793130182320.
- Restauración original verificada: D:\GABI-OS\data\recovery\20261027-155259-f2a2724d.

El índice inicial contiene 36 documentos de notas y 1111 fragmentos de conversaciones visibles, procedentes de 305 archivos de sesión. Excluye razonamientos, llamadas de herramientas, salidas de herramientas y mensajes de sistema/desarrollador. Los originales completos siguen en la restauración y el respaldo cifrado. El índice es una copia del momento del respaldo: no se sincroniza con cambios posteriores de la Philco.

La nueva conversación tiene su propio hilo persistente. Los historiales anteriores se consultan como recuerdos y no se muestran completos como mensajes del hilo nuevo. La búsqueda es local por términos y fragmentos; puede omitir recuerdos formulados con otras palabras. Si falta evidencia, Gabito debe reconocerlo.

Las respuestas se guardan en D:. Esta etapa no modifica las notas permanentes ni ejecuta los pedidos que requieran herramientas.

## Límites de esta etapa

Herramientas denegadas, cron y heartbeat deshabilitados, sin canales de mensajería. El proceso de la Philco sigue separado y no se modificó WhatsApp. El respaldo del origen no reemplazó las credenciales de la PC.

La API HTTP de OpenClaw usa un token con permisos amplios: queda únicamente en el servidor de loopback 18799. El navegador recibe una sesión efímera del puente 8787. Se exige origen local, token de sesión y límites de entrada. Vite bloquea el puente para conexiones de red y hosts distintos de localhost:5173 o 127.0.0.1:5173.

GitHub Pages conserva la oficina estática. El chat está deshabilitado en la compilación pública. iPhone y acceso remoto al chat requieren una etapa posterior con HTTPS y autenticación.

Los diálogos, rutinas y confesionarios de la sitcom siguen siendo ficción. El chat identifica las respuestas reales de IA y las fuentes recuperadas. No hay envío automático de prompts. Si una respuesta queda incierta, no se reintenta automáticamente; revisar el historial antes de enviar otra consulta.

## Verificación

Prueba real realizada con la pregunta elegida por Gabriel sobre los materiales del workshop de Mía. Respondió con la lista existente en organizacion/mia-colegio.md y respetó que el disfraz era opcional. Tras reiniciar el servidor se comprobó la continuidad con una segunda pregunta sobre ese disfraz.

Pruebas automatizadas con datos ficticios:

    npm run test:server
    npm test
    npm run build
    $env:PW_CHANNEL = "msedge"
    npm run test:e2e -- tests/browser/chat.spec.ts tests/browser/desktop.spec.ts
    $env:OFFICE_PREVIEW = "1"
    npm run test:e2e

La emulación móvil usa Chromium: no constituye una prueba en Safari físico. Los datos personales y las respuestas reales no forman parte del repositorio ni de los fixtures.

Referencias técnicas: https://docs.openclaw.ai/gateway/openresponses-http-api y documentación incluida en la instalación aislada OpenClaw 2026.10.1. La API ignora el parámetro reasoning del request; el nivel bajo se fija en la configuración del agente.

## Recuperación

Para volver al perfil anterior, detener únicamente el gateway local y el servidor de GABI OS. Conservar el runtime actual en una carpeta nueva bajo D:\GABI-OS\data\snapshots y copiar el runtime del respaldo indicado al directorio activo. No sobrescribir el perfil en ejecución. La Philco conserva su instancia original; este procedimiento no necesita tocarla.

Los scripts prepare-chat-profile.mjs e import-chat-memory.mjs son utilidades de preparación, no pasos de cada arranque. El primero exige detener el gateway, crea snapshot y se niega a reemplazar un workspace activo existente.

