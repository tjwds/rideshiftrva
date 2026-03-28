const AVG_COMMUTE_MILES = 12;
const CO2_LBS_PER_MILE = 0.89;

const MODE_FACTORS: Record<string, { milesMultiplier: number; co2Multiplier: number }> = {
  bike:    { milesMultiplier: 1.0, co2Multiplier: 1.0 },
  walk:    { milesMultiplier: 0.5, co2Multiplier: 1.0 },
  scooter: { milesMultiplier: 0.8, co2Multiplier: 0.95 },
  bus:     { milesMultiplier: 0.7, co2Multiplier: 0.6 },
  carpool: { milesMultiplier: 1.0, co2Multiplier: 0.5 },
};

const DEFAULT_FACTOR = { milesMultiplier: 1.0, co2Multiplier: 1.0 };

interface CheckInForImpact {
  response: string | null;
  goalSnapshot: Array<{ mode?: string; daysPerWeek: number }>;
}

export function calculateImpact(checkIns: CheckInForImpact[]) {
  let tripsAvoided = 0;
  let milesSaved = 0;
  let co2SavedLbs = 0;
  for (const ci of checkIns) {
    if (ci.response !== "yes") continue;
    for (const g of ci.goalSnapshot) {
      const factor = (g.mode && MODE_FACTORS[g.mode]) || DEFAULT_FACTOR;
      tripsAvoided += g.daysPerWeek;
      milesSaved += g.daysPerWeek * AVG_COMMUTE_MILES * factor.milesMultiplier;
      co2SavedLbs += g.daysPerWeek * AVG_COMMUTE_MILES * factor.milesMultiplier * CO2_LBS_PER_MILE * factor.co2Multiplier;
    }
  }
  milesSaved = Math.round(milesSaved * 10) / 10;
  co2SavedLbs = Math.round(co2SavedLbs * 10) / 10;
  return { tripsAvoided, milesSaved, co2SavedLbs };
}

export function calculateModeBreakdown(checkIns: CheckInForImpact[]): Record<string, number> {
  const breakdown: Record<string, number> = {};
  for (const ci of checkIns) {
    if (ci.response !== "yes") continue;
    for (const g of ci.goalSnapshot) {
      const mode = g.mode || "unknown";
      breakdown[mode] = (breakdown[mode] || 0) + g.daysPerWeek;
    }
  }
  return breakdown;
}
