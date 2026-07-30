# Managing or restricting GitHub Models in your organization

> [!NOTE]
> GitHub Models for organizations and repositories is in public preview and subject to change.


## About GitHub Models

GitHub Models automates, enhances, and streamlines AI-powered software development processes within GitHub. You can use GitHub Models to manage and optimize prompts, compare models, and create robust evaluations. See [About GitHub Models](https://docs.github.com/en/github-models/about-github-models).


## Prerequisites

For GitHub Models to be available to your organization, an enterprise owner must first enable the feature for the enterprise.
  See [Enabling GitHub Models for an enterprise](/github-models/github-models-at-scale/manage-models-at-scale#enabling-github-models-for-an-enterprise).

## Enabling or restricting models in your organization

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
