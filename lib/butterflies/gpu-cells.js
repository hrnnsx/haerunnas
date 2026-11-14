import {
  Renderer, RAMP_CHARS, DARK_CHARS, SPOT_CHARS, BODY_CHARS, EDGE_CHARS_STRONG, EDGE_CHARS_WEAK,
  SPARKLE_COLORS, CELL_WING, CELL_EDGE, CELL_BODY, CELL_ANTENNA,
} from "./renderer.js";
import { KIND } from "./config.js";
import { clamp, hash3 } from "./utils.js";

/** Every glyph the shader can draw; the atlas holds them in one row. */
export const GLYPHS = [...new Set(RAMP_CHARS + DARK_CHARS + SPOT_CHARS + BODY_CHARS + EDGE_CHARS_STRONG + EDGE_CHARS_WEAK + "-\\|/o")].join("");
const GLYPH_INDEX = new Map([...GLYPHS].map((c, i) => [c, i]));
const SPARKLE_RGB = SPARKLE_COLORS.map((h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)));

export const VERTEX_SHADER = /* glsl */ `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

/**
 * One full-screen pass. Per pixel: find the grid cell, then layer
 * grid line -> trail dot -> solid cell fill -> glyph (sampled from the atlas).
 */
export const FRAGMENT_SHADER = /* glsl */ `
precision highp float;
uniform vec2 uRes;        // canvas size, device px
uniform vec2 uGrid;       // cols, rows
uniform vec2 uCell;       // cell size, device px
uniform float uDpr;
uniform float uTime;
uniform float uGlyphCount;
uniform vec3 uBg;
uniform vec4 uGridCol;    // rgb, alpha
uniform vec4 uTrail;      // rgb, max alpha
uniform float uDot;       // trail dot size, device px
uniform sampler2D uBgTex;     // rgb fill colour, a = solid?
uniform sampler2D uGlyphTex;  // rgb glyph colour, a = atlas index + 1
uniform sampler2D uTrailTex;  // r = trail energy / 1.6
uniform sampler2D uAtlas;     // white glyphs, alpha only
uniform float uWhite;
uniform float uOpacity;

float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

vec4 acc; // premultiplied output colour

void over(vec3 c, float a) {
  acc.rgb = c * a + acc.rgb * (1.0 - a);
  acc.a = a + acc.a * (1.0 - a);
}

vec3 whiten(vec3 c) {
  float l = dot(c, vec3(0.3, 0.59, 0.11));
  return mix(c, vec3(min(1.0, l * 1.6)), uWhite);
}

void main() {
  acc = vec4(0.0);
  vec2 p = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  vec2 cell = floor(p / uCell);
  vec2 local = p - cell * uCell;
  vec2 tuv = (cell + 0.5) / uGrid;

  if (local.x < uDpr || local.y < uDpr) over(uGridCol.rgb, uGridCol.a);

  float e = texture2D(uTrailTex, tuv).r * 1.6;
  if (e >= 0.12) {
    float flicker = 0.75 + 0.25 * sin(uTime * 5.0 + hash(cell) * 40.0);
    float level = clamp(floor(e * flicker * 24.0) - 1.0, 0.0, 5.0);
    float size = e > 0.6 ? uDot + uDpr : uDot;
    vec2 d = abs(local - vec2(uCell.x * 0.5, uCell.y * 0.6));
    if (max(d.x, d.y) <= size * 0.5) over(whiten(uTrail.rgb), uTrail.a * (level + 1.0) / 6.0);
  }

  vec4 fill = texture2D(uBgTex, tuv);
  if (fill.a > 0.5 && local.x >= uDpr && local.y >= uDpr) over(whiten(fill.rgb), uOpacity);

  vec4 g = texture2D(uGlyphTex, tuv);
  float idx = floor(g.a * 255.0 + 0.5) - 1.0;
  if (idx >= 0.0) {
    float m = texture2D(uAtlas, vec2((idx + local.x / uCell.x) / uGlyphCount, local.y / uCell.y)).a;
    over(whiten(g.rgb), m * uOpacity);
  }
  gl_FragColor = acc;
}
`;

/**
 * Base class for GPU renderers. It reuses the Canvas2D renderer's CPU side
 * (butterfly sampling, trail field, cell buffers) and only replaces drawing.
 * Subclasses implement: onResize(), uploadAtlas(), present(time, uniforms).
 */
export class CellGPURenderer extends Renderer {
  atlas = document.createElement("canvas");
  atlasDirty = true;
  gridDirty = true;
  dBg = new Uint8Array(0);
  dGlyph = new Uint8Array(0);
  dTrail = new Uint8Array(0);

  constructor(canvas, tuning) {
    super(canvas, tuning, { context: false });
    // Web fonts arrive late; rebuild the glyph atlas when they do.
    document.fonts?.addEventListener?.("loadingdone", () => (this.atlasDirty = true));
  }

  paintBackground() {} // the shader draws the background and grid

  setFontFamily(family) {
    super.setFontFamily(family);
    this.atlasDirty = true;
  }

  resize(width, height, dpr) {
    super.resize(width, height, dpr);
    const n = this.cols * this.rows * 4;
    if (this.dBg.length !== n) {
      this.dBg = new Uint8Array(n);
      this.dGlyph = new Uint8Array(n);
      this.dTrail = new Uint8Array(n);
      this.gridDirty = true;
    }
    this.atlasDirty = true;
    this.onResize();
  }

  render(world, dt) {
    if (this.cols === 0) return;
    this.consumeEvents(world);
    this.depositTrail(world);
    this.diffuse(dt);
    this.rasterize(world.butterflies, world.time);
    if (this.atlasDirty) {
      this.buildAtlas();
      this.atlasDirty = false;
      this.uploadAtlas();
    }
    this.buildCells(world.time);
    this.present(world.time, this.uniformValues(world.time));
  }

  buildAtlas() {
    const { atlas, cw, ch, dpr } = this;
    const cellW = Math.max(1, Math.round(cw * dpr));
    const cellH = Math.max(1, Math.round(ch * dpr));
    atlas.width = cellW * GLYPHS.length;
    atlas.height = cellH;
    const ctx = atlas.getContext("2d");
    ctx.clearRect(0, 0, atlas.width, atlas.height);
    ctx.font = `600 ${Math.round(ch * 0.74 * dpr)}px ${this.fontFamily}`;
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (let i = 0; i < GLYPHS.length; i++) ctx.fillText(GLYPHS[i], i * cellW + cellW / 2, cellH / 2 + dpr);
  }

  uniformValues(time) {
    const { palette, tuning, canvas, cw, ch, dpr, cols, rows } = this;
    const [tr, tg, tb] = this.rotateHue(...palette.trail);
    const [gr, gg, gb, ga] = palette.grid;
    return {
      uRes: [canvas.width, canvas.height],
      uGrid: [cols, rows],
      uCell: [cw * dpr, ch * dpr],
      uDpr: dpr,
      uTime: time,
      uGlyphCount: GLYPHS.length,
      uBg: palette.background.map((v) => v / 255),
      uGridCol: [gr / 255, gg / 255, gb / 255, ga * tuning.grid],
      uTrail: [tr / 255, tg / 255, tb / 255, palette.trailAlpha],
      uDot: Math.max(2, Math.round(cw * 0.19)) * dpr,
      uWhite: tuning.white ?? 0,
      uOpacity: tuning.opacity ?? 1,
    };
  }

  /** Turn the rasterized cell buffers into three RGBA byte textures. */
  buildCells(time) {
    const { cellFlag, cellKind, cellColor, cellAux, cellKey, energy, dBg, dGlyph, dTrail } = this;
    const sparkle = this.tuning.sparkle;
    dBg.fill(0);
    dGlyph.fill(0);
    dTrail.fill(0);

    const glyph = (o, ch, r, g, b) => {
      dGlyph[o] = clamp(Math.round(r), 0, 255);
      dGlyph[o + 1] = clamp(Math.round(g), 0, 255);
      dGlyph[o + 2] = clamp(Math.round(b), 0, 255);
      dGlyph[o + 3] = (GLYPH_INDEX.get(ch) ?? 0) + 1;
    };

    for (let i = 0; i < cellFlag.length; i++) {
      const flag = cellFlag[i];
      const o = i * 4;
      const e = energy[i];
      if (e >= 0.12 && flag !== CELL_WING && flag !== CELL_BODY) dTrail[o] = Math.min(255, Math.round((e / 1.6) * 255));
      if (!flag) continue;

      const packed = cellColor[i];
      const r = packed >>> 16;
      const g = (packed >>> 8) & 255;
      const b = packed & 255;
      const key = cellKey[i];

      if (flag === CELL_ANTENNA) {
        glyph(o, String.fromCharCode(cellAux[i]), r, g, b);
        continue;
      }
      if (flag === CELL_EDGE) {
        const coverage = cellAux[i];
        const chars = coverage >= 0.5 ? EDGE_CHARS_STRONG : EDGE_CHARS_WEAK;
        const c = this.fade(r, g, b, 0.55 - 0.45 * coverage);
        glyph(o, chars[(key >>> 8) % chars.length], c >>> 16, (c >>> 8) & 255, c & 255);
        continue;
      }

      // Solid cell
      dBg[o] = r;
      dBg[o + 1] = g;
      dBg[o + 2] = b;
      dBg[o + 3] = 255;

      const kind = cellKind[i];
      const roll = hash3(key, Math.floor(time * 2.4 + (key % 997) / 97), 7);
      let ch, gr, gg, gb;
      if (flag === CELL_BODY) {
        ch = BODY_CHARS[(key >>> 8) % BODY_CHARS.length];
        [gr, gg, gb] = [r * 1.6 + 44, g * 1.6 + 40, b * 1.6 + 36];
      } else if (kind === KIND.DARK) {
        ch = DARK_CHARS[(key >>> 8) % DARK_CHARS.length];
        [gr, gg, gb] = [r * 1.7 + 34, g * 1.7 + 30, b * 1.7 + 30];
      } else if (kind === KIND.SPOT) {
        ch = SPOT_CHARS[(key >>> 8) % SPOT_CHARS.length];
        [gr, gg, gb] = [r * 0.4, g * 0.4, b * 0.4];
      } else {
        const lum = (0.3 * r + 0.59 * g + 0.11 * b) / 255;
        const jitter = ((key >>> 4) % 3) - 1;
        ch = RAMP_CHARS[clamp(Math.floor((1 - lum) * 7.99) + jitter, 0, RAMP_CHARS.length - 1)];
        [gr, gg, gb] = [r * 0.42, g * 0.42, b * 0.42];
      }
      if (flag === CELL_WING && roll < (kind === KIND.IRIDESCENT ? sparkle : sparkle / 3)) {
        [gr, gg, gb] = SPARKLE_RGB[key % SPARKLE_RGB.length];
      }
      glyph(o, ch, gr, gg, gb);
    }
  }
}
