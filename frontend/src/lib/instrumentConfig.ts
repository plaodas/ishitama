import type { Instrument } from "@/types/stone";

type OscillatorName = "sine" | "triangle" | "sawtooth" | "square";
type FilterName = "lowpass" | "highpass" | "bandpass";
type NoiseName = "white" | "pink" | "brown";
type PulseInterval = "2n" | "1n";

export type InstrumentConfig = {
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
  theme: {
    accent: string;
    atmosphere: string;
  };
  visual: {
    pulse: number;
    drone: number;
    noise: number;
    drift: number;
    speedOffset: number;
  };
};

export const INSTRUMENT_CONFIG: Record<Instrument, InstrumentConfig> = {
  ember: {
    osc: "sawtooth",
    droneOctave: 1,
    droneVolumeDb: -20,
    droneFilter: { type: "lowpass", frequency: 800, movement: 400, Q: 0.8 },
    noise: { type: "brown", gain: 0.18, highpass: 100 },
    pulse: { gain: 1.2, interval: "2n" },
    bpmOffset: 10,
    theme: { accent: "#d45a3a", atmosphere: "#3a1710" },
    visual: { pulse: 1.4, drone: 1, noise: 0.9, drift: 0.15, speedOffset: 0.2 },
  },
  sand: {
    osc: "sine",
    droneOctave: 2,
    droneVolumeDb: -21,
    droneFilter: { type: "lowpass", frequency: 900 },
    noise: { type: "white", gain: 0.07, highpass: 300 },
    pulse: { gain: 0.65, interval: "2n" },
    bpmOffset: 5,
    theme: { accent: "#c9a96a", atmosphere: "#332a1b" },
    visual: { pulse: 0.65, drone: 0.7, noise: 1.1, drift: 0.45, speedOffset: 0.05 },
  },
  earth: {
    osc: "sine",
    droneOctave: 1,
    droneVolumeDb: -18,
    droneFilter: { type: "lowpass", frequency: 400 },
    noise: { type: "brown", gain: 0.07, highpass: 100 },
    pulse: { gain: 0.9, interval: "2n" },
    bpmOffset: -5,
    theme: { accent: "#8a6f4a", atmosphere: "#261e15" },
    visual: { pulse: 0.9, drone: 1, noise: 0.6, drift: 0.15, speedOffset: 0 },
  },
  moss: {
    osc: "triangle",
    droneOctave: 1,
    droneVolumeDb: -20,
    droneFilter: { type: "lowpass", frequency: 500 },
    noise: { type: "pink", gain: 0.08, highpass: 150 },
    pulse: { gain: 0.7, interval: "1n" },
    bpmOffset: -10,
    theme: { accent: "#6f8c59", atmosphere: "#172317" },
    visual: { pulse: 0.55, drone: 1.05, noise: 0.65, drift: 0.55, speedOffset: -0.05 },
  },
  "moss-deep": {
    osc: "triangle",
    droneOctave: 0.5,
    droneVolumeDb: -18,
    droneFilter: { type: "lowpass", frequency: 350 },
    noise: { type: "pink", gain: 0.1, highpass: 100 },
    pulse: { gain: 0.5, interval: "1n" },
    bpmOffset: -15,
    theme: { accent: "#658675", atmosphere: "#14231c" },
    visual: { pulse: 0.45, drone: 0.9, noise: 0.75, drift: 0.3, speedOffset: -0.1 },
  },
  water: {
    osc: "sine",
    droneOctave: 2,
    droneVolumeDb: -22,
    droneFilter: { type: "bandpass", frequency: 600, Q: 0.7 },
    noise: { type: "white", gain: 0.1, highpass: 300 },
    pulse: { gain: 0.8, interval: "2n" },
    bpmOffset: 0,
    theme: { accent: "#5d91bf", atmosphere: "#142739" },
    visual: { pulse: 0.8, drone: 0.85, noise: 1, drift: 0.7, speedOffset: 0.05 },
  },
  frost: {
    osc: "sine",
    droneOctave: 2,
    droneVolumeDb: -22,
    droneFilter: { type: "lowpass", frequency: 1000 },
    noise: { type: "white", gain: 0.14, highpass: 500 },
    pulse: { gain: 0.55, interval: "1n" },
    bpmOffset: 5,
    theme: { accent: "#afc8df", atmosphere: "#263746" },
    visual: { pulse: 0.65, drone: 0.65, noise: 1.5, drift: 0.1, speedOffset: 0.1 },
  },
  dusk: {
    osc: "sine",
    droneOctave: 1,
    droneVolumeDb: -21,
    droneFilter: { type: "lowpass", frequency: 450 },
    noise: { type: "pink", gain: 0.06, highpass: 200 },
    pulse: { gain: 0.65, interval: "1n" },
    bpmOffset: -5,
    theme: { accent: "#8172a1", atmosphere: "#251d35" },
    visual: { pulse: 0.6, drone: 0.7, noise: 0.55, drift: 0.65, speedOffset: -0.05 },
  },
  night: {
    osc: "square",
    droneOctave: 0.5,
    droneVolumeDb: -24,
    droneFilter: { type: "lowpass", frequency: 300 },
    noise: { type: "brown", gain: 0.06, highpass: 80 },
    pulse: { gain: 0.5, interval: "1n" },
    bpmOffset: -10,
    theme: { accent: "#786a98", atmosphere: "#2a1f3a" },
    visual: { pulse: 0.65, drone: 0.35, noise: 0.5, drift: 0.2, speedOffset: -0.15 },
  },
  void: {
    osc: "square",
    droneOctave: 0.5,
    droneVolumeDb: -30,
    droneFilter: { type: "lowpass", frequency: 200 },
    noise: { type: null, gain: 0, highpass: 80 },
    pulse: { gain: 0, interval: null },
    bpmOffset: 0,
    theme: { accent: "#6f6975", atmosphere: "#0b0a09" },
    visual: { pulse: 0, drone: 0.15, noise: 0, drift: 0.05, speedOffset: -0.3 },
  },
  crystal: {
    osc: "sine",
    droneOctave: 2,
    droneVolumeDb: -22,
    droneFilter: { type: "lowpass", frequency: 1200 },
    noise: { type: "white", gain: 0.025, highpass: 700 },
    pulse: { gain: 0.45, interval: "1n" },
    bpmOffset: 5,
    theme: { accent: "#dfe8f2", atmosphere: "#303842" },
    visual: { pulse: 0.5, drone: 0.6, noise: 0.35, drift: 0.15, speedOffset: 0.05 },
  },
  shale: {
    osc: "sawtooth",
    droneOctave: 0.5,
    droneVolumeDb: -22,
    droneFilter: { type: "lowpass", frequency: 250 },
    noise: { type: "brown", gain: 0.12, highpass: 80 },
    pulse: { gain: 1.1, interval: "2n" },
    bpmOffset: -10,
    theme: { accent: "#858585", atmosphere: "#242424" },
    visual: { pulse: 1.25, drone: 0.8, noise: 0.8, drift: 0.12, speedOffset: -0.08 },
  },
};
