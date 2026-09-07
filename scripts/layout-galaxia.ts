import { writeFileSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  forceCollide,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
} from "d3-force";

type Nodo = {
  id: string;
  capa: string;
  pos?: { x: number; y: number };
};

type SimNode = {
  id: string;
  capa: string;
  x: number;
  y: number;
  fx?: number | null;
  fy?: number | null;
};

const WIDTH = 1400;
const HEIGHT = 900;

const CENTROIDS: Record<string, { x: number; y: number }> = {
  adquisicion: { x: 280, y: 280 },
  activacion: { x: 560, y: 220 },
  uso: { x: 860, y: 280 },
  expansion: { x: 1140, y: 230 },
  meta: { x: 700, y: 760 },
};

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const target = path.join(root, "src/data/ecosystem.json");

const data = JSON.parse(readFileSync(target, "utf8")) as { nodos: Nodo[] };

const byCapa = new Map<string, Nodo[]>();
for (const nodo of data.nodos) {
  const list = byCapa.get(nodo.capa) ?? [];
  list.push(nodo);
  byCapa.set(nodo.capa, list);
}

const simNodes: SimNode[] = data.nodos
  .filter((nodo) => nodo.capa in CENTROIDS)
  .map((nodo, index) => {
  const centroid = CENTROIDS[nodo.capa];
  if (!centroid) throw new Error(`Capa sin centroide: ${nodo.capa}`);
  const siblings = byCapa.get(nodo.capa) ?? [];
  const i = siblings.findIndex((item) => item.id === nodo.id);
  const angle = (Math.PI * 2 * i) / Math.max(siblings.length, 1) - Math.PI / 2;
  const spread = nodo.capa === "meta" ? 90 : 55;
  const node: SimNode = {
    id: nodo.id,
    capa: nodo.capa,
    x: centroid.x + Math.cos(angle) * spread,
    y: centroid.y + Math.sin(angle) * (nodo.capa === "meta" ? 28 : spread * 0.7),
  };
  if (nodo.capa === "meta") {
    const t = siblings.length === 1 ? 0.5 : i / (siblings.length - 1);
    node.fx = 220 + t * (WIDTH - 440);
    node.fy = centroid.y;
  }
  void index;
  return node;
});

const simulation = forceSimulation(simNodes)
  .force("charge", forceManyBody().strength(-180))
  .force("collide", forceCollide(42))
  .force(
    "x",
    forceX<SimNode>((d) => CENTROIDS[d.capa]?.x ?? WIDTH / 2).strength((d) =>
      d.capa === "meta" ? 0 : 0.35,
    ),
  )
  .force(
    "y",
    forceY<SimNode>((d) => CENTROIDS[d.capa]?.y ?? HEIGHT / 2).strength((d) =>
      d.capa === "meta" ? 0.9 : 0.35,
    ),
  )
  .stop();

for (let i = 0; i < 400; i += 1) simulation.tick();

const posById = new Map(
  simNodes.map((nodo) => [nodo.id, { x: Math.round(nodo.x), y: Math.round(nodo.y) }]),
);

const next = JSON.parse(readFileSync(target, "utf8")) as { nodos: Nodo[] };
for (const nodo of next.nodos) {
  const pos = posById.get(nodo.id);
  if (!pos) continue;
  nodo.pos = pos;
}

writeFileSync(target, `${JSON.stringify(next, null, 2)}\n`);
writeFileSync(path.join(root, "ecosystem.seed.json"), `${JSON.stringify(next, null, 2)}\n`);

console.log(`Posiciones congeladas: ${posById.size} nodos en ${byCapa.size} cúmulos.`);
