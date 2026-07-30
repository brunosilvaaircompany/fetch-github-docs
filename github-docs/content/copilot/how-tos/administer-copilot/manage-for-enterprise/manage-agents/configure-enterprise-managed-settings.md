# Configuring enterprise-managed settings

With enterprise managed settings, enterprise owners can centrally define and distribute configuration settings to supported clients for users on your enterprise's Copilot plan, ensuring every member works within the same guardrails.

Supported clients are:

* Copilot CLI
* VS Code
* The GitHub Copilot app

These settings apply enterprise-wide, with no organization-level override. For each supported key, the `managed-settings.json` value takes precedence over any file-based configuration a user sets in their client.

Managed settings are loaded locally when the client starts, even if the device has no network connection. This means controls such as suppressing the `allow-all` permission options and restricting plugin configuration still apply before sign in or any server round trip, and remain active when users switch accounts.

## Defining settings

For detailed information on the available properties and syntax, see [Enterprise Managed Settings Reference](https://docs.github.com/en/copilot/reference/enterprise-managed-settings-reference).

## Choosing a deployment method

There are multiple ways to deploy enterprise managed settings. Use the following guidelines to choose the right method for you. For any method, pilot on a small device group before broad deployment.

* **Server-managed**: Default for most enterprises and best for review workflows and audit history
* **MDM-managed**: Best when IT teams need device-group targeting through existing MDM tooling on macOS and Windows
* **File-based**: Available on all platforms, and useful when server-managed and MDM-managed deployment are not available, including developer environments such as containers and Codespaces

There are additional considerations if you use a dedicated enterprise for Copilot Business. See [Guidance for dedicated Copilot Business enterprises](#guidance-for-dedicated-copilot-business-enterprises).

## Deploying server-managed settings

1. Create and configure your `.github-private` repository. See [Create GitHub Private Repo](https://docs.github.com/en/copilot/how-tos/administer-copilot/manage-for-enterprise/manage-agents/create-github-private-repo).
1. In the repository, create or update `copilot/managed-settings.json`.
1. Add your enterprise policy keys and values in JSON format.
1. Commit and push your changes to the default branch.
1. Confirm that enterprise users are running a supported client. Updated settings are applied automatically within about an hour, or immediately after the client restarts or the user signs in again.

## Deploying MDM-managed settings

1. Create or update your `managed-settings.json` payload using the same JSON schema used for server-managed settings.
1. Deploy the payload using your enterprise MDM platform and standard rollout process.
1. Assign the policy to the target device groups.

    Clients do not need to restart, and check for updated policies on an hourly basis. In VS Code, an administrator can force a check for testing by running the `Developer: Sync Account Policy` command.

1. Confirm the settings took effect. See [Verifying the configuration has applied](#verifying-the-configuration-has-applied).

## Deploying file-based settings

1. Create or update a `managed-settings.json` file with the policy keys and values you want to enforce.
1. Distribute the file to managed machines using your standard device management process. Machines that don't receive the file are not restricted by this policy, so file-based deployment only provides coverage for the machines you actively distribute to.
1. Apply file permissions according to your enterprise security requirements.
1. Ask users to restart supported clients so the updated policy is loaded at startup.
1. Confirm the settings took effect. See [Verifying the configuration has applied](#verifying-the-configuration-has-applied).

## Verifying the configuration has applied

Once the configuration is committed, users on a supported client see the specified settings within about an hour, since clients periodically check the server for updated configuration. Restarting the client or signing in again applies the latest settings immediately.

If a user does not see these settings, ensure they receive access to Copilot through your enterprise or one of its organizations. If a user receives a license from multiple billing entities, ensure they have selected your enterprise in the "Usage billed to" dropdown in their [personal Copilot settings](https://github.com/settings/copilot/features).

## Guidance for dedicated Copilot Business enterprises

If you have a dedicated enterprise for Copilot Business (sometimes called Copilot Standalone), you can still use enterprise managed settings. The deployment method you choose determines what you need to set up first.

### Using server-managed settings

Server-managed settings require an organization and a `.github-private` repository. To create these, one user in your enterprise needs a GitHub Enterprise license. With that license, the user can:

1. Create an organization and a `.github-private` repository. See [Create GitHub Private Repo](https://docs.github.com/en/copilot/how-tos/administer-copilot/manage-for-enterprise/manage-agents/create-github-private-repo).
1. Add settings to the repository in a `copilot/managed-settings.json` file.
1. Set that organization as the source of governance for your enterprise's AI standards. See [Create GitHub Private Repo](https://docs.github.com/en/copilot/how-tos/administer-copilot/manage-for-enterprise/manage-agents/create-github-private-repo#selecting-your-repository-as-your-source-of-governance).

From that point on, any user on your enterprise's Copilot plan using Copilot CLI or VS Code is governed by those settings, whether or not they have access to the `.github-private` repository.

The main limitation of this method is the GitHub Enterprise license requirement to create the organization and repository.

### Using MDM-managed or file-based settings

If you don't want to add a GitHub Enterprise license or create an organization, you can deploy the same settings through MDM (such as Intune or Jamf) or a file-based deployment. These methods use the same JSON schema and don't require an organization or `.github-private` repository. See [Deploying MDM-managed settings](#deploying-mdm-managed-settings) and [Deploying file-based settings](#deploying-file-based-settings). For VS Code-specific guidance, see [Deploy Copilot managed settings](https://code.visualstudio.com/docs/enterprise/ai-settings#_deploy-copilot-managed-settings) in the VS Code documentation.

### Plugin access considerations

Users don't need access to the `.github-private` repository for clients to pull in managed settings. However, if managed settings define a plugin using `enabledPlugins`, the client automatically tries to install it for each user. The user needs access to where the plugin files are hosted. If the plugin is hosted in a private repository on GitHub, the user needs authorization to that repository, which may require a license.
