import * as vscode from 'vscode';
import { ContextManager } from './ContextManager';
import { ActionEngine } from './ActionEngine';
import { ConfigWebviewProvider } from './ConfigWebviewProvider';

const log = vscode.window.createOutputChannel('Context Bar');

export function activate(context: vscode.ExtensionContext) {
  log.appendLine('Context Bar: Activating...');

  const contextManager = new ContextManager();
  const actionEngine = new ActionEngine(log);

  // Register the configuration command
  context.subscriptions.push(
    vscode.commands.registerCommand('context-bar.configure', () => {
      ConfigWebviewProvider.show(context.extensionUri);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('context-bar.debugState', () => {
      const info = actionEngine.getDebugInfo();
      log.appendLine(info);
      log.show();
      vscode.window.showInformationMessage(info);
    })
  );

  // Register ONLY the commands that exist in package.json
  // These must match package.json exactly
  const slotsToRegister = [
    'play.1', 'play.2',
    'debug-start.1',
    'eye.1', 'eye.2',
    'checklist.1',
    'sync.1', 'trash.1', 'save.1', 'book.1', 'bug.1', 'zap.1', 'gear.1',
    'search.1', 'refresh.1', 'edit.1',
    'list-unordered.1', 'symbol-method.1', 'symbol-class.1',
    'new-file.1', 'new-folder.1', 'diff.1', 'git-commit.1',
    'terminal.1', 'graph.1', 'database.1', 'cloud.1',
    'lock.1', 'unlock.1', 'home.1', 'mail.1', 'bell.1'
  ];

  for (const slot of slotsToRegister) {
    const slotId = `context-bar.slot.${slot}`;
    context.subscriptions.push(
      vscode.commands.registerCommand(slotId, async () => {
        log.appendLine(`Slot triggered: ${slotId}`);
        const targetCommand = actionEngine.getActionForSlot(slotId);
        if (targetCommand) {
          try {
            vscode.window.showInformationMessage(`Triggering: ${targetCommand}`);
            await vscode.commands.executeCommand(targetCommand);
            log.appendLine(`Executed: ${targetCommand}`);
          } catch (err) {
            log.appendLine(`Error: ${err}`);
            vscode.window.showErrorMessage(`Action failed: ${err}`);
          }
        } else {
          log.appendLine(`No action mapped to slot: ${slotId}`);
        }
      })
    );
  }

  log.appendLine(`Registered ${slotsToRegister.length} slot commands`);

  // Update actions on context change
  context.subscriptions.push(
    contextManager.onContextChanged(ctx => {
      log.appendLine(`Context changed: ext=${ctx.fileExt}, lang=${ctx.languageId}`);
      actionEngine.refresh(ctx);
    })
  );

  // Initial update — MUST happen
  log.appendLine('Running initial context check...');
  const initialCtx = contextManager.getContext();
  if (initialCtx) {
    log.appendLine(`Initial context: ext=${initialCtx.fileExt}, lang=${initialCtx.languageId}`);
    actionEngine.refresh(initialCtx);
  } else {
    log.appendLine('No active editor on activation — icons will appear when you open a file.');
  }

  log.appendLine('Context Bar: Activated successfully!');
}

export function deactivate() {
  log.appendLine('Context Bar: Deactivated.');
}
