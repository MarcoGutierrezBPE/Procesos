export type Pt = { x: number; y: number };

export function nebulaPath(pts: Pt[], pad: number, seed: number, flatten = 1): string {
  if (pts.length === 0) return "";
  const samples: Pt[] = [];
  for (let i = 0; i < pts.length; i += 1) {
    const p = pts[i];
    const spokes = 8;
    for (let k = 0; k < spokes; k += 1) {
      const wobble = hash(seed + i * 17 + k * 9);
      const a = (Math.PI * 2 * k) / spokes + wobble * 0.55;
      const r = pad * (0.62 + hash(seed + i * 5 + k * 11) * 0.7);
      samples.push({ x: p.x + Math.cos(a) * r, y: p.y + Math.sin(a) * r });
    }
  }
  const hull = convexHull(samples);
  if (hull.length < 3) return "";
  if (flatten === 1) return smoothClosed(hull);
  const cy = hull.reduce((sum, p) => sum + p.y, 0) / hull.length;
  return smoothClosed(hull.map((p) => ({ x: p.x, y: cy + (p.y - cy) * flatten })));
}

function convexHull(points: Pt[]): Pt[] {
  const sorted = [...points].sort((a, b) => (a.x === b.x ? a.y - b.y : a.x - b.x));
  const lower: Pt[] = [];
  for (const p of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
      lower.pop();
    }
    lower.push(p);
  }
  const upper: Pt[] = [];
  for (let i = sorted.length - 1; i >= 0; i -= 1) {
    const p = sorted[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
      upper.pop();
    }
    upper.push(p);
  }
  lower.pop();
  upper.pop();
  return [...lower, ...upper];
}

function cross(o: Pt, a: Pt, b: Pt): number {
  return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
}

function smoothClosed(hull: Pt[]): string {
  const n = hull.length;
  if (n === 0) return "";
  const mids = hull.map((p, i) => {
    const q = hull[(i + 1) % n];
    return { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 };
  });
  let d = `M ${mids[0].x} ${mids[0].y}`;
  for (let i = 0; i < n; i += 1) {
    const c = hull[(i + 1) % n];
    const m = mids[(i + 1) % n];
    d += ` Q ${c.x} ${c.y} ${m.x} ${m.y}`;
  }
  return `${d} Z`;
}

function hash(n: number): number {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}
