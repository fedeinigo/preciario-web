// src/app/components/features/proposals/lib/catalogs.ts

/** ==================== Catálogo de países de la PROPUESTA ====================
 *  País elegido al crear la propuesta. La FILIAL se determina automáticamente
 *  con COUNTRY_TO_SUBSIDIARY y se muestra como sólo-lectura.
 */
export const COUNTRY_CATALOG = [
  { id: "PAIS-ARG", name: "Argentina" },
  { id: "PAIS-BOL", name: "Bolivia" },
  { id: "PAIS-BRA", name: "Brasil" },
  { id: "PAIS-CHL", name: "Chile" },
  { id: "PAIS-COL", name: "Colombia" },
  { id: "PAIS-CRI", name: "Costa Rica" },
  { id: "PAIS-ECU", name: "Ecuador" },
  { id: "PAIS-SLV", name: "El Salvador" },
  { id: "PAIS-ESP", name: "España" },
  { id: "PAIS-GTM", name: "Guatemala" },
  { id: "PAIS-HTI", name: "Haití" },
  { id: "PAIS-HND", name: "Honduras" },
  { id: "PAIS-JAM", name: "Jamaica" },
  { id: "PAIS-MEX", name: "México" },
  { id: "PAIS-NIC", name: "Nicaragua" },
  { id: "PAIS-PAN", name: "Panamá" },
  { id: "PAIS-PRY", name: "Paraguay" },
  { id: "PAIS-PER", name: "Perú" },
  { id: "PAIS-PRI", name: "Puerto Rico" },
  { id: "PAIS-DOM", name: "República Dominicana" },
  { id: "PAIS-URY", name: "Uruguay" },
  { id: "PAIS-VEN", name: "Venezuela" },
];

export type CountryOption = { value: string; label: string };
type CountryLabelResolver = (countryName: string) => string;

function defaultCountryResolver(): CountryLabelResolver {
  return (name) => name;
}

export function getCompanyCountryOptions(
  translate: CountryLabelResolver = defaultCountryResolver()
): CountryOption[] {
  return COUNTRY_CATALOG.map((country) => ({
    value: country.name,
    label: translate(country.name),
  }));
}
export const countryIdFromName = (name: string) =>
  COUNTRY_CATALOG.find((c) => c.name.toLowerCase() === name.toLowerCase())?.id ??
  "PAIS-UNK";

/** ==================== Filiales ==================== */
export const SUBSIDIARIES = [
  { id: "FILIAL-AR", name: "ARGENTINA" },
  { id: "FILIAL-BR", name: "BRASIL" },
  { id: "FILIAL-ES", name: "ESPAÑA" },
  { id: "FILIAL-US", name: "USA" },
  { id: "FILIAL-CO", name: "COLOMBIA" },
];

export const subsidiaryIdFromName = (name: string) =>
  SUBSIDIARIES.find((s) => s.name.toLowerCase() === name.toLowerCase())?.id ??
  "FILIAL-UNK";

/** ==================== Mapeo País -> Filial (propuesta) ==================== */
const COUNTRY_TO_SUBSIDIARY: Record<string, string> = {
  Argentina: "ARGENTINA",
  Bolivia: "COLOMBIA",
  Brasil: "BRASIL",
  Chile: "USA",
  Colombia: "COLOMBIA",
  "Costa Rica": "ESPAÑA",
  Ecuador: "ESPAÑA",
  "El Salvador": "ESPAÑA",
  España: "ESPAÑA",
  Guatemala: "USA",
  Haití: "USA",
  Honduras: "USA",
  Jamaica: "ESPAÑA",
  México: "USA",
  Nicaragua: "USA",
  Panamá: "ESPAÑA",
  Paraguay: "ESPAÑA",
  Perú: "COLOMBIA",
  "Puerto Rico": "USA",
  "República Dominicana": "ESPAÑA",
  Uruguay: "ESPAÑA",
  Venezuela: "ESPAÑA",
};

/** Devuelve la filial correspondiente al país de la propuesta */
export function autoSubsidiaryForCountry(countryName: string): string {
  return COUNTRY_TO_SUBSIDIARY[countryName] ?? "";
}

/** ==================== Países destino (WhatsApp / Minutos salientes) ==================== */
export const DESTINATION_COUNTRIES = [
  "Argentina",
  "Alemania",
  "Aruba",
  "Belgica",
  "Bolivia",
  "Brasil",
  "Canadá",
  "Chile",
  "Colombia",
  "Costa Rica",
  "Ecuador",
  "Egipto",
  "El Salvador",
  "España",
  "Estados Unidos",
  "Francia",
  "Guatemala",
  "Haití",
  "Honduras",
  "India",
  "Indonesia",
  "Israel",
  "Italia",
  "Jamaica",
  "Malasia",
  "México",
  "Nicaragua",
  "Nigeria",
  "Noruega",
  "Países Bajos",
  "Pakistán",
  "Panamá",
  "Paraguay",
  "Perú",
  "Polonia",
  "Puerto Rico",
  "Reino Unido",
  "República Dominicana",
  "Rumania",
  "Rusia",
  "Arabia Saudita",
  "Suecia",
  "Suiza",
  "Turquía",
  "Uruguay",
  "Venezuela",
  "Emiratos Árabes Unidos",
  "Resto de Asia",
  "Resto de Europa",
  "Resto de Africa",
  "Resto de America",
  "Other",
];

export type DestinationCountryId = (typeof DESTINATION_COUNTRIES)[number];

export type LocalizedCountry = { id: DestinationCountryId; label: string };

export function getLocalizedCountries(
  translate: CountryLabelResolver = defaultCountryResolver()
): LocalizedCountry[] {
  return DESTINATION_COUNTRIES.map((id) => ({
    id,
    label: translate(id),
  }));
}

export function getCountryLabel(
  id: DestinationCountryId,
  translate: CountryLabelResolver = defaultCountryResolver()
): string {
  return translate(id);
}
