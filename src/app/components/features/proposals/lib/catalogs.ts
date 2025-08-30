export const COUNTRY_CATALOG = [
  { id: "PAIS-ARG", name: "Argentina" },
  { id: "PAIS-BRA", name: "Brasil" },
  { id: "PAIS-CAN", name: "Canadá" },
  { id: "PAIS-CHL", name: "Chile" },
  { id: "PAIS-COL", name: "Colombia" },
  { id: "PAIS-CRI", name: "Costa Rica" },
  { id: "PAIS-CUB", name: "Cuba" },
  { id: "PAIS-DOM", name: "República Dominicana" },
  { id: "PAIS-ECU", name: "Ecuador" },
  { id: "PAIS-SLV", name: "El Salvador" },
  { id: "PAIS-ESP", name: "España" },
  { id: "PAIS-USA", name: "Estados Unidos" },
  { id: "PAIS-GTM", name: "Guatemala" },
  { id: "PAIS-HND", name: "Honduras" },
  { id: "PAIS-MEX", name: "México" },
  { id: "PAIS-NIC", name: "Nicaragua" },
  { id: "PAIS-PAN", name: "Panamá" },
  { id: "PAIS-PRY", name: "Paraguay" },
  { id: "PAIS-PER", name: "Perú" },
  { id: "PAIS-URY", name: "Uruguay" },
  { id: "PAIS-VEN", name: "Venezuela" },
];
export const COUNTRY_NAMES = COUNTRY_CATALOG.map(c => c.name);
export const countryIdFromName = (name: string) =>
  COUNTRY_CATALOG.find(c => c.name.toLowerCase() === name.toLowerCase())?.id ?? "PAIS-UNK";

export const SUBSIDIARIES = [
  { id: "FILIAL-AR", name: "ARGENTINA" },
  { id: "FILIAL-BR", name: "BRASIL" },
  { id: "FILIAL-ES", name: "ESPAÑA" },
  { id: "FILIAL-US", name: "USA" },
  { id: "FILIAL-CO", name: "COLOMBIA" },
];
export const subsidiaryIdFromName = (name: string) =>
  SUBSIDIARIES.find(s => s.name.toLowerCase() === name.toLowerCase())?.id ?? "FILIAL-UNK";
