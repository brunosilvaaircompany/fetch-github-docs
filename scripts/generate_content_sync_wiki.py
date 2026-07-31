#!/usr/bin/env python3
"""
Generate a wiki-oriented markdown page with operational updates for github-docs/content.

Input:
  - a git name-status file produced by:
      git diff --name-status -- github-docs/content

Behavior:
  - if there are no changes in github-docs/content, the script does not update output
  - if there are changes, prepend a new run entry to the output page
"""

from __future__ import annotations

import argparse
import os
from collections import Counter
from datetime import datetime, timezone


CONTENT_PREFIX = "github-docs/content/"
ENTRY_START = "<!-- entries:start -->"
ENTRY_END = "<!-- entries:end -->"


def normalize_slashes(path: str) -> str:
    return path.replace("\\", "/").strip()


def parse_name_status_line(line: str) -> dict | None:
    raw = line.strip()
    if not raw:
        return None

    parts = raw.split("\t")
    if len(parts) < 2:
        return None

    status = parts[0].strip()
    status_letter = status[0].upper() if status else ""
    if status_letter == "R":
        if len(parts) < 3:
            return None
        old_path = normalize_slashes(parts[1])
        new_path = normalize_slashes(parts[2])
        return {"status": "R", "old_path": old_path, "path": new_path}

    path = normalize_slashes(parts[1])
    if status_letter not in {"A", "M", "D"}:
        return None
    return {"status": status_letter, "path": path}


def parse_changes(lines: list[str]) -> list[dict]:
    parsed: list[dict] = []
    for line in lines:
        entry = parse_name_status_line(line)
        if not entry:
            continue

        if entry["status"] == "R":
            old_ok = entry["old_path"].startswith(CONTENT_PREFIX)
            new_ok = entry["path"].startswith(CONTENT_PREFIX)
            if old_ok or new_ok:
                parsed.append(entry)
            continue

        if entry["path"].startswith(CONTENT_PREFIX):
            parsed.append(entry)
    return parsed


def classify_priority(changes: list[dict]) -> str:
    counts = Counter(c["status"] for c in changes)
    if counts["D"] > 0 or counts["R"] > 0:
        return "alta"
    if len(changes) >= 30:
        return "alta"
    if len(changes) >= 10:
        return "media"
    return "baixa"


def area_from_path(path: str) -> str:
    rel = path[len(CONTENT_PREFIX) :] if path.startswith(CONTENT_PREFIX) else path
    parts = [p for p in rel.split("/") if p]
    if not parts:
        return "(root)"
    if len(parts) == 1:
        return parts[0]
    return f"{parts[0]}/{parts[1]}"


def summarize_areas(changes: list[dict]) -> list[tuple[str, int]]:
    area_counts = Counter()
    for change in changes:
        area_counts[area_from_path(change["path"])] += 1
    return sorted(area_counts.items(), key=lambda item: (-item[1], item[0]))


def render_header() -> str:
    return """# Atualizacoes operacionais de github-docs/content

Esta pagina registra as sincronizacoes automaticas de `github-docs/content` para conectar
mudancas na documentacao oficial ao proposito deste repositorio:
- manter base de conhecimento atualizada para consumo por Copilot/Spaces
- identificar impacto em treinamentos e materiais em `slides/`

Fluxo operacional:
1. `fetch-docs.yml` executa `scripts/kb_sync.py` e atualiza `github-docs/`.
2. O workflow commita as mudancas quando houver diff.
3. `check-slides-freshness.yml` avalia impacto em slides HTML.

## Entradas por execucao

<!-- entries:start -->
<!-- entries:end -->
"""


def render_changes_table(changes: list[dict], max_rows: int) -> list[str]:
    lines = [
        "| Tipo | Arquivo |",
        "|---|---|",
    ]
    for change in changes[:max_rows]:
        if change["status"] == "R":
            lines.append(f"| R | `{change['old_path']}` -> `{change['path']}` |")
        else:
            lines.append(f"| {change['status']} | `{change['path']}` |")
    if len(changes) > max_rows:
        lines.append(f"| ... | +{len(changes) - max_rows} arquivos |")
    return lines


def render_entry(
    *,
    executed_at: str,
    workflow_run_url: str,
    workflow_name: str,
    docs_section: str,
    source_sha: str,
    changes: list[dict],
    max_files: int,
) -> str:
    counts = Counter(c["status"] for c in changes)
    areas = summarize_areas(changes)
    priority = classify_priority(changes)

    lines: list[str] = [
        f"### Sync {executed_at}",
        "",
        "| Campo | Valor |",
        "|---|---|",
        f"| Workflow | `{workflow_name}` |",
        f"| Run | [abrir execucao]({workflow_run_url}) |",
        f"| Trigger SHA | `{source_sha}` |",
        f"| Escopo (`DOCS_SECTION`) | `{docs_section}` |",
        "",
        "#### Resumo de mudancas",
        "",
        f"- Total de arquivos alterados em `github-docs/content`: **{len(changes)}**",
        f"- `A`: **{counts['A']}** | `M`: **{counts['M']}** | `D`: **{counts['D']}** | `R`: **{counts['R']}**",
        "",
        "#### Areas mais impactadas",
        "",
        "| Area | Arquivos alterados |",
        "|---|---|",
    ]
    for area, total in areas[:10]:
        lines.append(f"| `{area}` | {total} |")

    lines.extend(
        [
            "",
            "#### Impacto para o repositorio",
            "",
            f"- Prioridade de revisao sugerida: **{priority}**",
            "- Verificar se houve alteracao em conteudo usado por `slides/slide-sources.yml`.",
            "- Se houver alerta do freshness, atualizar slide + baseline no mesmo commit.",
            "",
            "#### Checklist pos-sync",
            "",
            "- [ ] Revisar arquivos criticos alterados",
            "- [ ] Confirmar status do `check-slides-freshness.yml`",
            "- [ ] Ajustar `slides/slide-sources.yml` quando necessario",
            "- [ ] Registrar decisao editorial (atualizar agora vs backlog)",
            "",
            "#### Arquivos alterados (amostra)",
            "",
        ]
    )
    lines.extend(render_changes_table(changes, max_rows=max_files))
    lines.extend(["", "---", ""])
    return "\n".join(lines)


def prepend_entry(existing_page: str, entry: str) -> str:
    if ENTRY_START not in existing_page or ENTRY_END not in existing_page:
        existing_page = render_header()

    start_idx = existing_page.index(ENTRY_START) + len(ENTRY_START)
    end_idx = existing_page.index(ENTRY_END)
    current_entries = existing_page[start_idx:end_idx].lstrip("\n")
    new_entries = f"\n\n{entry}{current_entries}"
    return f"{existing_page[:start_idx]}{new_entries}{existing_page[end_idx:]}"


def load_changes_file(path: str) -> list[str]:
    if not os.path.isfile(path):
        raise ValueError(f"Arquivo de mudancas nao encontrado: {path}")
    with open(path, "r", encoding="utf-8") as f:
        return f.read().splitlines()


def write_text(path: str, text: str) -> None:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(text)


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate wiki update page from content diff.")
    parser.add_argument("--changes-file", required=True, help="Path to git name-status diff file.")
    parser.add_argument("--output", required=True, help="Output markdown file path.")
    parser.add_argument("--workflow-run-url", required=True, help="GitHub Actions run URL.")
    parser.add_argument("--workflow-name", default="Atualizar documentacao do GitHub")
    parser.add_argument("--docs-section", default="content")
    parser.add_argument("--source-sha", default="n/a")
    parser.add_argument("--executed-at", help="Optional timestamp (UTC ISO).")
    parser.add_argument("--max-files", type=int, default=40)
    args = parser.parse_args()

    executed_at = args.executed_at or datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%SZ")
    raw_lines = load_changes_file(args.changes_file)
    changes = parse_changes(raw_lines)

    if not changes:
        print("Sem mudancas em github-docs/content; pagina wiki nao foi alterada.")
        return 0

    entry = render_entry(
        executed_at=executed_at,
        workflow_run_url=args.workflow_run_url,
        workflow_name=args.workflow_name,
        docs_section=args.docs_section,
        source_sha=args.source_sha,
        changes=changes,
        max_files=max(1, args.max_files),
    )

    if os.path.isfile(args.output):
        with open(args.output, "r", encoding="utf-8") as f:
            page = f.read()
    else:
        page = render_header()

    updated = prepend_entry(page, entry)
    write_text(args.output, updated)
    print(f"Pagina de atualizacoes gerada: {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
