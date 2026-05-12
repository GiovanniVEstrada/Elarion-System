// Maps journal mood numeric (1-5) to positive state labels
export const MOOD_LABELS = {
  1: "Restless",
  2: "Tender",
  3: "Still",
  4: "Flowing",
  5: "Rising",
};

// Maps mood string enum to state labels
export const MOOD_STRING_LABELS = {
  awful:   "Restless",
  bad:     "Tender",
  neutral: "Still",
  good:    "Flowing",
  great:   "Rising",
};

// Short descriptor shown beside the numeric score
export const MOOD_SCORE_LABELS = {
  1: "Low tide",
  2: "Drifting",
  3: "Still",
  4: "Flowing",
  5: "Rising",
};

export function getMoodLabel(mood) {
  if (typeof mood === "number") return MOOD_LABELS[mood] || "Still";
  return MOOD_STRING_LABELS[mood] || "Still";
}

export function getMoodScoreLabel(mood) {
  if (typeof mood === "number") return MOOD_SCORE_LABELS[mood] || "Still";
  const numeric = getMoodNumeric(mood);
  return MOOD_SCORE_LABELS[numeric] || "Still";
}

export function getMoodNumeric(moodString) {
  const map = { awful: 1, bad: 2, neutral: 3, good: 4, great: 5 };
  return map[moodString] ?? 3;
}
