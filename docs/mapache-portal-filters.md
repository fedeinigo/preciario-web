# Mapache Portal – Formato de URLs con filtros

Los filtros del Portal Mapache ahora se reflejan en la query string, lo que permite compartir vistas exactas entre miembros del equipo.

## Parámetros disponibles

| Parámetro            | Descripción                                                                                 |
|----------------------|---------------------------------------------------------------------------------------------|
| `status`             | Estado activo (clave en mayúsculas, por ejemplo `PENDING`). Usa `all` para ver todos.       |
| `owner`              | Filtro rápido por responsable. Valores válidos: `all`, `mine`, `unassigned`.                |
| `needs`              | Lista separada por comas de necesidades del equipo (`QUOTE`, `SCOPE`, etc.).                |
| `directness`         | Lista separada por comas para el tipo de contacto (`DIRECT`, `PARTNER`).                    |
| `integration`        | Lista separada por comas para tipos de integración (`REST`, `GRAPHQL`, `SDK`, `OTHER`).     |
| `origins`            | Lista separada por comas para los orígenes de la señal (`MANUAL`, `API`, etc.).             |
| `assignees`          | Lista separada por comas de IDs de Mapaches asignados.                                      |
| `presentationFrom`   | Fecha inicial (formato `YYYY-MM-DD`) para filtrar por presentación.                         |
| `presentationTo`     | Fecha final (formato `YYYY-MM-DD`) para filtrar por presentación.                           |

Los parámetros pueden combinarse libremente. Las listas admiten valores repetidos o múltiples parámetros, pero se normalizan internamente.

## Ejemplo

```
/mapache-portal?status=PENDING&owner=mine&needs=QUOTE_SCOPE,OTHER&presentationFrom=2025-01-01
```

Compartir esta URL abrirá el Portal con el estado "Pending", mostrando solo las tareas propias, filtradas por las necesidades indicadas y con fecha de presentación posterior al 1 de enero de 2025.

Si la URL no define filtros válidos, el portal sigue utilizando el último estado guardado en `localStorage` como fallback.
