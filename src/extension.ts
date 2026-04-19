import * as vscode from 'vscode';
import { ContextManager } from './ContextManager';
import { ActionEngine } from './ActionEngine';
import { ConfigWebviewProvider } from './ConfigWebviewProvider';

export function activate(context: vscode.ExtensionContext) {
  const contextManager = new ContextManager();
  const actionEngine = new ActionEngine();

  // Register the configuration command
  context.subscriptions.push(
    vscode.commands.registerCommand('context-bar.configure', () => {
      ConfigWebviewProvider.show(context.extensionUri);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('context-bar.debugState', () => {
      vscode.window.showInformationMessage(`Context Bar Debug: ${actionEngine.getDebugInfo()}`);
    })
  );

  const icons = [
    'play', 'debug-start', 'eye', 'checklist', 'sync', 'trash', 'save', 'book', 'bug', 'zap', 
    'gear', 'search', 'refresh', 'edit', 'list-unordered', 'symbol-method', 'symbol-class', 
    'new-file', 'new-folder', 'diff', 'git-commit', 'terminal', 'graph', 'database', 'cloud', 
    'lock', 'unlock', 'home', 'mail', 'bell'
  ];

  // Register all slots
  for (const icon of icons) {
    for (let i = 1; i <= 2; i++) {
      const slotId = `context-bar.slot.${icon}.${i}`;
      context.subscriptions.push(
        vscode.commands.registerCommand(slotId, async () => {
          const targetCommand = actionEngine.getActionForSlot(slotId);
          if (targetCommand) {
            try {
              await vscode.commands.executeCommand(targetCommand);
            } catch (err) {
              vscode.window.showErrorMessage(`Action failed: ${err}`);
            }
          }
        })
      );
    }
  }

  // Update actions on context change
  context.subscriptions.push(
    contextManager.onContextChanged(ctx => {
      actionEngine.refresh(ctx);
    })
  );

  // Initial update
  const initialCtx = contextManager.getContext();
  if (initialCtx) {
    actionEngine.refresh(initialCtx);
  }
}

export function deactivate() {}
