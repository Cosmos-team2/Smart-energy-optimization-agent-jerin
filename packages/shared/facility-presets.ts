export interface LocationPreset {
  name: string;
  address: string;
  lat: number;
  lon: number;
  discom: string;
  facilityId: string;
}

export const PRESETS: LocationPreset[] = [
  {
    name: "Bengaluru Tech Park – Phase 2",
    address: "Plot 42, Electronic City Phase 1, Bengaluru, KA 560100",
    lat: 12.8452,
    lon: 77.6602,
    discom: "BESCOM HT-2a Industrial",
    facilityId: "f_001",
  },
  {
    name: "Whitefield Industrial Campus",
    address: "EPIP Zone, Whitefield, Bengaluru, KA 560066",
    lat: 12.9863,
    lon: 77.7376,
    discom: "BESCOM HT-2b Industrial",
    facilityId: "f_002",
  },
  {
    name: "Peenya Heavy Engineering Hub",
    address: "Peenya Industrial Area Stage 2, Bengaluru, KA 560058",
    lat: 13.0285,
    lon: 77.5197,
    discom: "BESCOM HT-1 Heavy Industrial",
    facilityId: "f_003",
  },
  {
    name: "Cybercity Tech Campus",
    address: "HITEC City Phase 2, Madhapur, Hyderabad, TG 500081",
    lat: 17.4474,
    lon: 78.3762,
    discom: "TSSPDCL HT-2 Commercial",
    facilityId: "f_004",
  },
  {
    name: "MIDC Manufacturing Zone",
    address: "Bhosari Industrial Estate, MIDC, Pune, MH 411026",
    lat: 18.6298,
    lon: 73.7997,
    discom: "MSEDCL HT-1 Industrial",
    facilityId: "f_005",
  },
];

export function getPresetById(facilityId?: string | null): LocationPreset {
  if (!facilityId) return PRESETS[0];
  return PRESETS.find((p) => p.facilityId === facilityId) || PRESETS[0];
}
