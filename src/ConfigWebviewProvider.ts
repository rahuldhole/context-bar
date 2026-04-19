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
            await ConfigWebviewProvider._saveConfig(message.actions, message.enabled);
            vscode.window.showInformationMessage('Context Bar configuration saved!');
            return;
          case 'reset':
            await ConfigWebviewProvider._resetConfig();
            vscode.window.showInformationMessage('Context Bar reset to defaults!');
            ConfigWebviewProvider._update(panel);
            return;
          case 'openSettings':
            vscode.commands.executeCommand('workbench.action.openSettingsJson', 'tabTools.actions');
            return;
        }
      },
      null
    );
  }

  private static _update(panel: vscode.WebviewPanel) {
    const actions = vscode.workspace.getConfiguration().get<Action[]>('tabTools.actions') || [];
    const enabled = vscode.workspace.getConfiguration().get<boolean>('context-bar.enabled') !== false;
    panel.webview.html = getWebviewContent({ actions, enabled });
  }

  private static async _saveConfig(actions: Action[], enabled: boolean) {
    const config = vscode.workspace.getConfiguration();
    await config.update('tabTools.actions', actions, vscode.ConfigurationTarget.Global);
    await config.update('context-bar.enabled', enabled, vscode.ConfigurationTarget.Global);
  }

  private static async _resetConfig() {
    const config = vscode.workspace.getConfiguration();
    await config.update('tabTools.actions', undefined, vscode.ConfigurationTarget.Global);
    await config.update('context-bar.enabled', undefined, vscode.ConfigurationTarget.Global);
  }
}
