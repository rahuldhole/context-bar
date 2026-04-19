import * as vscode from 'vscode';
import { Action, ActionContext, SlotState } from './types';

export class ActionEngine {
  private actions: Action[] = [];
  private slots: Map<string, SlotState> = new Map();

  constructor() {
    this.loadConfig();
    vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration('tabTools.actions')) {
        this.loadConfig();
      }
    });
  }

  private loadConfig() {
    this.actions = vscode.workspace.getConfiguration().get<Action[]>('tabTools.actions') || [];
    this.actions.sort((a, b) => (b.priority || 0) - (a.priority || 0));
  }

  public refresh(context: ActionContext) {
    this.slots.clear();
    const iconCounts = new Map<string, number>();

    for (const action of this.actions) {
      if (this.evaluate(action.when, context)) {
        const icon = action.icon || 'play';
        const count = (iconCounts.get(icon) || 0) + 1;
        if (count > 2) continue; // Max 2 of same icon per rules
        
        iconCounts.set(icon, count);
        const slotId = `context-bar.slot.${icon}.${count}`;
        
        this.slots.set(slotId, {
          id: slotId,
          actionId: action.id,
          command: action.command,
          icon: icon,
          visible: true
        });

        vscode.commands.executeCommand('setContext', `${slotId}.visible`, true);
      }
    }
  }

  private evaluate(rule: string, context: ActionContext): boolean {
    if (!rule || rule === 'true') return true;
    try {
      // Fast evaluation for simple rules
      if (rule.includes('editorLangId')) {
        const match = rule.match(/editorLangId == '(.+?)'/);
        if (match) return context.languageId === match[1];
      }
      return true;
    } catch (e) {
      return true;
    }
  }

  public getActionForSlot(slotId: string): string | undefined {
    return this.slots.get(slotId)?.command;
  }
}
