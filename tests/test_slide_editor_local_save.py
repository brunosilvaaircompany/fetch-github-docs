from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SLIDE_FILES = list((ROOT / "slides").rglob("*.html")) + [ROOT / "index.html"]


def test_versioned_themes_registry_matches_editor_variables():
    themes = (ROOT / "slides" / "themes.js").read_text(encoding="utf-8")
    storage = (ROOT / "slides" / "editor-storage.js").read_text(encoding="utf-8")

    for variable in (
        "--bg",
        "--surface",
        "--surface-strong",
        "--border",
        "--accent",
        "--accent-light",
        "--text",
        "--text-muted",
        "--green",
        "--amber",
    ):
        assert variable in themes
    assert "window.SlideDeckThemes" in themes
    assert 'const ROOT_KEY = "slide-editor:v4"' in storage
    assert "customThemes" in storage
    assert "getThemes" in storage
    assert "saveCustomTheme" in storage
    assert "deleteCustomTheme" in storage


def test_all_slide_pages_load_themes_and_current_editor_version():
    for path in SLIDE_FILES:
        source = path.read_text(encoding="utf-8")
        assert "themes.js?v=deck-v3" in source, path
        assert "editor-storage.js?v=deck-v3" in source, path
        assert "slide-editor.js?v=deck-v3" in source, path
        assert "deck-v2" not in source, path
        assert "deck-v1" not in source, path


def test_editor_exposes_theme_selection_and_customization_hooks():
    editor = (ROOT / "slides" / "slide-editor.js").read_text(encoding="utf-8")

    assert 'themesButton.textContent = "Temas"' in editor
    assert "applyDeckTheme" in editor
    assert "saveThemeFromPanel" in editor
    assert "themeId" in editor
    assert 'id = "slide-editor-theme"' in editor
    assert "insertBefore(themeStyle, editableStyleTag)" in editor
