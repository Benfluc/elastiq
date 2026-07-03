import Papa from "papaparse";

export type ParsedCSV = {
  columns: string[];
  rows: Record<string, string | number>[];
  numericColumns: string[];
};

export function parseCSV(text: string): ParsedCSV {
  const clean = text.replace(/^\uFEFF/, "").trim();
  const result = Papa.parse<Record<string, string>>(clean, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
    delimiter: "", // auto-detect (, ; \t |)
  });
  if (result.errors.length) {
    const fatal = result.errors.find((e) => e.type !== "FieldMismatch");
    if (fatal) throw new Error(`Erro no CSV: ${fatal.message}`);
  }
  const columns = (result.meta.fields ?? []).map((c) => c.trim()).filter(Boolean);
  const rows: Record<string, string | number>[] = [];
  for (const r of result.data) {
    const out: Record<string, string | number> = {};
    let hasAny = false;
    for (const col of columns) {
      const rawKey = Object.keys(r).find((k) => k.trim() === col) ?? col;
      const raw = (r[rawKey] ?? "").toString().trim();
      if (!raw) {
        out[col] = "";
        continue;
      }
      hasAny = true;
      // Strip currency symbols/spaces (R$, $, €, £, ¥)
      const cleaned = raw.replace(/[R$€£¥\s]/g, "").replace(/[^\d,.\-]/g, "");
      let normalized = cleaned;
      if (cleaned.includes(",") && cleaned.includes(".")) {
        // '.' as thousand sep, ',' as decimal (pt-BR)
        normalized = cleaned.replace(/\./g, "").replace(",", ".");
      } else if (cleaned.includes(",")) {
        normalized = cleaned.replace(",", ".");
      }
      const num = Number(normalized);
      out[col] = normalized !== "" && Number.isFinite(num) ? num : raw;
    }
    if (hasAny) rows.push(out);
  }
  const numericColumns = columns.filter(
    (c) =>
      rows.some((r) => typeof r[c] === "number") &&
      rows.every((r) => r[c] === "" || typeof r[c] === "number"),
  );
  return { columns, rows, numericColumns };
}

export function buildMatrices(
  rows: Record<string, string | number>[],
  target: string,
  features: string[],
  useLogLog: boolean,
): { X: number[][]; y: number[] } {
  const X: number[][] = [];
  const y: number[] = [];
  for (const r of rows) {
    const yv = Number(r[target]);
    const xs = features.map((f) => Number(r[f]));
    if (!Number.isFinite(yv) || xs.some((v) => !Number.isFinite(v))) continue;
    if (useLogLog) {
      if (yv <= 0 || xs.some((v) => v <= 0)) continue;
      X.push(xs.map((v) => Math.log(v)));
      y.push(Math.log(yv));
    } else {
      X.push(xs);
      y.push(yv);
    }
  }
  return { X, y };
}

export function columnStats(rows: Record<string, string | number>[], col: string) {
  const values = rows.map((r) => Number(r[col])).filter((v) => Number.isFinite(v));
  if (values.length === 0) return { min: 0, max: 1, mean: 0.5 };
  const min = Math.min(...values);
  const max = Math.max(...values);
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  return { min, max, mean };
}
