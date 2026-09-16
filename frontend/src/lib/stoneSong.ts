import { INSTRUMENT_CONFIG } from "@/lib/instrumentConfig";
import type { SoundParams } from "@/types/stone";

type StoneSongEvents = {
  onPulse?: () => void;
};

export async function startStoneSong(
  sound: SoundParams,
  events: StoneSongEvents = {},
): Promise<() => void> {
  const Tone = await import("tone");
  await Tone.start();
  const config = INSTRUMENT_CONFIG[sound.instrument];
  Tone.Transport.bpm.value = Math.min(140, Math.max(30, sound.bpm + config.bpmOffset));

  const master = new Tone.Gain(0.7).toDestination();

  const droneFilter = new Tone.Filter({
    type: config.droneFilter.type,
    frequency:
      config.droneFilter.frequency + sound.noiseLevel * (config.droneFilter.movement ?? 0),
    Q: config.droneFilter.Q ?? 0.7,
  }).connect(master);
  const drone = new Tone.Oscillator({
    type: config.osc,
    frequency: sound.pitch * config.droneOctave,
  }).connect(droneFilter);
  drone.volume.value = config.droneVolumeDb;

  const noiseFilter = new Tone.Filter({
    type: "highpass",
    frequency: config.noise.highpass,
  }).connect(master);
  const noiseAmount = config.noise.gain * (0.25 + sound.noiseLevel * 0.75);
  const noiseGain = new Tone.Gain(noiseAmount).connect(noiseFilter);
  const noise =
    config.noise.type === null ? null : new Tone.Noise(config.noise.type).connect(noiseGain);

  const pulseGain = new Tone.Gain(config.pulse.gain).connect(master);
  const pulse = new Tone.MembraneSynth({
    octaves: 2,
    envelope: { attack: 0.01, decay: 0.4, sustain: 0 },
  }).connect(pulseGain);
  const loop =
    config.pulse.interval === null
      ? null
      : new Tone.Loop((time) => {
          pulse.triggerAttackRelease(sound.pitch / 2, "8n", time);
          Tone.Draw.schedule(() => events.onPulse?.(), time);
        }, config.pulse.interval);

  drone.start();
  noise?.start();
  loop?.start(0);
  Tone.Transport.start();

  return () => {
    loop?.dispose();
    drone.stop();
    drone.dispose();
    if (noise) {
      noise.stop();
      noise.dispose();
    }
    pulse.dispose();
    pulseGain.dispose();
    droneFilter.dispose();
    noiseFilter.dispose();
    noiseGain.dispose();
    master.dispose();
    Tone.Transport.stop();
    Tone.Transport.cancel();
  };
}
