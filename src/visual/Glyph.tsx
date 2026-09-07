import type { TipoNodo } from "../schema/ecosystem";

type GlyphProps = {
  tipo: TipoNodo;
  filled: boolean;
};

/** Un glifo por tipo, no por nodo. */
export function Glyph({ tipo, filled }: GlyphProps) {
  const stroke = filled ? "var(--ink-900)" : "currentColor";
  const fill = filled ? "var(--ink-900)" : "none";

  if (tipo === "agente") {
    return (
      <polygon
        points="0,-6.5 1.1,-1.1 6.5,0 1.1,1.1 0,6.5 -1.1,1.1 -6.5,0 -1.1,-1.1"
        fill={stroke}
      />
    );
  }

  if (tipo === "equipo") {
    return (
      <g fill="none" stroke={stroke} strokeWidth="1.15">
        <circle cx="-2.3" cy="-2.3" r="1.15" />
        <circle cx="2.3" cy="-2.3" r="1.15" />
        <circle cx="-2.3" cy="2.3" r="1.15" />
        <circle cx="2.3" cy="2.3" r="1.15" />
      </g>
    );
  }

  if (tipo === "humano") {
    return (
      <g fill="none" stroke={stroke} strokeWidth="1.2">
        <circle cx="0" cy="-2.2" r="1.8" />
        <path d="M-3.4 4.2c.4-2.6 6.4-2.6 6.8 0" />
      </g>
    );
  }

  if (tipo === "dato") {
    return (
      <rect
        x="-3.2"
        y="-3.2"
        width="6.4"
        height="6.4"
        transform="rotate(45)"
        fill={fill}
        stroke={stroke}
        strokeWidth="1.1"
      />
    );
  }

  if (tipo === "externo") {
    return (
      <g fill="none" stroke={stroke} strokeWidth="1.2">
        <path d="M-4 1.5c1.6-3.4 6.4-3.4 8 0" />
        <path d="M-2.2 2.4c.9-1.8 3.5-1.8 4.4 0" />
        <circle cx="0" cy="3.4" r="0.7" fill={stroke} stroke="none" />
      </g>
    );
  }

  return (
    <circle cx="0" cy="0" r="3.4" fill="none" stroke={stroke} strokeWidth="1.15" />
  );
}
