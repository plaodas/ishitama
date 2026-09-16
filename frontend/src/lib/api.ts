import type { StoneAnalysis } from "@/types/stone";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export async function analyzeStone(file: File): Promise<StoneAnalysis> {
  const body = new FormData();
  body.append("image", file);

  const response = await fetch(`${API_URL}/api/stone/analyze`, {
    method: "POST",
    body,
    signal: AbortSignal.timeout(120_000),
  });

  if (!response.ok) {
    throw new Error("analyze failed");
  }

  return (await response.json()) as StoneAnalysis;
}
