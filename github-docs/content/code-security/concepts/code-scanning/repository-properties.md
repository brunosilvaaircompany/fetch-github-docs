# Repository properties for code scanning

## Prerequisites

For the repository properties described here to have an effect, you need to have set up code scanning. See [Setup Types](https://docs.github.com/en/code-security/concepts/code-scanning/setup-types).

Repository properties which affect code scanning must be created manually for your organization. You can then set values for them that apply to your entire organization or allow them to be configured differently for each repository. See [Managing Custom Properties For Repositories In Your Organization](https://docs.github.com/en/organizations/managing-organization-settings/managing-custom-properties-for-repositories-in-your-organization).

## Supported repository properties for code scanning

Some code scanning functionality can be configured using repository properties. Organizations can use repository properties to both enforce configurations across all repositories and for individual repositories. If code scanning is customized using repository properties, the customization applies to all setup types.

The following is an overview of repository properties you can set up which affect code scanning analyses when configured:

| Name | Type |
|------|------|
| `github-codeql-extra-queries` | Text |
| `github-codeql-disable-overlay` | True/false |
| `github-codeql-file-coverage-on-prs` | True/false |

> [!NOTE]
> The repository properties which are supported depend on the version of the [github/codeql-action](https://github.com/github/codeql-action/) that is used by your code scanning analyses. For code scanning advanced setup, check that your workflow is referencing the latest major version. Code scanning default setup automatically uses the latest version. If the server on which you are running GitHub Enterprise Server is not connected to the internet, you may need to use the CodeQL action sync tool. See [Configuring Code Scanning For Your Appliance](https://docs.github.com/en/code-security/how-tos/secure-at-scale/configure-enterprise-security/configure-specific-tools/configuring-code-scanning-for-your-appliance#configuring-codeql-analysis-on-a-server-without-internet-access).

### Analysis customization

The `github-codeql-extra-queries` property allows you to configure additional queries that should be run. This is useful to add queries to all relevant analyses in your organization without needing to modify individual workflows or switch to an advanced setup. This accepts the same values as the `queries` input of the [github/codeql-action](https://github.com/github/codeql-action/). See [Workflow Configuration Options](https://docs.github.com/en/code-security/reference/code-scanning/workflow-configuration-options).

### Enabling or disabling features

You can disable improved incremental analysis by setting the `github-codeql-disable-overlay` property to `true`. This may be useful if improved incremental analysis is failing because of increased hardware requirements.

File coverage information is not calculated for analyses of pull requests. If you want to enable file coverage information for pull requests, you can set the `github-codeql-file-coverage-on-prs` property to `true`.
