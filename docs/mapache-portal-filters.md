# Mapache Portal – Formato de URLs con filtros

Los filtros del Portal Mapache se sincronizan con la query string. Desde la refactorización de octubre de 2025, esa misma query se utiliza en el backend para paginar y filtrar tareas, por lo que cualquier URL compartida produce el mismo resultado en todos los dispositivos.

## Parámetros disponibles

| Parámetro          | Descripción                                                                                   |
|--------------------|-----------------------------------------------------------------------------------------------|
| `status`           | Clave del estado en mayúsculas (`PENDING`, `COMPLETED`, etc.). Usa `all` para incluir todos.  |
| `owner`            | Filtro rápido por responsable. Valores válidos: `all`, `mine`, `unassigned`.                  |
| `needs`            | Lista separada por comas con las necesidades del equipo (`QUOTE`, `SCOPE`, …).                |
| `directness`       | Lista separada por comas para el tipo de contacto (`DIRECT`, `PARTNER`).                      |
| `integration`      | Lista separada por comas con los tipos de integración (`REST`, `GRAPHQL`, `SDK`, `OTHER`).    |
| `origins`          | Lista separada por comas con los orígenes de la señal (`MANUAL`, `API`, `GOOGLE_FORM`, …).    |
| `assignees`        | Lista separada por comas de IDs de Mapaches asignados.                                        |
| `presentationFrom` | Fecha inicial en formato `YYYY-MM-DD` para filtrar por fecha de presentación.                 |
| `presentationTo`   | Fecha final en formato `YYYY-MM-DD` para filtrar por fecha de presentación.                   |
| `limit`            | (Opcional) Máximo de tareas por página. El valor por defecto actual es `100`.                 |

Las listas pueden declararse como parámetros repetidos (ej. `?needs=QUOTE&needs=SCOPE`) o separados por comas (`?needs=QUOTE,SCOPE`). El Portal normaliza ambas formas antes de consultar la API.

## Ejemplos

```text
/mapache-portal?status=PENDING&owner=mine&needs=QUOTE_SCOPE,OTHER&presentationFrom=2025-01-01
/mapache-portal?directness=PARTNER&assignees=usr_123,usr_999&limit=50
```

Si una URL no contiene filtros válidos, el Portal recurre al último estado persistido para la persona usuaria como fallback.
