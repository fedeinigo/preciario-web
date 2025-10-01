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
| `FEATURE_APP_SHELL_RSC` | Activa el layout con sesión pre-hidratada desde el servidor y metadata SEO ampliada. | `false` |
| `FEATURE_PROPOSALS_CLIENT_REFACTOR` | Usa la versión modular del dashboard de propuestas sin `useSession` global. | `false` |
| `FEATURE_ACCESSIBILITY_SKELETONS` | Habilita skeletons accesibles durante la carga en rutas cliente. | `false` |
| `NEXT_PUBLIC_FEATURE_ACCESSIBILITY_SKELETONS` | Flag equivalente del lado cliente para renderizar skeletons accesibles. | `false` |
| `ANALYZE` | Cuando es `true`, activa el analizador de bundles (`npm run build:analyze`). | `false` |

> Nota: los flags pueden declararse como `true` o `1` para activarlos. Mantenerlos apagados garantiza compatibilidad con el comportamiento previo mientras se completan las pruebas de regresión. Para los flags cliente (`NEXT_PUBLIC_*`) es necesario reiniciar el servidor de desarrollo.

## Dominios autorizados para autenticación

- **Desarrollo local:** `http://localhost:3000`
- **Preview de Vercel:** `https://<branch>-preciario-web.vercel.app`
- **Producción:** `https://preciario.wisecx.com`

Asegúrate de registrar estos dominios en Google Cloud OAuth y de actualizar `NEXTAUTH_URL`/`AUTH_URL` según el entorno donde se despliegue la app.
=======

> Nota: los flags pueden declararse como `true` o `1` para activarlos. Mantenerlos apagados garantiza compatibilidad con el comportamiento previo mientras se completan las pruebas de regresión.
