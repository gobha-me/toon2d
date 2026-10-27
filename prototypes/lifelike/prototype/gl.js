// Minimal WebGL1 helpers: context, shader programs, textures, and a CPU-transformed
// textured-triangle batch (used by all three body approaches so they share one renderer).

export function createGL(canvas) {
  const gl = canvas.getContext('webgl', { premultipliedAlpha: true, antialias: true, preserveDrawingBuffer: true });
  if (!gl) throw new Error('WebGL unavailable');
  gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
  return gl;
}

export function program(gl, vs, fs) {
  const sh = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  };
  const p = gl.createProgram();
  gl.attachShader(p, sh(gl.VERTEX_SHADER, vs));
  gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
  const u = {};
  const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < n; i++) {
    const info = gl.getActiveUniform(p, i);
    u[info.name.replace(/\[0\]$/, '')] = gl.getUniformLocation(p, info.name);
  }
  return { p, u, a: (name) => gl.getAttribLocation(p, name) };
}

export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const im = new Image();
    im.onload = () => resolve(im);
    im.onerror = () => reject(new Error(`failed to load ${url}`));
    im.src = url;
  });
}

export function texture(gl, img, { premultiply = false, linear = true } = {}) {
  const t = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, t);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, premultiply);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
  const f = linear ? gl.LINEAR : gl.NEAREST;
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, f);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, f);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  return { t, w: img.width, h: img.height };
}

export function whiteTexture(gl) {
  const t = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, t);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 255, 255, 255]));
  return { t, w: 1, h: 1 };
}

const BATCH_VS = `
attribute vec2 aPos; attribute vec2 aUV;
uniform vec2 uView; varying vec2 vUV;
void main() { vUV = aUV; gl_Position = vec4(aPos.x / uView.x * 2.0 - 1.0, 1.0 - aPos.y / uView.y * 2.0, 0.0, 1.0); }`;
const BATCH_FS = `
precision mediump float; varying vec2 vUV; uniform sampler2D uTex; uniform vec4 uTint;
void main() { gl_FragColor = texture2D(uTex, vUV) * uTint; }`;

// Immediate-mode batch: push triangles (screen px + texture px) for one texture, flush.
export class Batch {
  constructor(gl) {
    this.gl = gl;
    this.prog = program(gl, BATCH_VS, BATCH_FS);
    this.buf = gl.createBuffer();
    this.data = new Float32Array(4 * 6 * 4096);
    this.n = 0;
    this.white = whiteTexture(gl);
  }
  begin(w, h) {
    const gl = this.gl;
    gl.viewport(0, 0, w, h);
    this.view = [w, h];
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  }
  tri(x0, y0, u0, v0, x1, y1, u1, v1, x2, y2, u2, v2) {
    const d = this.data;
    let i = this.n * 4;
    d[i++] = x0; d[i++] = y0; d[i++] = u0; d[i++] = v0;
    d[i++] = x1; d[i++] = y1; d[i++] = u1; d[i++] = v1;
    d[i++] = x2; d[i++] = y2; d[i++] = u2; d[i++] = v2;
    this.n += 3;
  }
  // quad from 4 screen corners (tl, tr, br, bl) and a texture rect in px
  quad(c, rect) {
    const [rx, ry, rw, rh] = rect;
    this.tri(c[0], c[1], rx, ry, c[2], c[3], rx + rw, ry, c[4], c[5], rx + rw, ry + rh);
    this.tri(c[0], c[1], rx, ry, c[4], c[5], rx + rw, ry + rh, c[6], c[7], rx, ry + rh);
  }
  flush(tex, tint = [1, 1, 1, 1], mode) {
    if (!this.n) return;
    const gl = this.gl;
    const { p, u, a } = this.prog;
    gl.useProgram(p);
    const d = this.data;
    const sx = 1 / tex.w, sy = 1 / tex.h;
    for (let i = 0; i < this.n; i++) {
      d[i * 4 + 2] *= sx;
      d[i * 4 + 3] *= sy;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buf);
    gl.bufferData(gl.ARRAY_BUFFER, d.subarray(0, this.n * 4), gl.STREAM_DRAW);
    const ap = a('aPos'), au = a('aUV');
    gl.enableVertexAttribArray(ap);
    gl.enableVertexAttribArray(au);
    gl.vertexAttribPointer(ap, 2, gl.FLOAT, false, 16, 0);
    gl.vertexAttribPointer(au, 2, gl.FLOAT, false, 16, 8);
    gl.uniform2f(u.uView, this.view[0], this.view[1]);
    gl.uniform4f(u.uTint, tint[0] * tint[3], tint[1] * tint[3], tint[2] * tint[3], tint[3]);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tex.t);
    gl.uniform1i(u.uTex, 0);
    gl.drawArrays(mode ?? gl.TRIANGLES, 0, this.n);
    this.n = 0;
  }
  // debug lines (pairs of points), solid colour
  lines(pts, color) {
    for (let i = 0; i + 3 < pts.length; i += 4) {
      const d = this.data;
      let j = this.n * 4;
      d[j++] = pts[i]; d[j++] = pts[i + 1]; d[j++] = 0; d[j++] = 0;
      d[j++] = pts[i + 2]; d[j++] = pts[i + 3]; d[j++] = 0; d[j++] = 0;
      this.n += 2;
    }
    this.flush(this.white, color, this.gl.LINES);
  }
}
