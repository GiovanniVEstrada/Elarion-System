import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../context/AuthContext";
import client from "../api/client";

const FOCUS_AREAS = [
  { id: "Work",          emoji: "💼", label: "Work"          },
  { id: "Health",        emoji: "🏃", label: "Health"        },
  { id: "Creativity",    emoji: "🎨", label: "Creativity"    },
  { id: "Relationships", emoji: "🤝", label: "Relationships" },
  { id: "Learning",      emoji: "📚", label: "Learning"      },
  { id: "Mindfulness",   emoji: "🧘", label: "Mindfulness"   },
];

const MOOD_OPTIONS = [
  { value: "great",   emoji: "😊", label: "Great"   },
  { value: "good",    emoji: "🙂", label: "Good"    },
  { value: "neutral", emoji: "😐", label: "Neutral" },
  { value: "bad",     emoji: "😕", label: "Bad"     },
  { value: "awful",   emoji: "😔", label: "Awful"   },
];

const HABIT_MAP = {
  Work:          ["Plan tomorrow (5 min)", "Deep work block (1 hr)"],
  Health:        ["Morning walk", "Stay hydrated", "Sleep by 10pm"],
  Creativity:    ["Write for 10 minutes", "Sketch or doodle"],
  Relationships: ["Reach out to someone", "Write one gratitude"],
  Learning:      ["Read for 20 minutes", "Review one thing learned"],
  Mindfulness:   ["Morning meditation (5 min)", "Evening check-in"],
};
const DEFAULT_HABITS = ["Morning journal", "Daily walk", "Read before bed"];

function getSuggestions(areas) {
  if (!areas.length) return DEFAULT_HABITS;
  const seen = new Set();
  const out = [];
  for (const area of areas) {
    for (const h of (HABIT_MAP[area] ?? [])) {
      if (!seen.has(h)) { seen.add(h); out.push(h); }
    }
  }
  return out.slice(0, 6);
}

const STEPS = 3;

const variants = {
  enter:  { opacity: 0, x: 40 },
  center: { opacity: 1, x: 0  },
  exit:   { opacity: 0, x: -40 },
};

export default function Onboarding() {
  const { user, patchMe } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [focusAreas, setFocusAreas]     = useState(user?.focusAreas ?? []);
  const [baselineMood, setBaselineMood] = useState(user?.baselineMood ?? null);
  const [selectedHabits, setSelectedHabits] = useState([]);
  const [customHabit, setCustomHabit]   = useState("");
  const [saving, setSaving]             = useState(false);

  const suggestions = getSuggestions(focusAreas);

  function toggleFocus(id) {
    setFocusAreas((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : prev.length < 3 ? [...prev, id] : prev
    );
  }

  function toggleHabit(name) {
    setSelectedHabits((prev) =>
      prev.includes(name) ? prev.filter((h) => h !== name) : [...prev, name]
    );
  }

  function addCustomHabit() {
    const trimmed = customHabit.trim();
    if (trimmed && !selectedHabits.includes(trimmed)) {
      setSelectedHabits((prev) => [...prev, trimmed]);
      setCustomHabit("");
    }
  }

  async function finish(skip = false) {
    setSaving(true);
    try {
      await patchMe({
        focusAreas,
        baselineMood: baselineMood ?? undefined,
        onboardingComplete: true,
      });

      if (!skip && selectedHabits.length > 0) {
        await Promise.allSettled(
          selectedHabits.map((habitName) =>
            client.post("/habits", { name: habitName, frequency: "daily" })
          )
        );
      }
    } catch {
      // silent — onboarding failure shouldn't block the user
    } finally {
      setSaving(false);
      navigate("/");
    }
  }

  const stepContent = [
    // Step 0: Focus areas
    <motion.div key="step-0" className="onboarding-step" variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.28, ease: "easeOut" }}>
      <div className="onboarding-step-icon">🎯</div>
      <h2 className="onboarding-step-title">What do you want to align?</h2>
      <p className="onboarding-step-sub">Pick up to 3 areas. You can change these anytime.</p>
      <div className="onboarding-chips">
        {FOCUS_AREAS.map(({ id, emoji, label }) => (
          <button
            key={id}
            type="button"
            className={`onboarding-chip${focusAreas.includes(id) ? " onboarding-chip--active" : ""}${focusAreas.length >= 3 && !focusAreas.includes(id) ? " onboarding-chip--disabled" : ""}`}
            onClick={() => toggleFocus(id)}
          >
            <span className="onboarding-chip-emoji">{emoji}</span>
            {label}
          </button>
        ))}
      </div>
      <div className="onboarding-nav">
        <button type="button" className="onboarding-btn-ghost" onClick={() => finish(true)}>
          Skip all
        </button>
        <button type="button" className="onboarding-btn-primary" onClick={() => setStep(1)}>
          Next →
        </button>
      </div>
    </motion.div>,

    // Step 1: Baseline mood
    <motion.div key="step-1" className="onboarding-step" variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.28, ease: "easeOut" }}>
      <div className="onboarding-step-icon">🌤</div>
      <h2 className="onboarding-step-title">How have you been feeling lately?</h2>
      <p className="onboarding-step-sub">This sets your starting point — not a judgment.</p>
      <div className="onboarding-mood-row">
        {MOOD_OPTIONS.map(({ value, emoji, label }) => (
          <button
            key={value}
            type="button"
            className={`onboarding-mood-btn${baselineMood === value ? " onboarding-mood-btn--active" : ""}`}
            onClick={() => setBaselineMood(baselineMood === value ? null : value)}
            title={label}
          >
            <span className="onboarding-mood-emoji">{emoji}</span>
            <span className="onboarding-mood-label">{label}</span>
          </button>
        ))}
      </div>
      <div className="onboarding-nav">
        <button type="button" className="onboarding-btn-ghost" onClick={() => setStep(2)}>
          Skip
        </button>
        <button type="button" className="onboarding-btn-primary" onClick={() => setStep(2)}>
          Next →
        </button>
      </div>
    </motion.div>,

    // Step 2: First habits
    <motion.div key="step-2" className="onboarding-step" variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.28, ease: "easeOut" }}>
      <div className="onboarding-step-icon">🔁</div>
      <h2 className="onboarding-step-title">Start with one or two habits</h2>
      <p className="onboarding-step-sub">Tap to select. You can add more later.</p>
      <div className="onboarding-chips">
        {suggestions.map((name) => (
          <button
            key={name}
            type="button"
            className={`onboarding-chip${selectedHabits.includes(name) ? " onboarding-chip--active" : ""}`}
            onClick={() => toggleHabit(name)}
          >
            {name}
          </button>
        ))}
      </div>
      <div className="onboarding-custom-row">
        <input
          className="onboarding-custom-input"
          type="text"
          placeholder="Or add your own…"
          value={customHabit}
          onChange={(e) => setCustomHabit(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addCustomHabit()}
        />
        {customHabit.trim() && (
          <button type="button" className="onboarding-custom-add" onClick={addCustomHabit}>
            Add
          </button>
        )}
      </div>
      {selectedHabits.length > 0 && (
        <div className="onboarding-selected">
          {selectedHabits.map((h) => (
            <span key={h} className="onboarding-selected-pill">
              {h}
              <button
                type="button"
                className="onboarding-selected-remove"
                onClick={() => toggleHabit(h)}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="onboarding-nav">
        <button type="button" className="onboarding-btn-ghost" onClick={() => finish(true)}>
          Skip
        </button>
        <button
          type="button"
          className="onboarding-btn-primary"
          onClick={() => finish(false)}
          disabled={saving}
        >
          {saving ? "Setting up…" : "Let's go →"}
        </button>
      </div>
    </motion.div>,
  ];

  return (
    <div className="onboarding-shell">
      <div className="onboarding-card">
        {/* Brand */}
        <div className="onboarding-brand">Elarion</div>

        {/* Progress dots */}
        <div className="onboarding-dots">
          {Array.from({ length: STEPS }).map((_, i) => (
            <div
              key={i}
              className={`onboarding-dot${i === step ? " onboarding-dot--active" : i < step ? " onboarding-dot--done" : ""}`}
            />
          ))}
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait">
          {stepContent[step]}
        </AnimatePresence>
      </div>
    </div>
  );
}
