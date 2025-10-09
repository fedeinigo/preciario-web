# API Mapache Tasks

Endpoints protegidos para gestionar tareas internas del equipo **Mapaches**. Todos los métodos requieren una sesión válida mediante `requireApiSession()` y sólo se permiten usuarios con rol `superadmin` o con `team` igual a `"Mapaches"`.

## Modelo

```jsonc
{
  "id": "string",
  "title": "string",
  "description": "string | null",
  "statusId": "string", // FK a MapacheStatus
  "status": {
    "id": "string",
    "key": "string",     // p.ej. "PENDING"
    "label": "string",
    "order": 0
  },
  "createdAt": "Date",
  "updatedAt": "Date",
  "createdById": "string"
}
```

El campo `status` devuelto incluye el objeto completo para futuras necesidades de UI. Para crear o editar tareas se envía la propiedad `status` con el `key` deseado.

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
    "status": "string" // opcional, default "PENDING". Debe existir en MapacheStatus.key
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
    "status": "string"        // opcional. Debe existir en MapacheStatus.key
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

## Gestión de estados (`/api/mapache/statuses`)

Los estados disponibles se persisten en la tabla `MapacheStatus` y pueden administrarse mediante los siguientes endpoints protegidos (mismas reglas de autenticación que las tareas):

- **GET `/api/mapache/statuses`**: lista todos los estados ordenados por `order` ascendente.
- **POST `/api/mapache/statuses`**: crea un estado nuevo. Body esperado:

  ```jsonc
  {
    "key": "string",   // requerido, se normaliza en MAYÚSCULAS y debe ser único
    "label": "string", // requerido
    "order": 0          // opcional, entero. Si falta se asigna el siguiente disponible
  }
  ```

- **PUT `/api/mapache/statuses/{id}`**: reemplaza completamente un estado existente (requiere `key`, `label`, `order`).
- **PATCH `/api/mapache/statuses/{id}`**: permite actualizar parcialmente cualquiera de los campos anteriores.
- **DELETE `/api/mapache/statuses/{id}`**: elimina el estado (falla con `409` si hay tareas vinculadas).

Los `key` se comparan en mayúsculas y se devolverá `409` cuando exista un duplicado.
