// src/constants/teams.ts
// Único lugar donde definimos el tipo de rol.
export type AppRole = "admin" | "lider" | "usuario";

// Mantengo TEAMS por compatibilidad (ya no se usa para filtrar; ahora se consulta /api/teams)
export const TEAMS: string[] = [];
export type Team = string;
