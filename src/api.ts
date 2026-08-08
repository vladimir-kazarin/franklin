import type { ChatMessage, Entry, FocusResponse, Virtue } from "./types";

const BASE_URL = import.meta.env.VITE_API_URL ?? "";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    throw new Error(`${init?.method ?? "GET"} ${path} failed: ${res.status}`);
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

export async function streamChat(
  messages: ChatMessage[],
  onDelta: (text: string) => void,
): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });
  if (!res.ok || !res.body) {
    throw new Error(`POST /api/chat failed: ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let sepIndex: number;
    while ((sepIndex = buffer.indexOf("\n\n")) !== -1) {
      const rawEvent = buffer.slice(0, sepIndex);
      buffer = buffer.slice(sepIndex + 2);

      let eventType = "message";
      let data = "";
      for (const line of rawEvent.split("\n")) {
        if (line.startsWith("event:")) eventType = line.slice(6).trim();
        else if (line.startsWith("data:")) data += line.slice(5).trim();
      }
      if (!data) continue;

      if (eventType === "error") {
        throw new Error((JSON.parse(data) as { error: string }).error);
      }
      if (eventType === "done") continue;

      onDelta((JSON.parse(data) as { delta: string }).delta);
    }
  }
}
