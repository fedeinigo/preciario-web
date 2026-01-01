export type PipedriveDealSummary = {
  id: number;
  title: string;
  value: number | null;
  stageId: number | null;
  stageName: string | null;
  ownerId: number | null;
  ownerName: string | null;
  ownerEmail: string | null;
  status: string | null;
  createdAt: string | null;
  wonAt: string | null;
  lostAt: string | null;
  wonQuarter: number | null;
  mapacheAssigned: string | null;
  feeMensual: number | null;
  proposalUrl: string | null;
  docContextDeal: string | null;
  techSaleScopeUrl: string | null;
  dealUrl: string;
  dealType: string | null;
  country: string | null;
  origin: string | null;
  salesCycleDays: number | null;
};

export const DEAL_TYPES = {
  NEW_CUSTOMER: "13",
  UPSELLING: "14",
} as const;

export const PROPOSAL_STAGES = [4, 64, 30];

export const COUNTRY_OPTIONS: Record<string, string> = {
  "265": "Argentina",
  "574": "Brasil",
  "274": "Bolivia",
  "575": "Canadá",
  "268": "Chile",
  "267": "Colombia",
  "600": "Costa Rica",
  "272": "España",
  "273": "Ecuador",
  "601": "El Salvador",
  "602": "Guatemala",
  "603": "Honduras",
  "266": "Peru",
  "269": "Mexico",
  "594": "Nicaragua",
  "275": "Otros",
  "271": "Paraguay",
  "391": "Panama",
  "563": "República Dominicana",
  "270": "Uruguay",
  "604": "Venezuela",
};

export const ORIGEN_OPTIONS: Record<string, string> = {
  "375": "Directo",
  "15": "Directo Inbound",
  "230": "Directo Outbound",
  "741": "Netlife",
  "16": "Telefonica ARG",
  "18": "Telefónica CO",
  "40": "Telefónica PE",
  "171": "Telefonica Chile",
  "368": "Telefonica UY",
  "239": "Telefonica España - TTech",
  "664": "Telefonica España - Acens",
  "762": "Nods",
  "17": "Apex",
  "37": "Ricoh",
  "577": "Solu",
  "578": "Teleperformance",
  "586": "Link Solution",
  "605": "Atento",
  "610": "E3",
  "616": "Telefónica México",
  "617": "Telefónica Ecuador",
  "618": "Agata",
  "619": "Outsourcing",
  "626": "Jelou",
  "628": "Teknio",
  "638": "Lop",
  "649": "Konecta",
  "651": "Pontech",
  "750": "Vtex Colombia",
  "748": "Santex",
  "655": "Tatt",
  "656": "Orsonia",
  "763": "Tecnicom",
  "657": "Idata",
  "666": "Nexa BPO",
  "678": "Intellecta",
  "172": "Agencia COMLatam",
  "718": "AMG Consulting",
  "751": "Vtex - Otros",
  "758": "Patagonia - Franco Roccuzo",
  "759": "Avansa",
  "761": "WoowUp",
  "765": "Mak21",
  "772": "Solvis",
  "773": "Integratel",
  "740": "Govtech - Luciano",
};
