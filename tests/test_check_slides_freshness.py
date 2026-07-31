import json
from pathlib import Path

import yaml


def write_yaml(path: Path, payload: dict):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(yaml.safe_dump(payload, sort_keys=False), encoding="utf-8")


def test_normalize_and_extract_helpers(freshness_module):
    raw = "Line 1\r\nLine    2\r\n\r\n\r\nLine 3"
    assert freshness_module.normalize_text(raw) == "Line 1\nLine 2\n\nLine 3"

    md_text = "# Intro\nalpha\n## Details\nbeta\n# Outro\ngamma\n"
    sections = freshness_module.extract_heading_sections(md_text, ["Intro", "Details"])
    assert "# Intro" in sections
    assert "## Details" in sections
    assert "# Outro" not in sections

    regex_fragments = freshness_module.extract_regex_fragments(
        md_text, [r"(?i)alpha", r"(?i)gamma"]
    )
    assert "alpha" in regex_fragments
    assert "gamma" in regex_fragments


def test_digest_sources_reports_selector_and_missing_file_errors(freshness_module, tmp_path):
    source_file = tmp_path / "docs" / "source.md"
    source_file.parent.mkdir(parents=True, exist_ok=True)
    source_file.write_text("# Title\ncontent\n", encoding="utf-8")

    hashes, errors = freshness_module.digest_sources([{"path": str(source_file)}])
    assert not errors
    assert str(source_file) in hashes

    _, missing_errors = freshness_module.digest_sources([{"path": str(tmp_path / "docs" / "none.md")}])
    assert any("Fonte markdown nao encontrada" in err for err in missing_errors)

    _, selector_errors = freshness_module.digest_sources(
        [
            {
                "path": str(source_file),
                "selectors": {"headings": ["No Match"]},
            }
        ]
    )
    assert any("Seletores sem resultado" in err for err in selector_errors)


def test_parse_manifest_sources_supports_string_and_object(freshness_module):
    parsed = freshness_module.parse_manifest_sources(
        [
            "github-docs/content/copilot.md",
            {"path": "github-docs/content/cli.md", "selectors": {"headings": ["Intro"]}},
        ]
    )
    assert parsed[0] == {"path": "github-docs/content/copilot.md"}
    assert parsed[1]["path"] == "github-docs/content/cli.md"
    assert parsed[1]["selectors"] == {"headings": ["Intro"]}


def test_main_returns_error_for_invalid_manifest(freshness_module, tmp_path, monkeypatch):
    manifest = tmp_path / "manifest.yml"
    state = tmp_path / "state.json"
    write_yaml(manifest, {"wrong_key": []})

    monkeypatch.chdir(tmp_path)
    monkeypatch.setattr(
        "sys.argv",
        [
            "check_slides_freshness.py",
            "--manifest",
            str(manifest),
            "--state",
            str(state),
        ],
    )
    assert freshness_module.main() == 1


def test_main_returns_stale_when_source_hash_changes(freshness_module, tmp_path, monkeypatch):
    slide = tmp_path / "slides" / "copilot.html"
    source = tmp_path / "github-docs" / "content" / "copilot.md"
    manifest = tmp_path / "slides" / "slide-sources.yml"
    state = tmp_path / "slides" / ".freshness-state.json"

    slide.parent.mkdir(parents=True, exist_ok=True)
    source.parent.mkdir(parents=True, exist_ok=True)

    slide.write_text("<html>slide</html>", encoding="utf-8")
    source.write_text("# Copilot\nUpdated content\n", encoding="utf-8")

    write_yaml(
        manifest,
        {
            "slides": [
                {
                    "slide": "slides/copilot.html",
                    "sources": [{"path": "github-docs/content/copilot.md"}],
                }
            ]
        },
    )

    monkeypatch.chdir(tmp_path)
    monkeypatch.setattr(
        "sys.argv",
        [
            "check_slides_freshness.py",
            "--manifest",
            "slides/slide-sources.yml",
            "--state",
            "slides/.freshness-state.json",
        ],
    )
    assert freshness_module.main() == 2
    assert not state.exists()


def test_main_returns_ok_when_state_matches_sources(freshness_module, tmp_path, monkeypatch):
    slide = tmp_path / "slides" / "copilot.html"
    source = tmp_path / "github-docs" / "content" / "copilot.md"
    manifest = tmp_path / "slides" / "slide-sources.yml"
    state = tmp_path / "slides" / ".freshness-state.json"

    slide.parent.mkdir(parents=True, exist_ok=True)
    source.parent.mkdir(parents=True, exist_ok=True)

    slide.write_text("<html>slide</html>", encoding="utf-8")
    source.write_text("# Copilot\nStable content\n", encoding="utf-8")

    write_yaml(
        manifest,
        {
            "slides": [
                {
                    "slide": "slides/copilot.html",
                    "sources": [{"path": "github-docs/content/copilot.md"}],
                }
            ]
        },
    )

    monkeypatch.chdir(tmp_path)

    source_hashes, errors = freshness_module.digest_sources(
        [{"path": "github-docs/content/copilot.md"}]
    )
    assert not errors
    current_hash = freshness_module.combined_hash(source_hashes)
    state_payload = {
        "version": 1,
        "slides": {
            "slides/copilot.html": {
                "source_hash": current_hash,
                "source_hashes": source_hashes,
            }
        },
    }
    state.write_text(json.dumps(state_payload, indent=2), encoding="utf-8")

    monkeypatch.setattr(
        "sys.argv",
        [
            "check_slides_freshness.py",
            "--manifest",
            "slides/slide-sources.yml",
            "--state",
            "slides/.freshness-state.json",
        ],
    )
    assert freshness_module.main() == 0
