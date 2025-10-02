// src/app/api/proposals/create/helpers.ts

export type LineItem = {
  name: string;
  quantity: number;
  unitPrice: number;
  devHours: number;
};

export type CreateDocPayload = {
  companyName: string;
  country: string;
  subsidiary: string;
  items: LineItem[];
  totals: {
    monthly: number;
    oneShot: number;
    hours: number;
  };
};

export type BuildReplaceRequestsArgs = {
  body: CreateDocPayload;
  conditionsText: string;
  whatsappRows: string[][];
  hourlyRate: number;
  currentDate?: Date;
};

function formatUSD(n: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

function formatFechaDia(d = new Date()) {
  const meses = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ] as const;
  const dia = String(d.getDate()).padStart(2, "0");
  const mes = meses[d.getMonth()];
  const anio = d.getFullYear();
  return `${dia} de ${mes} de ${anio}`;
}

export function resolveHourlyRate(env: Record<string, string | undefined>): number {
  const hourlyRateEnv = Number(env.PROPOSALS_ONESHOT_RATE ?? env.ONESHOT_RATE ?? 50);
  return Number.isFinite(hourlyRateEnv) && hourlyRateEnv > 0 ? hourlyRateEnv : 50;
}

export function buildReplaceRequests({
  body,
  conditionsText,
  whatsappRows,
  hourlyRate,
  currentDate,
}: BuildReplaceRequestsArgs): Array<Record<string, unknown>> {
  const fechaDia = formatFechaDia(currentDate);

  const requests: Array<Record<string, unknown>> = [
    { replaceAllText: { containsText: { text: "<-cliente->", matchCase: false }, replaceText: body.companyName } },
    { replaceAllText: { containsText: { text: "<-fecha_dia->", matchCase: false }, replaceText: fechaDia } },
    { replaceAllText: { containsText: { text: "<-condiciones->", matchCase: false }, replaceText: conditionsText } },
    { replaceAllText: { containsText: { text: "<-horas->", matchCase: false }, replaceText: String(body.totals.hours) } },
    { replaceAllText: { containsText: { text: "<-valor_hora->", matchCase: false }, replaceText: `US$ ${hourlyRate}` } },
    {
      replaceAllText: {
        containsText: { text: "<-total_horas->", matchCase: false },
        replaceText: formatUSD(body.totals.oneShot),
      },
    },
    {
      replaceAllText: {
        containsText: { text: "<-total-oneshot->", matchCase: false },
        replaceText: formatUSD(body.totals.oneShot),
      },
    },
    {
      replaceAllText: {
        containsText: { text: "<-totalmensual->", matchCase: false },
        replaceText: formatUSD(body.totals.monthly),
      },
    },
  ];

  body.items.forEach((it, idx) => {
    const n = idx + 1;
    requests.push(
      { replaceAllText: { containsText: { text: `<item${n}>`, matchCase: false }, replaceText: it.name } },
      { replaceAllText: { containsText: { text: `<cantidad${n}>`, matchCase: false }, replaceText: String(it.quantity) } },
      { replaceAllText: { containsText: { text: `<precio${n}>`, matchCase: false }, replaceText: formatUSD(it.unitPrice) } },
      {
        replaceAllText: {
          containsText: { text: `<total${n}>`, matchCase: false },
          replaceText: formatUSD(it.unitPrice * it.quantity),
        },
      },
    );
  });

  whatsappRows.forEach((row, rIdx) => {
    const rowNum = rIdx + 1;
    for (let c = 0; c < 5; c++) {
      const value = row[c] ?? "";
      requests.push({
        replaceAllText: {
          containsText: { text: `<w${rowNum}c${c + 1}>`, matchCase: false },
          replaceText: value,
        },
      });
    }
  });

  return requests;
}
