// Local (browser) persistence for datasets — no auth required.
export type StoredDataset = {
  id: string;
  name: string;
  columns: string[];
  rows: Record<string, string | number>[];
  target_column: string | null;
  feature_columns: string[] | null;
  use_log_log: boolean;
  created_at: string;
};

const KEY = "elastiq.datasets.v1";

function read(): StoredDataset[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as StoredDataset[]) : [];
  } catch {
    return [];
  }
}

function write(items: StoredDataset[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(items));
}

export function listDatasets(): StoredDataset[] {
  return read().sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
}

export function getDataset(id: string): StoredDataset | undefined {
  return read().find((d) => d.id === id);
}

export function createDataset(input: Omit<StoredDataset, "id" | "created_at">): StoredDataset {
  const items = read();
  const ds: StoredDataset = {
    ...input,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
  };
  items.push(ds);
  write(items);
  return ds;
}

export function updateDataset(id: string, patch: Partial<StoredDataset>) {
  const items = read().map((d) => (d.id === id ? { ...d, ...patch } : d));
  write(items);
}

export function deleteDataset(id: string) {
  write(read().filter((d) => d.id !== id));
}
