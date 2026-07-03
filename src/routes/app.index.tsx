import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useRef, useState } from "react";
import { parseCSV } from "@/lib/dataset-utils";
import { createDataset, deleteDataset, listDatasets } from "@/lib/dataset-store";
import { Upload, Database, Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/app/")({
  component: Dashboard,
});

function Dashboard() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");

  const { data: datasets, isLoading } = useQuery({
    queryKey: ["datasets"],
    queryFn: async () => listDatasets(),
  });

  const createMutation = useMutation({
    mutationFn: async ({ file, dsName }: { file: File; dsName: string }) => {
      const text = await file.text();
      const parsed = parseCSV(text);
      if (parsed.rows.length < 5) throw new Error("Envie ao menos 5 linhas de dados.");
      if (parsed.numericColumns.length < 2)
        throw new Error("Precisa de ao menos 2 colunas numéricas.");
      const ds = createDataset({
        name: dsName || file.name.replace(/\.csv$/i, ""),
        columns: parsed.columns,
        rows: parsed.rows,
        target_column: parsed.numericColumns[parsed.numericColumns.length - 1],
        feature_columns: parsed.numericColumns.slice(0, -1),
        use_log_log: false,
      });
      return ds.id;
    },
    onSuccess: (id) => {
      qc.invalidateQueries({ queryKey: ["datasets"] });
      toast.success("Dataset carregado!");
      navigate({ to: "/app/dataset/$id", params: { id } });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro no upload"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => deleteDataset(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["datasets"] });
      toast.success("Dataset removido");
    },
  });

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    createMutation.mutate({ file: f, dsName: name });
    e.target.value = "";
    setName("");
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Meus datasets</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Envie um CSV com colunas numéricas para começar a simular cenários. Os dados ficam salvos
          neste navegador.
        </p>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Upload className="h-4 w-4 text-primary" /> Novo dataset
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <div className="space-y-2">
            <Label htmlFor="ds-name">Nome (opcional)</Label>
            <Input
              id="ds-name"
              placeholder="Ex.: Vendas loja centro 2024"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={onPickFile}
            />
            <Button onClick={() => fileRef.current?.click()} disabled={createMutation.isPending}>
              <Plus className="mr-2 h-4 w-4" />
              {createMutation.isPending ? "Carregando…" : "Escolher CSV"}
            </Button>
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Formato: primeira linha com nomes das colunas. Aceita separador , ou ;. Use ponto ou
          vírgula para decimais.
        </p>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}
        {datasets?.length === 0 && (
          <Card className="col-span-full p-10 text-center text-sm text-muted-foreground">
            Nenhum dataset ainda. Envie seu primeiro CSV acima.
          </Card>
        )}
        {datasets?.map((d) => (
          <Card key={d.id} className="group flex flex-col p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Database className="h-4 w-4" />
                {d.rows.length} linhas · {d.columns.length} colunas
              </div>
              <button
                onClick={() => deleteMutation.mutate(d.id)}
                className="text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <h3 className="mt-3 font-semibold">{d.name}</h3>
            <p className="mt-1 truncate text-xs text-muted-foreground">{d.columns.join(" · ")}</p>
            <Link to="/app/dataset/$id" params={{ id: d.id }} className="mt-4">
              <Button variant="secondary" className="w-full">
                Abrir simulador
              </Button>
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
