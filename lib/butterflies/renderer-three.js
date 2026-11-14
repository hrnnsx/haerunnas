import * as THREE from "three";
import { CellGPURenderer, FRAGMENT_SHADER } from "./gpu-cells.js";

const dataTexture = (data, w, h) => {
  const tex = new THREE.DataTexture(data, w, h, THREE.RGBAFormat, THREE.UnsignedByteType);
  tex.magFilter = tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  return tex;
};

/** Three.js renderer: a full-screen quad with the same cell shader. */
export class ThreeRenderer extends CellGPURenderer {
  constructor(canvas, tuning) {
    super(canvas, tuning);
    this.three = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: "high-performance" });
    this.three.setClearColor(0x000000, 0);
    this.material = new THREE.ShaderMaterial({
      // PlaneGeometry supplies `position`, so the shared aPos vertex shader isn't needed.
      vertexShader: "void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }",
      fragmentShader: FRAGMENT_SHADER,
      
      uniforms: {
        uRes: { value: new THREE.Vector2() },
        uGrid: { value: new THREE.Vector2() },
        uCell: { value: new THREE.Vector2() },
        uDpr: { value: 1 },
        uTime: { value: 0 },
        uGlyphCount: { value: 1 },
        uBg: { value: new THREE.Vector3() },
        uGridCol: { value: new THREE.Vector4() },
        uTrail: { value: new THREE.Vector4() },
        uDot: { value: 2 },
        uBgTex: { value: null },
        uGlyphTex: { value: null },
        uTrailTex: { value: null },
        uAtlas: { value: null },
        uWhite: { value: 0 },
        uOpacity: { value: 1 },
      },
      depthTest: false,
      depthWrite: false,
    });
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.material);
    quad.frustumCulled = false;
    this.scene = new THREE.Scene();
    this.scene.add(quad);
    this.camera = new THREE.Camera();
  }

  onResize() {
    this.three.setPixelRatio(this.dpr);
    this.three.setSize(this.width, this.height, false);
    if (this.gridDirty) {
      const { uniforms } = this.material;
      for (const key of ["uBgTex", "uGlyphTex", "uTrailTex"]) uniforms[key].value?.dispose();
      uniforms.uBgTex.value = dataTexture(this.dBg, this.cols, this.rows);
      uniforms.uGlyphTex.value = dataTexture(this.dGlyph, this.cols, this.rows);
      uniforms.uTrailTex.value = dataTexture(this.dTrail, this.cols, this.rows);
      this.gridDirty = false;
    }
  }

  uploadAtlas() {
    const { uniforms } = this.material;
    uniforms.uAtlas.value?.dispose(); // size changes need a fresh texture
    const tex = new THREE.CanvasTexture(this.atlas);
    tex.flipY = false;
    tex.generateMipmaps = false;
    tex.minFilter = tex.magFilter = THREE.LinearFilter;
    tex.needsUpdate = true;
    uniforms.uAtlas.value = tex;
  }

  present(time, u) {
    const { uniforms } = this.material;
    for (const [name, value] of Object.entries(u)) {
      const target = uniforms[name];
      if (typeof value === "number") target.value = value;
      else target.value.fromArray(value);
    }
    uniforms.uBgTex.value.needsUpdate = true;
    uniforms.uGlyphTex.value.needsUpdate = true;
    uniforms.uTrailTex.value.needsUpdate = true;
    this.three.render(this.scene, this.camera);
  }
}
