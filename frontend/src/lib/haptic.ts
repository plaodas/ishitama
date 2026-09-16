import { INSTRUMENT_CONFIG } from "@/lib/instrumentConfig";
import type { Instrument } from "@/types/stone";

export function pulseHaptic(instrument: Instrument): void {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") {
    return;
  }
  const strength = INSTRUMENT_CONFIG[instrument].visual.pulse;
  if (strength <= 0) {
    return;
  }
  navigator.vibrate(Math.round(28 + strength * 36));
}

export function stopHaptic(): void {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") {
    return;
  }
  navigator.vibrate(0);
}
