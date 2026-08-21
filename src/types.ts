export interface Virtue {
  id: number;
  name: string;
  precept: string;
  rationale: string;
  sortOrder: number;
}

export interface Entry {
  date: string;
  virtueId: number;
  faulted: boolean;
}

export interface FocusResponse {
  virtueId: number;
  weekStart: string;
  weekEnd: string;
}
