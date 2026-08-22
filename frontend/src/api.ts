import type { Entry, FocusResponse, ReflectionRequest, Virtue } from "./types";

const BASE_URL = import.meta.env.VITE_API_URL ?? "";

export class ApiError extends Error {
  code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.code = code;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new ApiError(
      data?.error ?? `${init?.method ?? "GET"} ${path} failed: ${res.status}`,
      data?.code
    );
  }
  return res.json() as Promise<T>;
}

export function fetchVirtues(): Promise<Virtue[]> {
  return request<Virtue[]>("/api/virtues");
}

export function fetchEntries(start: string, end: string): Promise<Entry[]> {
  return request<Entry[]>(`/api/entries?start=${start}&end=${end}`);
}

export function fetchFocus(date: string): Promise<FocusResponse> {
  return request<FocusResponse>(`/api/focus?date=${date}`);
}

export function setEntry(date: string, virtueId: number, faulted: boolean): Promise<Entry> {
  return request<Entry>("/api/entries", {
    method: "PUT",
    body: JSON.stringify({ date, virtueId, faulted }),
  });
}

export function fetchReflection(body: ReflectionRequest): Promise<{ reflection: string }> {
  return request<{ reflection: string }>("/api/reflect", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
