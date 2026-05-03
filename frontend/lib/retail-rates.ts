export type RetailRatesPayload = {
  asOf: string;
  regionLabel: string;
  petrolInrPerLitre: number;
  dieselInrPerLitre: number;
  lpgInrPerCylinder: number;
  gold22Carat: {
    inrPerGram: number;
    pavanGrams: number;
    inrPerPavan: number;
  };
  disclaimer: string;
};

export function isRetailRatesPayload(x: unknown): x is RetailRatesPayload {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  const g = o.gold22Carat;
  if (!g || typeof g !== "object") return false;
  const gg = g as Record<string, unknown>;
  return (
    typeof o.asOf === "string" &&
    typeof o.regionLabel === "string" &&
    typeof o.petrolInrPerLitre === "number" &&
    typeof o.dieselInrPerLitre === "number" &&
    typeof o.lpgInrPerCylinder === "number" &&
    typeof gg.inrPerGram === "number" &&
    typeof gg.pavanGrams === "number" &&
    typeof gg.inrPerPavan === "number" &&
    typeof o.disclaimer === "string"
  );
}
