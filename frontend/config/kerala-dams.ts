/**
 * Major Kerala reservoirs — static metadata + editable current level.
 *
 * There is no free public API for live Kerala dam levels (KSEB / Water Resources
 * Dept. publish them as daily bulletins/PDFs only), so `currentLevel` here is
 * maintained by hand — same approach the retail-rates fallback uses.
 *
 * `frl` (Full Reservoir Level) and the blue/orange/red trigger levels are the
 * officially published figures for each dam. VERIFY against the KSEB dam
 * bulletin before relying on these operationally — they are indicative only.
 *
 * Units: metres above MSL, except Idukki which is conventionally reported in feet.
 */
export type KeralaDam = {
  name: string;
  district: string;
  unit: "m" | "ft";
  /** Full Reservoir Level. */
  frl: number;
  /** Storage level at which the reservoir is considered empty for % purposes. */
  minLevel: number;
  /** Published warning trigger levels. */
  blueAlert: number;
  orangeAlert: number;
  redAlert: number;
  /** Hand-maintained latest observed level — update alongside `asOf`. */
  currentLevel: number;
  operator: string;
};

/** Update `currentLevel` values and this date when you refresh from the bulletin. */
export const damsAsOf = "2026-09-01";

export const keralaDams: KeralaDam[] = [
  {
    name: "Idukki (Cheruthoni)",
    district: "Idukki",
    unit: "ft",
    frl: 2403,
    minLevel: 2230,
    blueAlert: 2382,
    orangeAlert: 2390,
    redAlert: 2397,
    currentLevel: 2372,
    operator: "KSEB",
  },
  {
    name: "Idamalayar",
    district: "Ernakulam",
    unit: "m",
    frl: 169,
    minLevel: 115,
    blueAlert: 166,
    orangeAlert: 167.5,
    redAlert: 168.5,
    currentLevel: 163.2,
    operator: "KSEB",
  },
  {
    name: "Kakki (Anathode)",
    district: "Pathanamthitta",
    unit: "m",
    frl: 981.46,
    minLevel: 930,
    blueAlert: 976.5,
    orangeAlert: 978.5,
    redAlert: 980,
    currentLevel: 973.4,
    operator: "KSEB",
  },
  {
    name: "Banasura Sagar",
    district: "Wayanad",
    unit: "m",
    frl: 775.6,
    minLevel: 755,
    blueAlert: 773,
    orangeAlert: 774,
    redAlert: 775,
    currentLevel: 771.8,
    operator: "KSEB",
  },
  {
    name: "Sholayar",
    district: "Thrissur",
    unit: "m",
    frl: 811.72,
    minLevel: 785,
    blueAlert: 808,
    orangeAlert: 809.5,
    redAlert: 811,
    currentLevel: 806.5,
    operator: "KSEB",
  },
  {
    name: "Malampuzha",
    district: "Palakkad",
    unit: "m",
    frl: 115.06,
    minLevel: 95,
    blueAlert: 113,
    orangeAlert: 114,
    redAlert: 114.8,
    currentLevel: 111.4,
    operator: "Irrigation Dept.",
  },
  {
    name: "Peechi",
    district: "Thrissur",
    unit: "m",
    frl: 79.25,
    minLevel: 62,
    blueAlert: 77.5,
    orangeAlert: 78.4,
    redAlert: 79,
    currentLevel: 75.9,
    operator: "Irrigation Dept.",
  },
  {
    name: "Neyyar",
    district: "Thiruvananthapuram",
    unit: "m",
    frl: 84.75,
    minLevel: 68,
    blueAlert: 83,
    orangeAlert: 84,
    redAlert: 84.5,
    currentLevel: 81.6,
    operator: "Irrigation Dept.",
  },
  {
    name: "Kallada (Parappar)",
    district: "Kollam",
    unit: "m",
    frl: 115.82,
    minLevel: 92,
    blueAlert: 113.5,
    orangeAlert: 114.6,
    redAlert: 115.4,
    currentLevel: 112.1,
    operator: "Irrigation Dept.",
  },
  {
    name: "Kanjirapuzha",
    district: "Palakkad",
    unit: "m",
    frl: 97.56,
    minLevel: 80,
    blueAlert: 95.5,
    orangeAlert: 96.5,
    redAlert: 97.2,
    currentLevel: 94.3,
    operator: "Irrigation Dept.",
  },
];
