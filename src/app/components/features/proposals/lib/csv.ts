// src/app/components/features/proposals/lib/csv.ts
export function toCsvRow(values: (string | number | null | undefined)[]): string {
  const escaped = values.map((v) => {
    const s = v == null ? "" : String(v);
    // scape quotes and wrap when needed
    const needsWrap = /[",\n]/.test(s);
    const q = s.replace(/"/g, '""');
    return needsWrap ? `"${q}"` : q;
  });
  return escaped.join(",");
}

export function buildCsv(
  headers: string[],
  rows: Array<(string | number | null | undefined)[]>
): string {
  const lines = [toCsvRow(headers), ...rows.map(toCsvRow)];
  return lines.join("\n");
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(url);
  a.remove();
}
