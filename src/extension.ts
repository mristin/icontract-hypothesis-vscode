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

interface PathAndLine {
    path: string;
    line: number; // indexed at 1
};

function inferPathAndLine (): PathAndLine | null {
  if (!vscode.window.activeTextEditor) {
    return null
  }

  if (!vscode.window.activeTextEditor.document) {
    return null
  }

  if (!vscode.workspace) {
    return null
  }

  const path = vscode.workspace.asRelativePath(vscode.window.activeTextEditor.document.fileName)

  // See https://github.com/microsoft/vscode/issues/111
  // We also index from 1 since both the command-line arguments and the user index from 1.
  const line = vscode.window.activeTextEditor.selection.active.line + 1

  return { path, line }
}

/**
 * Defines the function to be executed in the VS Code command.
 */
type CommandImpl = (pythonPath: string, escapedPath: string, line: number) => void;

/**
 * Takes care of the plumbing so that you can easily add new VS Code commands which depend
 * on the path to the python interpreter, path to the active file and the line at the caret.
 *
 * The active document is always saved if dirty (otherwise the line would make little sense).
 */
function executeCommand (commandImpl: CommandImpl) {
  inferPythonPath().then((pythonPath) => {
    if (!pythonPath) {
      return
    }

    const pathAndLine = inferPathAndLine()
    if (!pathAndLine) {
      return
    }

    // We do not escape double-quotes. This is so uncommon that we ignore it here.
    if (pathAndLine.path.includes('"')) {
      vscode.window.showErrorMessage(
        'Path to the Python file unexpectedly contains double-quotes, ' +
                `so icontract-hypothesis can not handle it: ${pathAndLine.path}`)
      return
    }

    const escapedPath = pathAndLine.path.includes(' ') ? `"${pathAndLine.path}"` : pathAndLine.path

    if (vscode.window.activeTextEditor?.document?.isDirty) {
      vscode.window.activeTextEditor.document.save()
    }

    commandImpl(pythonPath, escapedPath, pathAndLine.line)
  })
}

function executeTestCommand () {
  executeCommand(
    (pythonPath: string, escapedPath: string, line: number) => {
      executeInRestartedTerminal(
                `${pythonPath} -m icontract_hypothesis test --path ${escapedPath}`)
    })
}

function executeTestAtCommand () {
  executeCommand(
    (pythonPath: string, escapedPath: string, line: number) => {
      executeInRestartedTerminal(
                `${pythonPath} -m icontract_hypothesis test --path ${escapedPath} --include ${line}`)
    })
}

function executeInspectCommand () {
  executeCommand(
    (pythonPath: string, escapedPath: string, line: number) => {
      executeInRestartedTerminal(
                `${pythonPath} -m icontract_hypothesis test --path ${escapedPath} --inspect`)
    })
}

function executeInspectAtCommand () {
  executeCommand(
    (pythonPath: string, escapedPath: string, line: number) => {
      executeInRestartedTerminal(
                `${pythonPath} -m icontract_hypothesis test --path ${escapedPath} --include ${line} --inspect`)
    })
}

function executeGhostwriteExplicitCommand () {
  executeCommand(
    (pythonPath: string, escapedPath: string, line: number) => {
      executeInRestartedTerminal(
                `${pythonPath} -m icontract_hypothesis ghostwrite --explicit --path ${escapedPath}`)
    })
}

function executeGhostwriteExplicitToCommand () {
  executeCommand(
    (pythonPath: string, escapedPath: string, line: number) => {
      vscode.window.showSaveDialog().then(fileInfos => {
        if (fileInfos) {
          executeInRestartedTerminal(
                                      `${pythonPath} -m icontract_hypothesis ghostwrite --explicit ` +
                                      `--path ${escapedPath} --output ${fileInfos.fsPath}`
          )
        }
      })
    })
}

function executePickCommand () {
  const pathAndLine = inferPathAndLine()
  if (!pathAndLine) {
    return
  }

  const { path, line } = pathAndLine

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

  quickPick.onDidAccept(e => {
    const label = quickPick.selectedItems[0].label

    switch (quickPick.selectedItems.length) {
      case 0:
        break
      case 1:
        switch (label) {
          case 'test':
            executeTestCommand()
            break
          case 'test at':
            executeTestAtCommand()
            break
          case 'inspect':
            executeInspectCommand()
            break
          case 'inspect at':
            executeInspectAtCommand()
            break
          case 'ghostwrite explicit':
            executeGhostwriteExplicitCommand()
            break
          case 'ghostwrite explicit to':
            executeGhostwriteExplicitToCommand()
            break
          default:
            vscode.window.showErrorMessage(
                            `Bug: unhandled action for icontract-hypothesis: ${label}`)
            break
        }
        break
      default:
        vscode.window.showErrorMessage('Bug: unexpectedly select multiple actions for icontract-hypothesis.')
        break
    }
    quickPick.hide()
  })
  quickPick.show()
}

export function activate (context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand('icontract-hypothesis-vscode.pick', () => {
      executePickCommand()
    })
  )

  context.subscriptions.push(
    vscode.commands.registerCommand('icontract-hypothesis-vscode.test', () => {
      executeTestCommand()
    })
  )

  context.subscriptions.push(
    vscode.commands.registerCommand('icontract-hypothesis-vscode.test-at', () => {
      executeTestAtCommand()
    })
  )

  context.subscriptions.push(
    vscode.commands.registerCommand('icontract-hypothesis-vscode.inspect', () => {
      executeInspectCommand()
    })
  )

  context.subscriptions.push(
    vscode.commands.registerCommand('icontract-hypothesis-vscode.inspect-at', () => {
      executeInspectAtCommand()
    })
  )

  context.subscriptions.push(
    vscode.commands.registerCommand('icontract-hypothesis-vscode.ghostwrite-explicit', () => {
      executeGhostwriteExplicitCommand()
    })
  )

  context.subscriptions.push(
    vscode.commands.registerCommand('icontract-hypothesis-vscode.ghostwrite-explicit-to', () => {
      executeGhostwriteExplicitToCommand()
    })
  )
}

export function deactivate () {
}
