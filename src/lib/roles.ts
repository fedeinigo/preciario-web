// src/lib/roles.ts
import { Role as DbRole } from "@prisma/client";
import type { AppRole } from "@/constants/teams";

/** Mapea el enum de Prisma a nuestro AppRole de la UI */
export function appRoleFromDb(role: DbRole | null | undefined): AppRole {
  switch (role) {
    case DbRole.superadmin:
      return "superadmin";
    case DbRole.admin:
      return "admin";
    case DbRole.lider:
      return "lider";
    default:
      // En la UI usamos "usuario" como rol base
      return "usuario";
  }
}

/** Mapea el rol de la UI al enum de Prisma */
export function dbRoleFromApp(role: AppRole | string | null | undefined): DbRole {
  switch (role) {
    case "superadmin":
      return DbRole.superadmin;
    case "admin":
      return DbRole.admin;
    case "lider":
      return DbRole.lider;
    case "usuario":
    default:
      return DbRole.usuario;
  }
}
