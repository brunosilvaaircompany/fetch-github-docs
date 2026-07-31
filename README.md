# fetch-github-docs

Automatiza o download de **qualquer seção** da documentação do GitHub
(`docs.github.com`), direto da fonte (repositório público
[`github/docs`](https://github.com/github/docs)), já resolvendo os
templates internos usados pelo site (`{% data reusables... %}`,
`{% ifversion %}`, `[AUTOTITLE]`, front matter YAML) — o resultado é
Markdown limpo, pronto para uso no **GitHub Copilot Spaces**,
NotebookLM, ou qualquer outra ferramenta de estudo.

## Instalação

```bash
pip install -r requirements.txt
```

## Uso básico

`--section` é obrigatório — você sempre informa qual parte da doc quer baixar:

```bash
python3 fetch_github_docs.py --section content/github-cli/github-cli
```

Isso cria a pasta `./github-docs/github-cli/` com os arquivos `.md`
limpos dessa seção (o nome da subpasta é sempre a última parte do
caminho de `--section`). Se você passar mais de uma seção, cada uma
ganha sua própria subpasta dentro de `./github-docs/`.

O download é **recursivo**: se a seção tiver subpastas (ex:
`content/copilot/how-tos/copilot-sdk/setup/`,
`.../features/`, etc), todas são baixadas e a estrutura de pastas
original é preservada dentro da saída.

## Descobrindo o caminho de uma seção

O desafio de usar `--section` é saber o caminho exato dentro do
repositório. Para isso, use os modos de descoberta (não exigem `--section`):

```bash
# Ver as categorias de nível superior da documentação do GitHub
python3 fetch_github_docs.py --list

# Buscar uma seção específica por palavra-chave (ex: "webhooks", "codespaces")
python3 fetch_github_docs.py --search webhooks
```

O `--search` devolve o caminho pronto para copiar e colar em `--section`.

## Opções

```bash
# Baixar mais de uma seção de uma vez (separadas por vírgula)
python3 fetch_github_docs.py --section content/webhooks,content/rest/webhooks

# Escolher outra pasta de saída
python3 fetch_github_docs.py --section content/codespaces --output ./minha-pasta

# Manter os arquivos brutos baixados (útil para depurar)
python3 fetch_github_docs.py --section content/codespaces --keep-raw
```

Esses dois modos de descoberta consultam a API do GitHub primeiro
(mais rápido); se ela estiver com limite de requisições atingido, o
script cai automaticamente para o download do tarball completo do
repositório (mais lento, mas nunca falha por rate limit).

## Automatizar de verdade (rodar sozinho, sem você lembrar)

Se você criar um repositório no GitHub só pra guardar esses arquivos
(e depois linkar esse repositório no Copilot Spaces), copie o arquivo
`.github/workflows/fetch-docs.yml` para dentro do seu repo, no mesmo
caminho, e ajuste a variável `DOCS_SECTION` no topo do arquivo para a
seção que você quer acompanhar.

Ele roda automaticamente toda segunda-feira, baixa a versão mais
recente da doc e faz commit se algo mudou. Assim o link no Copilot
Spaces sempre reflete a documentação atualizada, sem esforço manual.

## Como funciona (resumo técnico)

1. Baixa o tarball do repo `github/docs` (branch `main`) via
   `codeload.github.com` — não precisa de autenticação.
2. Extrai apenas a(s) pasta(s) da(s) seção(ões) informada(s) e as
   pastas `data/reusables` e `data/variables` (necessárias para
   resolver os templates).
3. Resolve recursivamente as tags `{% data variables.x.y %}` e
   `{% data reusables.x.y %}`, os blocos
   `{% ifversion %}...{% else %}...{% endif %}` (mantendo a versão
   padrão do GitHub.com) e os links `[AUTOTITLE](...)`.
4. Remove o front matter YAML, promovendo o campo `title` para um `#`
   no topo do arquivo.
5. Ignora páginas de índice sem conteúdo real (só navegação).

## Limitações conhecidas

- Só funciona para conteúdo em **inglês** — traduções (como pt-BR) não
  ficam no repositório público `github/docs` (são geradas por um
  pipeline de tradução separado).
- Se a GitHub reestruturar o repositório `github/docs` (mudar nomes de
  pastas), os caminhos de `--section` podem precisar de ajuste — rode
  `--list` ou `--search` de novo para confirmar.

## Automação para detectar slides HTML desatualizados

Este repositório também inclui um fluxo para detectar quando seus
slides em HTML ficaram desatualizados em relação à documentação
Markdown sincronizada.

Arquivos adicionados para isso:

- `.github/workflows/check-slides-freshness.yml`
- `scripts/check_slides_freshness.py`
- `slides/slide-sources.yml`
- `slides/.freshness-state.json`

### Como configurar o mapeamento

No arquivo `slides/slide-sources.yml`, cada slide define:

- `slide`: caminho do arquivo HTML
- `sources`: lista de arquivos Markdown fonte
- `selectors` (opcional): recortes relevantes (`headings` e/ou
  `regex_patterns`) para que a checagem considere apenas conteúdo que
  realmente alimenta o slide

Se você não informar `selectors`, o script considera o conteúdo inteiro
do arquivo Markdown fonte.

### Como inicializar/atualizar baseline

Depois de criar ou revisar slides, rode:

```bash
python3 scripts/check_slides_freshness.py \
  --manifest slides/slide-sources.yml \
  --state slides/.freshness-state.json \
  --write-state \
  --summary-file slides/.freshness-summary.md
```

Isso grava no `slides/.freshness-state.json` os hashes atuais do
conteúdo relevante.

### Comportamento da automação

O workflow `check-slides-freshness.yml` roda:

- semanalmente (segunda-feira, 07:00 UTC)
- manualmente (`workflow_dispatch`)
- após a conclusão com sucesso do workflow de sync (`fetch-docs.yml`)

Quando detectar desatualização:

- gera resumo no `GitHub Actions Job Summary`
- cria (ou comenta) issue aberta com label `slides-stale` e título
  `Slides HTML desatualizados`
- comenta em uma issue fixa de alerta (opcional)
- cria discussion de alerta (opcional)
- envia e-mail de alerta (quando os secrets SMTP estiverem configurados)

### Configurando alerta por e-mail

Para habilitar envio de e-mail no workflow, configure estes secrets no
repositório:

- `SMTP_SERVER`
- `SMTP_PORT`
- `SMTP_USERNAME`
- `SMTP_PASSWORD`
- `ALERT_EMAIL_TO` (pode ter múltiplos destinos separados por vírgula)
- `ALERT_EMAIL_FROM`

Se houver slide stale e esses secrets não estiverem preenchidos, o
workflow continua abrindo issue normalmente e apenas registra aviso no
`Job Summary`.

### Configurando comentário automático em issue

Para também comentar em uma issue específica (por exemplo, uma issue de
monitoramento central), configure:

- `ALERT_ISSUE_NUMBER` (somente o número da issue, ex: `123`)

### Configurando criação automática de Discussion

Para criar uma Discussion automaticamente a cada detecção de stale,
configure:

- `DISCUSSION_CATEGORY_ID` (ID GraphQL da categoria de Discussions)

Dica para descobrir o ID da categoria: use `gh api graphql` consultando
as categorias do repositório e copie o `id` da categoria desejada.
