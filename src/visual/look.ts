import type { TipoArista, TipoNodo } from "../schema/ecosystem";

export function strokeForTipo(tipo: TipoNodo): string {
  if (tipo === "agente") return "var(--star)";
  if (tipo === "humano") return "var(--alert)";
  if (tipo === "dato") return "var(--dato)";
  return "var(--det)";
}

export function fillForTipo(tipo: TipoNodo): string {
  if (tipo === "agente") return "var(--star)";
  return "transparent";
}

export function radiusForTipo(tipo: TipoNodo, neighbor: boolean): number {
  const base =
    tipo === "externo"
      ? 24
      : tipo === "agente"
        ? 22
        : tipo === "humano" || tipo === "equipo"
          ? 16
          : 15;
  return neighbor ? Math.round(base * 0.72) : base;
}

export function edgeStroke(tipo: TipoArista): string {
  if (tipo === "fallback") return "var(--alert)";
  return "var(--wire)";
}

export function edgeDash(tipo: TipoArista): string | undefined {
  if (tipo === "lectura") return "4 5";
  if (tipo === "escritura") return "1 4";
  return undefined;
}

export function edgeWidth(tipo: TipoArista): number {
  if (tipo === "fallback") return 1.4;
  if (tipo === "flujo") return 1.15;
  return 0.9;
}
