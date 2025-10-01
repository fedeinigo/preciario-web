# Reportes de performance

Usa el analizador de bundles de Next.js para medir el impacto de cada feature flag.

```bash
npm run build:analyze
```

El comando utiliza `next build --analyze` para abrir el reporte interactivo (generado en `.next/analyze`). Sube un resumen en `docs/perf/<fecha>.md` después de cada optimización relevante indicando métricas antes/después (KB y chunks principales).

## Reporte actual

- `docs/perf/2025-10-01-base.md`: baseline tomada antes de habilitar `FEATURE_APP_SHELL_RSC` y `FEATURE_PROPOSALS_CLIENT_REFACTOR`.
