import { SPECIES } from "./config.js";
import { clamp, rand, angleDiff, TAU } from "./utils.js";

const STARTLE_RADIUS = 240;

export class World {
  width = 0;
  height = 0;
  time = 0;
  butterflies = [];
  events = []; // consumed by the renderer (click bursts)
  base = 120;  // base wingspan in px
  nextId = 1;

  constructor(tuning, count) {
    this.tuning = tuning;
    this.count = count; // fixed count, or undefined to derive from screen area
  }

  resize(width, height) {
    const first = this.width === 0;
    this.width = width;
    this.height = height;
    this.base = clamp(Math.min(width, height) * 0.2, 80, 190);
    if (first) this.populate(true);
  }

  /** Migration heading in radians. */
  get course() {
    const { tuning, width, height } = this;
    return tuning.corner ? Math.atan2(-height, width) : (-tuning.direction * Math.PI) / 180;
  }

  /** Scatter nearby butterflies away from a point. */
  startle(x, y) {
    this.events.push({ kind: "burst", x, y });
    for (const b of this.butterflies) {
      const dx = b.x - x;
      const dy = b.y - y;
      const dist = Math.hypot(dx, dy) || 1;
      if (dist > STARTLE_RADIUS) continue;
      const push = (1 - dist / STARTLE_RADIUS) * 420 * b.depth;
      b.vx += (dx / dist) * push;
      b.vy += (dy / dist) * push;
      b.startledUntil = this.time + rand(0.6, 1.2);
      b.glideUntil = 0;
    }
  }

  step(dt) {
    this.time += dt;
    this.populate(false);
    const { tuning } = this;
    for (const b of this.butterflies) {
      b.depth = this.depthFor(b.roll);
      b.span = this.base * b.depth * tuning.size;
      this.fly(b, dt);
    }
  }

  depthFor(roll) {
    const { farthest, farBias } = this.tuning;
    return farthest + (1 - farthest) * Math.pow(roll, farBias);
  }

  /** Add/remove butterflies to match the target count. List stays sorted far -> near. */
  populate(initial) {
    const { width, height } = this;
    const full =
      this.count ?? clamp(Math.round(((width * height) / 48000) * this.tuning.density), 1, 200);

    // Ramp the crowd up from nothing over `intro` seconds (eased)
    const intro = this.tuning.intro ?? 0;
    const k = intro > 0 ? clamp(this.time / intro, 0, 1) : 1;
    const eased = k * k * (3 - 2 * k);
    const target = Math.round(full * eased);

    // Only trim once the intro is over, so a resize mid-intro doesn't delete anyone
    while (this.butterflies.length > target && k >= 1) {
      this.butterflies.splice(Math.floor(Math.random() * this.butterflies.length), 1);
    }
    while (this.butterflies.length < target) {
      const b = this.spawn();
      // After the intro, behave as before; during it, fly in from the edge
      if (k >= 1 && (initial || Math.random() < 0.5)) {
        b.x = rand(0, width);
        b.y = rand(0, height);
      }
      const at = this.butterflies.findIndex((o) => o.roll > b.roll);
      this.butterflies.splice(at < 0 ? this.butterflies.length : at, 0, b);
    }
  }

  spawn() {
    const species = SPECIES.morpho;
    const b = {
      id: this.nextId++,
      species,
      roll: Math.random(), // fixed random 0..1 that maps to depth
      span: 0,
      depth: 1,
      x: 0, y: 0, vx: 0, vy: 0,
      heading: 0,
      phase: rand(0, TAU), // wing-flap phase
      open: 1,             // wing openness 0.1..1
      glide: 0,            // 0 flapping .. 1 gliding
      glideUntil: 0,
      flutterX: 0, flutterY: 0,
      bias: 0,
      startledUntil: 0,
    };
    b.depth = this.depthFor(b.roll);
    b.span = this.base * b.depth * this.tuning.size;
    this.reenter(b);
    return b;
  }

  cruiseSpeed(species, depth) {
    return species.cruise * (0.55 + 0.45 * depth) * this.tuning.speed;
  }

  /** Put a butterfly back at the upwind edge of the screen. */
  reenter(b) {
    const { width, height, course } = this;
    const margin = b.span * 0.6;
    const cos = Math.cos(course);
    const sin = Math.sin(course);
    const sideEdge = height * Math.abs(cos);
    const vertEdge = width * Math.abs(sin);

    if (Math.random() * (sideEdge + vertEdge) < sideEdge) {
      b.x = cos >= 0 ? -margin : width + margin;
      b.y = rand(0, height);
    } else {
      b.x = rand(0, width);
      b.y = sin <= 0 ? height + margin : -margin;
    }
    const speed = this.cruiseSpeed(b.species, b.depth);
    b.heading = course;
    b.vx = cos * speed;
    b.vy = sin * speed;
    b.flutterX = 0;
    b.flutterY = 0;
    b.bias = rand(-1, 1);
  }

  fly(b, dt) {
    const { species, depth } = b;
    const t = this.time;
    const tn = this.tuning;
    const course = this.course;

    // Steer toward the desired heading
    const sway = tn.sway * (Math.sin(t * 0.13) + 0.5 * Math.sin(t * 0.31 + 1.7));
    const wanted = course + sway + b.bias * tn.spread;
    const cruise = this.cruiseSpeed(species, depth);
    let ax = (Math.cos(wanted) * cruise - b.vx) * tn.grip;
    let ay = (Math.sin(wanted) * cruise - b.vy) * tn.grip;

    // Random flutter (smoothed noise)
    const flutterAmp =
      Math.sqrt(dt) * 520 * species.flutter * tn.flutter * (1 - 0.8 * b.glide) * (0.5 + 0.5 * depth);
    b.flutterX += -b.flutterX * 3 * dt + (Math.random() * 2 - 1) * flutterAmp;
    b.flutterY += -b.flutterY * 3 * dt + (Math.random() * 2 - 1) * flutterAmp;
    ax += b.flutterX;
    ay += b.flutterY;

    // Forward thrust on the downstroke
    const downstroke = Math.max(0, -Math.sin(b.phase)) * (1 - b.glide);
    ax += Math.cos(b.heading) * downstroke * cruise * 1.4;
    ay += Math.sin(b.heading) * downstroke * cruise * 1.4;

    // Separation from neighbours at a similar depth
    if (tn.separation > 0) {
      for (const o of this.butterflies) {
        if (o === b || Math.abs(o.depth - depth) > 0.18) continue;
        const dx = b.x - o.x;
        const dy = b.y - o.y;
        const dist = Math.hypot(dx, dy);
        const minDist = (b.span + o.span) * 0.42;
        if (dist < minDist && dist > 0.001) {
          const push = (1 - dist / minDist) * tn.separation;
          ax += (dx / dist) * push;
          ay += (dy / dist) * push;
        }
      }
    }

    // Integrate
    b.vx += ax * dt;
    b.vy += ay * dt;
    let speed = Math.hypot(b.vx, b.vy);
    const maxSpeed = cruise * 2.2 + (t < b.startledUntil ? 300 : 0);
    if (speed > maxSpeed) {
      b.vx *= maxSpeed / speed;
      b.vy *= maxSpeed / speed;
      speed = maxSpeed;
    }
    b.x += b.vx * dt;
    b.y += b.vy * dt;

    // Off-screen handling
    const m = b.span;
    const { width, height } = this;
    const cos = Math.cos(course);
    const sin = Math.sin(course);
    const exited =
      (cos > 0.05 && b.x > width + m) ||
      (cos < -0.05 && b.x < -m) ||
      (sin < -0.05 && b.y < -m) ||
      (sin > 0.05 && b.y > height + m);
    const lost = b.x < -3 * m || b.x > width + 3 * m || b.y < -3 * m || b.y > height + 3 * m;
    if (exited || lost) this.reenter(b);

    // Turn body toward velocity
    if (speed > 12) {
      const maxTurn = 7 * dt;
      b.heading += clamp(angleDiff(b.heading, Math.atan2(b.vy, b.vx)), -maxTurn, maxTurn);
    }

    // Occasionally glide
    const glideRate = species.glide * tn.glide;
    if (b.glide < 0.5 && t > b.glideUntil && speed > cruise * 0.5 && Math.random() < glideRate * dt) {
      b.glideUntil = t + rand(0.5, 1.4);
    }
    b.glide += ((t < b.glideUntil ? 1 : 0) - b.glide) * Math.min(1, dt * 6);

    // Wing flap
    const speedFrac = clamp(speed / (cruise * 2), 0, 1);
    b.phase += dt * TAU * species.flapHz * tn.flapRate * (0.8 + 0.6 * speedFrac) * (1 - 0.9 * b.glide);
    const wave = Math.pow(0.5 + 0.5 * Math.cos(b.phase), 0.8);
    b.open = 0.1 + 0.9 * (wave * (1 - b.glide) + 0.96 * b.glide);
  }
}