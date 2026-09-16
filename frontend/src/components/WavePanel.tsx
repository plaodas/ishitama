import type { Wave } from "@/types/stone";

type WavePanelProps = {
  wave: Wave;
};

export function WavePanel({ wave }: WavePanelProps) {
  const width = 320;
  const height = 72;
  const max = Math.max(...wave.profile, 1);
  const min = Math.min(...wave.profile, 0);
  const span = Math.max(max - min, 0.0001);
  const points = wave.profile
    .map((value, index) => {
      const x = (index / Math.max(wave.profile.length - 1, 1)) * width;
      const y = height - ((value - min) / span) * (height - 8) - 4;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <section className="wave-panel">
      <p className="wave-level">波動 Lv.{wave.level}</p>
      <svg
        className="wave-svg"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="深度の中央ライン"
      >
        <polyline fill="none" stroke="currentColor" strokeWidth="1.4" points={points} />
      </svg>
    </section>
  );
}
