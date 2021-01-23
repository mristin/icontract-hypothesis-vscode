# Tips and Tricks for Creating a VS Code Plugin

## Useful links

https://code.visualstudio.com/api/get-started/your-first-extension

https://code.visualstudio.com/api/references/vscode-api

https://code.visualstudio.com/api/language-extensions/programmatic-language-features

https://github.com/microsoft/vscode-python

https://vscode.readthedocs.io/en/stable/extensionAPI/extension-points/ -- important so that you can reference vs-python!

https://stackoverflow.com/questions/43007267/how-to-run-a-system-command-from-vscode-extension/43008075

https://github.com/microsoft/vscode-python/blob/411d1d4ae7e3884a8ef9294a0aa1688dc05d0f37/src/client/common/terminal/syncTerminalService.ts#L90 -- important so that you can run commands synchroniously in the terminal!

Use output channel for process output: https://github.com/emeraldwalk/vscode-runonsave/blob/master/src/extension.ts

## Lint

Fix and lint: `npx eslint src --fix`

## Publish

Publish: https://code.visualstudio.com/api/working-with-extensions/publishing-extension

Create an Azure DevOps user and organization: https://dev.azure.com/mristin

Create an access token: https://dev.azure.com/mristin/_usersSettings/tokens
(See all scopes, marketplace, acquire + manage)

Create the publisher: https://aka.ms/vscode-create-publisher

Install vsce: `npm install -g vsce`

Login: `vsce login mristin` 
(make sure you see asterisks, copy/paste sometimes did not work on windows)

Package & publish: `vsce publish`
