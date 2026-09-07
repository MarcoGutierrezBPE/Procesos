import type { ReglaRuteo } from "../schema/ecosystem";

export type Perfil = {
  existe_en_bd: boolean;
  permanencia_dias: number;
  es_partner: boolean;
  en_campana_activa: boolean;
};

export type Clasificacion = {
  intencion: "VENTAS" | "SAC";
  dominio_tipificado?: "ventas" | "sac" | "onboarding" | "campanas";
  confianza: number;
};

export type ResultadoRuteo = {
  destino: string;
  regla_id: string;
  motivo: string;
  explicacion: string;
  path: string[];
};

type Contexto = {
  intencion: Clasificacion["intencion"];
  dominio_tipificado: Clasificacion["dominio_tipificado"];
  confianza: number;
  existe_en_bd: boolean;
  permanencia_dias: number;
  es_partner: boolean;
  en_campana_activa: boolean;
};

export function route(
  perfil: Perfil,
  clasificacion: Clasificacion,
  reglas: ReglaRuteo[],
): ResultadoRuteo {
  const ctx: Contexto = {
    intencion: clasificacion.intencion,
    dominio_tipificado: clasificacion.dominio_tipificado,
    confianza: clasificacion.confianza,
    existe_en_bd: perfil.existe_en_bd,
    permanencia_dias: perfil.permanencia_dias,
    es_partner: perfil.es_partner,
    en_campana_activa: perfil.en_campana_activa,
  };
  const ordenadas = [...reglas].sort((a, b) => a.prioridad - b.prioridad);
  for (const regla of ordenadas) {
    if (!matches(regla.cuando, ctx)) continue;
    return {
      destino: regla.destino,
      regla_id: regla.id,
      motivo: regla.motivo,
      explicacion: regla.explicacion,
      path: [...regla.path],
    };
  }
  throw new Error("Ninguna regla de ruteo aplica para este caso.");
}

function matches(cuando: Record<string, unknown>, ctx: Contexto): boolean {
  for (const [campo, esperado] of Object.entries(cuando)) {
    if (!(campo in ctx)) {
      throw new Error(`La regla usa el campo ${campo}, que no está en el perfil ni en la clasificación.`);
    }
    if (ctx[campo as keyof Contexto] !== esperado) return false;
  }
  return true;
}
