import type { RunRecord } from "./types";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
    cache: "no-store",
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({ detail: response.statusText }));
    const detail = typeof payload.detail === "string" ? payload.detail : JSON.stringify(payload.detail);
    throw new Error(detail || `Request failed with status ${response.status}`);
  }
  return response.status === 204 ? (undefined as T) : response.json();
}

export type RunInput = RunRecord["configuration"];

export const api = {
  health: () => request<{ status: string; sionna_available: boolean; sionna_version: string | null; device: string }>("/health"),
  createRun: (body: RunInput) => request<{ id: string; status: string }>("/runs", { method: "POST", body: JSON.stringify(body) }),
  listRuns: () => request<RunRecord[]>("/runs"),
  getRun: (id: string) => request<RunRecord>(`/runs/${id}`),
  deleteRun: (id: string) => request<void>(`/runs/${id}`, { method: "DELETE" }),
  exportUrl: (id: string, type: "json" | "csv") => `${API_URL}/runs/${id}/export.${type}`,
};
