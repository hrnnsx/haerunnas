import { fract } from "./utils.js";

/** How a painted cell is rendered (picks the glyph set / colour treatment). */
export const KIND = { PLAIN: 0, DARK: 1, SPOT: 2, IRIDESCENT: 3, BODY: 9 };

function setInk(ink, r, g, b, kind = KIND.PLAIN) {
  ink.r = r;
  ink.g = g;
  ink.b = b;
  ink.kind = kind;
}

/**
 * Species. Wing lobes are polar shapes:
 *   from/to  – angular sweep (radians), reach – max radius (fraction of span)
 *   peak     – where along the sweep the radius is largest (0..1)
 *   round    – roundness exponent, scallop – edge scalloping amount
 * `paint(point, ink)` colours a sample point:
 *   point.part: 0 fore, 1 hind, 2 tail | point.t: 0..1 along lobe | point.r: 0..1 centre->edge
 */
export const SPECIES = {
  morpho: {
    fore: { from: -0.3, to: 1, reach: 0.56, peak: 0.55, round: 0.5, scallop: 0 },
    hind: { from: -1.45, to: 0.15, reach: 0.44, peak: 0.48, round: 0.42, scallop: 0.04 },
    body: [30, 30, 42],
    flapHz: 2.6,
    cruise: 90,
    glide: 0.35,
    flutter: 1.3,
    paint(p, ink) {
      if (p.r > 0.86) {
        // Dark wing border, with white dashes on the forewing
        const dash = p.part === 0 && p.r < 0.95 && Math.abs(fract(p.t * 5) - 0.5) < 0.14;
        return dash ? setInk(ink, 236, 240, 255, KIND.SPOT) : setInk(ink, 22, 28, 62, KIND.DARK);
      }
      if (p.r < 0.08) return setInk(ink, 26, 44, 110, KIND.DARK);
      if (p.part === 0 && p.t > 0.9) return setInk(ink, 30, 50, 120, KIND.DARK);
      // Iridescent blue interior
      setInk(ink, 50 + 70 * p.r, 135 + 60 * p.r, 255, KIND.IRIDESCENT);
    },
  },
};

export const DEFAULT_TUNING = {
  density: 1.05,
  corner: false,      // fly corner to corner instead of using `direction`
  direction: 49,      // degrees
  speed: 1.05,
  sway: 0,
  spread: 0,
  size: 1.25,
  farthest: 0.18,     // depth of the farthest butterflies
  farBias: 1.7,
  flutter: 0,
  glide: 2.75,
  flapRate: 1,
  grip: 5,            // how strongly they hold course
  separation: 700,
  hue: 0,
  shimmer: 0.3,
  sparkle: 0.12,
  fog: 0.75,          // distance fade
  trail: 1.55,
  trailFade: 0.15,
  grid: 1.05,
  detail: 1.3,        // ASCII resolution

  white: 0,           // 0 = original colours, 1 = white butterflies
  opacity: 1,         // butterflies only (needs the transparent shader)
  intro: 8,           // seconds to ramp up to the full crowd (0 = start full)
};

export const DEFAULT_GLASS = {
  blur: 3.5,
  refraction: 40,
  ripple: 0.007,
  tint: 0.15,
  radius: 28,
  width: 610,
};