# Conservar la memoria de Gabito al cambiar de equipo

El gateway nuevo de la PC utiliza un perfil aislado. Crear ese perfil y autenticar ChatGPT **no importa** recuerdos, sesiones, documentos ni capacidades del Gabito de la Philco. Tampoco modifica los archivos originales.

## Qué debe conservarse

| Contenido | Tratamiento |
| --- | --- |
| Identidad, preferencias, instrucciones y memoria escrita | Preservar el workspace completo, incluidos `MEMORY.md`, `memory/`, `USER.md`, `SOUL.md`, `IDENTITY.md`, `AGENTS.md`, herramientas y skills. Verificar cuáles existen realmente. |
| Conversaciones y estado persistente | Respaldar el directorio de estado completo y las bases de datos, además de sesiones JSONL en versiones anteriores. Copiar solo `openclaw.json` no alcanza. |
| Documentos, adjuntos y carpetas externas | Inventariar ubicaciones configuradas y enlaces. Los archivos fuera del estado/workspace requieren incluir sus propias raíces. |
| Configuración de Linux y herramientas | Adaptar rutas, servicios y dependencias a Windows; no ejecutar automáticamente los scripts migrados. |
| Credenciales y canales | Mantenerlos privados. Conservar el acceso nuevo de ChatGPT en la PC. La sesión de WhatsApp requiere un cambio coordinado y no debe activarse en dos equipos. |

Los archivos y registros pueden preservarse; eso no garantiza respuestas idénticas al cambiar de modelo ni que todo el historial entre en cada consulta. Cambiar Astra por Sol no borra los archivos de memoria.

## Primera fase: inventario sin cambios remotos

Desde PowerShell en el repositorio:

```powershell
.\scripts\inventory-philco.ps1
```

Ingresar la contraseña únicamente en la terminal cuando SSH la solicite. El script comprueba la identidad SSH conocida, ejecuta Python estándar de solo lectura y guarda el informe en `%LOCALAPPDATA%\GabiOS\migration`, fuera de Git y OneDrive.

El informe muestra versiones, estado del servicio, rutas candidatas, cantidades/tamaños, presencia y hashes de archivos de identidad. No muestra textos de recuerdos ni credenciales. No abre bases de datos, crea respaldos, detiene servicios o importa archivos. Limita cada recorrido a 20.000 archivos y marca los resultados truncados. Los enlaces simbólicos, raíces personalizadas, perfiles adicionales y configuraciones JSON5 necesitan revisión antes de dar por completo el inventario.

## Migración posterior

1. Confirmar versión y rutas reales de la Philco, incluyendo carpetas externas y el perfil en uso. Obtener respaldo también del perfil nuevo de la PC.
2. Preparar una pausa breve del servicio anterior para un respaldo consistente; reiniciarlo si todavía continuará atendiendo hasta el cambio definitivo. La herramienta y los comandos dependen de la versión encontrada.
3. Crear y verificar el respaldo completo con la herramienta compatible. Para una copia entre equipos, no copiar bases SQLite mientras cambian. Mantener los respaldos privados y protegidos; nunca subirlos al repositorio, a GitHub Pages ni al chat.
4. Transferir por SSH y restaurar en una carpeta de ensayo separada. Verificar manifiesto/integridad, cantidades y hashes, y corregir rutas/enlaces Linux. No sobrescribir el perfil autenticado de la PC.
5. Decidir entre trasladar el perfil completo adaptado o importar su conocimiento al perfil nuevo. Probar que Gabito encuentre datos conocidos, documentos y sesiones esperadas, con canales y automatizaciones deshabilitados durante el ensayo.
6. Coordinar WhatsApp y tareas programadas: detener la instancia anterior para el cambio final, evitar credenciales de canal antiguas y duplicación de acciones. Mantener el original y los respaldos para recuperación; no reactivar a ciegas un canal con estado desactualizado.

Fuentes: [migración oficial](https://docs.openclaw.ai/install/migrating), [espacio de trabajo](https://docs.openclaw.ai/concepts/agent-workspace), [respaldo y restauración](https://docs.openclaw.ai/cli/backup).

Estado al preparar esta fase: el intento de SSH automático a la dirección local anterior fue rechazado por autenticación. Aún no se ha inventariado ni respaldado la Philco desde esta etapa. La autenticación interactiva local es necesaria para continuar; no hace falta enviar contraseñas ni instalar claves a ciegas.
