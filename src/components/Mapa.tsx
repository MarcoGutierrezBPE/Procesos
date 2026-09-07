import { useEffect, useMemo, useReducer, useState } from "react";
import { zoomIdentity } from "d3-zoom";
import { config } from "../config";
import { route, type ResultadoRuteo } from "../engine/router";
import type { Capa, Campana, Ecosystem, Nodo } from "../schema/ecosystem";
import { findOrphanEdges } from "../schema/ecosystem";
import { nebulaPath } from "../visual/nebula";
import { AristaView } from "./Arista";
import { CampoEstelar } from "./CampoEstelar";
import { NodoView } from "./Nodo";
import { PanelDetalle } from "./PanelDetalle";
import { PanelSimulacion, type Dominio, type Intencion, type RespuestasSim } from "./PanelSimulacion";

type Props = {
  data: Ecosystem;
};

type Vista = "galaxia" | "conversacion" | "embudo";

type State = {
  view: Vista;
  focusLayerId: string | null;
  selectedId: string | null;
  campaignId: string | null;
  esperaRespuesta: boolean;
  permanenciaDias: number;
  esPartner: boolean;
  descripcion: string;
  intencion: Intencion;
  dominio: Dominio;
  simPath: string[] | null;
  simRevealed: number;
  simResult: ResultadoRuteo | null;
};

type Action =
  | { type: "setView"; view: Vista }
  | { type: "enterLayer"; id: string }
  | { type: "select"; id: string }
  | { type: "clear" }
  | { type: "up" }
  | { type: "setCampaign"; id: string | null; answers: RespuestasSim }
  | { type: "setEspera"; value: boolean }
  | { type: "setPermanencia"; value: number }
  | { type: "setPartner"; value: boolean }
  | { type: "setDescripcion"; value: string }
  | { type: "setIntencion"; value: Intencion }
  | { type: "setDominio"; value: Dominio }
  | { type: "simulate"; result: ResultadoRuteo; revealed: number }
  | { type: "revealTick" }
  | { type: "resetSim"; answers: RespuestasSim };

const answersIdle: RespuestasSim = {
  esperaRespuesta: false,
  permanenciaDias: 0,
  esPartner: false,
  descripcion: "",
};

const simIdle = {
  simPath: null as string[] | null,
  simRevealed: 0,
  simResult: null as ResultadoRuteo | null,
};

function reducer(state: State, action: Action): State {
  if (action.type === "setView") {
    return {
      view: action.view,
      focusLayerId: null,
      selectedId: null,
      campaignId: null,
      ...answersIdle,
      intencion: "SAC",
      dominio: "sac",
      ...simIdle,
    };
  }
  if (action.type === "enterLayer") {
    return { ...state, focusLayerId: action.id, selectedId: null };
  }
  if (action.type === "select") {
    return { ...state, selectedId: action.id };
  }
  if (action.type === "clear") {
    return { ...state, selectedId: null };
  }
  if (action.type === "setCampaign") {
    return {
      ...state,
      campaignId: action.id,
      esperaRespuesta: action.answers.esperaRespuesta,
      permanenciaDias: action.answers.permanenciaDias,
      esPartner: action.answers.esPartner,
      descripcion: action.answers.descripcion,
      ...simIdle,
    };
  }
  if (action.type === "setEspera") {
    return { ...state, esperaRespuesta: action.value, ...simIdle };
  }
  if (action.type === "setPermanencia") {
    return { ...state, permanenciaDias: action.value, ...simIdle };
  }
  if (action.type === "setPartner") {
    return { ...state, esPartner: action.value, ...simIdle };
  }
  if (action.type === "setDescripcion") {
    return { ...state, descripcion: action.value, ...simIdle };
  }
  if (action.type === "setIntencion") {
    return { ...state, intencion: action.value, ...simIdle };
  }
  if (action.type === "setDominio") {
    return { ...state, dominio: action.value, ...simIdle };
  }
  if (action.type === "simulate") {
    return {
      ...state,
      simPath: action.result.path,
      simRevealed: action.revealed,
      simResult: action.result,
    };
  }
  if (action.type === "revealTick") {
    if (!state.simPath || state.simRevealed >= state.simPath.length) return state;
    return { ...state, simRevealed: state.simRevealed + 1 };
  }
  if (action.type === "resetSim") {
    return {
      ...state,
      esperaRespuesta: action.answers.esperaRespuesta,
      permanenciaDias: action.answers.permanenciaDias,
      esPartner: action.answers.esPartner,
      descripcion: action.answers.descripcion,
      ...simIdle,
    };
  }
  if (state.selectedId) return { ...state, selectedId: null };
  if (state.focusLayerId) return { ...state, focusLayerId: null, selectedId: null };
  return state;
}

export function Mapa({ data }: Props) {
  const [state, dispatch] = useReducer(reducer, {
    view: "galaxia",
    focusLayerId: null,
    selectedId: null,
    campaignId: null,
    ...answersIdle,
    intencion: "SAC",
    dominio: "sac",
    ...simIdle,
  });
  const reducedMotion = usePrefersReducedMotion();
  const isConversacion = state.view === "conversacion";
  const isEmbudo = state.view === "embudo";
  const isGalaxia = state.view === "galaxia";
  const isL1 = isGalaxia && state.focusLayerId === null;
  const focus = state.focusLayerId
    ? data.capas.find((capa) => capa.id === state.focusLayerId)
    : undefined;
  if (state.focusLayerId && !focus) {
    throw new Error(`No existe la capa ${state.focusLayerId} en ecosystem.json`);
  }
  if (isEmbudo && !data.textos?.embudo_intro) {
    throw new Error("Falta textos.embudo_intro en ecosystem.json");
  }

  const capaIds = useMemo(() => new Set(data.capas.map((capa) => capa.id)), [data.capas]);

  const focusIds = useMemo(() => {
    if (!state.focusLayerId) return new Set<string>();
    return new Set(
      data.nodos
        .filter((nodo) => nodo.capa === state.focusLayerId)
        .map((nodo) => nodo.id),
    );
  }, [data.nodos, state.focusLayerId]);

  const orphans = useMemo(() => findOrphanEdges(data), [data]);

  const synthetic = useMemo(() => {
    const existing = new Set(data.nodos.map((nodo) => nodo.id));
    const missing = [...new Set(orphans.map((item) => item.missing))];
    return missing
      .filter((id) => !existing.has(id))
      .map((id, index) => makeOrphanNode(id, index));
  }, [data.nodos, orphans]);

  const nodes = useMemo(() => [...data.nodos, ...synthetic], [data.nodos, synthetic]);
  const byId = useMemo(() => new Map(nodes.map((nodo) => [nodo.id, nodo])), [nodes]);

  const conversacionIds = useMemo(
    () => idsFromVista(data.aristas, "conversacion"),
    [data.aristas],
  );
  const embudoIds = useMemo(() => idsFromVista(data.aristas, "embudo"), [data.aristas]);

  const neighborIds = useMemo(() => {
    if (isL1 || isConversacion || isEmbudo) return new Set<string>();
    const ids = new Set<string>();
    for (const arista of data.aristas) {
      if (arista.vista === "conversacion" || arista.vista === "embudo") continue;
      const origenFocus = focusIds.has(arista.origen);
      const destinoFocus = focusIds.has(arista.destino);
      if (destinoFocus && !origenFocus) ids.add(arista.origen);
      if (origenFocus && !destinoFocus) ids.add(arista.destino);
    }
    for (const nodo of synthetic) ids.add(nodo.id);
    return ids;
  }, [data.aristas, focusIds, synthetic, isL1, isConversacion, isEmbudo]);

  const visibleNodes = useMemo(() => {
    if (isConversacion) {
      return nodes
        .filter((nodo) => conversacionIds.has(nodo.id))
        .map((nodo) => ({ ...nodo, pos: nodo.posFlujo }));
    }
    if (isEmbudo) {
      return nodes
        .filter((nodo) => embudoIds.has(nodo.id))
        .map((nodo) => ({ ...nodo, pos: nodo.posEmbudo }));
    }
    return nodes.filter((nodo) => capaIds.has(nodo.capa) || nodo.capa === "orphan");
  }, [nodes, isConversacion, isEmbudo, conversacionIds, embudoIds, capaIds]);

  const placedWithoutPos = useMemo(() => {
    return visibleNodes
      .filter((nodo) => !nodo.pos)
      .map((nodo, index) => ({
        ...nodo,
        pos: { x: 120 + index * 140, y: config.mapHeight - 70 },
      }));
  }, [visibleNodes]);

  const drawable = useMemo(() => {
    const extras = new Map(placedWithoutPos.map((nodo) => [nodo.id, nodo]));
    return visibleNodes.map((nodo) => extras.get(nodo.id) ?? nodo);
  }, [visibleNodes, placedWithoutPos]);

  const drawableById = useMemo(
    () => new Map(drawable.map((nodo) => [nodo.id, nodo])),
    [drawable],
  );

  const visibleEdges = useMemo(() => {
    return data.aristas.filter((arista) => {
      const a = drawableById.has(arista.origen);
      const b = drawableById.has(arista.destino);
      if (!a || !b) return false;
      if (isConversacion) return arista.vista === "conversacion";
      if (isEmbudo) return arista.vista === "embudo";
      if (arista.vista === "conversacion" || arista.vista === "embudo") return false;
      if (isL1) return true;
      return (
        focusIds.has(arista.origen) ||
        focusIds.has(arista.destino) ||
        neighborIds.has(arista.origen) ||
        neighborIds.has(arista.destino)
      );
    });
  }, [data.aristas, drawableById, focusIds, neighborIds, isL1, isConversacion, isEmbudo]);

  const selected = state.selectedId
    ? (drawableById.get(state.selectedId) ?? byId.get(state.selectedId))
    : undefined;

  const nombres = useMemo(() => {
    return new Map(nodes.map((nodo) => [nodo.id, nodo.nombre]));
  }, [nodes]);

  const clusters = useMemo(() => {
    if (isConversacion || isEmbudo) return [];
    return data.capas
      .slice()
      .sort((a, b) => a.orden - b.orden)
      .map((capa) => clusterFor(capa, drawable));
  }, [data.capas, drawable, isConversacion, isEmbudo]);

  const camera = useMemo(() => {
    if (isConversacion || isEmbudo || isL1 || !focus) return zoomIdentity;
    const pts = drawable.flatMap((nodo) =>
      nodo.capa === focus.id && nodo.pos ? [nodo.pos] : [],
    );
    if (pts.length === 0) return zoomIdentity;
    const minX = Math.min(...pts.map((p) => p.x));
    const maxX = Math.max(...pts.map((p) => p.x));
    const minY = Math.min(...pts.map((p) => p.y));
    const maxY = Math.max(...pts.map((p) => p.y));
    const pad = 140;
    const bw = Math.max(maxX - minX + pad * 2, 420);
    const bh = Math.max(maxY - minY + pad * 2, 320);
    const k = Math.min(config.mapWidth / bw, config.mapHeight / bh, 2.6);
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    return zoomIdentity
      .translate(config.mapWidth / 2, config.mapHeight / 2)
      .scale(k)
      .translate(-cx, -cy);
  }, [drawable, focus, isL1, isConversacion, isEmbudo]);

  const revealedIds = useMemo(() => {
    if (!state.simPath) return null;
    return new Set(state.simPath.slice(0, state.simRevealed));
  }, [state.simPath, state.simRevealed]);

  const activeEdges = useMemo(() => {
    const keys = new Set<string>();
    if (!state.simPath) return keys;
    const shown = state.simPath.slice(0, state.simRevealed);
    for (let i = 0; i < shown.length - 1; i += 1) {
      keys.add(`${shown[i]}>${shown[i + 1]}`);
    }
    return keys;
  }, [state.simPath, state.simRevealed]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") dispatch({ type: "up" });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!state.simPath) return;
    if (state.simRevealed >= state.simPath.length) return;
    const timer = window.setTimeout(() => dispatch({ type: "revealTick" }), 400);
    return () => window.clearTimeout(timer);
  }, [state.simPath, state.simRevealed]);

  const onBackground = () => {
    dispatch({ type: "up" });
  };

  const runSim = () => {
    if (state.campaignId) {
      const campana = data.campanas.find((item) => item.id === state.campaignId);
      if (!campana) {
        throw new Error(`No existe la campaña ${state.campaignId} en ecosystem.json`);
      }
    }
    const perfil = {
      existe_en_bd: state.esperaRespuesta,
      permanencia_dias: state.permanenciaDias,
      es_partner: state.esPartner,
      en_campana_activa: state.campaignId !== null && state.esperaRespuesta,
    };
    const clasificacion = {
      intencion: state.intencion,
      dominio_tipificado:
        state.intencion === "SAC" && perfil.existe_en_bd ? state.dominio : undefined,
      confianza: 1,
    };
    const result = route(perfil, clasificacion, data.reglas_ruteo);
    dispatch({
      type: "simulate",
      result,
      revealed: reducedMotion ? result.path.length : 1,
    });
  };

  const showPanel = Boolean(selected) && (isConversacion || isEmbudo || !isL1);

  return (
    <div className="mapa">
      <CampoEstelar density={isL1 || isConversacion || isEmbudo ? "dense" : "medium"} />
      <nav className="vista-bar" aria-label="Vistas">
        <button
          type="button"
          className={state.view === "galaxia" ? "vista-btn is-active" : "vista-btn"}
          aria-current={state.view === "galaxia" ? "page" : undefined}
          onClick={() => dispatch({ type: "setView", view: "galaxia" })}
        >
          Haulmer Grid
        </button>
        <button
          type="button"
          className={state.view === "conversacion" ? "vista-btn is-active" : "vista-btn"}
          aria-current={state.view === "conversacion" ? "page" : undefined}
          onClick={() => dispatch({ type: "setView", view: "conversacion" })}
        >
          Conversación
        </button>
        <button
          type="button"
          className={state.view === "embudo" ? "vista-btn is-active" : "vista-btn"}
          aria-current={state.view === "embudo" ? "page" : undefined}
          onClick={() => dispatch({ type: "setView", view: "embudo" })}
        >
          Embudo
        </button>
      </nav>
      {isGalaxia ? (
        <nav className="crumbs" aria-label="Ubicación">
          <button type="button" className="crumb" onClick={() => dispatch({ type: "up" })}>
            Ecosistema
          </button>
          {focus ? (
            <>
              <span aria-hidden="true"> / </span>
              <span>{focus.nombre}</span>
            </>
          ) : null}
        </nav>
      ) : null}
      <svg
        viewBox={`0 0 ${config.mapWidth} ${config.mapHeight}`}
        role="img"
        aria-label={
          isEmbudo
            ? "Embudo de ruteo"
            : isConversacion
              ? "Flujo de conversación"
              : focus
                ? `Área ${focus.nombre}`
                : "Ecosistema Haulmer"
        }
        onClick={onBackground}
      >
        <defs>
          <filter id="nebula-blur" x="-45%" y="-45%" width="190%" height="190%">
            <feGaussianBlur stdDeviation="16" />
          </filter>
          <filter id="nebula-blur-meta" x="-50%" y="-80%" width="200%" height="260%">
            <feGaussianBlur stdDeviation="18" />
          </filter>
        </defs>
        <g className="scene" transform={camera.toString()}>
          <text
            className="watermark"
            x={config.mapWidth / 2}
            y={
              isL1 || isConversacion || isEmbudo
                ? config.mapHeight / 2 - 20
                : config.mapHeight / 2 + 40
            }
            textAnchor="middle"
          >
            {config.watermark}
          </text>
          {clusters.map((cluster) =>
            cluster.path ? (
              <g key={cluster.capa.id}>
                <path
                  className={cluster.isMeta ? "nebula meta" : "nebula"}
                  d={cluster.path}
                  fill="var(--star)"
                  fillOpacity={
                    isL1 ? 0.04 : cluster.capa.id === focus?.id ? 0.055 : 0.018
                  }
                  filter={cluster.isMeta ? "url(#nebula-blur-meta)" : "url(#nebula-blur)"}
                  onClick={(event) => {
                    event.stopPropagation();
                    dispatch({ type: "enterLayer", id: cluster.capa.id });
                  }}
                />
                <text
                  className={
                    cluster.capa.id === config.metaLayerId ? "area-label meta-label" : "area-label"
                  }
                  x={cluster.labelX}
                  y={cluster.labelY}
                  textAnchor="middle"
                  onClick={(event) => {
                    event.stopPropagation();
                    dispatch({ type: "enterLayer", id: cluster.capa.id });
                  }}
                >
                  {cluster.capa.nombre}
                </text>
                <text
                  className="area-count"
                  x={cluster.labelX}
                  y={cluster.labelY + 18}
                  textAnchor="middle"
                  onClick={(event) => {
                    event.stopPropagation();
                    dispatch({ type: "enterLayer", id: cluster.capa.id });
                  }}
                >
                  {cluster.nodeCount} {cluster.nodeCount === 1 ? "nodo" : "nodos"}
                  {cluster.agentCount > 0
                    ? ` · ${cluster.agentCount} ${cluster.agentCount === 1 ? "agente" : "agentes"}`
                    : ""}
                </text>
              </g>
            ) : null,
          )}
          {visibleEdges.map((arista) => {
            const origen = drawableById.get(arista.origen);
            const destino = drawableById.get(arista.destino);
            if (!origen || !destino) return null;
            const internal = isConversacion || isEmbudo
              ? true
              : isL1
                ? origen.capa === destino.capa
                : focusIds.has(arista.origen) && focusIds.has(arista.destino);
            const edgeKey = `${arista.origen}>${arista.destino}`;
            const simulating = revealedIds !== null;
            return (
              <AristaView
                key={`${arista.origen}-${arista.destino}-${arista.tipo}-${arista.etiqueta ?? ""}`}
                arista={arista}
                origen={origen}
                destino={destino}
                neighbor={!internal}
                pulse={isConversacion}
                active={activeEdges.has(edgeKey)}
                dimmed={simulating && !activeEdges.has(edgeKey)}
                alwaysShowCondition={isEmbudo}
              />
            );
          })}
          {drawable.map((nodo) => {
            const inFocus = isConversacion || isEmbudo || isL1 || focusIds.has(nodo.id);
            const isNeighbor = isGalaxia && !isL1 && !focusIds.has(nodo.id);
            const onRoute = revealedIds?.has(nodo.id) ?? false;
            const dimmed = revealedIds !== null && !onRoute;
            return (
              <NodoView
                key={nodo.id}
                nodo={nodo}
                neighbor={isNeighbor}
                compact={!isConversacion && !isEmbudo && (isL1 || isNeighbor)}
                selected={state.selectedId === nodo.id}
                missingPos={placedWithoutPos.some((item) => item.id === nodo.id)}
                dimmed={dimmed}
                onRoute={onRoute}
                onSelect={(id) => {
                  if (isConversacion || isEmbudo) {
                    dispatch({ type: "select", id });
                    return;
                  }
                  if (isL1) {
                    dispatch({ type: "enterLayer", id: nodo.capa });
                    return;
                  }
                  if (isNeighbor) {
                    dispatch({ type: "enterLayer", id: nodo.capa });
                    return;
                  }
                  if (inFocus) dispatch({ type: "select", id });
                }}
              />
            );
          })}
        </g>
      </svg>
      {isEmbudo ? (
        <PanelSimulacion
          intro={data.textos?.embudo_intro ?? ""}
          campanas={data.campanas}
          campaignId={state.campaignId}
          respuestas={{
            esperaRespuesta: state.esperaRespuesta,
            permanenciaDias: state.permanenciaDias,
            esPartner: state.esPartner,
            descripcion: state.descripcion,
          }}
          intencion={state.intencion}
          dominio={state.dominio}
          resultado={state.simResult}
          onCampaign={(id) => {
            const campana = id
              ? data.campanas.find((item) => item.id === id)
              : undefined;
            if (id && !campana) {
              throw new Error(`No existe la campaña ${id} en ecosystem.json`);
            }
            dispatch({ type: "setCampaign", id, answers: answersFromCampaign(campana) });
          }}
          onEspera={(value) => dispatch({ type: "setEspera", value })}
          onPermanencia={(value) => dispatch({ type: "setPermanencia", value })}
          onPartner={(value) => dispatch({ type: "setPartner", value })}
          onDescripcion={(value) => dispatch({ type: "setDescripcion", value })}
          onIntencion={(value) => dispatch({ type: "setIntencion", value })}
          onDominio={(value) => dispatch({ type: "setDominio", value })}
          onExecute={runSim}
          onReset={() => {
            const campana = state.campaignId
              ? data.campanas.find((item) => item.id === state.campaignId)
              : undefined;
            if (state.campaignId && !campana) {
              throw new Error(`No existe la campaña ${state.campaignId} en ecosystem.json`);
            }
            dispatch({ type: "resetSim", answers: answersFromCampaign(campana) });
          }}
        />
      ) : null}
      {showPanel && selected ? (
        <PanelDetalle
          nodo={selected}
          capa={data.capas.find((capa) => capa.id === selected.capa)}
          parametros={data.parametros}
          nombres={nombres}
          onClose={() => dispatch({ type: "clear" })}
        />
      ) : null}
    </div>
  );
}

function idsFromVista(
  aristas: Ecosystem["aristas"],
  vista: "conversacion" | "embudo",
): Set<string> {
  const ids = new Set<string>();
  for (const arista of aristas) {
    if (arista.vista !== vista) continue;
    ids.add(arista.origen);
    ids.add(arista.destino);
  }
  return ids;
}

function answersFromCampaign(campana: Campana | undefined): RespuestasSim {
  if (!campana) return answersIdle;
  if (!campana.espera_respuesta) {
    return {
      esperaRespuesta: false,
      permanenciaDias: 0,
      esPartner: false,
      descripcion: campana.descripcion ?? "",
    };
  }
  if (campana.tiempo_permanencia_dias === undefined) {
    throw new Error(`La campaña ${campana.id} espera respuesta y no trae tiempo_permanencia_dias`);
  }
  if (campana.es_partner === undefined) {
    throw new Error(`La campaña ${campana.id} espera respuesta y no trae es_partner`);
  }
  return {
    esperaRespuesta: true,
    permanenciaDias: campana.tiempo_permanencia_dias,
    esPartner: campana.es_partner,
    descripcion: campana.descripcion ?? "",
  };
}

function clusterFor(capa: Capa, nodos: Nodo[]) {
  const pts = nodos.flatMap((nodo) =>
    nodo.capa === capa.id && nodo.pos ? [nodo.pos] : [],
  );
  const nodeCount = nodos.filter((nodo) => nodo.capa === capa.id).length;
  const agentCount = nodos.filter(
    (nodo) => nodo.capa === capa.id && nodo.tipo === "agente",
  ).length;
  if (pts.length === 0) {
    return {
      capa,
      path: null as null,
      labelX: 0,
      labelY: 0,
      nodeCount,
      agentCount,
      isMeta: false,
    };
  }
  const cx = pts.reduce((sum, pos) => sum + pos.x, 0) / pts.length;
  const isMeta = capa.id === config.metaLayerId;
  const pad = isMeta ? 48 : 62;
  const path = nebulaPath(pts, pad, seedFromId(capa.id), isMeta ? 0.38 : 1);
  const minY = Math.min(...pts.map((pos) => pos.y));
  const maxY = Math.max(...pts.map((pos) => pos.y));
  const labelY = isMeta ? maxY + 54 : minY - 78;
  return {
    capa,
    path,
    labelX: cx,
    labelY,
    nodeCount,
    agentCount,
    isMeta,
  };
}

function seedFromId(id: string): number {
  let n = 0;
  for (let i = 0; i < id.length; i += 1) {
    n = (n * 31 + id.charCodeAt(i)) | 0;
  }
  return Math.abs(n) + 1;
}

function makeOrphanNode(id: string, index: number): Nodo {
  return {
    id,
    nombre: id,
    capa: "orphan",
    tipo: "determinista",
    estado: "propuesto",
    descripcion: "Nodo huérfano: aparece en una arista y no está en la lista de nodos.",
    pos: { x: 80 + index * 110, y: 70 },
  };
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return reduced;
}
