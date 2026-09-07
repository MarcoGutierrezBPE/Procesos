import type { Nodo } from "../schema/ecosystem";
import { Glyph } from "../visual/Glyph";
import { fillForTipo, radiusForTipo, strokeForTipo } from "../visual/look";

type Props = {
  nodo: Nodo;
  neighbor: boolean;
  compact?: boolean;
  selected: boolean;
  missingPos: boolean;
  dimmed?: boolean;
  onRoute?: boolean;
  onSelect: (id: string) => void;
};

export function NodoView({
  nodo,
  neighbor,
  compact = false,
  selected,
  missingPos,
  dimmed = false,
  onRoute = false,
  onSelect,
}: Props) {
  if (!nodo.pos && !missingPos) {
    throw new Error(`Nodo ${nodo.id} sin posición y sin marca de ausencia`);
  }
  const pos = nodo.pos ?? { x: 0, y: 0 };
  const r = Math.max(5, Math.round(radiusForTipo(nodo.tipo, neighbor) * (compact ? 0.42 : 1)));
  const stroke = strokeForTipo(nodo.tipo);
  const fill = fillForTipo(nodo.tipo);
  const dashed = nodo.estado === "propuesto";
  const opacity = dimmed ? 0.28 : neighbor ? 0.38 : 1;
  const lines = wrapLabel(nodo.nombre);

  return (
    <g
      className={onRoute ? "node is-route" : "node"}
      transform={`translate(${pos.x} ${pos.y})`}
      opacity={opacity}
      style={{ cursor: "pointer" }}
      tabIndex={0}
      role="button"
      aria-label={nodo.nombre}
      aria-pressed={selected}
      data-on-route={onRoute ? "true" : undefined}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(nodo.id);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect(nodo.id);
        }
      }}
    >
      <circle
        className="halo"
        r={r + 14}
        fill={onRoute ? "var(--signal)" : "var(--star)"}
        fillOpacity={selected || onRoute ? 0.14 : 0}
      />
      {missingPos ? (
        <circle r={r + 6} fill="none" stroke="var(--alert)" strokeDasharray="2 3" />
      ) : null}
      <circle
        className="core"
        r={r}
        fill={fill}
        stroke={stroke}
        strokeWidth={nodo.tipo === "agente" ? 0 : 1.35}
        strokeDasharray={dashed ? "3 3" : undefined}
      />
      <g color={stroke} transform={compact ? "scale(0.55)" : undefined}>
        <Glyph tipo={nodo.tipo} filled={nodo.tipo === "agente"} />
      </g>
      {!compact ? (
        <text
          y={r + 20}
          textAnchor="middle"
          fill="var(--star)"
          fontSize={neighbor ? 10 : 13}
          style={{ fontFamily: "var(--font-ui)" }}
        >
          {lines.map((line, index) => (
            <tspan key={line} x={0} dy={index === 0 ? 0 : 14}>
              {line}
            </tspan>
          ))}
        </text>
      ) : null}
      {missingPos ? (
        <text
          y={r + 30}
          textAnchor="middle"
          fill="var(--alert)"
          fontSize={9}
          style={{ fontFamily: "var(--font-mono)" }}
        >
          sin posición
        </text>
      ) : null}
    </g>
  );
}

function wrapLabel(nombre: string): string[] {
  if (nombre.length <= 28) return [nombre];
  const cut = nombre.lastIndexOf(" ", 28);
  if (cut <= 0) return [nombre];
  return [nombre.slice(0, cut), nombre.slice(cut + 1)];
}
