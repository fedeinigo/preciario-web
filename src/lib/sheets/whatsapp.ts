export type WhatsAppVariant = "marketing" | "utility" | "auth";

type VariantColumns = Partial<Record<WhatsAppVariant, number>> & { label?: string };
export type VariantColumnMap = Partial<Record<WhatsAppVariant, number[]>>;

const WHATSAPP_VARIANT_MATCHERS: Record<WhatsAppVariant, (key: string) => boolean> = {
  marketing: (key) => key.includes("MARK"),
  utility: (key) => key.includes("UTIL") || key.includes("SERVIC") || key.includes("SERVICE"),
  auth: (key) => key.includes("AUTH") || key.includes("AUTENT"),
};

const WHATSAPP_VARIANT_FALLBACK_COLUMNS: Record<WhatsAppVariant, readonly number[]> = {
  marketing: [3, 7],
  utility: [8, 4],
  auth: [9, 5],
};

export function normalizeSheetKey(input: unknown): string {
  return String(input ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function detectVariant(value: unknown): WhatsAppVariant | null {
  const key = normalizeSheetKey(value);
  if (!key) return null;
  for (const [variant, matcher] of Object.entries(WHATSAPP_VARIANT_MATCHERS) as [
    WhatsAppVariant,
    (key: string) => boolean
  ][]) {
    if (matcher(key)) return variant;
  }
  return null;
}

function castCellValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return "";
  return String(value);
}

export function detectWhatsAppVariantColumns(values: string[][]): VariantColumnMap {
  const detected: VariantColumnMap = {};

  const maxRowsToInspect = Math.min(values.length, 5);
  for (let rowIdx = 0; rowIdx < maxRowsToInspect; rowIdx++) {
    const row = values[rowIdx];
    if (!Array.isArray(row)) continue;

    for (let col = 0; col < row.length; col++) {
      const variant = detectVariant(row[col]);
      if (!variant) continue;

      const columns = detected[variant] ?? [];
      if (!columns.includes(col)) columns.push(col);
      detected[variant] = columns;
    }
  }

  for (const variant of Object.keys(WHATSAPP_VARIANT_FALLBACK_COLUMNS) as WhatsAppVariant[]) {
    const fallback = WHATSAPP_VARIANT_FALLBACK_COLUMNS[variant];
    const existing = detected[variant] ?? [];
    for (const col of fallback) {
      if (!existing.includes(col)) existing.push(col);
    }
    detected[variant] = existing;
  }

  return detected;
}

export function resolveWhatsAppCell(
  row: string[],
  variant: WhatsAppVariant,
  columnsMap?: VariantColumnMap
): string {
  const columns = columnsMap?.[variant] ?? WHATSAPP_VARIANT_FALLBACK_COLUMNS[variant];
  for (const col of columns) {
    if (col >= row.length) continue;
    const cell = castCellValue(row[col]);
    if (cell.trim()) return cell;
  }
  return "";
}

/**
 * Convierte una hoja "pivot" de WhatsApp (columnas por filial y variante) al formato histórico.
 * Si la hoja ya viene en el formato antiguo, retorna un array vacío para permitir fallback.
 */
function pivotWhatsAppSheet(values: string[][]): string[][] {
  if (values.length < 3) return [];

  const headerSubsidiaries = values[0] ?? [];
  const headerVariants = values[1] ?? [];
  const variantBySubsidiary = new Map<string, VariantColumns>();

  const columnCount = Math.max(headerSubsidiaries.length, headerVariants.length);

  for (let col = 1; col < columnCount; col++) {
    const subsidiary = normalizeSheetKey(headerSubsidiaries[col]);
    if (!subsidiary) continue;

    const variant = detectVariant(headerVariants[col] ?? headerSubsidiaries[col]);
    if (!variant) continue;

    const columns = variantBySubsidiary.get(subsidiary) ?? {};
    if (!columns.label) columns.label = castCellValue(headerSubsidiaries[col]);
    columns[variant] = col;
    variantBySubsidiary.set(subsidiary, columns);
  }

  if (variantBySubsidiary.size === 0) return [];

  const output: string[][] = [];

  for (let rowIdx = 2; rowIdx < values.length; rowIdx++) {
    const row = values[rowIdx];
    if (!row) continue;
    const countryCell = row[0];
    const countryKey = normalizeSheetKey(countryCell);
    if (!countryKey) continue;

    for (const [subsidiary, cols] of variantBySubsidiary.entries()) {
      const marketing = cols.marketing !== undefined ? castCellValue(row[cols.marketing]) : "";
      const utility = cols.utility !== undefined ? castCellValue(row[cols.utility]) : "";
      const auth = cols.auth !== undefined ? castCellValue(row[cols.auth]) : "";

      if (!marketing && !utility && !auth) continue;

      output.push([
        cols.label ?? subsidiary,
        castCellValue(countryCell),
        "",
        marketing,
        utility,
        auth,
      ]);
    }
  }

  return output;
}

/**
 * Normaliza la hoja de precios de WhatsApp: si proviene del formato nuevo (pivot),
 * la convierte al formato histórico (filial/país/variantes). En caso contrario retorna el input.
 */
export function normalizeWhatsAppRows(values: string[][]): string[][] {
  const pivot = pivotWhatsAppSheet(values);
  return pivot.length > 0 ? pivot : values;
}

