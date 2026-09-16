import type { Instrument, SoundParams } from "@/types/stone";

type OscillatorName = "sine" | "triangle" | "sawtooth" | "square";
type FilterName = "lowpass" | "highpass" | "bandpass";
type NoiseName = "white" | "pink" | "brown";
type PulseInterval = "2n" | "1n";

type InstrumentConfig = {
  osc: OscillatorName;
  droneOctave: number;
  droneVolumeDb: number;
  droneFilter: {
    type: FilterName;
    frequency: number;
    movement?: number;
    Q?: number;
  };
  noise: {
    type: NoiseName | null;
    gain: number;
    highpass: number;
  };
  pulse: {
    gain: number;
    interval: PulseInterval | null;
  };
  bpmOffset: number;
};

const INSTRUMENT_CONFIG: Record<Instrument, InstrumentConfig> = {
  ember: {
    osc: "sawtooth",
    droneOctave: 1,
    droneVolumeDb: -20,
    droneFilter: { type: "lowpass", frequency: 800, movement: 400, Q: 0.8 },
    noise: { type: "brown", gain: 0.18, highpass: 100 },
    pulse: { gain: 1.2, interval: "2n" },
    bpmOffset: 10,
  },
  sand: {
    osc: "sine",
    droneOctave: 2,
    droneVolumeDb: -21,
    droneFilter: { type: "lowpass", frequency: 900 },
    noise: { type: "white", gain: 0.07, highpass: 300 },
    pulse: { gain: 0.65, interval: "2n" },
    bpmOffset: 5,
  },
  earth: {
    osc: "sine",
    droneOctave: 1,
    droneVolumeDb: -18,
    droneFilter: { type: "lowpass", frequency: 400 },
    noise: { type: "brown", gain: 0.07, highpass: 100 },
    pulse: { gain: 0.9, interval: "2n" },
    bpmOffset: -5,
  },
  moss: {
    osc: "triangle",
    droneOctave: 1,
    droneVolumeDb: -20,
    droneFilter: { type: "lowpass", frequency: 500 },
    noise: { type: "pink", gain: 0.08, highpass: 150 },
    pulse: { gain: 0.7, interval: "1n" },
    bpmOffset: -10,
  },
  "moss-deep": {
    osc: "triangle",
    droneOctave: 0.5,
    droneVolumeDb: -18,
    droneFilter: { type: "lowpass", frequency: 350 },
    noise: { type: "pink", gain: 0.1, highpass: 100 },
    pulse: { gain: 0.5, interval: "1n" },
    bpmOffset: -15,
  },
  water: {
    osc: "sine",
    droneOctave: 2,
    droneVolumeDb: -22,
    droneFilter: { type: "bandpass", frequency: 600, Q: 0.7 },
    noise: { type: "white", gain: 0.1, highpass: 300 },
    pulse: { gain: 0.8, interval: "2n" },
    bpmOffset: 0,
  },
  frost: {
    osc: "sine",
    droneOctave: 2,
    droneVolumeDb: -22,
    droneFilter: { type: "lowpass", frequency: 1000 },
    noise: { type: "white", gain: 0.14, highpass: 500 },
    pulse: { gain: 0.55, interval: "1n" },
    bpmOffset: 5,
  },
  dusk: {
    osc: "sine",
    droneOctave: 1,
    droneVolumeDb: -21,
    droneFilter: { type: "lowpass", frequency: 450 },
    noise: { type: "pink", gain: 0.06, highpass: 200 },
    pulse: { gain: 0.65, interval: "1n" },
    bpmOffset: -5,
  },
  night: {
    osc: "square",
    droneOctave: 0.5,
    droneVolumeDb: -24,
    droneFilter: { type: "lowpass", frequency: 300 },
    noise: { type: "brown", gain: 0.06, highpass: 80 },
    pulse: { gain: 0.5, interval: "1n" },
    bpmOffset: -10,
  },
  void: {
    osc: "square",
    droneOctave: 0.5,
    droneVolumeDb: -30,
    droneFilter: { type: "lowpass", frequency: 200 },
    noise: { type: null, gain: 0, highpass: 80 },
    pulse: { gain: 0, interval: null },
    bpmOffset: 0,
  },
  crystal: {
    osc: "sine",
    droneOctave: 2,
    droneVolumeDb: -22,
    droneFilter: { type: "lowpass", frequency: 1200 },
    noise: { type: "white", gain: 0.025, highpass: 700 },
    pulse: { gain: 0.45, interval: "1n" },
    bpmOffset: 5,
  },
  shale: {
    osc: "sawtooth",
    droneOctave: 0.5,
    droneVolumeDb: -22,
    droneFilter: { type: "lowpass", frequency: 250 },
    noise: { type: "brown", gain: 0.12, highpass: 80 },
    pulse: { gain: 1.1, interval: "2n" },
    bpmOffset: -10,
  },
};

export async function startStoneSong(sound: SoundParams): Promise<() => void> {
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
