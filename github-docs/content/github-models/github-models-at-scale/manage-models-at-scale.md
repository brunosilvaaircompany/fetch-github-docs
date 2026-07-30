# Managing your team's model usage

> [!NOTE]
> GitHub Models for organizations and repositories is in public preview and subject to change.


## Why restrict model usage in your organization?

Limiting the models available to your developers can help **control spend on models and meet your governance, data security, and compliance requirements**.

If you don't manage access, your teams may inadvertently use models that do not meet your organization’s standards, leading to potential risks such as:

* Unexpected costs from high-priced models
* Security or compliance issues caused by unauthorized AI services
* Time wasted integrating unapproved or suboptimal models

For more information about using models at scale, see [Use Models At Scale](https://docs.github.com/en/github-models/github-models-at-scale/use-models-at-scale).

## Exceptions to your organization's model settings

While GitHub Models for organizations and repositories is in public preview, some of your organization's model settings are not applied in certain circumstances. Your teams will be able to use AI models without limitation in the following places:

* Enterprise Managed Users organizations
* GitHub Models extension for GitHub CLI
* GitHub Models extension for GitHub Copilot Chat
* GitHub Models VS Code extension
* Playground for GitHub Models in the GitHub Marketplace at https://github.com/marketplace/models.

## Enabling GitHub Models for an enterprise

For GitHub Models to be available to your organization, an enterprise owner must first enable the feature for the enterprise.



1. In the top-right corner of GitHub Enterprise Server, click your profile picture, then click **Enterprise settings**.


1. At the top of the page, click **{% octicon "law" aria-hidden="true" aria-label="law" %} Policies**.

1. Under {% octicon "law" aria-hidden="true" aria-label="law" %} "Policies", click **{% octicon "ai-model" aria-hidden="true" aria-label="ai-model" %} Models**.

1. Under "Models", in the "Models in your enterprise" section, click {% octicon "chevron-down" aria-label="the down arrow" %} beside **Disabled** and select one of the following options:
    * **Enabled**: Enable GitHub Models for all organizations in your enterprise.
    * **No policy**: Allow each organization in your enterprise to manage the enablement of GitHub Models independently.

## Controlling model usage in your organization

> [!NOTE]
> You can only change your organization's Models settings if your enterprise policies allow access to GitHub Models.


You can choose to enable or disable GitHub Models for your organization. You can also choose to only allow the use of selected models or model publishers. For more information, see the instructions below.

You can also integrate your preferred external LLM models by bringing your own keys (BYOK) to GitHub Models. See [Using Your Own API Keys In GitHub Models](https://docs.github.com/en/github-models/github-models-at-scale/using-your-own-api-keys-in-github-models)


1. In the upper-right corner of GitHub, click your profile picture, then click **{% octicon "organization" aria-hidden="true" aria-label="organization" %} Organizations**.

1. Select an organization by clicking on it.
1. Under your organization name, click **{% octicon "gear" aria-hidden="true" aria-label="gear" %} Settings**. If you cannot see the "Settings" tab, select the **{% octicon "kebab-horizontal" aria-label="More" %}** dropdown menu, then click **Settings**.

   ![Screenshot of the tabs in an organization's profile. The "Settings" tab is outlined in dark orange.](/assets/images/help/discussions/org-settings-global-nav-update.png)


1. In the sidebar, under "Code, planning, and automation",
 click the **{% octicon "ai-model" aria-hidden="true" aria-label="ai-model" %} Models** dropdown. Then click **Development**.

1. Under "Models", in the "Models in your organization" section, click {% octicon "chevron-down" aria-label="the down arrow" %} beside **Disabled** and select **Enabled** from the dropdown.

   > [!NOTE]
   > If GitHub Models is already enabled for the organization, the dropdown will show **Enabled**, and you can skip the step above.

1. Under "Models permissions", select one or more options.
   * **All publishers** is the default option and indicates that models from all the current and future publishers available on the GitHub Models catalog from the GitHub Marketplace can be used in the organization.
   * **Only select models** allows you to define a list of models and publishers:
        * Available to the organization (**Enabled list**)
        * Restricted for use in the organization (**Disabled list**)

   Depending on your requirements, you can specify an enabled list, a disabled list, or both.
   Once you've added a publisher to a list, you can fine-tune the list by removing individual models from it.
