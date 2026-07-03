import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceDot,
} from "recharts";
import { fitOLS, predict } from "@/lib/regression";
import { buildMatrices, columnStats } from "@/lib/dataset-utils";
import { getDataset, updateDataset } from "@/lib/dataset-store";
import { ArrowLeft, Save, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/app/dataset/$id")({
  component: Simulator,
});

function Simulator() {
  const { id } = Route.useParams();
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["dataset", id],
    queryFn: async () => {
      const ds = getDataset(id);
      if (!ds) throw new Error("Dataset não encontrado");
      return ds;
    },
  });

  const [target, setTarget] = useState<string>("");
  const [features, setFeatures] = useState<string[]>([]);
  const [useLogLog, setUseLogLog] = useState(false);
  const [primary, setPrimary] = useState<string>("");
  const [sliderValues, setSliderValues] = useState<Record<string, number>>({});

  const numericColumns = useMemo(() => {
    if (!data) return [];
    return data.columns.filter((c) => data.rows.every((r) => typeof r[c] === "number"));
  }, [data]);

  useEffect(() => {
    if (!data) return;
    const t = data.target_column ?? numericColumns[numericColumns.length - 1] ?? "";
    const f = (data.feature_columns ?? numericColumns.filter((c) => c !== t)).filter((c) =>
      numericColumns.includes(c),
    );
    setTarget(t);
    setFeatures(f);
    setUseLogLog(data.use_log_log);
    setPrimary(f[0] ?? "");
    const sv: Record<string, number> = {};
    for (const c of f) sv[c] = columnStats(data.rows, c).mean;
    setSliderValues(sv);
  }, [data, numericColumns]);

  const model = useMemo(() => {
    if (!data || !target || features.length === 0) return null;
    try {
      const { X, y } = buildMatrices(data.rows, target, features, useLogLog);
      return fitOLS({ X, y, featureNames: features, useLogLog });
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Erro no modelo" } as const;
    }
  }, [data, target, features, useLogLog]);

  const chartData = useMemo(() => {
    if (!data || !model || "error" in model || !primary) return [];
    const stats = columnStats(data.rows, primary);
    const steps = 60;
    const out: { x: number; predicted: number; actual?: number }[] = [];
    for (let i = 0; i <= steps; i++) {
      const x = stats.min + ((stats.max - stats.min) * i) / steps;
      const featureValues = features.map((f) =>
        f === primary ? x : (sliderValues[f] ?? columnStats(data.rows, f).mean),
      );
      out.push({ x, predicted: predict(model, featureValues) });
    }
    const actualPts = data.rows
      .map((r) => ({ x: Number(r[primary]), actual: Number(r[target]) }))
      .filter((p) => Number.isFinite(p.x) && Number.isFinite(p.actual));
    return [...out, ...actualPts] as { x: number; predicted?: number; actual?: number }[];
  }, [data, model, primary, features, sliderValues, target]);

  const currentPrediction = useMemo(() => {
    if (!model || "error" in model || !data) return null;
    const fv = features.map((f) => sliderValues[f] ?? 0);
    return predict(model, fv);
  }, [model, features, sliderValues, data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      updateDataset(id, {
        target_column: target,
        feature_columns: features,
        use_log_log: useLogLog,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dataset", id] });
      toast.success("Configuração salva");
    },
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Carregando…</p>;
  if (error || !data) return <p className="text-destructive">Erro ao carregar dataset.</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            to="/app"
            className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">{data.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {data.rows.length} observações · {numericColumns.length} colunas numéricas
          </p>
        </div>
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
          <Save className="mr-2 h-4 w-4" /> Salvar configuração
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Card className="space-y-5 p-5">
          <div className="space-y-2">
            <Label>Variável a explicar (Y)</Label>
            <Select value={target} onValueChange={setTarget}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {numericColumns.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Variáveis explicativas (X)</Label>
            <div className="space-y-2 rounded-md border border-border p-3">
              {numericColumns
                .filter((c) => c !== target)
                .map((c) => (
                  <label key={c} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={features.includes(c)}
                      onCheckedChange={(v) => {
                        setFeatures((prev) => {
                          const next = v ? [...prev, c] : prev.filter((x) => x !== c);
                          setSliderValues((sv) => {
                            const nv = { ...sv };
                            if (v && !(c in nv)) nv[c] = columnStats(data.rows, c).mean;
                            return nv;
                          });
                          if (!next.includes(primary)) setPrimary(next[0] ?? "");
                          return next;
                        });
                      }}
                    />
                    {c}
                  </label>
                ))}
            </div>
          </div>
          <div className="flex items-center justify-between rounded-md border border-border p-3">
            <div>
              <Label className="text-sm">Modelo log-log</Label>
              <p className="text-xs text-muted-foreground">
                Coeficientes viram elasticidades (% por %).
              </p>
            </div>
            <Switch checked={useLogLog} onCheckedChange={setUseLogLog} />
          </div>
          {features.length > 1 && (
            <div className="space-y-2">
              <Label>Variável do gráfico</Label>
              <Select value={primary} onValueChange={setPrimary}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {features.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </Card>

        <div className="space-y-6">
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Previsão para os valores atuais
                </p>
                <p className="mt-1 text-3xl font-bold text-primary">
                  {currentPrediction != null && Number.isFinite(currentPrediction)
                    ? currentPrediction.toLocaleString("pt-BR", { maximumFractionDigits: 2 })
                    : "—"}
                  <span className="ml-2 text-sm font-normal text-muted-foreground">{target}</span>
                </p>
              </div>
              {model && !("error" in model) && (
                <div className="text-right text-sm">
                  <p className="text-muted-foreground">Qualidade do ajuste</p>
                  <p className="text-2xl font-semibold">R² = {model.rSquared.toFixed(3)}</p>
                </div>
              )}
            </div>
            {model && "error" in model && (
              <p className="mt-2 text-sm text-destructive">{model.error}</p>
            )}
          </Card>

          <Card className="p-5">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <TrendingUp className="h-4 w-4 text-primary" />
              {target} vs {primary} {useLogLog ? "(log-log)" : ""}
            </div>
            <div className="h-[360px]">
              {chartData.length > 0 && (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis
                      dataKey="x"
                      type="number"
                      domain={["auto", "auto"]}
                      stroke="var(--muted-foreground)"
                      tick={{ fontSize: 12 }}
                      label={{
                        value: primary,
                        position: "insideBottom",
                        offset: -4,
                        fill: "var(--muted-foreground)",
                      }}
                    />
                    <YAxis
                      stroke="var(--muted-foreground)"
                      tick={{ fontSize: 12 }}
                      label={{
                        value: target,
                        angle: -90,
                        position: "insideLeft",
                        fill: "var(--muted-foreground)",
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: 8,
                      }}
                      formatter={(v: number) =>
                        v.toLocaleString("pt-BR", { maximumFractionDigits: 2 })
                      }
                    />
                    <Scatter dataKey="actual" fill="var(--accent)" name="Dados reais" />
                    <Line
                      type="monotone"
                      dataKey="predicted"
                      stroke="var(--primary)"
                      strokeWidth={3}
                      dot={false}
                      name="Previsão do modelo"
                    />
                    {sliderValues[primary] != null && currentPrediction != null && (
                      <ReferenceDot
                        x={sliderValues[primary]}
                        y={currentPrediction}
                        r={6}
                        fill="var(--primary)"
                        stroke="var(--background)"
                        strokeWidth={2}
                      />
                    )}
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>

          <Card className="p-5">
            <p className="mb-4 text-sm font-semibold">🎛️ Ajuste os valores e veja o impacto</p>
            <div className="space-y-5">
              {features.map((f) => {
                const s = columnStats(data.rows, f);
                const step = (s.max - s.min) / 200 || 0.01;
                const val = sliderValues[f] ?? s.mean;
                return (
                  <div key={f}>
                    <div className="mb-2 flex items-baseline justify-between text-sm">
                      <span className="font-medium">{f}</span>
                      <span className="tabular-nums text-primary">
                        {val.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <Slider
                      min={s.min}
                      max={s.max}
                      step={step}
                      value={[val]}
                      onValueChange={([v]) => setSliderValues((sv) => ({ ...sv, [f]: v }))}
                    />
                    <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                      <span>{s.min.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}</span>
                      <span>{s.max.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {model && !("error" in model) && (
            <Card className="p-5">
              <p className="mb-3 text-sm font-semibold">Coeficientes do modelo</p>
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="py-1">Variável</th>
                    <th>Coeficiente</th>
                    <th>Interpretação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="py-2">Intercepto</td>
                    <td className="tabular-nums">{model.coefficients[0].toFixed(4)}</td>
                    <td className="text-muted-foreground">valor base</td>
                  </tr>
                  {features.map((f, i) => {
                    const b = model.coefficients[i + 1];
                    return (
                      <tr key={f}>
                        <td className="py-2">{f}</td>
                        <td className="tabular-nums">{b.toFixed(4)}</td>
                        <td className="text-muted-foreground">
                          {useLogLog
                            ? `elasticidade: +1% em ${f} → ${b.toFixed(2)}% em ${target}`
                            : `+1 em ${f} → ${b >= 0 ? "+" : ""}${b.toFixed(3)} em ${target}`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
