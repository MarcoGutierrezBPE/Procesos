import { describe, expect, it } from "vitest";
import { formatIssuePath, loadEcosystem } from "./ecosystem";

describe("loadEcosystem", () => {
  it("falla con la ruta del campo inválido", () => {
    const result = loadEcosystem({
      meta: {
        nombre: "x",
        organizacion: "Haulmer",
        version: "0",
        canal_entrada_unico: "whatsapp",
      },
      capas: [{ id: "c4", nombre: "Atención", orden: 4, descripcion: "área" }],
      nodos: [
        {
          id: "ag_sac",
          nombre: "Agente de Soporte",
          capa: "c4",
          tipo: "desconocido",
          estado: "produccion",
          descripcion: "x",
        },
      ],
      aristas: [],
      parametros: [],
      reglas_ruteo: [],
      campanas: [],
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues[0]?.path).toBe("nodos[0].tipo");
  });

  it("formatea la raíz", () => {
    expect(formatIssuePath([])).toBe("(raíz)");
  });
});
