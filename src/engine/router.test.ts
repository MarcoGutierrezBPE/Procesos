import { describe, expect, it } from "vitest";
import raw from "../data/ecosystem.json";
import { loadEcosystem } from "../schema/ecosystem";
import { route, type Clasificacion, type Perfil } from "./router";

const loaded = loadEcosystem(raw);
if (!loaded.ok) {
  throw new Error(loaded.issues.map((issue) => `${issue.path}: ${issue.message}`).join("; "));
}
const { reglas_ruteo: reglas } = loaded.data;

const basePerfil: Perfil = {
  existe_en_bd: false,
  permanencia_dias: 0,
  es_partner: false,
  en_campana_activa: false,
};

const baseClasificacion: Clasificacion = {
  intencion: "SAC",
  confianza: 1,
};

describe("route", () => {
  it("intención Ventas va al Agente IA Ventas y no entra al embudo SAC", () => {
    const result = route(basePerfil, { ...baseClasificacion, intencion: "VENTAS" }, reglas);
    expect(result.destino).toBe("ag_ventas");
    expect(result.regla_id).toBe("r_ventas");
    expect(result.path).toEqual(["cliente", "ag_clasificador", "ag_ventas"]);
  });

  it("SAC sin número en la base sale directo al Agente IA SAC", () => {
    const result = route(basePerfil, baseClasificacion, reglas);
    expect(result.destino).toBe("ag_sac_haulmer");
    expect(result.regla_id).toBe("r_sac_no_bd");
    expect(result.path).toEqual(["cliente", "ag_clasificador", "det_existe_bd", "ag_sac_haulmer"]);
    expect(result.path).not.toContain("det_tipificado");
    expect(result.path).not.toContain("det_partner");
  });

  it("SAC en base con tipificado ONB va a Onboarding", () => {
    const result = route(
      { ...basePerfil, existe_en_bd: true, permanencia_dias: 20, en_campana_activa: true },
      { ...baseClasificacion, dominio_tipificado: "onboarding" },
      reglas,
    );
    expect(result.destino).toBe("ag_onboarding");
    expect(result.regla_id).toBe("r_sac_onboarding");
    expect(result.path).toEqual([
      "cliente",
      "ag_clasificador",
      "det_existe_bd",
      "det_tipificado",
      "ag_onboarding",
    ]);
  });

  it("SAC en base, tipificado SAC y Partner va al Agente IA Partner", () => {
    const result = route(
      {
        ...basePerfil,
        existe_en_bd: true,
        es_partner: true,
        permanencia_dias: 5,
        en_campana_activa: true,
      },
      { ...baseClasificacion, dominio_tipificado: "sac" },
      reglas,
    );
    expect(result.destino).toBe("ag_partner");
    expect(result.regla_id).toBe("r_sac_partner");
    expect(result.path.at(-1)).toBe("ag_partner");
  });

  it("SAC en base, tipificado SAC y no Partner va al Agente IA SAC", () => {
    const result = route(
      {
        ...basePerfil,
        existe_en_bd: true,
        es_partner: false,
        permanencia_dias: 20,
        en_campana_activa: true,
      },
      { ...baseClasificacion, dominio_tipificado: "sac" },
      reglas,
    );
    expect(result.destino).toBe("ag_sac_haulmer");
    expect(result.regla_id).toBe("r_sac_no_partner");
    expect(result.path).toEqual([
      "cliente",
      "ag_clasificador",
      "det_existe_bd",
      "det_tipificado",
      "det_partner",
      "ag_sac_haulmer",
    ]);
  });
});
