import { DEFAULT_TUNING } from "./config.js";
import { World } from "./world.js";
import { Renderer } from "./renderer.js";

const FIXED_STEP = 1 / 60;
const MAX_STEPS_PER_FRAME = 4;

export class ButterflyEngine {
  raf = 0;
  last = 0;
  accumulator = 0;
  visible = true;
  disposed = false;

  constructor(canvas, { count, theme = "light", tuning, RendererClass = Renderer } = {}) {
    this.canvas = canvas;
    this.tuning = { ...DEFAULT_TUNING, ...tuning };
    this.world = new World(this.tuning, count);
    this.renderer = new RendererClass(canvas, this.tuning);
    this.renderer.setFontFamily(getComputedStyle(canvas).fontFamily);
    this.renderer.setTheme(theme);

    this.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);
    this.intersectionObserver = new IntersectionObserver(([entry]) => {
      this.visible = entry.isIntersecting;
      this.schedule();
    });
    this.intersectionObserver.observe(canvas);

    this.reducedMotion.addEventListener("change", this.onMotionPreference);
    window.addEventListener("pointerdown", this.onPointerDown, { passive: true });

    this.resize();
    // Redraw the still frame once the font is ready
    document.fonts?.load(`600 16px ${getComputedStyle(canvas).fontFamily}`).then(() => {
      if (!this.disposed && this.reducedMotion.matches) this.drawStill();
    });
    this.schedule();
  }

  destroy() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.resizeObserver.disconnect();
    this.intersectionObserver.disconnect();
    this.reducedMotion.removeEventListener("change", this.onMotionPreference);
    window.removeEventListener("pointerdown", this.onPointerDown);
  }

  /** Change one tuning value live. */
  set(key, value) {
    this.tuning[key] = value;
    if (key === "detail") this.resize();
    else if (key === "hue" || key === "grid") this.renderer.restyle();
    if (this.reducedMotion.matches) this.drawStill();
  }

  setTheme(theme) {
    this.renderer.setTheme(theme);
    if (this.reducedMotion.matches) this.drawStill();
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.renderer.resize(rect.width, rect.height, dpr);
    this.world.resize(rect.width, rect.height);
    if (this.reducedMotion.matches) this.drawStill();
  }

  schedule() {
    cancelAnimationFrame(this.raf);
    if (this.disposed || !this.visible || this.reducedMotion.matches) return;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.frame);
  }

  frame = (now) => {
    const dt = Math.min(0.1, (now - this.last) / 1000);
    this.last = now;
    this.accumulator += dt;

    let steps = 0;
    while (this.accumulator >= FIXED_STEP && steps < MAX_STEPS_PER_FRAME) {
      this.world.step(FIXED_STEP);
      this.accumulator -= FIXED_STEP;
      steps++;
    }
    if (steps === MAX_STEPS_PER_FRAME) this.accumulator = 0;

    this.renderer.render(this.world, dt);
    this.raf = requestAnimationFrame(this.frame);
  };

  onMotionPreference = () => {
    if (this.reducedMotion.matches) {
      cancelAnimationFrame(this.raf);
      this.drawStill();
    } else {
      this.schedule();
    }
  };

  onPointerDown = (e) => {
    if (this.reducedMotion.matches) return;
    // Don't scatter when the click is on something interactive
    if (e.target instanceof Element && e.target.closest("a, button, input, textarea, select, label, [data-no-scatter]")) return;
    const rect = this.canvas.getBoundingClientRect();
    this.world.startle(e.clientX - rect.left, e.clientY - rect.top);
  };

  /** Static frame for prefers-reduced-motion. */
  drawStill() {
    if (this.world.time < 4) {
      for (let i = 0; i < 240; i++) this.world.step(FIXED_STEP);
    }
    this.renderer.render(this.world, FIXED_STEP);
  }
}
