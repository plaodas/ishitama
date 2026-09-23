import type { StoneAnalysis } from "@/types/stone";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export class AnalyzeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AnalyzeError";
  }
}

function analyzeError(status: number): Error {
  if (status === 413) {
    return new AnalyzeError("画像が大きすぎる");
  }
  if (status === 429) {
    return new AnalyzeError("少し待ってからもう一度");
  }
  if (status === 503) {
    return new AnalyzeError("いま混み合っている");
  }
  return new Error("analyze failed");
}

export async function analyzeStone(file: File): Promise<StoneAnalysis> {
  const body = new FormData();
  body.append("image", file);
  body.append("hour", String(new Date().getHours()));

  const response = await fetch(`${API_URL}/api/stone/analyze`, {
    method: "POST",
    body,
    signal: AbortSignal.timeout(120_000),
  });

  if (!response.ok) {
    throw analyzeError(response.status);
  }

  return (await response.json()) as StoneAnalysis;
}
