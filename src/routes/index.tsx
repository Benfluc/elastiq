import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { TrendingUp, LineChart, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2 font-semibold">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <TrendingUp className="h-4 w-4" />
            </div>
            ElastIQ
          </div>
          <Link to="/app">
            <Button variant="ghost">Abrir app</Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-20">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
            <Sparkles className="h-3 w-3 text-primary" /> Econometria acessível para o comércio
          </span>
          <h1 className="mt-6 text-5xl font-bold tracking-tight sm:text-6xl">
            Se eu baixar R$1 no preço, <span className="text-primary">quanto vendo a mais?</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">
            Envie um CSV com seus dados históricos de preço, vendas, promoções e o que mais importar.
            O ElastIQ ajusta uma regressão OLS (e elasticidade log-log) e deixa você
            simular decisões em tempo real com gráficos interativos.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/app">
              <Button size="lg">Começar agora</Button>
            </Link>
            <a href="#como-funciona">
              <Button size="lg" variant="secondary">Como funciona</Button>
            </a>
          </div>
        </div>

        <section id="como-funciona" className="mt-24 grid gap-6 sm:grid-cols-3">
          {[
            { icon: "📥", title: "1. Envie seu CSV", body: "Colunas como preço, vendas, temperatura, gastos com anúncio." },
            { icon: "📈", title: "2. Escolha o alvo", body: "Selecione a variável a explicar (vendas) e as explicativas (preço…)." },
            { icon: "🎛️", title: "3. Simule cenários", body: "Arraste sliders e veja o impacto previsto em tempo real." },
          ].map((c) => (
            <div key={c.title} className="rounded-2xl border border-border bg-card p-6">
              <div className="text-3xl">{c.icon}</div>
              <h3 className="mt-3 text-lg font-semibold">{c.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{c.body}</p>
            </div>
          ))}
        </section>

        <section className="mt-24 flex items-center gap-4 rounded-2xl border border-border bg-card p-8">
          <LineChart className="h-10 w-10 text-primary" />
          <div>
            <h2 className="text-xl font-semibold">Regressão OLS + elasticidade log-log</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Interpretação direta: <em>β</em> mostra o efeito marginal, e no modelo log-log você lê
              elasticidades — quanto Y muda em % quando X muda 1%.
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        ElastIQ · construído com dados que já são seus.
      </footer>
    </div>
  );
}
