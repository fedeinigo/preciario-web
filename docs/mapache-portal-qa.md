# Portal Mapache – Lista de verificación QA

## Sección tableros

- **Columna con múltiples estados**: al arrastrar una tarea desde otra columna debe abrirse el selector de estado. El cambio se confirma solo después de elegir una opción.
- **Columna con un único estado**: arrastrar y soltar mueve la tarjeta inmediatamente sin solicitar confirmación.
- **Cancelar selección**: en el selector de estado, presionar `Cancelar` o `Esc` cierra el menú sin mover la tarjeta.
- **Actualización optimista**: después de editar o reordenar columnas, la vista debe mantenerse sincronizada tras el refetch automático de React Query.

## Sección tareas

- **Sincronización de filtros**: cambiar filtros desde la UI debe actualizar la query string y recargar los datos paginados desde la API.
- **Persistencia de filtros**: al volver a cargar la página se restauran los filtros guardados para la sesión actual.
- **Resumen servidor**: la sección inferior “Panorama rápido del pipeline” muestra cifras coherentes con los datos del tablero.

## Sección métricas

- **Snapshots almacenados**: el resumen “Métricas en cache servidor” refleja el último snapshot persistido en la tabla `MapacheInsightsSnapshot`.
- **Guardado automático**: ajustar filtros en el panel de insights genera un nuevo snapshot semanal (`scope = filtered`) sin bloquear la UI.

