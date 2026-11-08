import { describe, expect, it } from "vitest";
import { generateWorkout } from "../lib/workoutEngine";
import { workoutToText } from "./SwimWorkout";

describe("grouped workout instructions", () => {
  const workout = generateWorkout({ duration: 60, pace: "1:45", unit: "meters", seed: 176 });
  const main = workout.sections.find((section) => section.name === "Main Set")!;
  const group = main.items[0];

  it("reproduces the reported 1500 m main set without guessing the round count", () => {
    expect(workout.name).toBe("Race Pace");
    expect(workout.totalDistance).toBe(2300);
    expect(main.distance).toBe(1500);
    expect(group.reps).toBe(15);
    expect(group.items!.map((item) => item.distance)).toEqual([50, 50]);
    expect(group.reps * group.items!.reduce((sum, item) => sum + item.reps * item.distance, 0)).toBe(main.distance);
  });

  it("keeps the round instruction before both indented steps in copied text", () => {
    const text = workoutToText(workout);
    expect(text).toContain("Main Set (1500m)");
    expect(text).toContain("  15x through:\n    50m  Free — race pace  @ 0:55\n    50m  Free — easy  @ 1:05");
    expect(text).toContain("2× 100m  IM — 25 each stroke");
  });
});
