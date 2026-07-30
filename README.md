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
