export type Instrument =
  | "earth"
  | "moss"
  | "water"
  | "ember"
  | "night"
  | "crystal"
  | "shale"
  | "sand"
  | "frost"
  | "moss-deep"
  | "dusk"
  | "void";

export type Point = {
  x: number;
  y: number;
  z: number;
  r: number;
  g: number;
  b: number;
};

export type SoundParams = {
  pitch: number;
  noiseLevel: number;
  bpm: number;
  instrument: Instrument;
};

export type Wave = {
  level: number;
  profile: number[];
};

export type StoneAnalysis = {
  pointCloud: {
    points: Point[];
  };
  sound: SoundParams;
  wave: Wave;
  message: string;
};
