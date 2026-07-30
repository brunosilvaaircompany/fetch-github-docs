# Enabling secret scanning for generic patterns

## Enabling scanning for generic patterns

You can enable scanning for generic patterns. Generic patterns correspond to secrets such as private keys.

For more information about generic patterns, see "[Supported Secret Scanning Patterns](https://docs.github.com/en/code-security/reference/secret-security/supported-secret-scanning-patterns#supported-generic-patterns)."

### Enabling detection of generic patterns for a repository

1. On GitHub, navigate to the main page of the repository.

1. Under your repository name, click **{% octicon "gear" aria-hidden="true" aria-label="gear" %} Settings**. If you cannot see the "Settings" tab, select the **{% octicon "kebab-horizontal" aria-label="More" %}** dropdown menu, then click **Settings**.

   ![Screenshot of a repository header showing the tabs. The "Settings" tab is highlighted by a dark orange outline.](/assets/images/help/repository/repo-actions-settings.png)

1. In the "Security" section of the sidebar, click **{% octicon "codescan" aria-hidden="true" aria-label="codescan" %} Advanced Security**.

1. Under "Secret Protection", to the right of "Generic patterns", click **Enable**.

### Enabling detection of generic patterns for an organization

You can enable scanning for generic patterns at the organization level by applying a custom security configuration. For more information, see [Creating A Custom Security Configuration](https://docs.github.com/en/code-security/securing-your-organization/enabling-security-features-in-your-organization/creating-a-custom-security-configuration).
