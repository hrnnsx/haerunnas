import { KIND } from "./config.js";
import { clamp, hash3, hueMatrix, rgb } from "./utils.js";

// ── Palettes ────────────────────────────────────────────────────────
const PALETTES = {
  light: {
    background: [246, 243, 236],
    grid: [30, 34, 60, 0.07],
    trail: [70, 118, 226],
    trailAlpha: 0.7,
    antenna: [42, 42, 59],
  },
  dark: {
    background: [6, 7, 12],
    grid: [255, 255, 255, 0.055],
    trail: [96, 156, 255],
    trailAlpha: 0.85,
    antenna: [150, 160, 200],
  },
};

// ── Glyph sets ──────────────────────────────────────────────────────
const RAMP_CHARS = ".:;+=*%#";       // light -> dark, for plain wing cells
const DARK_CHARS = "#%@";            // dark wing borders
const SPOT_CHARS = "o*";             // white spots
const BODY_CHARS = "8#@";
const EDGE_CHARS_STRONG = ":;";      // partially covered cells (>= 50%)
const EDGE_CHARS_WEAK = ".',`";      // partially covered cells (< 50%)
const SPARKLE_COLORS = ["#ffffff", "#e4f6ff", "#c8f4ff"];

// ── Cell flags (what occupies a grid cell) ──────────────────────────
const CELL_EMPTY = 0;
const CELL_WING = 1;
const CELL_EDGE = 2;     // partially covered, drawn as a faint glyph
const CELL_BODY = 3;
const CELL_ANTENNA = 4;

const TRAIL_LEVELS = 6;

// Extra sample points inside a cell (fractions of cell w/h) for anti-aliasing
const SUBSAMPLES = [0.25, 0.3, 0.75, 0.3, 0.25, 0.72, 0.75, 0.72];

// Where the fore/hind wings attach along the body axis (fraction of span)
const FORE_OFFSET = 0.06;
const HIND_OFFSET = -0.02;

/** Half-width of the body at position u along the body axis (0 = outside). */
function bodyHalfWidth(u) {
  if (u > 0.17 || u < -0.32) return 0;
  if (u > 0.11) return Math.sqrt(Math.max(0, 0.03 * 0.03 - (u - 0.14) ** 2)); // head
  if (u > -0.04) return 0.034;                                                  // thorax
  return 0.03 * (1 - 0.6 * ((-0.04 - u) / 0.28));                               // abdomen
}

/** Radius of a wing lobe at the given polar angle. */
function lobeRadius(lobe, angle, t = (angle - lobe.from) / (lobe.to - lobe.from)) {
  if (t <= 0 || t >= 1) return 0;
  const s = t < lobe.peak ? (t / lobe.peak) * 0.5 : 0.5 + ((t - lobe.peak) / (1 - lobe.peak)) * 0.5;
  const r = lobe.reach * Math.pow(Math.sin(Math.PI * s), lobe.round);
  return lobe.scallop ? r * (1 - lobe.scallop * (0.5 + 0.5 * Math.cos(t * Math.PI * 14))) : r;
}

function drawGrid(ctx, width, height, cw, ch, dpr, color) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i <= Math.ceil(width / cw); i++) {
    const x = Math.round(i * cw * dpr) + 0.5;
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height * dpr);
  }
  for (let j = 0; j <= Math.ceil(height / ch); j++) {
    const y = Math.round(j * ch * dpr) + 0.5;
    ctx.moveTo(0, y);
    ctx.lineTo(width * dpr, y);
  }
  ctx.stroke();
}

export class Renderer {
  dpr = 1;
  width = 0;
  height = 0;
  cw = 12; // cell width
  ch = 18; // cell height
  cols = 0;
  rows = 0;
  fontFamily = "ui-monospace, Menlo, monospace";

  // Per-cell buffers (size cols*rows)
  energy = new Float32Array(0);    // trail intensity
  energyTmp = new Float32Array(0);
  cellFlag = new Uint8Array(0);
  cellKind = new Uint8Array(0);
  cellColor = new Uint32Array(0);  // packed 0xRRGGBB
  cellAux = new Float32Array(0);   // coverage (edge) or char code (antenna)
  cellKey = new Uint32Array(0);    // stable per-cell random

  palette = PALETTES.light;
  hue = hueMatrix(0);
  trailStyles = [];

  // Scratch state while rasterizing the current butterfly
  current = null;
  cos = 1;
  sin = 0;
  open = 1;
  point = { part: 0, t: 0, r: 0, u: 0 };
  ink = { r: 0, g: 0, b: 0, kind: 0 };
  hitU = 0;
  hitV = 0;

  constructor(canvas, tuning, { context = true } = {}) {
    this.canvas = canvas;
    this.tuning = tuning;
    if (context) {
      const ctx = canvas.getContext("2d", { alpha: false });
      if (!ctx) throw new Error("2D canvas unavailable");
      this.ctx = ctx;
    }
    this.bg = document.createElement("canvas"); // cached background + grid
    this.setTheme("light");
  }

  setFontFamily(family) {
    if (family) this.fontFamily = family;
  }

  setTheme(name) {
    this.palette = PALETTES[name];
    this.restyle();
  }

  /** Rebuild anything derived from palette / hue / grid tuning. */
  restyle() {
    const { palette, tuning } = this;
    this.hue = hueMatrix(tuning.hue);
    const [r, g, b] = this.rotateHue(...palette.trail);
    this.trailStyles = [];
    for (let i = 0; i < TRAIL_LEVELS; i++) {
      const alpha = (palette.trailAlpha * (i + 1)) / TRAIL_LEVELS;
      this.trailStyles.push(`rgba(${r},${g},${b},${alpha.toFixed(3)})`);
    }
    this.paintBackground();
  }

  rotateHue(r, g, b) {
    const m = this.hue;
    return [
      clamp(Math.round(m[0] * r + m[1] * g + m[2] * b), 0, 255),
      clamp(Math.round(m[3] * r + m[4] * g + m[5] * b), 0, 255),
      clamp(Math.round(m[6] * r + m[7] * g + m[8] * b), 0, 255),
    ];
  }

  /** Blend a colour toward the background; returns packed 0xRRGGBB. */
  fade(r, g, b, amount) {
    const [br, bg, bb] = this.palette.background;
    return (
      (clamp(Math.round(r + (br - r) * amount), 0, 255) << 16) |
      (clamp(Math.round(g + (bg - g) * amount), 0, 255) << 8) |
      clamp(Math.round(b + (bb - b) * amount), 0, 255)
    );
  }

  resize(width, height, dpr) {
    const prevCols = this.cols;
    const prevRows = this.rows;
    this.width = width;
    this.height = height;
    this.dpr = dpr;
    this.cw = clamp(Math.round(width / 124 / this.tuning.detail), 5, 24);
    this.ch = Math.round(this.cw * 1.45);
    this.cols = Math.ceil(width / this.cw);
    this.rows = Math.ceil(height / this.ch);

    this.canvas.width = Math.round(width * dpr);
    this.canvas.height = Math.round(height * dpr);
    this.bg.width = this.canvas.width;
    this.bg.height = this.canvas.height;

    if (this.cols !== prevCols || this.rows !== prevRows) {
      const n = this.cols * this.rows;
      this.energy = new Float32Array(n);
      this.energyTmp = new Float32Array(n);
      this.cellFlag = new Uint8Array(n);
      this.cellKind = new Uint8Array(n);
      this.cellColor = new Uint32Array(n);
      this.cellAux = new Float32Array(n);
      this.cellKey = new Uint32Array(n);
    }
    this.paintBackground();
  }

  paintBackground() {
    const ctx = this.bg.getContext("2d");
    if (!ctx) return;
    const { width, height, dpr, cw, ch, palette, tuning } = this;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = rgb(...palette.background);
    ctx.fillRect(0, 0, width, height);
    const [r, g, b, a] = palette.grid;
    drawGrid(ctx, width, height, cw, ch, dpr, `rgba(${r},${g},${b},${(a * tuning.grid).toFixed(3)})`);
  }

  // ── Frame ─────────────────────────────────────────────────────────

  render(world, dt) {
    const { ctx, dpr, cols, ch } = this;
    if (cols === 0) return;
    const time = world.time;

    this.consumeEvents(world);
    this.depositTrail(world);
    this.diffuse(dt);
    this.rasterize(world.butterflies, time);

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(this.bg, 0, 0);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.drawTrail(time);
    ctx.font = `600 ${Math.round(ch * 0.74)}px ${this.fontFamily}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    this.drawButterflies(time);
  }

  /** Grid index for a pixel position, or -1 if off-screen. */
  cellIndex(x, y) {
    const cx = Math.floor(x / this.cw);
    const cy = Math.floor(y / this.ch);
    return cx < 0 || cy < 0 || cx >= this.cols || cy >= this.rows ? -1 : cy * this.cols + cx;
  }

  // ── Trail energy field ────────────────────────────────────────────

  /** Add a soft round blob of energy to the field. */
  stamp(field, x, y, radius, amount) {
    const cx = Math.floor(x / this.cw);
    const cy = Math.floor(y / this.ch);
    for (let j = cy - radius; j <= cy + radius; j++) {
      for (let i = cx - radius; i <= cx + radius; i++) {
        if (i < 0 || j < 0 || i >= this.cols || j >= this.rows) continue;
        const d = Math.hypot(i - cx, (j - cy) * 1.4);
        if (d > radius + 0.5) continue;
        const idx = j * this.cols + i;
        field[idx] = Math.min(1.6, field[idx] + amount * (1 - d / (radius + 1)));
      }
    }
  }

  consumeEvents(world) {
    for (const e of world.events) this.stamp(this.energy, e.x, e.y, 6, .2);
    world.events.length = 0;
  }

  /** Leave glowing dots at the wing tips. */
  depositTrail(world) {
    const { energy } = this;
    for (const b of world.butterflies) {
      const downstroke = Math.max(0, -Math.sin(b.phase)) * (1 - b.glide);
      const fore = b.species.fore;
      const tipAngle = fore.from + (fore.to - fore.from) * fore.peak;
      const forward = (FORE_OFFSET + Math.sin(tipAngle) * fore.reach * 0.95) * b.span;
      const lateral = Math.cos(tipAngle) * fore.reach * 0.95 * b.open * b.span;
      const c = Math.cos(b.heading);
      const s = Math.sin(b.heading);
      for (const side of [-1, 1]) {
        const idx = this.cellIndex(b.x + forward * c - side * lateral * s, b.y + forward * s + side * lateral * c);
        if (idx >= 0) {
          energy[idx] = Math.min(1.6, energy[idx] + (0.02 + 0.1 * downstroke) * b.depth * this.tuning.trail);
        }
      }
    }
  }

  /** Blur the field slightly and decay it. */
  diffuse(dt) {
    const { cols, rows, energy, energyTmp } = this;
    const decay = Math.exp(-dt * this.tuning.trailFade);
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const i = y * cols + x;
        const left = x > 0 ? energy[i - 1] : energy[i];
        const right = x < cols - 1 ? energy[i + 1] : energy[i];
        const up = y > 0 ? energy[i - cols] : energy[i];
        const down = y < rows - 1 ? energy[i + cols] : energy[i];
        energyTmp[i] = (energy[i] * 4 + left + right + up + down) * 0.125 * decay;
      }
    }
    this.energy = energyTmp;
    this.energyTmp = energy;
  }

  drawTrail(time) {
    const { ctx, cols, cw, ch, energy, cellFlag } = this;
    const dot = Math.max(2, Math.round(cw * 0.19));
    // One pass per alpha level so fillStyle changes only TRAIL_LEVELS times
    for (let level = 0; level < TRAIL_LEVELS; level++) {
      ctx.fillStyle = this.trailStyles[level];
      for (let i = 0; i < energy.length; i++) {
        const e = energy[i];
        if (e < 0.12 || cellFlag[i] === CELL_WING || cellFlag[i] === CELL_BODY) continue;
        const gx = i % cols;
        const gy = (i / cols) | 0;
        const flicker = 0.75 + 0.25 * Math.sin(time * 5 + hash3(gx, gy, 3) * 40);
        if (clamp(Math.floor(e * flicker * 4 * TRAIL_LEVELS) - 1, 0, TRAIL_LEVELS - 1) !== level) continue;
        const size = e > 0.6 ? dot + 1 : dot;
        ctx.fillRect(Math.round(gx * cw + cw * 0.5 - size / 2), Math.round(gy * ch + ch * 0.6 - size / 2), size, size);
      }
    }
  }

  // ── Butterfly shape sampling ──────────────────────────────────────

  /** Is (u, v) inside the wing lobe? Writes point.t / point.r on hit. */
  inLobe(lobe, u, v) {
    const angle = Math.atan2(u, v);
    const t = (angle - lobe.from) / (lobe.to - lobe.from);
    const maxR = lobeRadius(lobe, angle, t);
    const dist = Math.hypot(u, v);
    if (dist > maxR) return false;
    this.point.t = t;
    this.point.r = dist / maxR;
    return true;
  }

  inTail(u, v) {
    const species = this.current.species;
    const tail = species.tail;
    const root = lobeRadius(species.hind, tail.angle) * 0.85;
    const rootU = Math.sin(tail.angle) * root;
    const rootV = Math.cos(tail.angle) * root;
    const dirAngle = tail.angle - 0.25;
    const du = Math.sin(dirAngle) * tail.length;
    const dv = Math.cos(dirAngle) * tail.length;
    const along = clamp(((u - rootU) * du + (v - rootV) * dv) / (du * du + dv * dv), 0, 1);
    const dist = Math.hypot(u - rootU - du * along, v - rootV - dv * along);
    const halfWidth = tail.width * (1 - 0.4 * along + (along > 0.82 ? 0.5 : 0));
    if (dist > halfWidth) return false;
    this.point.t = along;
    this.point.r = 1;
    return true;
  }

  /**
   * Sample the current butterfly at a screen position.
   * Returns CELL_WING / CELL_BODY / CELL_EMPTY and fills `this.ink` with the colour.
   */
  sample(x, y) {
    const b = this.current;
    const span = b.span;
    const dx = x - b.x;
    const dy = y - b.y;
    // Rotate into butterfly space: u along the body, v across it (units of span)
    const u = (dx * this.cos + dy * this.sin) / span;
    const v = (dy * this.cos - dx * this.sin) / span;
    const absV = Math.abs(v);
    this.hitU = u;
    this.hitV = v;

    const halfWidth = bodyHalfWidth(u);
    if (halfWidth > 0 && absV * span <= Math.max(halfWidth * span, this.cw * 0.4)) {
      const [r, g, bl] = b.species.body;
      this.ink.r = r;
      this.ink.g = g;
      this.ink.b = bl;
      this.ink.kind = KIND.BODY;
      return CELL_BODY;
    }

    const vOpen = absV / this.open; // wings fold toward the body as they close
    const sp = b.species;
    const point = this.point;
    point.u = u;
    if (this.inLobe(sp.fore, u - FORE_OFFSET, vOpen)) point.part = 0;
    else if (this.inLobe(sp.hind, u - HIND_OFFSET, vOpen)) point.part = 1;
    else if (sp.tail && this.inTail(u - HIND_OFFSET, vOpen)) point.part = 2;
    else return CELL_EMPTY;

    sp.paint(point, this.ink);
    return CELL_WING;
  }

  /** Fill the per-cell buffers for every butterfly (far -> near). */
  rasterize(butterflies, time) {
    const { cellFlag, cellKind, cellColor, cellAux, cellKey, cw, ch, cols, rows, ink } = this;
    cellFlag.fill(0);
    const hueShifted = this.tuning.hue % 360 !== 0;
    const shimmer = this.tuning.shimmer;

    for (const b of butterflies) {
      this.current = b;
      const span = b.span;
      const angle = b.heading + 0.06 * Math.sin(b.phase);
      this.cos = Math.cos(angle);
      this.sin = Math.sin(angle);
      this.open = Math.max(0.08, b.open);
      const brightness = 0.6 + 0.4 * b.open;
      const fogAmount = (1 - b.depth) * this.tuning.fog;

      // Bounding box in grid cells
      const reach = span * 0.75;
      const x0 = Math.max(0, Math.floor((b.x - reach) / cw));
      const x1 = Math.min(cols - 1, Math.floor((b.x + reach) / cw));
      const y0 = Math.max(0, Math.floor((b.y - reach) / ch));
      const y1 = Math.min(rows - 1, Math.floor((b.y + reach) / ch));

      for (let gy = y0; gy <= y1; gy++) {
        for (let gx = x0; gx <= x1; gx++) {
          const px = gx * cw;
          const py = gy * ch;

          // Centre sample decides the main look
          const centerHit = this.sample(px + cw / 2, py + ch / 2);
          let hits = centerHit ? 1 : 0;
          let r = ink.r, g = ink.g, bl = ink.b;
          let hitType = centerHit;
          const kind = ink.kind;
          const hitU = this.hitU;
          const hitV = this.hitV;

          // Extra samples estimate coverage for anti-aliasing
          for (let k = 0; k < SUBSAMPLES.length; k += 2) {
            if (this.sample(px + SUBSAMPLES[k] * cw, py + SUBSAMPLES[k + 1] * ch)) {
              if (hits === 0) {
                r = ink.r; g = ink.g; bl = ink.b;
                hitType = ink.kind === KIND.BODY ? CELL_BODY : CELL_WING;
              }
              hits++;
            }
          }
          if (hits === 0) continue;

          const coverage = hits / 5;
          const idx = gy * cols + gx;

          if (hitType === CELL_WING && hueShifted) {
            const m = this.hue;
            const nr = m[0] * r + m[1] * g + m[2] * bl;
            const ng = m[3] * r + m[4] * g + m[5] * bl;
            bl = m[6] * r + m[7] * g + m[8] * bl;
            r = nr;
            g = ng;
          }

          // Iridescent shimmer
          let light = brightness;
          if (centerHit === CELL_WING && kind === KIND.IRIDESCENT) {
            light *= 1 - 0.4 * shimmer +
              shimmer * Math.sin(time * 2.2 + hitU * 9 + hitV * 6 + b.open * 3 + b.heading * 2);
          }
          const jitter = 1 + (hash3(gx, gy, Math.floor(time * 6)) - 0.5) * 0.06;
          const color = this.fade(r * light * jitter, g * light * jitter, bl * light * jitter, fogAmount);

          if (centerHit && coverage >= 0.6) {
            cellFlag[idx] = centerHit;
            cellKind[idx] = kind;
          } else {
            if (cellFlag[idx] === CELL_WING || cellFlag[idx] === CELL_BODY) continue; // don't overwrite solid cells
            cellFlag[idx] = CELL_EDGE;
            cellAux[idx] = coverage;
          }
          cellColor[idx] = color;
          cellKey[idx] =
            (hash3(Math.round((hitU * span) / (cw * 0.9)), Math.round((hitV * span) / (cw * 0.9)), b.id) * 4294967295) >>> 0;
        }
      }
      this.rasterizeAntennae(b, time);
    }
  }

  rasterizeAntennae(b, time) {
    const { cellFlag, cellColor, cellAux, cellKey, cw, cos, sin } = this;
    const span = b.span;
    const [ar, ag, ab] = this.palette.antenna;
    const color = this.fade(ar, ag, ab, (1 - b.depth) * this.tuning.fog);

    for (const side of [-1, 1]) {
      const wobble = 0.012 * Math.sin(time * 3 + b.id + side);
      // Base and tip in butterfly space (u along body, v across), then to screen
      const baseU = 0.16, baseV = 0.012 * side;
      const tipU = 0.37 + wobble, tipV = (0.12 + wobble) * side;
      const bx = b.x + (baseU * cos - baseV * sin) * span;
      const by = b.y + (baseU * sin + baseV * cos) * span;
      const tx = b.x + (tipU * cos - tipV * sin) * span;
      const ty = b.y + (tipU * sin + tipV * cos) * span;

      // Pick a line glyph by angle
      let a = Math.atan2(ty - by, tx - bx);
      if (a < 0) a += Math.PI;
      const glyph =
        a < Math.PI / 8 || a >= (7 * Math.PI) / 8 ? "-" :
        a < (3 * Math.PI) / 8 ? "\\" :
        a < (5 * Math.PI) / 8 ? "|" : "/";

      const steps = Math.ceil(Math.hypot(tx - bx, ty - by) / (cw * 0.5));
      let last = -1;
      for (let i = 1; i <= steps; i++) {
        const idx = this.cellIndex(bx + ((tx - bx) * i) / steps, by + ((ty - by) * i) / steps);
        if (idx < 0 || cellFlag[idx] === CELL_WING || cellFlag[idx] === CELL_BODY) continue;
        cellFlag[idx] = CELL_ANTENNA;
        cellColor[idx] = color;
        cellAux[idx] = glyph.charCodeAt(0);
        cellKey[idx] = 0;
        last = idx;
      }
      if (last >= 0 && span > 120) cellAux[last] = 111; // 'o' club on big butterflies
    }
  }

  // ── Drawing the cell buffers ──────────────────────────────────────

  drawButterflies(time) {
    const { ctx, cols, rows, cw, ch, cellFlag, cellKind, cellColor, cellAux, cellKey } = this;
    const sparkle = this.tuning.sparkle;

    for (let i = 0; i < cols * rows; i++) {
      const flag = cellFlag[i];
      if (!flag) continue;

      const x = (i % cols) * cw;
      const y = ((i / cols) | 0) * ch;
      const cx = x + cw / 2;
      const cy = y + ch / 2 + 1;
      const packed = cellColor[i];
      const r = packed >>> 16;
      const g = (packed >>> 8) & 255;
      const b = packed & 255;
      const key = cellKey[i];

      if (flag === CELL_ANTENNA) {
        ctx.fillStyle = rgb(r, g, b);
        ctx.fillText(String.fromCharCode(cellAux[i]), cx, cy);
        continue;
      }

      if (flag === CELL_EDGE) {
        const coverage = cellAux[i];
        const chars = coverage >= 0.5 ? EDGE_CHARS_STRONG : EDGE_CHARS_WEAK;
        const c = this.fade(r, g, b, 0.55 - 0.45 * coverage);
        ctx.fillStyle = rgb(c >>> 16, (c >>> 8) & 255, c & 255);
        ctx.fillText(chars[(key >>> 8) % chars.length], cx, cy);
        continue;
      }

      // Solid cell: background block, then a glyph on top
      ctx.fillStyle = rgb(r, g, b);
      ctx.fillRect(x + 1, y + 1, cw - 1, ch - 1);

      const kind = cellKind[i];
      const sparkleRoll = hash3(key, Math.floor(time * 2.4 + (key % 997) / 97), 7);
      let glyph, glyphColor;

      if (flag === CELL_BODY) {
        glyph = BODY_CHARS[(key >>> 8) % BODY_CHARS.length];
        glyphColor = rgb(r * 1.6 + 44, g * 1.6 + 40, b * 1.6 + 36);
      } else if (kind === KIND.DARK) {
        glyph = DARK_CHARS[(key >>> 8) % DARK_CHARS.length];
        glyphColor = rgb(r * 1.7 + 34, g * 1.7 + 30, b * 1.7 + 30);
      } else if (kind === KIND.SPOT) {
        glyph = SPOT_CHARS[(key >>> 8) % SPOT_CHARS.length];
        glyphColor = rgb(r * 0.4, g * 0.4, b * 0.4);
      } else {
        const luminance = (0.3 * r + 0.59 * g + 0.11 * b) / 255;
        const jitter = ((key >>> 4) % 3) - 1;
        glyph = RAMP_CHARS[clamp(Math.floor((1 - luminance) * 7.99) + jitter, 0, RAMP_CHARS.length - 1)];
        glyphColor = rgb(r * 0.42, g * 0.42, b * 0.42);
      }

      const sparkleChance = kind === KIND.IRIDESCENT ? sparkle : sparkle / 3;
      if (flag === CELL_WING && sparkleRoll < sparkleChance) {
        glyphColor = SPARKLE_COLORS[key % SPARKLE_COLORS.length];
      }
      ctx.fillStyle = glyphColor;
      ctx.fillText(glyph, cx, cy);
    }
  }
}

// Shared with the GPU renderers
export {
  RAMP_CHARS, DARK_CHARS, SPOT_CHARS, BODY_CHARS, EDGE_CHARS_STRONG, EDGE_CHARS_WEAK, SPARKLE_COLORS,
  CELL_WING, CELL_EDGE, CELL_BODY, CELL_ANTENNA,
};
