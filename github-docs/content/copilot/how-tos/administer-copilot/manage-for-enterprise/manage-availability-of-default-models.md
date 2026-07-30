# Managing availability of models in your enterprise

## About managing model availability

As an enterprise owner, you can manage which Copilot models are available to organizations within your enterprise. For each model, you can choose whether it is automatically enabled for all organizations or whether individual organizations can choose to enable it.

> [!IMPORTANT] 

On Copilot Business and Copilot Enterprise plans, a new policy will control whether unconfigured generally available (GA) models default to enabled or disabled. For more information, see [Automatic Enablement](https://docs.github.com/en/copilot/concepts/models/automatic-enablement).




## Navigating to your model policies

From the model configuration page, you can enable or disable specific models. You can also configure the **Default availability for released models** policy to choose the default status of unconfigured models.


1. In the top-right corner of GitHub Enterprise Server, click your profile picture, then click **Enterprise settings**.


1. At the top of the page, click **{% octicon "copilot" aria-hidden="true" aria-label="copilot" %} AI controls**.

1. In the sidebar, click {% octicon "copilot" aria-hidden="true" aria-label="copilot" %} **Copilot**.

1. To configure model availability, click **Configure models**.


## Enabling or disabling models

You should explicitly configure all models for which you want to set a policy. Any models that are not in your models list, or that are set to **Optional** and not explicitly configured by organization owners, will inherit the default specified in the **Default availability for released models** policy.

Select a status for each model in the list:

* **Enabled**: Enabled for everyone, cannot be disabled by organizations.
* **Disabled**: Explicitly disabled for everyone, cannot be enabled by organizations.
* **Optional**: Organizations can choose whether to enable or disable it. If left unconfigured by an organization, defaults to enabled or disabled depending on the organization's **Default availability for released models** policy setting.

## Granting access to specific organizations

Targeted model rules let you control exactly which models are available to specific organizations, giving you more granular control than the enterprise-wide availability settings.

1. In the "Targeted model rules" section, click **Create access rule**.
1. Next to "Target organizations", click **Add organizations**, then select the organizations you want the rule to apply to.
1. Under "Allowed models", click **Add models**, then select the models you want to make available to the selected organizations and click **Save**.
1. Click **Create rule**.

## Further reading

* [Supported Surfaces For Policies](https://docs.github.com/en/copilot/reference/supported-surfaces-for-policies)
