import * as vscode from 'vscode';
import { Action, ActionContext, SlotState } from './types';

export class ActionEngine {
  private actions: Action[] = [];
  private slots: Map<string, SlotState> = new Map();
  private lastContext?: ActionContext;
  private keyCache: Map<string, boolean> = new Map();

  private readonly icons = [
    'play', 'debug-start', 'eye', 'checklist', 'sync', 'trash', 'save', 'book', 'bug', 'zap', 
    'gear', 'search', 'refresh', 'edit', 'list-unordered', 'symbol-method', 'symbol-class', 
    'new-file', 'new-folder', 'diff', 'git-commit', 'terminal', 'graph', 'database', 'cloud', 
    'lock', 'unlock', 'home', 'mail', 'bell'
  ];

  constructor() {
    this.loadConfig();
    vscode.workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration('tabTools.actions')) {
            this.loadConfig();
            if (this.lastContext) this.refresh(this.lastContext);
        }
    });
  }

  private loadConfig() {
    this.actions = vscode.workspace.getConfiguration().get<Action[]>('tabTools.actions') || [];
    this.actions.sort((a, b) => (b.priority || 0) - (a.priority || 0));
  }

  private setContextKey(key: string, value: boolean) {
    if (this.keyCache.get(key) === value) return;
    this.keyCache.set(key, value);
    vscode.commands.executeCommand('setContext', key, value);
  }

  public refresh(context: ActionContext) {
    this.lastContext = context;
    
    // Compute current matches first
    const activeSlotMap = new Map<string, string>(); // slotId -> command
    const iconCounts = new Map<string, number>();

    for (const action of this.actions) {
      if (action.enabled === false) continue;

      if (this.matches(action, context)) {
        const icon = action.icon || 'play';
        const count = (iconCounts.get(icon) || 0) + 1;
        if (count > 2) continue;
        
        iconCounts.set(icon, count);
        const slotId = `context-bar.slot.${icon}.${count}`;
        activeSlotMap.set(slotId, action.command);
      }
    }

    // Now update ALL possible slots
    for (const icon of this.icons) {
        for (let i = 1; i <= 2; i++) {
            const slotId = `context-bar.slot.${icon}.${i}`;
            const isVisible = activeSlotMap.has(slotId);
            
            if (isVisible) {
                this.slots.set(slotId, {
                    id: slotId,
                    actionId: 'dynamic',
                    command: activeSlotMap.get(slotId)!,
                    icon: icon,
                    visible: true
                });
            }
            
            this.setContextKey(`${slotId}.visible`, isVisible);
        }
    }
  }

  private matches(action: Action, context: ActionContext): boolean {
    const exts = (action.exts || '').trim();
    if (!exts || exts === '*' || exts === 'any') return true;
    
    const allowed = exts.split(',').map(e => e.trim().toLowerCase().replace('.', ''));
    return allowed.includes(context.fileExt.toLowerCase().replace('.', ''));
  }

  public getActionForSlot(slotId: string): string | undefined {
    return this.slots.get(slotId)?.command;
  }

  public getDebugInfo(): string {
    const active = Array.from(this.keyCache.entries()).filter(e => e[1]).map(e => e[0].split('.')[2]).join(', ');
    return `Actions: \${this.actions.length}, Active: \${active || 'none'}, File: \${this.lastContext?.fileExt}`;
  }
}
