import type { Instrument, SoundParams } from "@/types/stone";

type OscillatorName = "sine" | "triangle" | "sawtooth" | "square";

const OSC: Record<Instrument, OscillatorName> = {
  earth: "sine",
  moss: "triangle",
  water: "sine",
  ember: "sawtooth",
  night: "square",
};

export async function startStoneSong(sound: SoundParams): Promise<() => void> {
  const Tone = await import("tone");
  await Tone.start();
  Tone.Transport.bpm.value = sound.bpm;

  const master = new Tone.Gain(0.7).toDestination();

  const droneFilter = new Tone.Filter({
    type: "lowpass",
    frequency: 400 + sound.noiseLevel * 800,
    Q: 0.7,
  }).connect(master);
  const drone = new Tone.Oscillator({
    type: OSC[sound.instrument],
    frequency: sound.pitch,
  }).connect(droneFilter);
  drone.volume.value = -18;

  const noiseFilter = new Tone.Filter({
    type: "highpass",
    frequency: 200,
  }).connect(master);
  const noiseGain = new Tone.Gain(sound.noiseLevel * 0.18).connect(noiseFilter);
  const noise = new Tone.Noise("brown").connect(noiseGain);

  const pulse = new Tone.MembraneSynth({
    octaves: 2,
    envelope: { attack: 0.01, decay: 0.4, sustain: 0 },
  }).connect(master);
  const loop = new Tone.Loop((time) => {
    pulse.triggerAttackRelease(sound.pitch / 2, "8n", time);
  }, "2n");

  drone.start();
  noise.start();
  loop.start(0);
  Tone.Transport.start();

  return () => {
    loop.dispose();
    drone.stop().dispose();
    noise.stop().dispose();
    pulse.dispose();
    droneFilter.dispose();
    noiseFilter.dispose();
    noiseGain.dispose();
    master.dispose();
    Tone.Transport.stop();
    Tone.Transport.cancel();
  };
}
