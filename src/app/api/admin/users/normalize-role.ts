import { Role as DbRole } from "@prisma/client";

/**
 * Normaliza strings de rol que puedan venir del front.
 * Acepta "comercial" como sinónimo de "usuario" (compatibilidad vieja).
 */
export function normalizeRole(
  input: string | null | undefined,
): DbRole | undefined {
  if (!input) return undefined;
  const v = input.toLowerCase().trim();
  if (v === "comercial") return DbRole.usuario;
  if (v === "usuario") return DbRole.usuario;
  if (v === "lider") return DbRole.lider;
  if (v === "admin") return DbRole.admin;
  if (v === "superadmin") return DbRole.superadmin;
  return undefined;
}
