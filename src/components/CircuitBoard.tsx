"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "@/lib/theme";

interface Pulse {
  a: number;
  b: number;
  t: number;
  speed: number;
  life: number;
  amp: number;
}

interface Ripple {
  x: number;
  y: number;
  r: number;
  maxR: number;
  life: number;
}

interface Palette {
  nodeRgb: string;
  nodeAlpha: number;
  traceAlpha: number;
  trailRgb: string;
  coreRgb: string;
  midRgb: string;
  glowRgb: string;
  glowAlpha: number;
}

const DARK_PALETTE: Palette = {
  nodeRgb: "127,184,255",
  nodeAlpha: 0.14,
  traceAlpha: 0.1,
  trailRgb: "150,200,255",
  coreRgb: "245,250,255",
  midRgb: "120,190,255",
  glowRgb: "160,205,255",
  glowAlpha: 0.18,
};

const LIGHT_PALETTE: Palette = {
  nodeRgb: "22,163,74",
  nodeAlpha: 0.18,
  traceAlpha: 0.14,
  trailRgb: "74,222,128",
  coreRgb: "235,255,245",
  midRgb: "52,199,123",
  glowRgb: "74,222,128",
  glowAlpha: 0.2,
};

export default function CircuitBoard() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const palette: Palette = theme === "light" ? LIGHT_PALETTE : DARK_PALETTE;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0;
    let height = 0;
    let raf = 0;

    const nodes: Array<{ x: number; y: number }> = [];
    const edges: Array<{ a: number; b: number }> = [];
    const adj: Map<number, number[]> = new Map();
    const pulses: Pulse[] = [];
    const ripples: Ripple[] = [];
    let staticLayer: HTMLCanvasElement | null = null;

    let mouse = { x: -1000, y: -1000, active: false };
    let lastEmit = 0;
    let lastRipple = 0;

    const rebuild = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      nodes.length = 0;
      edges.length = 0;
      adj.clear();
      pulses.length = 0;
      ripples.length = 0;

      const spacing = 56;
      const cols = Math.max(1, Math.floor(width / spacing));
      const rows = Math.max(1, Math.floor(height / spacing));
      for (let r = 0; r <= rows; r++) {
        for (let c = 0; c <= cols; c++) {
          const jitter = (Math.random() * 2 - 1) * 5;
          nodes.push({
            x: c * spacing + (c > 0 && c < cols ? jitter : 0),
            y: r * spacing + (r > 0 && r < rows ? jitter : 0),
          });
        }
      }

      const idx = (r: number, c: number) =>
        r < 0 || c < 0 || r > rows || c > cols ? -1 : r * (cols + 1) + c;

      const addEdge = (a: number, b: number) => {
        if (a < 0 || b < 0 || Math.random() > 0.42) return;
        edges.push({ a, b });
        if (!adj.has(a)) adj.set(a, []);
        if (!adj.has(b)) adj.set(b, []);
        adj.get(a)!.push(b);
        adj.get(b)!.push(a);
      };

      for (let r = 0; r <= rows; r++) {
        for (let c = 0; c <= cols; c++) {
          addEdge(idx(r, c), idx(r, c + 1));
          addEdge(idx(r, c), idx(r + 1, c));
        }
      }

      staticLayer = document.createElement("canvas");
      staticLayer.width = canvas.width;
      staticLayer.height = canvas.height;
      const s = staticLayer.getContext("2d");
      if (!s) return;
      s.setTransform(dpr, 0, 0, dpr, 0, 0);

      for (const n of nodes) {
        s.fillStyle = `rgba(${palette.nodeRgb},${(
          palette.nodeAlpha +
          Math.random() * 0.08
        ).toFixed(2)})`;
        s.beginPath();
        s.arc(n.x, n.y, 1.3, 0, Math.PI * 2);
        s.fill();
      }

      s.strokeStyle = `rgba(${palette.nodeRgb},${palette.traceAlpha})`;
      s.lineWidth = 1;
      for (const e of edges) {
        const A = nodes[e.a];
        const B = nodes[e.b];
        s.beginPath();
        s.moveTo(A.x, A.y);
        s.lineTo(B.x, B.y);
        s.stroke();
      }
    };

    const nearestNode = (x: number, y: number): number => {
      let best = 0;
      let bestD = Infinity;
      for (let i = 0; i < nodes.length; i++) {
        const dx = nodes[i].x - x;
        const dy = nodes[i].y - y;
        const d = dx * dx + dy * dy;
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      }
      return best;
    };

    // Form a cluster of signals at the pointer, radiating outward along traces.
    const spawnSpray = () => {
      if (!mouse.active || pulses.length >= 80 || edges.length === 0) return;
      const source = nearestNode(mouse.x, mouse.y);
      const sx = nodes[source].x;
      const sy = nodes[source].y;
      const neighbors = adj.get(source) ?? [];
      if (neighbors.length === 0) return;

      for (const nb of neighbors) {
        if (pulses.length >= 80) break;
        const n = nodes[nb];
        const outX = n.x - sx;
        const outY = n.y - sy;
        const dxW = mouse.x - sx;
        const dyW = mouse.y - sy;
        const outward =
          (outX * outX + outY * outY) /
          (Math.abs(outX * dxW + outY * dyW) + 1e-6);
        if (Math.random() > 0.35 && outward < 0.5) continue;
        pulses.push({
          a: source,
          b: nb,
          t: 0,
          speed: 0.016 + Math.random() * 0.014,
          life: 1,
          amp: 1 + Math.random() * 0.8,
        });
      }
    };

    // A single gentle ring expanding from the pointer (sparse).
    const spawnRipple = () => {
      if (!mouse.active) return;
      ripples.push({
        x: mouse.x,
        y: mouse.y,
        r: 4,
        maxR: 96,
        life: 1,
      });
    };

    // Ambient pulses traveling the traces on their own (slow, sparse).
    const spawnAmbient = () => {
      if (pulses.length >= 40 || edges.length === 0) return;
      const e = edges[Math.floor(Math.random() * edges.length)];
      pulses.push({
        a: e.a,
        b: e.b,
        t: 0,
        speed: 0.01 + Math.random() * 0.008,
        life: 1,
        amp: 0.7 + Math.random() * 0.5,
      });
    };

    const stepPulse = (p: Pulse) => {
      p.t += p.speed;
      p.life -= 0.007;
      while (p.t >= 1) {
        const node = p.b;
        const neighbors = adj.get(node) ?? [];
        if (neighbors.length === 0) {
          p.life = -1;
          break;
        }
        let next = neighbors[Math.floor(Math.random() * neighbors.length)];
        if (neighbors.length > 1) {
          const cur = nodes[node];
          let best = next;
          let bestScore = -Infinity;
          for (const nb of neighbors) {
            if (nb === p.a) continue;
            const n = nodes[nb];
            const dx = n.x - cur.x;
            const dy = n.y - cur.y;
            const tx = mouse.x - cur.x;
            const ty = mouse.y - cur.y;
            const sc =
              (dx * tx + dy * ty) / (Math.hypot(dx, dy) + 1e-6);
            if (sc > bestScore) {
              bestScore = sc;
              best = nb;
            }
          }
          next = best;
        }
        p.a = node;
        p.b = next;
        p.t -= 1;
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      if (staticLayer) ctx.drawImage(staticLayer, 0, 0, width, height);

      if (mouse.active) {
        const g = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 130);
        g.addColorStop(0, `rgba(${palette.glowRgb},${palette.glowAlpha})`);
        g.addColorStop(0.6, `rgba(${palette.glowRgb},${(palette.glowAlpha * 0.3).toFixed(2)})`);
        g.addColorStop(1, `rgba(${palette.glowRgb},0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 130, 0, Math.PI * 2);
        ctx.fill();
      }

      for (let i = ripples.length - 1; i >= 0; i--) {
        const rp = ripples[i];
        rp.r += 1.2;
        rp.life -= 0.022;
        if (rp.life <= 0 || rp.r > rp.maxR) {
          ripples.splice(i, 1);
          continue;
        }
        ctx.strokeStyle = `rgba(${palette.midRgb},${(0.35 * rp.life).toFixed(2)})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2);
        ctx.stroke();
      }

      for (let i = pulses.length - 1; i >= 0; i--) {
        const p = pulses[i];
        if (p.life <= 0) {
          pulses.splice(i, 1);
          continue;
        }
        stepPulse(p);
        if (p.life <= 0) {
          pulses.splice(i, 1);
          continue;
        }

        const A = nodes[p.a];
        const B = nodes[p.b];
        const ux = B.x - A.x;
        const uy = B.y - A.y;
        const nx = A.x + ux * p.t;
        const ny = A.y + uy * p.t;

        const r = 2.6 + p.amp * 0.8;
        const g = ctx.createRadialGradient(nx, ny, 0, nx, ny, r + 3);
        g.addColorStop(0, `rgba(${palette.midRgb},${(0.9 * p.life).toFixed(2)})`);
        g.addColorStop(0.4, `rgba(${palette.coreRgb},${(0.6 * p.life).toFixed(2)})`);
        g.addColorStop(1, `rgba(${palette.coreRgb},0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(nx, ny, r + 3, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    };

    const onResize = () => rebuild();
    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse = { x: e.clientX - rect.left, y: e.clientY - rect.top, active: true };
      const now = performance.now();
      if (now - lastEmit > 180) {
        lastEmit = now;
        spawnSpray();
      }
      if (now - lastRipple > 140) {
        lastRipple = now;
        spawnRipple();
      }
    };
    const onMouseInactive = () => {
      mouse.active = false;
    };

    window.addEventListener("resize", onResize);
    window.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseleave", onMouseInactive);
    window.addEventListener("blur", onMouseInactive);

    rebuild();
    draw();
    const ambientTimer = window.setInterval(spawnAmbient, 640);

    return () => {
      cancelAnimationFrame(raf);
      clearInterval(ambientTimer);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseleave", onMouseInactive);
      window.removeEventListener("blur", onMouseInactive);
    };
  }, [theme]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0 h-full w-full"
    />
  );
}
