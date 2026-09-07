import { useEffect, useRef } from "react";

type Props = {
  density: "dense" | "medium" | "thin";
};

const COUNT = { dense: 520, medium: 240, thin: 90 };

export function CampoEstelar({ density }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    let raf = 0;

    const stars = Array.from({ length: COUNT[density] }, (_, i) => ({
      x: hash(i, 1),
      y: hash(i, 2),
      r: 0.4 + hash(i, 3) * 1.1,
      phase: hash(i, 4) * Math.PI * 2,
    }));

    const draw = () => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);
      for (const star of stars) {
        const twinkle = reduced
          ? 0.55
          : 0.35 + 0.45 * Math.abs(Math.sin(star.phase + frame * 0.008));
        ctx.fillStyle = `rgba(233, 227, 214, ${twinkle * 0.55})`;
        ctx.beginPath();
        ctx.arc(star.x * width, star.y * height, star.r, 0, Math.PI * 2);
        ctx.fill();
      }
      if (!reduced) {
        frame += 1;
        raf = requestAnimationFrame(draw);
      }
    };

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
      if (reduced) draw();
    };

    resize();
    window.addEventListener("resize", resize);
    if (reduced) {
      draw();
    } else {
      raf = requestAnimationFrame(draw);
    }

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(raf);
    };
  }, [density]);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}
    />
  );
}

function hash(i: number, salt: number): number {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}
