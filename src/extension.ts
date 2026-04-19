import * as vscode from 'vscode';
import { ContextManager } from './ContextManager';
import { ActionEngine } from './ActionEngine';

export function activate(context: vscode.ExtensionContext) {
  const contextManager = new ContextManager();
  const actionEngine = new ActionEngine();

  // Register the configuration command
  context.subscriptions.push(
    vscode.commands.registerCommand('context-bar.configure', () => {
      vscode.commands.executeCommand('workbench.action.openSettings', 'tabTools.actions');
    })
  );

  // Supported icons list (must match package.json)
  const supportedIcons = [
    'preview', 'format', 'play', 'debug', 'test', 'sync',
    'trash', 'save', 'book', 'bug', 'zap', 'gear',
    'markdown', 'json', 'python', 'javascript', 'typescript'
  ];

  // Register command handlers for slots
  for (const icon of supportedIcons) {
    for (let i = 1; i <= 3; i++) { // Support up to 3 instances of same icon
      const slotId = `context-bar.slot.${icon}.${i}`;
      context.subscriptions.push(
        vscode.commands.registerCommand(slotId, async () => {
          const targetCommand = actionEngine.getActionForSlot(slotId);
          if (targetCommand) {
            try {
              await vscode.commands.executeCommand(targetCommand);
            } catch (err) {
              vscode.window.showErrorMessage(`Failed to execute command ${targetCommand}: ${err}`);
            }
          }
        })
      );
    }
  }

  // Update context and actions on change
  context.subscriptions.push(
    contextManager.onContextChanged(ctx => {
      // Clear all slots first (brute force for now, can be optimized)
      for (const icon of supportedIcons) {
        for (let i = 1; i <= 3; i++) {
          vscode.commands.executeCommand('setContext', `context-bar.slot.${icon}.${i}.visible`, false);
        }
      }
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
