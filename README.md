# copilot-knowledge-base

Kit completo para times que treinam e usam **GitHub Copilot**: sincroniza automaticamente a documentação oficial do GitHub como Markdown limpo (pronto para o Copilot Spaces) e oferece templates prontos para criar treinamentos de 1 hora com slides e hands-on.

🔗 **[Ver galeria de slides →](https://brunosilvaaircompany.github.io/copilot-knowledge-base/)**

## O que este repositório entrega

| Pilar | O que faz |
|---|---|
| 📥 **Sync de documentação** | Baixa qualquer seção de `docs.github.com`, resolve os templates Liquid internos e entrega arquivos `.md` limpos |
| 🎨 **Templates de treinamento** | Slides Reveal.js e guia de instrutor para treinamentos de 60 min sobre GitHub Copilot |
| 🔔 **Detecção de desatualização** | Alerta automaticamente quando os slides ficam defasados em relação à documentação sincronizada |
| 🌐 **GitHub Pages** | Galeria web com todos os slides disponíveis — acessível via `index.html` na raiz |

> **Publicação estática:** o repositório usa `.nojekyll` na raiz para o GitHub Pages servir os HTML diretamente, sem processar os arquivos Markdown em `github-docs/`.

## Estrutura

```
index.html                      # GitHub Pages — galeria de slides

scripts/
├── kb_sync.py                  # Sync de documentação
└── check_slides_freshness.py   # Verificação de slides desatualizados

slides/
├── template.md                 # Guia de conteúdo para o instrutor
├── template.html               # Apresentação Reveal.js (tema Copilot)
├── copilot-cli/index.html      # Slide: GitHub Copilot CLI (60 min)
├── slide-sources.yml           # Mapeamento slide ↔ fontes Markdown
└── images/                     # Imagens dos slides

.github/workflows/
├── fetch-docs.yml              # Roda diariamente e sincroniza a doc
└── check-slides-freshness.yml  # Detecta slides desatualizados

github-docs/                    # Markdown limpo gerado pelo kb_sync.py
```

---

## Pilar 1 — Sincronização de documentação

### Instalação

```bash
pip install -r requirements.txt
```

### Estilos com Primer (Design System)

Para manter as páginas estáticas alinhadas ao ecossistema GitHub, o repositório usa `@primer/css` como base visual:

```bash
npm install
npm run build:css
```

Isso gera/atualiza o arquivo `assets/css/primer.css`, consumido por `index.html` e pelos slides em `slides/`.

### Executando os testes automatizados

```bash
pytest -q
```

### Descobrindo o caminho de uma seção

Antes de baixar, use os modos de descoberta para encontrar o caminho exato:

```bash
# Listar categorias de nível superior
python3 scripts/kb_sync.py --list

# Buscar por palavra-chave
python3 scripts/kb_sync.py --search webhooks
```

O `--search` devolve o caminho pronto para copiar em `--section`.

### Baixando uma seção

```bash
python3 scripts/kb_sync.py --section content/github-cli/github-cli
```

Isso cria `./github-docs/github-cli/` com os arquivos `.md` limpos. O download é **recursivo** — subpastas são preservadas. Várias seções de uma vez:

```bash
python3 scripts/kb_sync.py --section content/webhooks,content/rest/webhooks
```

### Opções disponíveis

| Opção | Descrição |
|---|---|
| `--section <caminho>` | Seção a baixar (obrigatório, exceto com `--list`/`--search`) |
| `--output <pasta>` | Pasta de saída (padrão: `./github-docs`) |
| `--keep-raw` | Mantém o cache bruto em `.gh_docs_cache/` (útil para debug) |
| `--list` | Lista categorias de nível superior e sai |
| `--search <termo>` | Busca seções por palavra-chave e sai |

### Como o sync funciona

1. Baixa o tarball do repositório `github/docs` via `codeload.github.com` — sem autenticação.
2. Extrai a(s) seção(ões) solicitada(s) e as pastas `data/reusables` e `data/variables`.
3. Resolve recursivamente `{% data variables.x.y %}`, `{% data reusables.x.y %}`, blocos `{% ifversion %}` (mantendo a versão padrão do GitHub.com) e links `[AUTOTITLE]`.
4. Remove o front matter YAML, promovendo o campo `title` para `# H1`.
5. Ignora páginas de índice sem conteúdo real.

> Se a API do GitHub atingir o rate limit, o script cai automaticamente para o tarball completo — nunca falha silenciosamente.

### Automação diária

Copie `.github/workflows/fetch-docs.yml` para o seu repositório, ajuste a variável `DOCS_SECTION` e pronto: diariamente o workflow baixa a versão mais recente da documentação e faz commit se algo mudou. O link no Copilot Spaces fica sempre atualizado sem intervenção manual.

### Limitações

- Somente conteúdo em **inglês** — traduções (pt-BR etc.) são geradas por pipeline separado e não estão no repositório público `github/docs`.
- Se a GitHub reestruturar o repositório, rode `--list` ou `--search` para confirmar os novos caminhos.

---

## Pilar 2 — Templates de treinamento

### Slides prontos para uso

A pasta `slides/` traz dois arquivos para criar treinamentos de **1 hora** sobre GitHub Copilot:

| Arquivo | Descrição |
|---|---|
| `slides/template.md` | Guia de conteúdo para o instrutor — agenda, timebox e orientações por bloco |
| `slides/template.html` | Apresentação Reveal.js com tema GitHub Copilot — abre direto no navegador |

Estrutura padrão de 60 minutos:

| Bloco | Horário | Duração |
|---|---|---|
| ⚡ Abertura & Alinhamento | 00:00 – 05:00 | 5 min |
| 📖 Teoria, Conceitos & Casos de Uso | 05:00 – 15:00 | 10 min |
| 🛠️ Preparação do Ambiente | 15:00 – 20:00 | 5 min |
| 💻 Hands-on / Demonstração Prática | 20:00 – 50:00 | 30 min |
| ✅ Boas Práticas | 50:00 – 55:00 | 5 min |
| 🎯 Encerramento & Q&A | 55:00 – 60:00 | 5 min |

### Criando um novo slide

1. Copie `slides/template.html` para um novo arquivo (ex: `slides/copilot-mcp.html`).
2. Substitua os marcadores `[...]` pelo tema, instrutor e links do treinamento.
3. Adicione imagens em `slides/images/` e referencie com caminho relativo (`images/nome.png`).
4. Registre o novo slide em `slides/slide-sources.yml` para ativar o monitoramento de desatualização.

### Editando slides direto no navegador

Os decks em `slides/` agora incluem um modo de edição embutido no próprio HTML:

- **Novo deck (na galeria inicial)**: cria um deck com template inicial, título, descrição e tags, abre o editor e baixa uma cópia `.html` no computador.
- **Deck**: altera os metadados (título, descrição e tags) do deck atual.
- **Excluir deck**: remove um deck salvo localmente (decks base não são excluídos).
- **Editar slide**: ativa a edição inline no slide atual, direto na apresentação.
- **Editar HTML**: abre o editor de HTML do slide atual.
- **Editar CSS**: abre o editor de CSS da apresentação.
- **+ Slide**: adiciona um novo slide após o slide atual.
- **Templates**: insere páginas prontas e permite cadastrar templates do usuário.
- **Imagens**: abre biblioteca unificada (imagens do repositório + uploads locais); a inserção no slide exige **Editar slide** ativo e usa a posição atual do cursor.
- **Duplicar**: cria uma cópia do slide atual.
- **Fechar slide**: remove o slide atual da apresentação.
- **Salvar no computador**: baixa um arquivo `.html` com as alterações mais recentes aplicadas.
- **Resetar deck**: restaura somente o deck atual para o template inicial da página.
- **Esconder botões**: oculta os controles de edição (com botão para mostrar novamente).

As alterações de conteúdo, HTML, CSS, templates personalizados e uploads de imagem continuam sendo salvas automaticamente no `localStorage` do navegador (por deck e por dispositivo). Ao criar ou duplicar um deck, o navegador também baixa uma cópia `.html` para o computador. Depois de novas edições, use **Salvar no computador** para baixar a versão atualizada e, se quiser compartilhar as mudanças, versione esse arquivo no repositório.

> O navegador escolhe a pasta de downloads ou solicita o destino conforme a configuração do usuário. A aplicação não sobrescreve silenciosamente arquivos existentes, garantindo o mesmo comportamento em Windows, macOS e Linux.

---

## Pilar 3 — Detecção de slides desatualizados

O workflow `check-slides-freshness.yml` compara o conteúdo dos slides HTML com a documentação Markdown sincronizada e alerta quando há defasagem.

### Configurando o mapeamento

Em `slides/slide-sources.yml`, cada entrada define:

- `slide`: caminho do arquivo HTML
- `sources`: lista de arquivos Markdown fonte
- `selectors` *(opcional)*: recortes por `headings` e/ou `regex_patterns` para focar apenas no conteúdo relevante ao slide

### Inicializando o baseline

Após criar ou revisar um slide, grave o estado atual:

```bash
python3 scripts/check_slides_freshness.py \
  --manifest slides/slide-sources.yml \
  --state slides/.freshness-state.json \
  --write-state \
  --summary-file slides/.freshness-summary.md
```

### Quando a automação roda

- Toda segunda-feira às 07:00 UTC
- Manualmente via `workflow_dispatch`
- Automaticamente após cada execução bem-sucedida do `fetch-docs.yml`

Ao detectar desatualização, o workflow:

- Gera resumo no **GitHub Actions Job Summary**
- Abre (ou comenta em) uma issue com label `slides-stale`
- Envia e-mail de alerta *(se secrets SMTP configurados)*
- Cria uma Discussion de alerta *(se `DISCUSSION_CATEGORY_ID` configurado)*

### Secrets e variáveis de configuração

| Secret / Variável | Descrição |
|---|---|
| `SMTP_SERVER` | Servidor SMTP para envio de e-mail |
| `SMTP_PORT` | Porta do servidor SMTP |
| `SMTP_USERNAME` | Usuário de autenticação SMTP |
| `SMTP_PASSWORD` | Senha SMTP |
| `ALERT_EMAIL_TO` | Destinatário(s) do e-mail (separados por vírgula) |
| `ALERT_EMAIL_FROM` | Remetente do e-mail |
| `ALERT_ISSUE_NUMBER` | Número da issue de monitoramento central (opcional) |
| `DISCUSSION_CATEGORY_ID` | ID GraphQL da categoria de Discussions (opcional) |

> **Dica:** para descobrir o `DISCUSSION_CATEGORY_ID`, use `gh api graphql` consultando as categorias do repositório.
