# slides/images

Diretório para imagens das apresentações.

## Assets incluídos (MIT License — primer/octicons)

| Arquivo | Descrição | Tamanho |
|---|---|---|
| `copilot-48.svg` | Ícone do GitHub Copilot (48×48) | 48px |
| `copilot-24.svg` | Ícone do GitHub Copilot (24×24) | 24px |
| `mark-github-24.svg` | Marca GitHub / Invertocat (24×24) | 24px |
| `mark-github-16.svg` | Marca GitHub / Invertocat (16×16) | 16px |

Fonte: [github/primer/octicons](https://github.com/primer/octicons) — licença MIT.

## Assets proprietários — links externos (não incluídos no repositório)

As imagens do Octodex são **© GitHub Inc.** e não devem ser redistribuídas.
Use links externos diretamente no HTML:

```html
<img class="octocat"
     src="https://octodex.github.com/images/neurocats_FULL.png"
     alt="Neurocats — GitHub Octocat" />
```

Sugestoes para treinamentos de Copilot e IA:

| Octocat | URL | Por que usar |
|---|---|---|
| **Neurocats** | `https://octodex.github.com/images/neurocats_FULL.png` | Tematica de IA/neural — perfeita para Copilot |
| **Codercat** | `https://octodex.github.com/images/codercat.jpg` | Tematica de coding |
| **Original Mona** | `https://octodex.github.com/images/original.png` | Classica, reconhecivel |

O `template.html` ja inclui o elemento `.octocat` comentado na capa e no slide final.
Para ativar, descomente a linha `<!-- <img class="octocat" ... /> -->` e substitua pela URL desejada.

Referencia: [octodex.github.com](https://octodex.github.com) — [diretrizes de marca GitHub](https://brand.github.com/foundations/logo#legal)

## Adicionando novas imagens

Coloque seus arquivos de imagem aqui e referencie no HTML com caminho relativo:

```html
<img src="images/minha-imagem.png" alt="Descrição" />
```
