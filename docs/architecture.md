## Arquitetura do projeto

O diagrama abaixo apresenta a visão em alto nível do fluxo de dados e das responsabilidades principais do projeto.

```mermaid
flowchart LR
  subgraph Client
    App[App (`src/App.tsx`)] --> Router[BrowserRouter]
    Router --> Pages[Pages (`src/pages/*`)]
    Pages --> Components[UI Components (`src/components/*`)]
  end

  Components --> Hooks[Hooks (`src/hooks/*`)]
  Components --> Contexts[Contexts (`src/contexts/*`)]
  Hooks --> ReactQuery[React Query (`@tanstack/react-query`)]
  ReactQuery --> SupabaseClient[Supabase client (`src/integrations/supabase/client.ts`)]
  SupabaseClient --> SupabaseFuncs[Supabase Functions (`supabase/functions/*`)]

  subgraph UI_Primitives
    Radix[Radix UI] --> Components
    Tailwind[Tailwind CSS + CVA] --> Components
  end

  subgraph Utils
    Lib[`src/lib/*`] --> Hooks
    Utils[`src/utils/*`] --> Components
  end

  subgraph Dev
    Vite[Vite] --> App
    TS[TypeScript] --> App
    ESLint[ESLint] --> Code
  end

  classDef box stroke:#333,stroke-width:1px,fill:#f8f9fa;
  class App,Router,Pages,Components,Hooks,ReactQuery,SupabaseClient,Contexts box;
```

**Resumo da visão:**
- O ponto de entrada é `src/App.tsx` com `BrowserRouter` e rotas em `src/pages/`.
- Páginas combinam componentes reutilizáveis presentes em `src/components/`.
- A lógica de acesso a dados e caching usa hooks customizados em `src/hooks/` integrados com `@tanstack/react-query`.
- O backend é o Supabase: há um cliente em `src/integrations/supabase/client.ts` e funções serverless em `supabase/functions/`.
- Estados globais (tema, sidebar, modo do app, auth) são expostos via Providers em `src/contexts/`.
- UI é construída sobre Radix + Tailwind + CVA/`clsx` para variantes e consistência visual.

Se quiser, eu posso:
- Gerar uma versão em SVG do diagrama (precisa do `mmdc`/Mermaid CLI ou exportação via VS Code).
- Listar os 20 arquivos mais relevantes e explicar cada um rapidamente.

Arquivo criado: `docs/architecture.md` — abra no editor para visualizar o diagrama Mermaid.
