# Using your own API keys in GitHub Models

> [!NOTE]
> The ability to bring your own keys (BYOK) to use custom models with GitHub Models for organizations on GitHub is in public preview and subject to change.

>
> Model support is currently limited to OpenAI and AzureAI.

You can bring your own API keys (BYOK) to GitHub Models, and enable teams to use your preferred large language model (LLM) providers across tools like Prompts, Playground, and Models in Actions. For more information about GitHub Models, see [About GitHub Models](https://docs.github.com/en/github-models/about-github-models).

To learn about billing and pricing, see [GitHub Models](https://docs.github.com/en/billing/concepts/product-billing/github-models).

## Why bring your own API keys?

As an organization owner, you may have specific requirements for governance, data security, and compliance. By setting up your own API keys, you can:

* **Governance and compliance:** Choose LLM providers that comply with your organization's policies and regulatory requirements.
* **Cost management:** Align with your existing payment methods, contracts, credits, or negotiated rates, and avoid usage overages.
* **Visibility and control:** Manage which models your team can access, and monitor usage through your provider's existing dashboards and billing.
* **Flexibility:** Support custom or specialized models that your organization already uses.

## Setting up your API keys to add custom models

> [!IMPORTANT] We highly recommend adhering to the principle of least privilege by assigning only the minimum necessary scopes to your API keys.

You must first add the relevant API keys for the organization. After that, your can specify or enable the custom models you wish to make available to users.

### Adding API keys

1. In the upper-right corner of GitHub, click your profile picture, then click **{% octicon "organization" aria-hidden="true" aria-label="organization" %} Organizations**.

1. Select an organization by clicking on it.
1. Under your organization name, click **{% octicon "gear" aria-hidden="true" aria-label="gear" %} Settings**. If you cannot see the "Settings" tab, select the **{% octicon "kebab-horizontal" aria-label="More" %}** dropdown menu, then click **Settings**.

   ![Screenshot of the tabs in an organization's profile. The "Settings" tab is outlined in dark orange.](/assets/images/help/discussions/org-settings-global-nav-update.png)


1. In the sidebar, under "Code, planning, and automation",
 click **{% octicon "ai-model" aria-hidden="true" aria-label="ai-model" %} Models** dropdown. Then click **Custom models**. The "Custom Models" page displays the API keys and custom models added to the organization.

1. Click **Add API key**.
1. In the "Add the API key" dialog, provide details about your key. **Name** and **API key** are compulsory fields.
1. Click **Save**.

## Enabling custom models

1. In the upper-right corner of GitHub, click your profile picture, then click **{% octicon "organization" aria-hidden="true" aria-label="organization" %} Organizations**.

1. Select an organization by clicking on it.
1. Under your organization name, click **{% octicon "gear" aria-hidden="true" aria-label="gear" %} Settings**. If you cannot see the "Settings" tab, select the **{% octicon "kebab-horizontal" aria-label="More" %}** dropdown menu, then click **Settings**.

   ![Screenshot of the tabs in an organization's profile. The "Settings" tab is outlined in dark orange.](/assets/images/help/discussions/org-settings-global-nav-update.png)


1. In the sidebar, under "Code, planning, and automation",
 click the **{% octicon "ai-model" aria-hidden="true" aria-label="ai-model" %} Models** dropdown. Then click **Development**.

1. Under "Models permissions," select **All publishers** to enable models added by API keys.
   * If this option isn't available, you need to allow the use of the model in the organization. See [Manage Models At Scale](https://docs.github.com/en/github-models/github-models-at-scale/manage-models-at-scale#controlling-model-usage-in-your-organization).
1. Optionally, select **Only select models** to create a custom list of enabled or disabled models. This allows you to control which models are available to your organization.  

## Creating an enabled or disabled models list

To control which models are available to your organization, create an enabled or disabled models list as follows:

1. In the upper-right corner of GitHub, click your profile picture, then click **{% octicon "organization" aria-hidden="true" aria-label="organization" %} Organizations**.

1. Select an organization by clicking on it.
1. Under your organization name, click **{% octicon "gear" aria-hidden="true" aria-label="gear" %} Settings**. If you cannot see the "Settings" tab, select the **{% octicon "kebab-horizontal" aria-label="More" %}** dropdown menu, then click **Settings**.

   ![Screenshot of the tabs in an organization's profile. The "Settings" tab is outlined in dark orange.](/assets/images/help/discussions/org-settings-global-nav-update.png)


1. In the sidebar, under "Code, planning, and automation",
 click the **{% octicon "ai-model" aria-hidden="true" aria-label="ai-model" %} Models** dropdown. Then click **Development**.

1. Under "Models permissions," select **Only select models**, then select **Enabled list** from the dropdown to create a list of allowed models.
1. Optionally, select **Disabled list** from the dropdown if you want to create a list of blocked models.
1. Above the table of models, click **Add models or publishers**.
1. In the "Select models and publishers to allow" dialog, select the models and publishers you want to include in your list.
1. Click **Update enabled list** to save your changes.

## Next steps

Now that you've enabled your custom models in GitHub Models, learn how to:

* Experiment with your custom model in the playground. See [Experimenting with AI models in the playground](/github-models/use-github-models/prototyping-with-ai-models#experimenting-with-ai-models-in-the-playground).

* Store prompts on GitHub so that you can iterate to fine-tune your prompts, and share them with stakeholders. See [Storing Prompts In GitHub Repositories](https://docs.github.com/en/github-models/use-github-models/storing-prompts-in-github-repositories).

* Launch your AI application. See [Going to production](/github-models/use-github-models/prototyping-with-ai-models#going-to-production).
