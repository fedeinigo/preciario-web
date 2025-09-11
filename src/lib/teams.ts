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

  export type Team = typeof TEAMS[number];
  export type AppRole = "superadmin" | "lider" | "comercial";
