import { writeFileSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  forceCollide,
  forceLink,
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

type Arista = { origen: string; destino: string };

type EcosystemFile = {
  nodos: Nodo[];
  aristas: Arista[];
};

type SimNode = {
  id: string;
  capa: string;
  kind: "focus" | "incoming" | "outgoing";
  x: number;
  y: number;
  fx?: number | null;
  fy?: number | null;
};

const FOCUS_LAYER = "c4";
const WIDTH = 1400;
const HEIGHT = 900;
const CX = 780;
const CY = 470;

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const target = path.join(root, "src/data/ecosystem.json");

const data = JSON.parse(readFileSync(target, "utf8")) as EcosystemFile;
const byId = new Map(data.nodos.map((nodo) => [nodo.id, nodo]));
const focusIds = new Set(
  data.nodos.filter((nodo) => nodo.capa === FOCUS_LAYER).map((nodo) => nodo.id),
);

const incoming = new Set<string>();
const outgoing = new Set<string>();

for (const arista of data.aristas) {
  const origenFocus = focusIds.has(arista.origen);
  const destinoFocus = focusIds.has(arista.destino);
  if (destinoFocus && !origenFocus) incoming.add(arista.origen);
  if (origenFocus && !destinoFocus) outgoing.add(arista.destino);
}

function spread(ids: string[], x: number): SimNode[] {
  const list = [...ids].sort();
  if (list.length === 0) return [];
  const top = 180;
  const bottom = HEIGHT - 180;
  return list.map((id, index) => {
    const t = list.length === 1 ? 0.5 : index / (list.length - 1);
    const nodo = byId.get(id);
    if (!nodo) throw new Error(`Vecino ausente en nodos: ${id}`);
    const y = top + t * (bottom - top);
    return {
      id,
      capa: nodo.capa,
      kind: x < CX ? "incoming" : "outgoing",
      x,
      y,
      fx: x,
      fy: y,
    };
  });
}

const focusList = [...focusIds].sort();
const simNodes: SimNode[] = [
  ...focusList.map((id, index) => {
    const angle = (Math.PI * 2 * index) / focusList.length - Math.PI / 2;
    const nodo = byId.get(id);
    if (!nodo) throw new Error(`Nodo de atención ausente: ${id}`);
    return {
      id,
      capa: nodo.capa,
      kind: "focus" as const,
      x: CX + Math.cos(angle) * 210,
      y: CY + Math.sin(angle) * 160,
    };
  }),
  ...spread([...incoming], 400),
  ...spread([...outgoing], WIDTH - 150),
];

const nodeIndex = new Map(simNodes.map((nodo) => [nodo.id, nodo]));
const simLinks = data.aristas
  .filter((arista) => nodeIndex.has(arista.origen) && nodeIndex.has(arista.destino))
  .map((arista) => ({
    source: arista.origen,
    target: arista.destino,
    distance:
      focusIds.has(arista.origen) && focusIds.has(arista.destino) ? 200 : 280,
  }));

const simulation = forceSimulation(simNodes)
  .force("charge", forceManyBody().strength(-560))
  .force(
    "link",
    forceLink(simLinks)
      .id((d) => (d as SimNode).id)
      .distance((d) => (d as { distance: number }).distance)
      .strength(0.45),
  )
  .force("collide", forceCollide(88))
  .force(
    "x",
    forceX<SimNode>((d) => (d.kind === "focus" ? CX : d.x)).strength((d) =>
      d.kind === "focus" ? 0.08 : 1,
    ),
  )
  .force(
    "y",
    forceY<SimNode>((d) => (d.kind === "focus" ? CY : d.y)).strength((d) =>
      d.kind === "focus" ? 0.08 : 1,
    ),
  )
  .stop();

for (let i = 0; i < 400; i += 1) simulation.tick();

const posById = new Map(
  simNodes.map((nodo) => [nodo.id, { x: Math.round(nodo.x), y: Math.round(nodo.y) }]),
);

const next = JSON.parse(readFileSync(target, "utf8")) as EcosystemFile;
for (const nodo of next.nodos) {
  const pos = posById.get(nodo.id);
  if (pos) nodo.pos = pos;
}

writeFileSync(target, `${JSON.stringify(next, null, 2)}\n`);

const missingFocus = focusList.filter((id) => !posById.has(id));
if (missingFocus.length > 0) {
  throw new Error(`Sin posición para: ${missingFocus.join(", ")}`);
}

console.log(
  `Posiciones congeladas: ${posById.size} nodos (foco ${focusList.length}, vecindario ${posById.size - focusList.length}).`,
);
