import { describe, it, expect } from "vitest";
import { generateWorkout } from "./workoutEngine";

describe("generateWorkout", () => {
  const defaults = { duration: 60, pace: "1:30", unit: "meters", seed: 42 };

  it("returns a workout object with required fields", () => {
    const w = generateWorkout(defaults);
    expect(w).toHaveProperty("name");
    expect(w).toHaveProperty("totalDistance");
    expect(w).toHaveProperty("estimatedMinutes");
    expect(w).toHaveProperty("sections");
    expect(w).toHaveProperty("pace", "1:30");
    expect(w).toHaveProperty("unit", "meters");
    expect(w).toHaveProperty("duration", 60);
  });

  it("always has Warmup, Main Set, and Cooldown sections", () => {
    const w = generateWorkout(defaults);
    const names = w.sections.map((s) => s.name);
    expect(names).toContain("Warmup");
    expect(names).toContain("Main Set");
    expect(names).toContain("Cooldown");
  });

  it("produces consistent output for the same seed", () => {
    const a = generateWorkout({ ...defaults, seed: 123 });
    const b = generateWorkout({ ...defaults, seed: 123 });
    expect(a.totalDistance).toBe(b.totalDistance);
    expect(a.name).toBe(b.name);
    expect(a.sections.length).toBe(b.sections.length);
  });

  it("produces different output for different seeds", () => {
    const a = generateWorkout({ ...defaults, seed: 1 });
    const b = generateWorkout({ ...defaults, seed: 999 });
    // At least one property should differ (name or distance)
    const differs = a.name !== b.name || a.totalDistance !== b.totalDistance;
    expect(differs).toBe(true);
  });

  it("scales distance with duration", () => {
    const short = generateWorkout({ ...defaults, duration: 30 });
    const long = generateWorkout({ ...defaults, duration: 120 });
    expect(long.totalDistance).toBeGreaterThan(short.totalDistance);
  });

  it("all section distances are positive", () => {
    const w = generateWorkout(defaults);
    for (const section of w.sections) {
      expect(section.distance).toBeGreaterThan(0);
    }
  });

  it("total distance equals sum of section distances", () => {
    const w = generateWorkout(defaults);
    const sum = w.sections.reduce((acc, s) => acc + s.distance, 0);
    expect(w.totalDistance).toBe(sum);
  });

  it("works with yards unit", () => {
    const w = generateWorkout({ ...defaults, unit: "yards", pace: "1:15" });
    expect(w.unit).toBe("yards");
    expect(w.totalDistance).toBeGreaterThan(0);
  });

  it("warmup distance is capped at 1000", () => {
    const w = generateWorkout({ ...defaults, duration: 120 });
    const warmup = w.sections.find((s) => s.name === "Warmup");
    expect(warmup.distance).toBeLessThanOrEqual(1000);
  });

  it("estimated minutes is reasonable for the duration", () => {
    for (const duration of [30, 60, 90, 120]) {
      const w = generateWorkout({ ...defaults, duration });
      // Should be within 50% of target duration
      expect(w.estimatedMinutes).toBeGreaterThan(duration * 0.4);
      expect(w.estimatedMinutes).toBeLessThan(duration * 1.6);
    }
  });

  it("all items have positive reps and distance", () => {
    const w = generateWorkout(defaults);
    for (const section of w.sections) {
      for (const item of section.items) {
        expect(item.reps).toBeGreaterThan(0);
        expect(item.distance).toBeGreaterThan(0);
      }
    }
  });

  it("interval display is formatted as m:ss when present", () => {
    const w = generateWorkout(defaults);
    for (const section of w.sections) {
      for (const item of section.items) {
        if (item.intervalDisplay) {
          expect(item.intervalDisplay).toMatch(/^\d+:\d{2}$/);
        }
      }
    }
  });
});
