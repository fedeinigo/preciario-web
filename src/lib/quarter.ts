// src/lib/quarter.ts
export function getQuarterFromDate(d: Date): 1 | 2 | 3 | 4 {
  const m = d.getMonth(); // 0..11
  if (m <= 2) return 1;
  if (m <= 5) return 2;
  if (m <= 8) return 3;
  return 4;
}

export function quarterRange(year: number, q: 1 | 2 | 3 | 4) {
  const startMonth = (q - 1) * 3; // 0,3,6,9
  const from = new Date(Date.UTC(year, startMonth, 1, 0, 0, 0));
  const to = new Date(Date.UTC(year, startMonth + 3, 0, 23, 59, 59));
  return { from, to };
}
