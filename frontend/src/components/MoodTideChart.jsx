import { useMemo, useState } from "react";
import { motion } from "motion/react";

const WIDTH = 620;
const HEIGHT = 220;
const PAD_X = 28;
const PAD_TOP = 26;
const PAD_BOTTOM = 38;

function scaleY(value) {
  const chartH = HEIGHT - PAD_TOP - PAD_BOTTOM;
  return PAD_TOP + (10 - value) / 9 * chartH;
}

function buildSmoothPath(points) {
  if (points.length < 2) return "";
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const current = points[i];
    const next = points[i + 1];
    const midX = (current.x + next.x) / 2;
    d += ` C ${midX} ${current.y}, ${midX} ${next.y}, ${next.x} ${next.y}`;
  }
  return d;
}

export default function MoodTideChart({ weekData }) {
  const [activeIndex, setActiveIndex] = useState(null);

  const { points, linePath, areaPath } = useMemo(() => {
    const step = (WIDTH - PAD_X * 2) / 6;
    const mapped = weekData.map((item, index) => ({
      ...item,
      index,
      x: PAD_X + index * step,
      y: item.value == null ? null : scaleY(item.value),
    }));
    const valid = mapped.filter((item) => item.value != null);
    const path = buildSmoothPath(valid);
    const area = valid.length >= 2
      ? `${path} L ${valid[valid.length - 1].x} ${HEIGHT - PAD_BOTTOM} L ${valid[0].x} ${HEIGHT - PAD_BOTTOM} Z`
      : "";
    return { points: mapped, linePath: path, areaPath: area };
  }, [weekData]);

  if (points.filter((point) => point.value != null).length < 2) {
    return (
      <div className="tide-chart-empty">
        <p className="tide-chart-empty-title">The tide hasn't moved yet.</p>
        <p className="tide-chart-empty-sub">Log your mood to see patterns surface.</p>
      </div>
    );
  }

  return (
    <svg
      className="tide-chart-svg"
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label="Mood tide chart for this week"
      preserveAspectRatio="none"
    >
      <defs>
        <filter id="tide-chart-dot-glow" x="-150%" y="-150%" width="400%" height="400%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <path className="tide-chart-area" d={areaPath} />
      <path className="tide-chart-line" d={linePath} />

      {points.map((point) => (
        point.value == null ? null : (
          <motion.circle
            key={point.index}
            className="tide-chart-dot"
            cx={point.x}
            cy={point.y}
            r={activeIndex === point.index ? 8 : 6}
            onPointerEnter={() => setActiveIndex(point.index)}
            onPointerLeave={() => setActiveIndex(null)}
            animate={{ opacity: activeIndex == null || activeIndex === point.index ? 1 : 0.58 }}
            transition={{ duration: 0.18 }}
          />
        )
      ))}

      {points.map((point) => (
        <text
          key={point.day}
          className="tide-chart-label"
          x={point.x}
          y={HEIGHT - 9}
          textAnchor="middle"
        >
          {point.day}
        </text>
      ))}
    </svg>
  );
}
