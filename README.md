# Azure DevOps planner

This extension features ability to export a planning session into Azure DevOps system. Planning in Azure DevOps itself is hard, way too much clicking. It's so much easier to just type all the tasks in a simple text form and then just export them.

## Usage

To start a planning session open a new file in vscode and change the language to `planner` (_Change Language mode_ command). This should enable the extension and all its features.

Before you can start you have to configure connection to your Azure DevOps account. For that you will need a URL and a token for authentication. For details please check the [Configuration](#configuration).

Now it's time to start planning your first story. You can start by typing `US#` to get an autocomplete for user stories of current sprint:

![user story autocomplete](images/planner-1.gif)

Then it's time to enter some tasks in the following manner:

![user story autocomplete](images/planner-tasks.png)

> Tip: tasks don't necesarilly have to be prepended with a hyphen but it makes it look better

The image should be pretty self-explanatory I hope. The numbers following the tasks are estimations. They will be filled in both **Original** and **Remaining Estimation** field in Azure DevOps.

At this point there is a Code Lens action above the user story that lets you publish the changes. Check it out. In case of something is not working just open Output panel and pick `Azure DevOps planner` channel to see what might be wrong. If it's not obvious just raise an issue.

## Configuration

This extension contributes the following settings:

* `planner.url`: URL to your Azure DevOps team project (https://dev.azure.com/{organization}/{project}/)
* `planner.token`: Authentication token (https://docs.microsoft.com/en-us/azure/devops/organizations/accounts/use-personal-access-tokens-to-authenticate?view=azure-devops)

## Known issues

This is a very early stage of development so don't expect everything to work.
Some stuff is hardcoded for now like the Activity under which the tasks are created. It's always `Development` now.
Additionally you should not publish your tasks partially just to update them later. They will get duplicated since it's always _Push All_ now.