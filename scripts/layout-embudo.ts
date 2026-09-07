import { writeFileSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

type Pos = { x: number; y: number };
type Nodo = { id: string; pos?: Pos; posFlujo?: Pos; posEmbudo?: Pos };
type Arista = { origen: string; destino: string; vista?: string };

/** Cliente arriba, clasificador, Ventas a la izquierda, capas SAC a la derecha. */
const POS_EMBUDO: Record<string, Pos> = {
  cliente: { x: 860, y: 70 },
  ag_clasificador: { x: 860, y: 200 },
  ag_ventas: { x: 430, y: 380 },
  det_existe_bd: { x: 1040, y: 380 },
  ag_sac_haulmer: { x: 1260, y: 560 },
  det_tipificado: { x: 820, y: 540 },
  ag_onboarding: { x: 760, y: 720 },
  eq_customer_success: { x: 560, y: 720 },
  det_partner: { x: 1040, y: 700 },
  ag_partner: { x: 860, y: 840 },
};

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const target = path.join(root, "src/data/ecosystem.json");

const data = JSON.parse(readFileSync(target, "utf8")) as {
  nodos: Nodo[];
  aristas: Arista[];
};

const embudoIds = new Set<string>();
for (const arista of data.aristas) {
  if (arista.vista === "embudo") {
    embudoIds.add(arista.origen);
    embudoIds.add(arista.destino);
  }
}

for (const nodo of data.nodos) {
  if (!embudoIds.has(nodo.id)) continue;
  const pos = POS_EMBUDO[nodo.id];
  if (!pos) throw new Error(`Sin posEmbudo congelada para: ${nodo.id}`);
  nodo.posEmbudo = pos;
}

writeFileSync(target, `${JSON.stringify(data, null, 2)}\n`);
writeFileSync(path.join(root, "ecosystem.seed.json"), `${JSON.stringify(data, null, 2)}\n`);

console.log(`posEmbudo congelada: ${embudoIds.size} nodos del embudo.`);
