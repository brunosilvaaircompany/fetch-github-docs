from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]


def read_text(relative_path: str) -> str:
    return (REPO_ROOT / relative_path).read_text(encoding="utf-8")


def test_all_deck_creation_flows_request_an_initial_download():
    gallery = read_text("index.html")

    assert gallery.count("{ saveToComputer: true }") == 3
    assert "window.location.assign(store.buildDeckHref(duplicated, { saveToComputer: true }))" in gallery
    assert "window.location.assign(store.buildDeckHref(created, { saveToComputer: true }))" in gallery


def test_deck_url_marks_download_only_when_requested():
    storage = read_text("slides/editor-storage.js")

    assert 'const saveParam = settings.saveToComputer ? "&save=computer" : "";' in storage
    assert "`${base}${separator}deck=${encodeURIComponent(item.id)}${saveParam}`" in storage


def test_editor_exposes_portable_save_and_consumes_request_once():
    editor = read_text("slides/slide-editor.js")

    assert 'exportButton.textContent = "Salvar no computador";' in editor
    assert "saveSlidesNow();" in editor
    assert 'url.searchParams.delete(INITIAL_SAVE_PARAM);' in editor
    assert 'window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);' in editor
    assert 'base.href = document.baseURI;' in editor
    assert 'anchor.download = getDeckFileName();' in editor


def test_all_pages_use_the_new_editor_asset_version():
    pages = [
        read_text("index.html"),
        read_text("slides/template.html"),
        read_text("slides/copilot-cli/index.html"),
    ]

    assert all("deck-v1" not in page for page in pages)
    assert all("deck-v2" in page for page in pages)
