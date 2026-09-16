import { useEffect, useRef, useState } from "react";

import { startStoneSong } from "@/lib/stoneSong";
import type { SoundParams } from "@/types/stone";

type StoneSongProps = {
  sound: SoundParams;
};

export function StoneSong({ sound }: StoneSongProps) {
  const stopRef = useRef<(() => void) | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    return () => {
      stopRef.current?.();
      stopRef.current = null;
      setPlaying(false);
    };
  }, [sound]);

  const toggle = async () => {
    if (playing) {
      stopRef.current?.();
      stopRef.current = null;
      setPlaying(false);
      return;
    }
    stopRef.current = await startStoneSong(sound);
    setPlaying(true);
  };

  return (
    <button className="ghost-button" type="button" onClick={() => void toggle()}>
      {playing ? "沈黙" : "聴く"}
    </button>
  );
}
