# Upload fails because GitHub Code Security is disabled

## About this error

```text
{% data variables.product.prodname_GHAS_or_code_security %} not enabled
{% data variables.product.prodname_GHAS_or_code_security %} blocked by a policy
403: {% data variables.product.prodname_GHAS_or_code_security %} is not enabled
```

This error is reported if a process attempts to upload a SARIF file to a repository where GitHub Code Security is not enabled or where use of this feature is blocked by a policy.

You will only see this error for SARIF files that contain results created using CodeQL and for uploads to repositories with private or internal visibility. GitHub Code Security is enabled by default for all public repositories.

For information on how to confirm this error and fix the problem, see [Advanced Security Must Be Enabled](https://docs.github.com/en/code-security/reference/code-scanning/troubleshoot-analysis-errors/advanced-security-must-be-enabled).
