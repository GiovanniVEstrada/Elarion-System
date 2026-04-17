// Time-of-day palette stops. Each stop defines the orb glow colors and sky
// gradient that complement the corresponding background image for that hour.
// Hours 0 and 24 are identical so the cycle wraps seamlessly through midnight.

const TIME_STOPS = [
  {
    hour: 0,
    orbA: [116, 216, 255],  // aqua — image 1 (midnight)
    orbB: [181, 140, 255],  // lavender
    sky: ['#030b14', '#0a2030', '#0a2130'],
  },
  {
    hour: 1,
    orbA: [180, 150, 210],  // dusty lavender — image 2 (deep night)
    orbB: [220, 110, 150],  // rose pink
    sky: ['#0d0818', '#1a1030', '#180e28'],
  },
  {
    hour: 4,
    orbA: [210, 150, 170],  // muted rose — image 3 (dawn)
    orbB: [230, 160, 110],  // warm peach
    sky: ['#160a10', '#281520', '#221018'],
  },
  {
    hour: 7,
    orbA: [230, 185, 110],  // golden sand — image 4 (morning)
    orbB: [240, 150, 90],   // soft orange
    sky: ['#100a04', '#221408', '#1c1006'],
  },
  {
    hour: 11,
    orbA: [240, 165, 70],   // bright amber — image 5 (midday)
    orbB: [250, 120, 60],   // burnt orange
    sky: ['#0e0904', '#201406', '#1a1004'],
  },
  {
    hour: 14,
    orbA: [240, 100, 70],   // orange-red — image 6 (sunset)
    orbB: [210, 50, 60],    // deep crimson
    sky: ['#120504', '#260a08', '#1e0806'],
  },
  {
    hour: 18,
    orbA: [190, 80, 140],   // muted magenta — image 7 (evening)
    orbB: [160, 70, 200],   // deep violet
    sky: ['#0e0510', '#1e0a22', '#180818'],
  },
  {
    hour: 21,
    orbA: [120, 100, 210],  // soft indigo — image 8 (late night)
    orbB: [150, 110, 240],  // deep violet
    sky: ['#080618', '#101230', '#0e1028'],
  },
  {
    hour: 24,
    orbA: [116, 216, 255],  // back to midnight — wrap-around
    orbB: [181, 140, 255],
    sky: ['#030b14', '#0a2030', '#0a2130'],
  },
];

// Peak hours for each of the 8 images (index 0 = bg-1-midnight)
const IMAGE_PEAKS = [0, 2, 5.5, 9, 12.5, 16, 19.5, 22];
const TRANSITION_RADIUS = 1.5;

function lerp(a, b, t) {
  return Math.round(a + (b - a) * t);
}

function hexToRgb(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}

function lerpHex(hexA, hexB, t) {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  return rgbToHex(lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t));
}

function getFractionalHour() {
  const now = new Date();
  return now.getHours() + now.getMinutes() / 60;
}

function findBracket(hour) {
  for (let i = 0; i < TIME_STOPS.length - 1; i++) {
    const a = TIME_STOPS[i];
    const b = TIME_STOPS[i + 1];
    if (hour >= a.hour && hour < b.hour) {
      const t = (hour - a.hour) / (b.hour - a.hour);
      return { stopA: a, stopB: b, t };
    }
  }
  // Fallback to midnight
  return { stopA: TIME_STOPS[0], stopB: TIME_STOPS[1], t: 0 };
}

// Returns CSS variable name → value map for orb colors and sky gradient
export function getTimeThemeVars() {
  const hour = getFractionalHour();
  const { stopA, stopB, t } = findBracket(hour);

  const orbA = stopA.orbA.map((ch, i) => lerp(ch, stopB.orbA[i], t));
  const orbB = stopA.orbB.map((ch, i) => lerp(ch, stopB.orbB[i], t));
  const sky = stopA.sky.map((hex, i) => lerpHex(hex, stopB.sky[i], t));

  return {
    '--orb-a-rgb': orbA.join(', '),
    '--orb-b-rgb': orbB.join(', '),
    '--sky-0':   sky[0],
    '--sky-48':  sky[1],
    '--sky-100': sky[2],
  };
}

// Returns opacity values for each of the 8 background image layers.
// At any moment at most 2 images are non-zero (fading out / fading in).
export function getImageOpacities() {
  const hour = getFractionalHour();

  return IMAGE_PEAKS.map(peak => {
    // Handle midnight wrap for image 1 (peak at hour 0/24)
    let diff = Math.abs(hour - peak);
    // Check wrap-around distance through midnight
    const wrapDiff = 24 - diff;
    diff = Math.min(diff, wrapDiff);

    if (diff >= TRANSITION_RADIUS) return 0;
    // Ramp: 1 at peak, 0 at ±TRANSITION_RADIUS
    return parseFloat((1 - diff / TRANSITION_RADIUS).toFixed(3));
  });
}
