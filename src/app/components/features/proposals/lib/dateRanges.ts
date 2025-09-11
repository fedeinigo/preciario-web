// src/app/components/features/proposals/lib/dateRanges.ts

function toYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function lastDayOfMonth(year: number, monthIndex0: number): Date {
  return new Date(year, monthIndex0 + 1, 0);
}

export function currentMonthRange(): { from: string; to: string } {
  const now = new Date();
  const y = now.getFullYear();
  const m0 = now.getMonth();
  const from = new Date(y, m0, 1);
  const to = lastDayOfMonth(y, m0);
  return { from: toYMD(from), to: toYMD(to) };
}

export function prevMonthRange(): { from: string; to: string } {
  const now = new Date();
  const y = now.getFullYear();
  const m0 = now.getMonth();
  const prev = new Date(y, m0 - 1, 1);
  const from = new Date(prev.getFullYear(), prev.getMonth(), 1);
  const to = lastDayOfMonth(prev.getFullYear(), prev.getMonth());
  return { from: toYMD(from), to: toYMD(to) };
}

function quarterBounds(year: number, q: 1 | 2 | 3 | 4): { from: Date; to: Date } {
  const startMonth = (q - 1) * 3;
  const from = new Date(year, startMonth, 1);
  const to = lastDayOfMonth(year, startMonth + 2);
  return { from, to };
}

export function currentQuarterRange(): { from: string; to: string } {
  const now = new Date();
  const q = (Math.floor(now.getMonth() / 3) + 1) as 1 | 2 | 3 | 4;
  const { from, to } = quarterBounds(now.getFullYear(), q);
  return { from: toYMD(from), to: toYMD(to) };
}

export function q1Range(year: number): { from: string; to: string } {
  const { from, to } = quarterBounds(year, 1);
  return { from: toYMD(from), to: toYMD(to) };
}
export function q2Range(year: number): { from: string; to: string } {
  const { from, to } = quarterBounds(year, 2);
  return { from: toYMD(from), to: toYMD(to) };
}
export function q3Range(year: number): { from: string; to: string } {
  const { from, to } = quarterBounds(year, 3);
  return { from: toYMD(from), to: toYMD(to) };
}
export function q4Range(year: number): { from: string; to: string } {
  const { from, to } = quarterBounds(year, 4);
  return { from: toYMD(from), to: toYMD(to) };
}

export function currentWeekRange(): { from: string; to: string } {
  const now = new Date();
  const dow = (now.getDay() + 6) % 7; // 0 = lunes
  const monday = new Date(now);
  monday.setDate(now.getDate() - dow);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { from: toYMD(monday), to: toYMD(sunday) };
}

export function prevWeekRange(): { from: string; to: string } {
  const { from } = currentWeekRange();
  const monday = new Date(from);
  monday.setDate(monday.getDate() - 7);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { from: toYMD(monday), to: toYMD(sunday) };
}
