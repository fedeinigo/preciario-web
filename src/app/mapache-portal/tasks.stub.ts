export type MapacheTaskStatus = "backlog" | "in-progress" | "blocked" | "qa" | "done";

export interface MapacheTask {
  id: string;
  title: string;
  description: string;
  status: MapacheTaskStatus;
  owner: string;
  dueDate?: string;
  tags?: string[];
  lastUpdated?: string;
}

const MAPACHE_TASKS: MapacheTask[] = [
  {
    id: "MP-101",
    title: "Integrar pipeline de leads con HubSpot",
    description:
      "Revisar los webhooks nuevos, documentar endpoints y validar payloads con el equipo de Producto.",
    status: "in-progress",
    owner: "Ana P.",
    dueDate: "2024-12-05",
    tags: ["integraciones", "prioridad-alta"],
    lastUpdated: "2024-11-28T09:30:00Z",
  },
  {
    id: "MP-094",
    title: "Migrar reportes de desempeño a Looker Studio",
    description:
      "Armado de dashboards para Mapaches con filtros dinámicos por vertical y responsable.",
    status: "qa",
    owner: "Diego R.",
    dueDate: "2024-12-12",
    tags: ["reportes"],
    lastUpdated: "2024-11-27T14:10:00Z",
  },
  {
    id: "MP-087",
    title: "Definir playbook de onboarding para cuentas enterprise",
    description:
      "Compilar checklist actualizado, crear plantillas y coordinar capacitación con CX.",
    status: "backlog",
    owner: "Lucía M.",
    tags: ["process"],
    lastUpdated: "2024-11-21T16:45:00Z",
  },
  {
    id: "MP-076",
    title: "Auditar health de cuentas en riesgo Q4",
    description:
      "Cruzar métricas de uso con alertas de soporte y preparar recomendaciones.",
    status: "in-progress",
    owner: "Juan F.",
    dueDate: "2024-12-03",
    tags: ["retención", "salud"],
    lastUpdated: "2024-11-29T11:20:00Z",
  },
  {
    id: "MP-059",
    title: "Actualizar base de templates de propuestas",
    description:
      "Revisar versiones antiguas, consolidar assets y definir responsables de mantenimiento.",
    status: "blocked",
    owner: "Caro G.",
    dueDate: "2024-12-19",
    tags: ["templates", "bloqueado"],
    lastUpdated: "2024-11-26T18:05:00Z",
  },
  {
    id: "MP-041",
    title: "Automatizar recordatorios de renovaciones",
    description:
      "Sincronizar cron con CRM y revisar copy junto a Marketing.",
    status: "done",
    owner: "Nico S.",
    dueDate: "2024-11-15",
    tags: ["automations"],
    lastUpdated: "2024-11-18T08:15:00Z",
  },
];

export async function getMapacheTasks(): Promise<MapacheTask[]> {
  // Simula una llamada a un servicio remoto.
  await new Promise((resolve) => setTimeout(resolve, 10));
  return MAPACHE_TASKS;
}
