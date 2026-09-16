import { useEffect, useMemo, useRef } from "react";

import { INSTRUMENT_CONFIG } from "@/lib/instrumentConfig";
import type { SoundParams, Wave } from "@/types/stone";

type WavePanelProps = {
  wave: Wave;
  sound: SoundParams;
  playing?: boolean;
  pulseTick: number;
};

const WIDTH = 320;
const HEIGHT = 72;
const BREATH_PERIOD = 5.2;

export function WavePanel({ wave, sound, playing = false, pulseTick }: WavePanelProps) {
  const lineRef = useRef<SVGPolylineElement>(null);
  const pulseEnergyRef = useRef(0);
  const visual = INSTRUMENT_CONFIG[sound.instrument].visual;
  const motionSpeed = Math.max(0.25, 0.5 + wave.level * 0.1 + visual.speedOffset);
  const baseStrokeWidth = wave.level <= 3 ? 1.4 : wave.level <= 6 ? 2.1 : 2.8;
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
    if (pulseTick > 0) {
      pulseEnergyRef.current = 1;
    }
  }, [pulseTick]);

  useEffect(() => {
    const node = lineRef.current;
    if (!node) {
      return;
    }

    let frame = 0;
    let amplitude = 0;
    const started = performance.now();
    let previous = started;
    const targetAmplitude = 2.6 + wave.level * 0.2;

    const tick = (now: number) => {
      const delta = Math.min((now - previous) / 1000, 0.1);
      previous = now;
      pulseEnergyRef.current *= Math.exp(-delta * 6);
      const target = playing ? targetAmplitude : 0;
      amplitude += (target - amplitude) * 0.07;
      if (!playing && amplitude < 0.03 && pulseEnergyRef.current < 0.01) {
        amplitude = 0;
        node.setAttribute("points", layout.rest);
        node.setAttribute("stroke-width", baseStrokeWidth.toFixed(2));
        return;
      }

      const t = (now - started) / 1000;
      const breath = Math.sin(t * ((Math.PI * 2) / BREATH_PERIOD) * motionSpeed);
      const drift = Math.sin(t * 0.45 * motionSpeed) * visual.drift * 1.4;
      const points = layout.xs
        .map((x, index) => {
          const ripple =
            Math.sin(t * 1.9 * motionSpeed + index * 0.12) *
            0.28 *
            sound.noiseLevel *
            visual.noise;
          const pulseShape = Math.sin((index / Math.max(layout.xs.length - 1, 1)) * Math.PI);
          const pulse =
            pulseShape * pulseEnergyRef.current * (2.4 + wave.level * 0.2) * visual.pulse;
          const y =
            layout.ys[index] +
            (breath * visual.drone + ripple) * amplitude +
            drift * amplitude * 0.25 -
            pulse;
          return `${x.toFixed(1)},${y.toFixed(1)}`;
        })
        .join(" ");
      node.setAttribute("points", points);
      node.setAttribute(
        "stroke-width",
        (baseStrokeWidth + pulseEnergyRef.current * 0.7 * visual.pulse).toFixed(2),
      );
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [
    baseStrokeWidth,
    layout,
    motionSpeed,
    playing,
    sound.noiseLevel,
    visual.drift,
    visual.drone,
    visual.noise,
    visual.pulse,
    wave.level,
  ]);

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
          strokeWidth={baseStrokeWidth}
          points={layout.rest}
        />
      </svg>
    </section>
  );
}
