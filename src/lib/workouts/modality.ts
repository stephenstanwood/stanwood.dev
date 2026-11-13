/**
 * What kind of workout a class is, for color-coding. The colors on the page are bumper-plate
 * colors (red, blue, green, yellow) plus court and pool, so a row reads before its name does.
 */

export type Modality = "strength" | "pilates" | "yoga" | "cardio" | "court" | "swim" | "other";

export const MODALITY_LABELS: Record<Modality, string> = {
  strength: "Strength",
  pilates: "Pilates and barre",
  yoga: "Yoga and recovery",
  cardio: "Cardio and dance",
  court: "Court",
  swim: "Swim",
  other: "Other",
};

const RULES: [Modality, RegExp][] = [
  ["swim", /\b(swim|aqua|water)/i],
  ["court", /\b(pickleball|tennis|padel|paddle|racquet)/i],
  ["pilates", /\b(pilates|reformer|barre|powerhouse|lagree)/i],
  ["yoga", /\b(yoga|vinyasa|yin|restorative|stretch|meditation|recovery|mobility|tai chi|postural|breath)/i],
  [
    "strength",
    /\b(strength|strong|hiit|boxing|barbell|wod|sculpt|core|burner|body shop|bootcamp|circuit|trx|kettlebell|power|lift|conditioning|training)/i,
  ],
  ["cardio", /\b(dance|zumba|mixxed|cycle|spin|cardio|step|sweat|kickbox|rhythm)/i],
];

export function modalityOf(title: string, category = ""): Modality {
  if (/aquatic/i.test(category)) return "swim";
  if (/pickleball|tennis/i.test(category)) return "court";
  for (const [modality, pattern] of RULES) {
    if (pattern.test(title)) return modality;
  }
  return "other";
}
