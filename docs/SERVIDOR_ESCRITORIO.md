# Motor local de GABI OS

Decisión del usuario del 27/10/2026: ejecutar el funcionamiento en la PC de escritorio. La Philco queda fuera de esta integración. Proveedor elegido: cuenta ChatGPT Plus, mediante autenticación de ChatGPT/Codex en OpenClaw. El acceso OAuth se completó y la comprobación real del proveedor devolvió `status: ok` para `openai/gpt-6-astra`. Esto verifica el proveedor; todavía no una conversación con el personaje Gabito.

## Lo que funciona

- Servidor Node de diagnóstico en `127.0.0.1:8787`, con memoria disponible y comprobación del gateway aislado en `127.0.0.1:18799`.
- Panel **Motor** en la oficina. En desarrollo consulta datos reales; en el sitio estático explica que el backend privado todavía falta.
- Arranque aislado de OpenClaw ya instalado. No utiliza el perfil habitual, no importa claves del entorno, no configura canales de mensajería y no envía tareas.
- Configuración y credenciales en `%LOCALAPPDATA%\GabiOS\runtime`, fuera de Git y OneDrive. El token local del gateway se genera automáticamente y nunca llega al navegador.
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

1. Verificar una primera respuesta de Gabito en una conversación controlada; el acceso OAuth y la prueba del proveedor ya pasaron.
2. Implementar conversación con Gabito, almacenamiento de tareas y permisos del lado del servidor, con evidencia de resultados.
3. Conectar los demás especialistas gradualmente, con límites de concurrencia y consumo; los ocho personajes actuales siguen siendo ambientación.
4. Acceso privado desde iPhone/GitHub Pages: HTTPS, autenticación y permisos. El navegador del teléfono no debe apuntar al localhost de la PC. El proxy de desarrollo es exclusivo de desarrollo local.
5. Persistencia operativa: arranque automático, suspensión de Windows, copias de seguridad y monitorización antes de prometer funcionamiento continuo.

Diagnóstico de esta PC: i5-10400F, unos 32 GB RAM, 11 GB libres en C: y 372 GB libres en D: al revisar. WSL solo tiene `docker-desktop`, detenido; Docker no estaba iniciado. Esta etapa usa Node/OpenClaw nativos y no requiere iniciar Docker ni descargar modelos. Conviene elegir D: para almacenamiento voluminoso posterior.
