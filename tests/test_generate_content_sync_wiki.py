def test_parse_changes_supports_add_modify_delete_and_rename(wiki_sync_module):
    lines = [
        "A\tgithub-docs/content/copilot/new.md",
        "M\tgithub-docs/content/copilot/overview.md",
        "D\tgithub-docs/content/copilot/legacy.md",
        "R100\tgithub-docs/content/copilot/old-name.md\tgithub-docs/content/copilot/new-name.md",
        "M\tREADME.md",
    ]

    changes = wiki_sync_module.parse_changes(lines)
    assert len(changes) == 4
    assert [c["status"] for c in changes] == ["A", "M", "D", "R"]
    assert changes[-1]["old_path"].endswith("old-name.md")
    assert changes[-1]["path"].endswith("new-name.md")


def test_main_generates_page_and_prepends_entries(wiki_sync_module, tmp_path, monkeypatch):
    changes_file = tmp_path / ".content-changes.txt"
    output_file = tmp_path / "github-docs" / "content-sync-log.md"
    changes_file.write_text(
        "\n".join(
            [
                "M\tgithub-docs/content/copilot/how-tos/copilot-cli/overview.md",
                "A\tgithub-docs/content/copilot/how-tos/copilot-cli/new-topic.md",
            ]
        ),
        encoding="utf-8",
    )

    monkeypatch.setattr(
        "sys.argv",
        [
            "generate_content_sync_wiki.py",
            "--changes-file",
            str(changes_file),
            "--output",
            str(output_file),
            "--workflow-run-url",
            "https://github.com/org/repo/actions/runs/123",
            "--source-sha",
            "abc123",
            "--executed-at",
            "2026-07-31 04:00:00Z",
        ],
    )
    assert wiki_sync_module.main() == 0

    first_content = output_file.read_text(encoding="utf-8")
    assert "# Atualizacoes operacionais de github-docs/content" in first_content
    assert "Sync 2026-07-31 04:00:00Z" in first_content
    assert "`abc123`" in first_content
    assert "**2**" in first_content

    changes_file.write_text(
        "D\tgithub-docs/content/copilot/how-tos/copilot-cli/legacy.md",
        encoding="utf-8",
    )
    monkeypatch.setattr(
        "sys.argv",
        [
            "generate_content_sync_wiki.py",
            "--changes-file",
            str(changes_file),
            "--output",
            str(output_file),
            "--workflow-run-url",
            "https://github.com/org/repo/actions/runs/456",
            "--source-sha",
            "def456",
            "--executed-at",
            "2026-08-01 04:00:00Z",
        ],
    )
    assert wiki_sync_module.main() == 0

    second_content = output_file.read_text(encoding="utf-8")
    top_first = second_content.index("Sync 2026-08-01 04:00:00Z")
    top_second = second_content.index("Sync 2026-07-31 04:00:00Z")
    assert top_first < top_second
    assert "`def456`" in second_content


def test_main_does_not_write_when_no_content_changes(wiki_sync_module, tmp_path, monkeypatch):
    changes_file = tmp_path / ".content-changes.txt"
    output_file = tmp_path / "github-docs" / "content-sync-log.md"
    changes_file.write_text("M\tREADME.md\n", encoding="utf-8")

    monkeypatch.setattr(
        "sys.argv",
        [
            "generate_content_sync_wiki.py",
            "--changes-file",
            str(changes_file),
            "--output",
            str(output_file),
            "--workflow-run-url",
            "https://github.com/org/repo/actions/runs/123",
        ],
    )
    assert wiki_sync_module.main() == 0
    assert not output_file.exists()
