import io
import tarfile
from pathlib import Path


def build_tarball(path_to_content: dict[str, str]) -> bytes:
    buffer = io.BytesIO()
    with tarfile.open(fileobj=buffer, mode="w:gz") as tar:
        for path, content in path_to_content.items():
            data = content.encode("utf-8")
            info = tarfile.TarInfo(name=path)
            info.size = len(data)
            tar.addfile(info, io.BytesIO(data))
    return buffer.getvalue()


def test_fetch_repo_tree_uses_api_when_available(kb_sync_module, monkeypatch):
    class FakeResponse:
        status_code = 200

        @staticmethod
        def json():
            return {"tree": [{"path": "content/copilot", "type": "tree"}]}

    monkeypatch.setattr(kb_sync_module.requests, "get", lambda *args, **kwargs: FakeResponse())
    tree = kb_sync_module.fetch_repo_tree()
    assert tree == [{"path": "content/copilot", "type": "tree"}]


def test_fetch_repo_tree_falls_back_to_tarball(kb_sync_module, monkeypatch):
    class FakeResponse:
        status_code = 403

        @staticmethod
        def json():
            return {"message": "API rate limit exceeded"}

    monkeypatch.setattr(kb_sync_module.requests, "get", lambda *args, **kwargs: FakeResponse())
    monkeypatch.setattr(
        kb_sync_module,
        "fetch_repo_tree_via_tarball",
        lambda: [{"path": "content/rest", "type": "tree"}],
    )
    tree = kb_sync_module.fetch_repo_tree()
    assert tree == [{"path": "content/rest", "type": "tree"}]


def test_extract_paths_extracts_only_matching_prefix(kb_sync_module, tmp_path):
    tar_bytes = build_tarball(
        {
            "docs-main/content/demo/guide.md": "guide content",
            "docs-main/content/demo/nested/info.md": "nested content",
            "docs-main/content/other/skip.md": "should not extract",
        }
    )
    kb_sync_module.extract_paths(tar_bytes, ["content/demo"], str(tmp_path))

    assert (tmp_path / "content" / "demo" / "guide.md").read_text(encoding="utf-8") == "guide content"
    assert (
        tmp_path / "content" / "demo" / "nested" / "info.md"
    ).read_text(encoding="utf-8") == "nested content"
    assert not (tmp_path / "content" / "other" / "skip.md").exists()


def test_liquid_resolver_replaces_supported_tags(kb_sync_module, tmp_path):
    (tmp_path / "data" / "variables").mkdir(parents=True, exist_ok=True)
    (tmp_path / "data" / "reusables" / "tips").mkdir(parents=True, exist_ok=True)

    (tmp_path / "data" / "variables" / "product.yml").write_text(
        "name: GitHub Copilot CLI\n", encoding="utf-8"
    )
    (tmp_path / "data" / "reusables" / "tips" / "intro.md").write_text(
        "Use {% data variables.product.name %} every day.\n", encoding="utf-8"
    )

    resolver = kb_sync_module.LiquidResolver(str(tmp_path))
    source = """
{% data variables.product.name %}
{% data reusables.tips.intro %}
{% ifversion fpt %}primary{% else %}secondary{% endif %}
{% note %}Heads up{% endnote %}
{% codetabs %}
{% codetab typescript %}
console.log("ok")
{% endcodetab %}
{% endcodetabs %}
"""
    resolved = resolver.resolve(source)
    assert "GitHub Copilot CLI" in resolved
    assert "Use GitHub Copilot CLI every day." in resolved
    assert "primary" in resolved
    assert "secondary" not in resolved
    assert "> **Nota:**Heads up" in resolved
    assert "#### TypeScript" in resolved


def test_autotitle_and_frontmatter_processing(kb_sync_module):
    resolver = kb_sync_module.LiquidResolver.__new__(kb_sync_module.LiquidResolver)
    text = "---\ntitle: Meu Guia\n---\n[AUTOTITLE](/copilot/how-tos/copilot-cli)\n<!-- hidden -->\n"

    frontmatter_stripped = resolver.strip_front_matter(text)
    autotitled = resolver.resolve_autotitles(frontmatter_stripped)
    clean = resolver.strip_html_comments(autotitled)

    assert clean.startswith("# Meu Guia")
    assert "[Copilot CLI](https://docs.github.com/en/copilot/how-tos/copilot-cli)" in clean
    assert "<!-- hidden -->" not in clean


def test_run_generates_clean_markdown_and_skips_empty_indexes(kb_sync_module, tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    output_dir = tmp_path / "output"

    tar_bytes = build_tarball(
        {
            "docs-main/content/demo/page.md": (
                "---\n"
                "title: Demo Page\n"
                "---\n"
                "{% data variables.product.name %}\n\n"
                "{% data reusables.tips.intro %}\n"
            ),
            "docs-main/content/demo/index.md": "---\ntitle: Empty Index\n---\n",
            "docs-main/data/variables/product.yml": "name: GitHub Copilot\n",
            "docs-main/data/reusables/tips/intro.md": "Always test your changes.\n",
        }
    )
    monkeypatch.setattr(kb_sync_module, "download_repo_tarball", lambda *_: tar_bytes)

    kb_sync_module.run(["content/demo"], str(output_dir), keep_raw=False)

    page = output_dir / "demo" / "page.md"
    skipped_index = output_dir / "demo" / "index.md"

    assert page.exists()
    content = page.read_text(encoding="utf-8")
    assert content.startswith("# Demo Page")
    assert "GitHub Copilot" in content
    assert "Always test your changes." in content
    assert not skipped_index.exists()
    assert not (tmp_path / ".gh_docs_cache").exists()
