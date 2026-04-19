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
        this.refresh();
      }
    });
  }

  private loadConfig() {
    const config = vscode.workspace.getConfiguration('tabTools.actions');
    this.actions = vscode.workspace.getConfiguration().get<Action[]>('tabTools.actions') || [];
    // Sort by priority if available
    this.actions.sort((a, b) => (b.priority || 0) - (a.priority || 0));
  }

  public refresh(context?: ActionContext) {
    if (!context) {
      context = this.getCurrentContext();
    }

    const matchedActions = this.actions.filter(action => this.evaluate(action.when, context!));
    
    // Reset all slots visibility
    const updatedSlots = new Map<string, string>(); // icon -> actionId
    
    // Groups slots by icon to handle multiple instances of same icon
    const iconCounts = new Map<string, number>();

    for (const action of matchedActions) {
      const icon = action.icon || 'star';
      const count = (iconCounts.get(icon) || 0) + 1;
      iconCounts.set(icon, count);
      
      const slotId = `context-bar.slot.${icon}.${count}`;
      this.slots.set(slotId, {
        id: slotId,
        actionId: action.id,
        command: action.command,
        icon: icon,
        visible: true
      });
      updatedSlots.set(slotId, action.command);
    }

    // Update VSCode Context Keys for all possible slots
    // Note: We need a fixed list of slots in package.json. 
    // For this implementation, I'll assume we have a defined list of supported icons.
    this.syncVSCodeContext(updatedSlots);
  }

  private evaluate(rule: string, context: ActionContext): boolean {
    try {
      // Basic rule evaluation logic
      // e.g. "editorLangId == markdown && selectionEmpty"
      // Replace keys with context values
      let expression = rule
        .replace(/editorLangId/g, `'${context.languageId}'`)
        .replace(/fileName/g, `'${context.fileName}'`)
        .replace(/fileExt/g, `'${context.fileExt}'`)
        .replace(/isDirty/g, String(context.isDirty))
        .replace(/selectionEmpty/g, String(context.selectionEmpty));

      // Use a safe subset of JS logic or a simple parser
      // For now, using a basic Function approach (careful!)
      return new Function('return ' + expression)() === true;
    } catch (e) {
      console.error(`Failed to evaluate rule: ${rule}`, e);
      return false;
    }
  }

  private syncVSCodeContext(activeSlots: Map<string, string>) {
    // We'll set context keys for visibility and store the command mappings
    // The handler will use these mappings.
    for (const [slotId, command] of activeSlots) {
      vscode.commands.executeCommand('setContext', `${slotId}.visible`, true);
    }
    
    // Deactivate slots not in activeSlots
    // This requires knowing the full list. We'll handle this in extension.ts
  }

  public getActionForSlot(slotId: string): string | undefined {
    return this.slots.get(slotId)?.command;
  }

  private getCurrentContext(): ActionContext | undefined {
    // Helper to get context if not provided
    return undefined; // Will be passed from ContextManager
  }
}
