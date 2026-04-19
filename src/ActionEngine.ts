import * as vscode from 'vscode';
import { Action, ActionContext, SlotState } from './types';

export class ActionEngine {
  private actions: Action[] = [];
  private slots: Map<string, SlotState> = new Map();
  private lastContext?: ActionContext;
  private enabled: boolean = true;

  private readonly icons = [
    'play', 'debug-start', 'eye', 'checklist', 'sync', 'trash', 'save', 'book', 'bug', 'zap', 
    'gear', 'search', 'refresh', 'edit', 'list-unordered', 'symbol-method', 'symbol-class', 
    'new-file', 'new-folder', 'diff', 'git-commit', 'terminal', 'graph', 'database', 'cloud', 
    'lock', 'unlock', 'home', 'mail', 'bell'
  ];

  constructor() {
    this.loadConfig();
    vscode.workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration('tabTools.actions') || e.affectsConfiguration('context-bar.enabled')) {
            this.loadConfig();
            if (this.lastContext) this.refresh(this.lastContext);
        }
    });
  }

  private loadConfig() {
    const config = vscode.workspace.getConfiguration();
    this.actions = config.get<Action[]>('tabTools.actions') || [];
    this.enabled = config.get<boolean>('context-bar.enabled') !== false;
    this.actions.sort((a, b) => (b.priority || 0) - (a.priority || 0));
  }

  public refresh(context: ActionContext) {
    this.lastContext = context;
    
    // 1. Reset all slots ALWAYS
    for (const icon of this.icons) {
        for (let i = 1; i <= 2; i++) {
            vscode.commands.executeCommand('setContext', `context-bar.slot.${icon}.${i}.visible`, false);
        }
    }

    if (!this.enabled) return;

    // 2. Compute matches
    this.slots.clear();
    const iconCounts = new Map<string, number>();

    for (const action of this.actions) {
      if (this.evaluate(action.when, context)) {
        const icon = action.icon || 'play';
        const count = (iconCounts.get(icon) || 0) + 1;
        if (count > 2) continue; // Hard limit per icon type
        
        iconCounts.set(icon, count);
        const slotId = `context-bar.slot.${icon}.${count}`;
        
        this.slots.set(slotId, {
          id: slotId,
          actionId: action.id,
          command: action.command,
          icon: icon,
          visible: true
        });

        // Set visibility IMMEDIATELY
        vscode.commands.executeCommand('setContext', `${slotId}.visible`, true);
      }
    }
  }

  private evaluate(rule: string, context: ActionContext): boolean {
    if (!rule || rule === 'true' || rule === '*') return true;
    try {
        // Agnostic language checking: rule contains the language ID
        if (rule.includes('editorLangId')) {
            const pattern = /'(.+?)'/;
            const match = rule.match(pattern);
            if (match) return context.languageId === match[1];
        }
        return true; // Fallback to visible if rule doesn't match known patterns but isn't 'false'
    } catch (e) {
        return true;
    }
  }

  public getActionForSlot(slotId: string): string | undefined {
    return this.slots.get(slotId)?.command;
  }
}
