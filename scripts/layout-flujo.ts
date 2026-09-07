import { writeFileSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

type Pos = { x: number; y: number };
type Nodo = { id: string; pos?: Pos; posFlujo?: Pos };
type Arista = { origen: string; destino: string; vista?: string };

/** Coordenadas congeladas: Cliente abajo, clasificador al medio, agentes en abanico. */
const POS_FLUJO: Record<string, Pos> = {
  cliente: { x: 700, y: 760 },
  ag_clasificador: { x: 700, y: 470 },
  ag_sac_haulmer: { x: 320, y: 220 },
  ag_sac_hosting: { x: 540, y: 160 },
  ag_partner: { x: 860, y: 160 },
  ag_onboarding: { x: 1080, y: 220 },
};

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const target = path.join(root, "src/data/ecosystem.json");

const data = JSON.parse(readFileSync(target, "utf8")) as {
  nodos: Nodo[];
  aristas: Arista[];
};

const flujoIds = new Set<string>();
for (const arista of data.aristas) {
  if (arista.vista === "conversacion") {
    flujoIds.add(arista.origen);
    flujoIds.add(arista.destino);
  }
}

for (const nodo of data.nodos) {
  if (!flujoIds.has(nodo.id)) continue;
  const pos = POS_FLUJO[nodo.id];
  if (!pos) throw new Error(`Sin posFlujo congelada para: ${nodo.id}`);
  nodo.posFlujo = pos;
}

writeFileSync(target, `${JSON.stringify(data, null, 2)}\n`);
writeFileSync(path.join(root, "ecosystem.seed.json"), `${JSON.stringify(data, null, 2)}\n`);

console.log(`posFlujo congelada: ${flujoIds.size} nodos de conversación.`);
