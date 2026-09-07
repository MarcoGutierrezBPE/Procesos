/** Decisiones abiertas del contexto, en un solo lugar. */
export const config = {
  umbralOnboardingDias: 30,
  umbralOnboardingCampo: "fecha_compra" as const,
  partnerEsNodoApart: true,
  metaLayerId: "meta",
  flujoLayerId: "flujo",
  watermark: "HAULMER",
  mapWidth: 1400,
  mapHeight: 900,
} as const;
