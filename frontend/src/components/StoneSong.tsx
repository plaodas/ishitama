import { useEffect, useRef, useState } from "react";

import { startStoneSong } from "@/lib/stoneSong";
import type { SoundParams } from "@/types/stone";

type StoneSongProps = {
  sound: SoundParams;
  onPlayingChange?: (playing: boolean) => void;
};

export function StoneSong({ sound, onPlayingChange }: StoneSongProps) {
  const stopRef = useRef<(() => void) | null>(null);
  const onPlayingChangeRef = useRef(onPlayingChange);
  const [playing, setPlaying] = useState(false);
  onPlayingChangeRef.current = onPlayingChange;

  const setPlayingState = (next: boolean) => {
    setPlaying(next);
    onPlayingChangeRef.current?.(next);
  };

  useEffect(() => {
    return () => {
      stopRef.current?.();
      stopRef.current = null;
      setPlayingState(false);
    };
  }, [sound]);

  const toggle = async () => {
    if (playing) {
      stopRef.current?.();
      stopRef.current = null;
      setPlayingState(false);
      return;
    }
    stopRef.current = await startStoneSong(sound);
    setPlayingState(true);
  };

  return (
    <button className="ghost-button" type="button" onClick={() => void toggle()}>
      {playing ? "沈黙" : "聴く"}
    </button>
  );
}
