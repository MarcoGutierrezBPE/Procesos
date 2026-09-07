import { z } from "zod";

export const TipoNodo = z.enum([
  "agente",
  "determinista",
  "dato",
  "externo",
  "humano",
  "equipo",
]);
export type TipoNodo = z.infer<typeof TipoNodo>;

export const EstadoNodo = z.enum(["produccion", "desarrollo", "propuesto"]);
export type EstadoNodo = z.infer<typeof EstadoNodo>;

export const TipoArista = z.enum(["flujo", "lectura", "escritura", "fallback"]);
export type TipoArista = z.infer<typeof TipoArista>;

export const TipoParametro = z.enum(["bool", "int", "enum", "string", "date"]);

export const CapaSchema = z.object({
  id: z.string().min(1),
  nombre: z.string().min(1),
  orden: z.number(),
  descripcion: z.string().min(1),
});
export type Capa = z.infer<typeof CapaSchema>;

export const PosSchema = z.object({
  x: z.number(),
  y: z.number(),
});

export const NodoSchema = z.object({
  id: z.string().min(1),
  nombre: z.string().min(1),
  capa: z.string().min(1),
  tipo: TipoNodo,
  estado: EstadoNodo,
  descripcion: z.string().min(1),
  modelo: z.string().optional(),
  herramientas: z.array(z.string()).optional(),
  parametros_lee: z.array(z.string()).optional(),
  escribe_en: z.array(z.string()).optional(),
  kb_namespaces: z.array(z.string()).optional(),
  workflow_n8n: z.string().optional(),
  pos: PosSchema.optional(),
  posFlujo: PosSchema.optional(),
  posEmbudo: PosSchema.optional(),
});
export type Nodo = z.infer<typeof NodoSchema>;

export const AristaSchema = z.object({
  origen: z.string().min(1),
  destino: z.string().min(1),
  tipo: TipoArista,
  etiqueta: z.string().optional(),
  condicion: z.string().optional(),
  vista: z.enum(["galaxia", "conversacion", "embudo"]).optional(),
});
export type Arista = z.infer<typeof AristaSchema>;

export const ParametroSchema = z.object({
  id: z.string().min(1),
  nombre: z.string().min(1),
  fuente: z.string().min(1),
  tipo: TipoParametro,
  valores: z.array(z.string()).optional(),
  derivado_de: z.string().optional(),
  usado_por: z.array(z.string()).min(1),
});
export type Parametro = z.infer<typeof ParametroSchema>;

export const CampanaSchema = z.object({
  id: z.string().min(1),
  nombre: z.string().min(1),
  espera_respuesta: z.boolean(),
  tiempo_permanencia_dias: z.number().int().optional(),
  descripcion: z.string().optional(),
  es_partner: z.boolean().optional(),
});
export type Campana = z.infer<typeof CampanaSchema>;

export const ReglaRuteoSchema = z.object({
  id: z.string().min(1),
  prioridad: z.number(),
  cuando: z.record(z.unknown()),
  destino: z.string().min(1),
  motivo: z.string().min(1),
  explicacion: z.string().min(1),
  path: z.array(z.string().min(1)).min(1),
});
export type ReglaRuteo = z.infer<typeof ReglaRuteoSchema>;

export const TextosSchema = z.object({
  embudo_intro: z.string().min(1),
});

export const MetaSchema = z.object({
  nombre: z.string().min(1),
  organizacion: z.string().min(1),
  version: z.string().min(1),
  canal_entrada_unico: z.string().min(1).optional(),
});

export const EcosystemSchema = z.object({
  meta: MetaSchema,
  capas: z.array(CapaSchema).min(1),
  nodos: z.array(NodoSchema).min(1),
  aristas: z.array(AristaSchema),
  parametros: z.array(ParametroSchema),
  reglas_ruteo: z.array(ReglaRuteoSchema),
  campanas: z.array(CampanaSchema),
  textos: TextosSchema.optional(),
});
export type Ecosystem = z.infer<typeof EcosystemSchema>;

export type SchemaIssue = {
  path: string;
  message: string;
};

export type LoadResult =
  | { ok: true; data: Ecosystem }
  | { ok: false; issues: SchemaIssue[] };

export function formatIssuePath(path: PropertyKey[]): string {
  if (path.length === 0) return "(raíz)";
  return path
    .map((segment, index) => {
      if (typeof segment === "number") return `[${segment}]`;
      return index === 0 ? String(segment) : `.${String(segment)}`;
    })
    .join("");
}

export function loadEcosystem(raw: unknown): LoadResult {
  const parsed = EcosystemSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => ({
      path: formatIssuePath(issue.path),
      message: issue.message,
    }));
    return { ok: false, issues };
  }
  return { ok: true, data: parsed.data };
}

export type OrphanEdge = {
  origen: string;
  destino: string;
  missing: string;
};

export function findOrphanEdges(data: Ecosystem): OrphanEdge[] {
  const ids = new Set(data.nodos.map((nodo) => nodo.id));
  const orphans: OrphanEdge[] = [];
  for (const arista of data.aristas) {
    if (!ids.has(arista.origen)) {
      orphans.push({
        origen: arista.origen,
        destino: arista.destino,
        missing: arista.origen,
      });
    }
    if (!ids.has(arista.destino)) {
      orphans.push({
        origen: arista.origen,
        destino: arista.destino,
        missing: arista.destino,
      });
    }
  }
  return orphans;
}
