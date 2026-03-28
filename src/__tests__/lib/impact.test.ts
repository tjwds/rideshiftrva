import { describe, it, expect } from "vitest";
import { calculateImpact, calculateModeBreakdown } from "@/lib/impact";

describe("calculateImpact", () => {
  it("returns all zeros for empty array", () => {
    expect(calculateImpact([])).toEqual({
      tripsAvoided: 0,
      milesSaved: 0,
      co2SavedLbs: 0,
    });
  });

  it('returns all zeros when all responses are "no"', () => {
    const result = calculateImpact([
      { response: "no", goalSnapshot: [{ mode: "bike", daysPerWeek: 3 }] },
    ]);
    expect(result).toEqual({
      tripsAvoided: 0,
      milesSaved: 0,
      co2SavedLbs: 0,
    });
  });

  it("returns all zeros when all responses are null", () => {
    const result = calculateImpact([
      { response: null, goalSnapshot: [{ mode: "bike", daysPerWeek: 3 }] },
    ]);
    expect(result).toEqual({
      tripsAvoided: 0,
      milesSaved: 0,
      co2SavedLbs: 0,
    });
  });

  it("bike trips fully displace car miles (1.0 / 1.0)", () => {
    const result = calculateImpact([
      { response: "yes", goalSnapshot: [{ mode: "bike", daysPerWeek: 3 }] },
    ]);
    expect(result.tripsAvoided).toBe(3);
    expect(result.milesSaved).toBe(36); // 3 * 12 * 1.0
    expect(result.co2SavedLbs).toBe(32); // 36 * 0.89 * 1.0 = 32.04 → 32
  });

  it("bus trips use reduced factors (0.7 / 0.6)", () => {
    const result = calculateImpact([
      { response: "yes", goalSnapshot: [{ mode: "bus", daysPerWeek: 5 }] },
    ]);
    expect(result.tripsAvoided).toBe(5);
    expect(result.milesSaved).toBe(42); // 5 * 12 * 0.7
    expect(result.co2SavedLbs).toBe(22.4); // 42 * 0.89 * 0.6 = 22.428 → 22.4
  });

  it("walk trips use shorter distance (0.5 / 1.0)", () => {
    const result = calculateImpact([
      { response: "yes", goalSnapshot: [{ mode: "walk", daysPerWeek: 4 }] },
    ]);
    expect(result.tripsAvoided).toBe(4);
    expect(result.milesSaved).toBe(24); // 4 * 12 * 0.5
    expect(result.co2SavedLbs).toBe(21.4); // 24 * 0.89 * 1.0 = 21.36 → 21.4
  });

  it("carpool trips split CO2 savings (1.0 / 0.5)", () => {
    const result = calculateImpact([
      { response: "yes", goalSnapshot: [{ mode: "carpool", daysPerWeek: 2 }] },
    ]);
    expect(result.tripsAvoided).toBe(2);
    expect(result.milesSaved).toBe(24); // 2 * 12 * 1.0
    expect(result.co2SavedLbs).toBe(10.7); // 24 * 0.89 * 0.5 = 10.68 → 10.7
  });

  it("scooter trips use slightly reduced factors (0.8 / 0.95)", () => {
    const result = calculateImpact([
      { response: "yes", goalSnapshot: [{ mode: "scooter", daysPerWeek: 3 }] },
    ]);
    expect(result.tripsAvoided).toBe(3);
    expect(result.milesSaved).toBe(28.8); // 3 * 12 * 0.8
    expect(result.co2SavedLbs).toBe(24.4); // 28.8 * 0.89 * 0.95 = 24.3504 → 24.4
  });

  it("goals without mode fall back to full displacement", () => {
    const result = calculateImpact([
      { response: "yes", goalSnapshot: [{ daysPerWeek: 3 }] },
    ]);
    expect(result.tripsAvoided).toBe(3);
    expect(result.milesSaved).toBe(36);
    expect(result.co2SavedLbs).toBe(32);
  });

  it('multiple "yes" check-ins with different modes accumulate correctly', () => {
    const result = calculateImpact([
      { response: "yes", goalSnapshot: [{ mode: "bike", daysPerWeek: 3 }] },
      { response: "yes", goalSnapshot: [{ mode: "bus", daysPerWeek: 2 }] },
    ]);
    expect(result.tripsAvoided).toBe(5);
    // bike: 3*12*1.0 = 36, bus: 2*12*0.7 = 16.8 → total 52.8
    expect(result.milesSaved).toBe(52.8);
  });

  it('mixed responses: only counts "yes" check-ins', () => {
    const result = calculateImpact([
      { response: "yes", goalSnapshot: [{ mode: "bike", daysPerWeek: 3 }] },
      { response: "no", goalSnapshot: [{ mode: "bus", daysPerWeek: 5 }] },
      { response: "yes", goalSnapshot: [{ mode: "walk", daysPerWeek: 2 }] },
    ]);
    expect(result.tripsAvoided).toBe(5);
  });

  it("multi-mode goal in single check-in", () => {
    const result = calculateImpact([
      {
        response: "yes",
        goalSnapshot: [
          { mode: "bike", daysPerWeek: 2 },
          { mode: "bus", daysPerWeek: 3 },
        ],
      },
    ]);
    expect(result.tripsAvoided).toBe(5);
    // bike: 2*12*1.0=24, bus: 3*12*0.7=25.2 → 49.2
    expect(result.milesSaved).toBe(49.2);
  });
});

describe("calculateModeBreakdown", () => {
  it("returns empty object for empty array", () => {
    expect(calculateModeBreakdown([])).toEqual({});
  });

  it("counts trips by mode for confirmed check-ins", () => {
    const result = calculateModeBreakdown([
      { response: "yes", goalSnapshot: [{ mode: "bike", daysPerWeek: 3 }, { mode: "bus", daysPerWeek: 2 }] },
      { response: "yes", goalSnapshot: [{ mode: "bike", daysPerWeek: 1 }] },
    ]);
    expect(result).toEqual({ bike: 4, bus: 2 });
  });

  it("ignores non-yes responses", () => {
    const result = calculateModeBreakdown([
      { response: "yes", goalSnapshot: [{ mode: "bike", daysPerWeek: 3 }] },
      { response: "no", goalSnapshot: [{ mode: "bus", daysPerWeek: 5 }] },
      { response: null, goalSnapshot: [{ mode: "walk", daysPerWeek: 2 }] },
    ]);
    expect(result).toEqual({ bike: 3 });
  });

  it("handles goals without mode as unknown", () => {
    const result = calculateModeBreakdown([
      { response: "yes", goalSnapshot: [{ daysPerWeek: 3 }] },
    ]);
    expect(result).toEqual({ unknown: 3 });
  });
});
