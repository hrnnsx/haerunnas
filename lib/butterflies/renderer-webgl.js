import { CellGPURenderer, VERTEX_SHADER, FRAGMENT_SHADER } from "./gpu-cells.js";

function compile(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
  return shader;
}

/** Raw WebGL renderer: one full-screen triangle, four textures, one shader. */
export class WebGLRenderer extends CellGPURenderer {
  constructor(canvas, tuning) {
    super(canvas, tuning);
    const gl = canvas.getContext("webgl", { alpha: true, antialias: false, powerPreference: "high-performance" });
    if (!gl) throw new Error("WebGL unavailable");
    this.gl = gl;

    const program = gl.createProgram();
    gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER));
    gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
    gl.useProgram(program);
    gl.clearColor(0, 0, 0, 0);
    this.program = program;

    // Full-screen triangle
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(program, "aPos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    // Texture units: 0 bg, 1 glyph colour, 2 trail, 3 atlas
    const make = (unit, filter) => {
      const tex = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return tex;
    };
    this.tex = [make(0, gl.NEAREST), make(1, gl.NEAREST), make(2, gl.NEAREST), make(3, gl.LINEAR)];
    ["uBgTex", "uGlyphTex", "uTrailTex", "uAtlas"].forEach((name, i) =>
      gl.uniform1i(gl.getUniformLocation(program, name), i)
    );
    this.uniformLocs = {};
  }

  onResize() {
    this.gl?.viewport(0, 0, this.canvas.width, this.canvas.height);
  }

  uploadAtlas() {
    const { gl } = this;
    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D, this.tex[3]);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.atlas);
  }

  present(time, u) {
    const { gl, cols, rows, program } = this;
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);

    [this.dBg, this.dGlyph, this.dTrail].forEach((data, i) => {
      gl.activeTexture(gl.TEXTURE0 + i);
      gl.bindTexture(gl.TEXTURE_2D, this.tex[i]);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, cols, rows, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
    });

    for (const [name, value] of Object.entries(u)) {
      const loc = (this.uniformLocs[name] ??= gl.getUniformLocation(program, name));
      if (typeof value === "number") gl.uniform1f(loc, value);
      else if (value.length === 2) gl.uniform2fv(loc, value);
      else if (value.length === 3) gl.uniform3fv(loc, value);
      else gl.uniform4fv(loc, value);
    }
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
}
