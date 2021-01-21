import * as vscode from 'vscode'

// Adapted from:
// https://github.com/formulahendry/vscode-code-runner/blob/2bed9aeeabc1118a5f3d75e47bdbcfaf412765ed/src/utility.ts#L6

function getConfiguration (section?: string, document?: vscode.TextDocument): vscode.WorkspaceConfiguration {
  if (document) {
    return vscode.workspace.getConfiguration(section, document.uri)
  } else {
    return vscode.workspace.getConfiguration(section)
  }
}

async function inferPythonPath (document?: vscode.TextDocument): Promise<string> {
  const defaultPythonPath = 'python'

  try {
    const extension = vscode.extensions.getExtension('ms-python.python')
    if (!extension) {
      return defaultPythonPath
    }

    const usingNewInterpreterStorage = extension.packageJSON?.featureFlags?.usingNewInterpreterStorage
    if (usingNewInterpreterStorage) {
      if (!extension.isActive) {
        await extension.activate()
      }
      const pythonPath = extension.exports.settings.getExecutionCommand(document?.uri).join(' ')
      return pythonPath
    }

    const configuration = getConfiguration('python', document)
    if (configuration === null || configuration === undefined) {
      return defaultPythonPath
    }

    const value = configuration.get<string>('pythonPath')
    if (value === null || value === undefined) {
      return defaultPythonPath
    }

    return value
  } catch (error) {
    return defaultPythonPath
  }
}

/**
 * Execute the command in a terminal.
 *
 * The terminals related to this extension are all expected to have the same name.
 * If a terminal exists with this name, it will first be closed and a new terminal
 * will be created.
 *
 * @param command to be executed
 */
function executeInRestartedTerminal (command: string): void {
  const name = 'icontract-hypothesis'

  // Close the terminal, if it has been already open
  for (const terminal of vscode.window.terminals) {
    if (terminal.name === name) {
      terminal.dispose()
      break
    }
  }

  // Open a new one
  const terminal = vscode.window.createTerminal(name)

  // We can not wait for terminal to be ready so we wait at least a little bit.
  // See: https://github.com/microsoft/vscode-python/issues/15197
  const registration = vscode.window.onDidChangeActiveTerminal((activeTerminal) => {
    if (activeTerminal === terminal) {
      setTimeout(() => {
        terminal.sendText(command)
      }, 1000)
      registration.dispose()
    }
  })
}

function pickCommand (pythonPath: string) {
  if (!vscode.window.activeTextEditor) {
    return
  }

  if (!vscode.window.activeTextEditor.document) {
    return
  }

  if (!vscode.workspace) {
    return
  }

  const path = vscode.workspace.asRelativePath(vscode.window.activeTextEditor.document.fileName)

  if (vscode.window.activeTextEditor.document.isDirty) {
    vscode.window.activeTextEditor.document.save()
  }

  // See https://github.com/microsoft/vscode/issues/111
  // We also index from 1 since both the command-line arguments and the user index from 1.
  const line = vscode.window.activeTextEditor.selection.active.line + 1

  // We can not dynamically change editor context menu so we need to use QuickPick,
  // see https://stackoverflow.com/questions/42586589/build-dynamic-menu-in-vscode-extension
  const quickPick = vscode.window.createQuickPick()
  quickPick.canSelectMany = false
  quickPick.items = [
    {
      label: 'test',
      description: `Execute inferred Hypothesis strategies for ${path}`
    },
    {
      label: 'test at',
      description: `Execute inferred Hypothesis strategies for ${path} and function at line ${line}`
    },
    {
      label: 'inspect',
      description: `Inspect inferred Hypothesis strategies for ${path}`
    },
    {
      label: 'inspect at',
      description: `Inspect inferred Hypothesis strategies for ${path} and function at line ${line}`
    },
    {
      label: 'ghostwrite explicit',
      description: `Ghostwrite an explicit test file for ${path}`
    },
    {
      label: 'ghostwrite explicit to',
      description: `Ghostwrite an explicit test file for ${path} and save it to ...`
    }
  ]

  // The escaped path does not escape double-quotes. This is so uncommon that we ignore it here.
  if (path.includes('"')) {
    vscode.window.showErrorMessage(
      'Path to the Python file unexpectedly contains double-quotes, ' +
            `so icontract-hypothesis can not handle it: ${path}`)
    return
  }

  const escapedPath = path.includes(' ') ? `"${path}"` : path

  quickPick.onDidAccept(e => {
    const label = quickPick.selectedItems[0].label

    switch (quickPick.selectedItems.length) {
      case 0:
        break
      case 1:
        switch (label) {
          case 'test':
            executeInRestartedTerminal(
                            `${pythonPath} -m icontract_hypothesis test --path ${escapedPath}`
            )
            break
          case 'test at':
            executeInRestartedTerminal(
                            `${pythonPath} -m icontract_hypothesis test --path ${escapedPath} --include ${line}`
            )
            break
          case 'inspect':
            executeInRestartedTerminal(
                            `${pythonPath} -m icontract_hypothesis test --inspect --path ${escapedPath}`
            )
            break
          case 'inspect at':
            executeInRestartedTerminal(
                            `${pythonPath} -m icontract_hypothesis test --inspect --path ${escapedPath} --include ${line}`
            )
            break
          case 'ghostwrite explicit':
            executeInRestartedTerminal(
                            `${pythonPath} -m icontract_hypothesis ghostwrite --explicit --path ${escapedPath}`
            )
            break
          case 'ghostwrite explicit to':
            vscode.window.showSaveDialog().then(fileInfos => {
              if (fileInfos) {
                executeInRestartedTerminal(
                                    `${pythonPath} -m icontract_hypothesis ghostwrite --explicit ` +
                                    `--path ${escapedPath} --output ${fileInfos.fsPath}`
                )
              }
            })
            break
          default:
            vscode.window.showErrorMessage(
                            `This is an unexpected bug -- unhandled action for icontract-hypothesis: ${label}`)
            break
        }
        break
      default:
        vscode.window.showErrorMessage('Multiple actions selected for icontract-hypothesis, this is an unexpected bug.')
        break
    }
    quickPick.hide()
  })
  quickPick.show()
}

export function activate (context: vscode.ExtensionContext) {
  inferPythonPath().then(pythonPath => {
    const disposable = vscode.commands.registerCommand('icontract-hypothesis-vscode.pick', () => {
      pickCommand(pythonPath)
    })

    context.subscriptions.push(disposable)
  })
}

export function deactivate () {
}
