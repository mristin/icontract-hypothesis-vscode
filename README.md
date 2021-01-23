# icontract-hypothesis-vscode

![Build-and-lint](https://github.com/mristin/icontract-hypothesis-vscode/workflows/Build-and-lint/badge.svg)

Icontract-hypothesis-vscode is an extension for 
[Visual Studio Code (VS Code)](https://code.visualstudio.com/) that allows you
 to automatically test your Python code using 
[icontract-hypothesis](https://github.com/mristin/icontract-hypothesis).

## Installation

Icontract-hypothesis-vscode has two dependencies:
* The Python extension [ms-python.python][ms-python.python] for VS Code, and
* The Python package [icontract-hypothesis][icontract-hypothesis].

**ms-python.python**. 
Use the Visual Studio marketplace to install the extension ms-python.python by 
following [this link][ms-python.python].

**icontract-hypothesis**. The easiest way to install the package 
[icontract-hypothesis][icontract-hypothesis] is *via* pip3:

```
pip3 insatll icontract-hypothesis
```

If you use a [virtual environment][venv], make sure that you activate it 
beforehand so that the package [icontract-hypothesis][icontract-hypothesis] is 
installed in it (instead of globally).

You have to [set up ms-python.python][vscode-venv] extension so that
icontract-hypothesis-vscode can use the package 
[icontract-hypothesis][icontract-hypothesis].

**icontract-hypothesis-vscode**.
Use the Visual Studio marketplace to install the extension ms-python.python by 
following [this link][icontract-hypothesis-vscode].
 

[ms-python.python]: https://marketplace.visualstudio.com/items?itemName=ms-python.python
[icontract-hypothesis]: https://pypi.org/project/icontract-hypothesis/
[venv]: https://docs.python.org/3/tutorial/venv.html
[vscode-venv]: https://code.visualstudio.com/docs/python/environments
[icontract-hypothesis-vscode]: https://marketplace.visualstudio.com/items?itemName=mristin.icontract-hypothesis-vscode

## Usage

The icontract-hypothesis-vscode is automatically activated when you start your
[VS Code](https://code.visualstudio.com/).

You access it through the editor context pop-up menu:

<img src="https://raw.githubusercontent.com/mristin/icontract-hypothesis-vscode/main/readme/editor-context.png" width=400 alt="editor context pop-up" />

Once you click on it, a quick pick will appear so that you can choose one of
the possible commands:

<img src="https://raw.githubusercontent.com/mristin/icontract-hypothesis-vscode/main/readme/quick-pick.png" width=400 alt="quick pick" />

If your file contains unsaved changes, the file will be saved first before
the commands are executed.

The commands are executed in a terminal named "icontract-hypothesis".
(If a terminal with that name already exists, it will be closed first and
then freshly re-opened.
This is necessary so that we do not pollute your terminal space on many
command calls.) 

The following commands are provided:

**test**.
Infer the Hypothesis strategies for all the global functions in the active file 
and execute them.

**test at**.
Infer the Hypothesis strategy for the global function at the caret.

If the caret is outside of a function, this command does nothing.

**inspect**.
Infer the Hypothesis strategies for all the global functions in the active file 
and write them to the standard output so that you can inspect what will be
eventually executed.

**inspect at**.
Analogous to "test at", this command lets you inspect the inferred Hypothesis
strategies for the global function at the caret.

If the caret is outside of a function, this command does nothing.

**ghostwrite explicit**.
Infer the Hypothesis strategies for all the global functions in the active file.
Then generate a stub unit test file with the strategies explicitly written out
and print the test file to the standard output.

**ghostwrite explicit to**.
Same as "ghostwrite explicit", but saves the generated test file to a file on
disk. 

## Known Issues

It is hard to control terminals in VS Code (see 
[this issue](https://github.com/microsoft/vscode-python/issues/15197)).
We wait for a short delay (~1 second) till we send commands to the terminal.
This might cause racing conditions in some rare cases.

## Versioning

We follow a bit unusual semantic versioning schema:

* X is the oldest supported version of
  [icontract-hypothesis](https://github.com/mristin/icontract-hypothesis),
* Y is the minor version (new or modified features), and
* Z is the patch version (only bug fixes).

## Release Notes

### 1.0.0

Initial release of icontract-hypothesis-vscode.
