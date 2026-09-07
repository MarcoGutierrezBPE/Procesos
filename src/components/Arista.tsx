import { useEffect, useState } from "react";
import type { Arista, Nodo } from "../schema/ecosystem";
import { edgeDash, edgeStroke, edgeWidth } from "../visual/look";

type Props = {
  arista: Arista;
  origen: Nodo;
  destino: Nodo;
  neighbor: boolean;
  pulse?: boolean;
  active?: boolean;
  dimmed?: boolean;
  alwaysShowCondition?: boolean;
};

export function AristaView({
  arista,
  origen,
  destino,
  neighbor,
  pulse = false,
  active = false,
  dimmed = false,
  alwaysShowCondition = false,
}: Props) {
  const a = origen.pos;
  const b = destino.pos;
  if (!a || !b) return null;

  const [hover, setHover] = useState(false);
  const reduced = usePrefersReducedMotion();
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const tipX = b.x - ux * 22;
  const tipY = b.y - uy * 22;
  const label = hover || !neighbor ? arista.etiqueta : undefined;
  const showCondition = alwaysShowCondition
    ? Boolean(arista.condicion)
    : hover && Boolean(arista.condicion);
  const d = `M ${a.x} ${a.y} L ${tipX} ${tipY}`;
  const opacity = dimmed ? 0.18 : neighbor ? 0.32 : 0.85;
  const stroke = active ? "var(--signal)" : edgeStroke(arista.tipo);
  const width = active ? 1.7 : edgeWidth(arista.tipo);

  if (pulse) {
    return (
      <g
        className="arista-pulso"
        opacity={neighbor ? 0.55 : 0.95}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        <path d={d} fill="none" stroke="transparent" strokeWidth={14} />
        <path
          className="pulse-base"
          d={d}
          fill="none"
          stroke="var(--wire)"
          strokeWidth={1.1}
        />
        <path
          className={reduced ? "pulse-signal is-static" : "pulse-signal"}
          d={d}
          fill="none"
          pathLength={1}
          stroke="var(--signal)"
          strokeWidth={1.35}
          strokeLinecap="round"
        />
        {reduced ? (
          <circle className="pulse-dot" cx={mx} cy={my} r={2.4} fill="var(--signal)" />
        ) : (
          <circle
            className="pulse-dot"
            r={2.6}
            fill="var(--signal)"
            style={{ offsetPath: `path("${d}")` }}
          />
        )}
        {label ? (
          <text
            x={mx}
            y={my - 8}
            textAnchor="middle"
            fill="var(--mute)"
            fontSize={10}
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {label}
          </text>
        ) : null}
        {showCondition ? (
          <text
            x={mx}
            y={my + (label ? 10 : -6)}
            textAnchor="middle"
            fill="var(--signal)"
            fontSize={10}
            style={{ fontFamily: "var(--font-ui)" }}
          >
            {arista.condicion}
          </text>
        ) : null}
      </g>
    );
  }

  return (
    <g
      className={active ? "route-active" : undefined}
      opacity={opacity}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <line
        x1={a.x}
        y1={a.y}
        x2={tipX}
        y2={tipY}
        stroke="transparent"
        strokeWidth={12}
      />
      <line
        x1={a.x}
        y1={a.y}
        x2={tipX}
        y2={tipY}
        stroke={stroke}
        strokeWidth={width}
        strokeDasharray={edgeDash(arista.tipo)}
      />
      <polygon
        points={`${tipX},${tipY} ${tipX - ux * 7 + uy * 3.2},${tipY - uy * 7 - ux * 3.2} ${tipX - ux * 7 - uy * 3.2},${tipY - uy * 7 + ux * 3.2}`}
        fill={stroke}
      />
      {label ? (
        <text
          x={mx}
          y={my - 6}
          textAnchor="middle"
          fill="var(--mute)"
          fontSize={10}
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {label}
        </text>
      ) : null}
      {showCondition ? (
        <text
          x={mx}
          y={my + (label ? 10 : -6)}
          textAnchor="middle"
          fill="var(--signal)"
          fontSize={10}
          style={{ fontFamily: "var(--font-ui)" }}
        >
          {arista.condicion}
        </text>
      ) : null}
    </g>
  );
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
