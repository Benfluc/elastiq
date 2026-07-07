# ElastIQ

ElastIQ é uma aplicação web para explorar e simular relações entre variáveis de negócio a partir de dados próprios. O usuário envia um arquivo CSV, o sistema ajusta um modelo de regressão (OLS, com suporte a especificação log-log) e permite simular cenários interativamente, visualizando em gráfico como a variável alvo (por exemplo, demanda ou vendas) responde a mudanças em uma variável explicativa (por exemplo, preço).

Acesse a versão em produção: https://elastiqia.vercel.app

## Funcionalidades

- Upload de datasets em CSV, com detecção automática de colunas numéricas
- Ajuste de modelo de regressão linear (OLS), com opção de especificação log-log para estimar elasticidades
- Simulador interativo com sliders para ajustar os valores das variáveis explicativas
- Visualização de gráficos comparando valores observados e previstos (Recharts)
- Persistência das configurações de cada dataset, como coluna alvo, variáveis explicativas e tipo de modelo
- Roteamento por arquivo com TanStack Router/Start

## Tecnologias

- React 19 com TanStack Start e TanStack Router
- TanStack Query para gerenciamento de estado assíncrono
- Vite como bundler
- Tailwind CSS e Radix UI para a interface
- Supabase como backend/autenticação
- Recharts para visualização de dados
- TypeScript em todo o projeto

## Requisitos

- Bun (recomendado) ou Node.js 18+
- Uma conta e projeto no Supabase para autenticação/backend

## Instalação

Clone o repositório:

```bash
git clone https://github.com/Benfluc/elastiq.git
cd elastiq
```

Instale as dependências:

```bash
bun install
```

Configure as variáveis de ambiente copiando o arquivo de exemplo:

```bash
cp .env.example .env
```

Preencha os valores no arquivo .env:

```
SUPABASE_PROJECT_ID=
SUPABASE_PUBLISHABLE_KEY=
SUPABASE_URL=
VITE_SUPABASE_PROJECT_ID=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_SUPABASE_URL=
```

Inicie o servidor de desenvolvimento:

```bash
bun dev
```

## Scripts disponíveis

| Comando | Descrição |
| --- | --- |
| bun dev | Inicia o servidor de desenvolvimento |
| bun run build | Gera a build de produção |
| bun run build:dev | Gera a build em modo de desenvolvimento |
| bun run preview | Executa a build localmente para pré-visualização |
| bun run lint | Executa o ESLint |
| bun run format | Formata o código com Prettier |

## Estrutura do projeto

```
src/
├── components/ui    # Componentes de interface reutilizáveis
├── hooks            # Hooks customizados
├── integrations     # Integrações externas (ex.: Supabase)
├── lib              # Utilitários (parsing de CSV, regressão, etc.)
├── routes           # Rotas da aplicação (file-based routing)
└── styles.css       # Estilos globais
```

## Licença

Projeto privado/pessoal. Todos os direitos reservados ao autor.
