# API Mapache Tasks

Endpoints protegidos para gestionar tareas internas del equipo **Mapaches**. Todos los métodos requieren una sesión válida mediante `requireApiSession()` y sólo se permiten usuarios con rol `superadmin` o con `team` igual a `"Mapaches"`.

## Modelo

```jsonc
{
  "id": "string",
  "title": "string",
  "description": "string | null",
  "status": "PENDING" | "IN_PROGRESS" | "DONE",
  "createdAt": "Date",
  "updatedAt": "Date",
  "createdById": "string"
}
```

## GET `/api/mapache/tasks`

Lista todas las tareas ordenadas por `createdAt` descendente.

- **Respuesta 200**: `MapacheTask[]`.
- **Errores**: `401` si no hay sesión, `403` si la persona no pertenece al equipo autorizado.

## POST `/api/mapache/tasks`

Crea una nueva tarea asociada al usuario autenticado.

- **Body**:
  ```jsonc
  {
    "title": "string",        // requerido, no vacío
    "description": "string?",  // opcional
    "status": "PENDING" | "IN_PROGRESS" | "DONE" // opcional, default PENDING
  }
  ```
- **Respuesta 201**: tarea creada.
- **Errores**: `400` por validaciones básicas, `401`/`403` igual que en GET.

## PATCH `/api/mapache/tasks`

Actualiza campos seleccionados de una tarea.

- **Body**:
  ```jsonc
  {
    "id": "string",           // requerido
    "title": "string?",       // opcional, no vacío si se envía
    "description": "string?", // opcional (null para borrar)
    "status": "PENDING" | "IN_PROGRESS" | "DONE" // opcional
  }
  ```
- **Respuesta 200**: tarea actualizada.
- **Errores**: `400` cuando no hay cambios válidos.

## DELETE `/api/mapache/tasks`

Elimina una tarea por `id`.

- **Body**:
  ```jsonc
  { "id": "string" }
  ```
- **Respuesta 200**: `{ "ok": true }`.

Todos los métodos comparten los códigos `401`/`403` descritos anteriormente.
