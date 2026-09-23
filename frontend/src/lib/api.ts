import type { StoneAnalysis } from "@/types/stone";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export class AnalyzeError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "AnalyzeError";
    this.status = status;
  }
}

function analyzeError(status: number): Error {
  if (status === 401) {
    return new AnalyzeError("合言葉が必要", 401);
  }
  if (status === 413) {
    return new AnalyzeError("画像が大きすぎる", 413);
  }
  if (status === 429) {
    return new AnalyzeError("少し待ってからもう一度", 429);
  }
  if (status === 503) {
    return new AnalyzeError("いま混み合っている", 503);
  }
  return new Error("analyze failed");
}

export async function currentSession(): Promise<boolean> {
  const response = await fetch(`${API_URL}/api/auth/me`, {
    credentials: "include",
    signal: AbortSignal.timeout(8_000),
  });
  return response.ok;
}

export async function loginWithPassword(password: string): Promise<void> {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
    signal: AbortSignal.timeout(15_000),
  });
  if (response.status === 401) {
    throw new AnalyzeError("合言葉が違う", 401);
  }
  if (!response.ok) {
    throw analyzeError(response.status);
  }
}

export async function logoutSession(): Promise<void> {
  await fetch(`${API_URL}/api/auth/logout`, {
    method: "POST",
    credentials: "include",
    signal: AbortSignal.timeout(8_000),
  });
}

export async function analyzeStone(file: File): Promise<StoneAnalysis> {
  const body = new FormData();
  body.append("image", file);
  body.append("hour", String(new Date().getHours()));

  const response = await fetch(`${API_URL}/api/stone/analyze`, {
    method: "POST",
    credentials: "include",
    body,
    signal: AbortSignal.timeout(120_000),
  });

  if (!response.ok) {
    throw analyzeError(response.status);
  }

  return (await response.json()) as StoneAnalysis;
}
