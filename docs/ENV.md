# Variables de entorno

Estas variables son utilizadas por la aplicación. Los nuevos flags se introducen con valores por defecto seguros (apagados) para evitar cambios de comportamiento inesperados.

| Variable | Descripción | Valor por defecto |
| --- | --- | --- |
| `DATABASE_URL` | Cadena de conexión para PostgreSQL usada por Prisma. | _(sin valor, requerido)_ |
| `GOOGLE_CLIENT_ID` | Credenciales OAuth de Google para NextAuth. | _(sin valor, requerido)_ |
| `GOOGLE_CLIENT_SECRET` | Secreto OAuth de Google para NextAuth. | _(sin valor, requerido)_ |
| `NEXTAUTH_SECRET` | Secreto para firmar JWT de NextAuth. | _(sin valor, requerido)_ |
| `NEXTAUTH_URL` | URL base para callbacks de NextAuth (incluir https:// en producción). | `http://localhost:3000` |
| `FEATURE_SECURE_API_ROUTES` | Activa los guardas de sesión/rol en endpoints críticos (`/api/items`, `/api/proposals`, `/api/admin/users`). | `false` |
| `FEATURE_PROPOSALS_PAGINATION` | Habilita la respuesta paginada y con `select` reducido en `GET /api/proposals`. | `false` |
| `FEATURE_STRICT_OAUTH_LINKING` | Deshabilita `allowDangerousEmailAccountLinking` para evitar uniones de cuentas inseguras. | `false` |

> Nota: los flags pueden declararse como `true` o `1` para activarlos. Mantenerlos apagados garantiza compatibilidad con el comportamiento previo mientras se completan las pruebas de regresión.
