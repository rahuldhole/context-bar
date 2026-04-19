import * as vscode from 'vscode';
import { getWebviewContent } from './webviewContent';
import { Action } from './types';

export class ConfigWebviewProvider {
  public static readonly viewType = 'contextBarConfig';
  private static _currentPanel: vscode.WebviewPanel | undefined;

  public static show(extensionUri: vscode.Uri) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    if (ConfigWebviewProvider._currentPanel) {
      ConfigWebviewProvider._currentPanel.reveal(column);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      ConfigWebviewProvider.viewType,
      'Context Bar Builder',
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [extensionUri]
      }
    );

    ConfigWebviewProvider._currentPanel = panel;
    ConfigWebviewProvider._update(panel);

    panel.onDidDispose(() => {
      ConfigWebviewProvider._currentPanel = undefined;
    }, null);

    panel.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.type) {
          case 'save':
            await ConfigWebviewProvider._saveConfig(message.actions);
            vscode.window.showInformationMessage('Context Bar configuration saved!');
            return;
        }
      },
      null
    );
  }

  private static _update(panel: vscode.WebviewPanel) {
    const config = vscode.workspace.getConfiguration().get<Action[]>('tabTools.actions') || [];
    panel.webview.html = getWebviewContent(config);
  }

  private static async _saveConfig(actions: Action[]) {
    await vscode.workspace.getConfiguration().update(
      'tabTools.actions',
      actions,
      vscode.ConfigurationTarget.Global
    );
  }
}
