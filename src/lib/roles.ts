import { Role as DbRole } from "@prisma/client";
import type { AppRole } from "@/constants/teams";

/** AppRole -> Prisma Role */
export function toDbRole(r: AppRole): DbRole {
  switch (r) {
    case "superadmin":
      return DbRole.superadmin;
    case "lider":
      return DbRole.lider;
    case "comercial":
    default:
      // En DB se llama "usuario"
      return DbRole.usuario;
  }
}

/** Prisma Role -> AppRole */
export function fromDbRole(r?: DbRole | null): AppRole {
  if (!r) return "comercial";
  switch (r) {
    case DbRole.superadmin:
      return "superadmin";
    case DbRole.lider:
      return "lider";
    case DbRole.usuario:
    default:
      return "comercial";
  }
}
