import { config } from "../config";
import type { Capa, Nodo, Parametro } from "../schema/ecosystem";

type Props = {
  nodo: Nodo;
  capa: Capa | undefined;
  parametros: Parametro[];
  nombres: Map<string, string>;
  onClose: () => void;
};

const ESTADO: Record<Nodo["estado"], string> = {
  produccion: "Producción",
  desarrollo: "En desarrollo",
  propuesto: "Propuesto",
};

const TIPO: Record<Nodo["tipo"], string> = {
  agente: "Agente IA",
  determinista: "Paso determinista",
  dato: "Dato",
  externo: "Externo",
  humano: "Humano",
  equipo: "Equipo",
};

export function PanelDetalle({ nodo, capa, parametros, nombres, onClose }: Props) {
  const leidos = (nodo.parametros_lee ?? []).map((id) => {
    const param = parametros.find((item) => item.id === id);
    return param ? param.nombre : id;
  });
  const escritos = (nodo.escribe_en ?? []).map((id) => nombres.get(id) ?? id);

  return (
    <aside className="panel-detalle" aria-labelledby="detalle-titulo">
      <header>
        <p className="kicker">
          {capa
            ? capa.nombre
            : nodo.capa === config.flujoLayerId
              ? "Conversación"
              : nodo.capa}
        </p>
        <div className="title-row">
          <h2 id="detalle-titulo">{nodo.nombre}</h2>
          <button type="button" onClick={onClose} aria-label="Cerrar detalle">
            Cerrar
          </button>
        </div>
        <p className="id">{nodo.id}</p>
      </header>

      <dl>
        <Item label="Tipo" value={TIPO[nodo.tipo]} />
        <Item label="Estado" value={ESTADO[nodo.estado]} />
        <Item label="Descripción" value={nodo.descripcion} />
        {nodo.modelo ? <Item label="Modelo" value={nodo.modelo} /> : null}
        {nodo.herramientas && nodo.herramientas.length > 0 ? (
          <Item label="Herramientas" value={nodo.herramientas.join(", ")} />
        ) : null}
        {leidos.length > 0 ? (
          <Item label="Parámetros que lee" value={leidos.join(", ")} />
        ) : null}
        {escritos.length > 0 ? <Item label="Escribe en" value={escritos.join(", ")} /> : null}
        {nodo.kb_namespaces && nodo.kb_namespaces.length > 0 ? (
          <Item label="Espacios de conocimiento" value={nodo.kb_namespaces.join(", ")} />
        ) : null}
        {nodo.workflow_n8n ? (
          <Item label="Workflow n8n" value={nodo.workflow_n8n} mono />
        ) : null}
      </dl>
    </aside>
  );
}

function Item({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <dt>{label}</dt>
      <dd className={mono ? "mono" : undefined}>{value}</dd>
    </div>
  );
}
