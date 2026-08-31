import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {

    let disposable = vscode.commands.registerCommand(
        'markdown-image-paste.pasteImage',
        async () => {

            const editor = vscode.window.activeTextEditor;

            if (!editor) {
                return;
            }

            const filename = await vscode.window.showInputBox({
                prompt: "Image filename",
                placeHolder: "iced-coffee"
            });

            if (!filename) {
                return;
            }

            const workspace = vscode.workspace.workspaceFolders?.[0];

            if (!workspace) {
                vscode.window.showErrorMessage("Open a workspace first.");
                return;
            }

            const imageDir = path.join(workspace.uri.fsPath, "public", "blog");

            if (!fs.existsSync(imageDir)) {
                fs.mkdirSync(imageDir, { recursive: true });
            }

            const imagePath = path.join(imageDir, filename + ".png");

            await vscode.env.clipboard.readText();

            vscode.window.showInformationMessage(
                "Next step: save clipboard image to " + imagePath
            );

            editor.edit(editBuilder => {

                editBuilder.insert(
                    editor.selection.active,
                    `![${filename}](/blog/${filename}.png)`
                );

            });

        });

    context.subscriptions.push(disposable);
}

export function deactivate() {}