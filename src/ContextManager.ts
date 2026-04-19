import * as vscode from 'vscode';
import { ActionContext } from './types';

export class ContextManager {
  private _onContextChanged = new vscode.EventEmitter<ActionContext>();
  public readonly onContextChanged = this._onContextChanged.event;

  private debounceTimer?: NodeJS.Timeout;

  constructor() {
    vscode.window.onDidChangeActiveTextEditor(() => this.updateContext());
    vscode.window.onDidChangeTextEditorSelection(() => this.updateContext());
    vscode.workspace.onDidChangeTextDocument(() => this.updateContext());
  }

  public getContext(): ActionContext | undefined {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return undefined;
    }

    const doc = editor.document;
    const fileName = doc.fileName;
    const fileExt = fileName.split('.').pop() || '';

    return {
      languageId: doc.languageId,
      fileName: fileName,
      fileExt: fileExt,
      isDirty: doc.isDirty,
      isUntitled: doc.isUntitled,
      selectionEmpty: editor.selection.isEmpty,
      workspaceName: vscode.workspace.name
    };
  }

  private updateContext() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      const context = this.getContext();
      if (context) {
        this._onContextChanged.fire(context);
        this.updateVSCodeContext(context);
      }
    }, 50);
  }

  private updateVSCodeContext(context: ActionContext) {
    // Set some global context keys for convenience in when clauses
    vscode.commands.executeCommand('setContext', 'context-bar.langId', context.languageId);
    vscode.commands.executeCommand('setContext', 'context-bar.isDirty', context.isDirty);
    vscode.commands.executeCommand('setContext', 'context-bar.selectionEmpty', context.selectionEmpty);
  }
}
