def test_slugify(changelog_module):
    assert changelog_module._slugify("copilot") == "copilot"
    assert changelog_module._slugify("collaboration tools") == "collaboration-tools"
    assert changelog_module._slugify("ecosystem & accessibility") == "ecosystem-and-accessibility"
    assert changelog_module._slugify("application security") == "application-security"


def test_topic_slug_picks_first_non_status_tag(changelog_module):
    assert changelog_module._topic_slug({"categories": ["Release", "copilot"]}) == "copilot"
    assert changelog_module._topic_slug({"categories": ["Improvement", "actions"]}) == "actions"


def test_topic_slug_returns_outros_when_only_status_tags(changelog_module):
    assert changelog_module._topic_slug({"categories": ["Release", "Retired"]}) == "outros"


def test_topic_slug_returns_outros_when_empty(changelog_module):
    assert changelog_module._topic_slug({"categories": []}) == "outros"


def test_write_category_files_creates_per_category_files(changelog_module, tmp_path):
    entries = [
        {
            "title": "Copilot 1",
            "link": "https://example.com/copilot-1",
            "date": "2026-01-01",
            "description": "desc",
            "categories": ["Release", "copilot"],
        },
        {
            "title": "Copilot 2",
            "link": "https://example.com/copilot-2",
            "date": "2026-01-02",
            "description": "desc",
            "categories": ["copilot"],
        },
        {
            "title": "Actions 1",
            "link": "https://example.com/actions-1",
            "date": "2026-01-03",
            "description": "desc",
            "categories": ["Improvement", "actions"],
        },
    ]

    changelog_module.write_category_files(entries, str(tmp_path))

    copilot_md = tmp_path / "copilot.md"
    actions_md = tmp_path / "actions.md"
    index_md = tmp_path / "_index.md"

    assert copilot_md.exists()
    assert actions_md.exists()
    assert index_md.exists()
    assert copilot_md.read_text(encoding="utf-8").count("## [") == 2
    assert actions_md.read_text(encoding="utf-8").count("## [") == 1


def test_write_category_files_creates_index_with_all_themes(changelog_module, tmp_path):
    entries = [
        {
            "title": "Copilot 1",
            "link": "https://example.com/copilot-1",
            "date": "2026-01-01",
            "description": "desc",
            "categories": ["copilot"],
        },
        {
            "title": "Actions 1",
            "link": "https://example.com/actions-1",
            "date": "2026-01-03",
            "description": "desc",
            "categories": ["actions"],
        },
    ]

    changelog_module.write_category_files(entries, str(tmp_path))
    index_content = (tmp_path / "_index.md").read_text(encoding="utf-8")

    assert "[copilot](copilot.md)" in index_content
    assert "[actions](actions.md)" in index_content
