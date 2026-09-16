import { useEffect, useMemo, useRef } from "react";

import type { Wave } from "@/types/stone";

type WavePanelProps = {
  wave: Wave;
  playing?: boolean;
};

const WIDTH = 320;
const HEIGHT = 72;
const BREATH_PERIOD = 5.2;

export function WavePanel({ wave, playing = false }: WavePanelProps) {
  const lineRef = useRef<SVGPolylineElement>(null);
  const layout = useMemo(() => {
    const max = Math.max(...wave.profile, 1);
    const min = Math.min(...wave.profile, 0);
    const span = Math.max(max - min, 0.0001);
    const last = Math.max(wave.profile.length - 1, 1);
    const xs = wave.profile.map((_, index) => (index / last) * WIDTH);
    const ys = wave.profile.map(
      (value) => HEIGHT - ((value - min) / span) * (HEIGHT - 8) - 4,
    );
    const rest = xs.map((x, index) => `${x.toFixed(1)},${ys[index].toFixed(1)}`).join(" ");
    return { xs, ys, rest };
  }, [wave.profile]);

  useEffect(() => {
    const node = lineRef.current;
    if (!node) {
      return;
    }

    let frame = 0;
    let amplitude = 0;
    const started = performance.now();
    const targetAmplitude = 2.6 + wave.level * 0.2;

    const tick = (now: number) => {
      const target = playing ? targetAmplitude : 0;
      amplitude += (target - amplitude) * 0.07;
      if (!playing && amplitude < 0.03) {
        amplitude = 0;
        node.setAttribute("points", layout.rest);
        return;
      }

      const t = (now - started) / 1000;
      const breath = Math.sin(t * ((Math.PI * 2) / BREATH_PERIOD));
      const points = layout.xs
        .map((x, index) => {
          const ripple = Math.sin(t * 1.9 + index * 0.12) * 0.28;
          const y = layout.ys[index] + (breath + ripple) * amplitude;
          return `${x.toFixed(1)},${y.toFixed(1)}`;
        })
        .join(" ");
      node.setAttribute("points", points);
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [layout, playing, wave.level]);

  return (
    <section className="wave-panel">
      <p className="wave-level">波動 Lv.{wave.level}</p>
      <svg
        className={`wave-svg${playing ? " is-breathing" : ""}`}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label="深度の中央ライン"
      >
        <polyline
          ref={lineRef}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          points={layout.rest}
        />
      </svg>
    </section>
  );
}
