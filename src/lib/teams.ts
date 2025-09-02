// src/lib/teams.ts
export const TEAMS = [
  "Leones",
  "Lobos",
  "Tigres",
  "Panteras",
  "Jaguares",
  "Pirañas",
  "Tiburones",
  "Gorilas",
  "Abejas",
  "Mapaches",
  "Hormigas",
  "Carpinchos",
  "Buhos",
] as const;

export type TeamName = (typeof TEAMS)[number];
export type AppRole = "superadmin" | "lider" | "usuario";
