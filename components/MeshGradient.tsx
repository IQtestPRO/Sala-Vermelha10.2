"use client";

import React, { useEffect, useRef } from "react";

// Mesh gradient animado (WebGL) — porte do componente Aceternity, cores da marca STAT.
type MeshGradientProps = {
  className?: string;
  style?: React.CSSProperties;
  colors?: string[];
  speed?: number;
  resolutionScale?: number;
  paused?: boolean;
};

function resolveCssColorToRGB(color: string): [number, number, number] {
  const el = document.createElement("div");
  el.style.color = color;
  document.body.appendChild(el);
  const computed = getComputedStyle(el).color;
  document.body.removeChild(el);
  const match = computed.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (!match) return [225, 29, 42];
  return [parseInt(match[1], 10), parseInt(match[2], 10), parseInt(match[3], 10)];
}

export default function MeshGradient({
  className,
  style,
  // navy/azul dominantes + acento ECG vermelho (identidade STAT)
  colors = ["#1f4fa3", "#2f6df0", "#E11D2A", "#0c1d3f", "#16294d"],
  speed = 1,
  resolutionScale = 1,
  paused = false,
}: MeshGradientProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const glCtx = canvas.getContext("webgl", { premultipliedAlpha: true, alpha: true });
    if (!glCtx) return;
    const gl: WebGLRenderingContext = glCtx;

    const getDpr = () => Math.min(window.devicePixelRatio || 1, 1.75) * resolutionScale;

    const vertexSrc = `
      attribute vec2 a_position;
      varying vec2 v_uv;
      void main() { v_uv = a_position * 0.5 + 0.5; gl_Position = vec4(a_position, 0.0, 1.0); }
    `;
    const fragmentSrc = `
      precision mediump float;
      varying vec2 v_uv;
      uniform vec2 u_resolution;
      uniform float u_time;
      uniform vec3 u_colors[5];
      float hash(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
      void main(){
        vec2 uv = v_uv; uv.x *= u_resolution.x / u_resolution.y;
        float t = u_time;
        vec2 p0 = 0.52 + 0.35*vec2(sin(0.7*t), cos(0.9*t));
        vec2 p1 = 0.48 + 0.35*vec2(sin(0.6*t+1.7), cos(0.8*t+2.3));
        vec2 p2 = 0.50 + 0.38*vec2(sin(0.9*t+0.7), cos(0.7*t+1.7));
        vec2 p3 = 0.46 + 0.33*vec2(sin(0.5*t+2.9), cos(1.1*t+0.2));
        vec2 p4 = 0.50 + 0.30*vec2(sin(0.8*t-1.4), cos(0.6*t-0.9));
        float d0=distance(uv,p0), d1=distance(uv,p1), d2=distance(uv,p2), d3=distance(uv,p3), d4=distance(uv,p4);
        float w0=smoothstep(0.85,0.05,d0), w1=smoothstep(0.85,0.05,d1), w2=smoothstep(0.90,0.05,d2), w3=smoothstep(0.95,0.05,d3), w4=smoothstep(0.90,0.05,d4);
        vec3 col = vec3(0.0);
        col += u_colors[0]*w0; col += u_colors[1]*w1; col += u_colors[2]*w2; col += u_colors[3]*w3; col += u_colors[4]*w4;
        float wsum = w0+w1+w2+w3+w4+1e-3; col /= wsum;
        float g = hash(uv*u_resolution*0.5 + u_time); col += (g-0.5)*0.02;
        float vign = smoothstep(1.1,0.35,length(uv-vec2(0.5))); col *= vign;
        gl_FragColor = vec4(col, 1.0);
      }
    `;

    function compile(type: number, src: string) {
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) { gl.deleteShader(sh); return null; }
      return sh;
    }
    const vs = compile(gl.VERTEX_SHADER, vertexSrc);
    const fs = compile(gl.FRAGMENT_SHADER, fragmentSrc);
    if (!vs || !fs) return;

    const program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uResolution = gl.getUniformLocation(program, "u_resolution");
    const uTime = gl.getUniformLocation(program, "u_time");
    const uColors = gl.getUniformLocation(program, "u_colors");

    const resolved = [...colors];
    while (resolved.length < 5) resolved.push(resolved[resolved.length - 1] ?? "#ffffff");
    const rgb = resolved.slice(0, 5).map((c) => {
      const [r, g, b] = resolveCssColorToRGB(c);
      return [r / 255, g / 255, b / 255] as [number, number, number];
    });
    gl.uniform3fv(uColors, new Float32Array(rgb.flat()));

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const resize = () => {
      const dpr = getDpr();
      const w = Math.max(1, Math.floor(canvas.clientWidth * dpr));
      const h = Math.max(1, Math.floor(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uResolution, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener("resize", resize);

    const start = performance.now();
    const loop = () => {
      const t = ((performance.now() - start) / 1000) * (paused || prefersReduced ? 0.0 : speed);
      gl.uniform1f(uTime, t);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      gl.useProgram(null);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buffer);
    };
  }, [colors, speed, resolutionScale, paused]);

  return <canvas ref={canvasRef} className={className} style={{ width: "100%", height: "100%", display: "block", ...style }} />;
}
