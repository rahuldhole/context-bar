import * as vscode from 'vscode';
import { Action, ActionContext, SlotState } from './types';

export class ActionEngine {
  private actions: Action[] = [];
  private slots: Map<string, SlotState> = new Map();
  private lastContext?: ActionContext;
  private keyCache: Map<string, boolean> = new Map();
  private log: vscode.OutputChannel;

  // Must match package.json exactly
  private readonly allSlots = [
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

  constructor(log: vscode.OutputChannel) {
    this.log = log;
    this.loadConfig();
    vscode.workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration('tabTools.actions')) {
            this.log.appendLine('Config changed — reloading actions');
            this.loadConfig();
            if (this.lastContext) this.refresh(this.lastContext);
        }
    });
  }

  private loadConfig() {
    this.actions = vscode.workspace.getConfiguration().get<Action[]>('tabTools.actions') || [];
    this.actions.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    this.log.appendLine(`Loaded ${this.actions.length} actions: ${JSON.stringify(this.actions.map(a => a.id))}`);
  }

  private setContextKey(key: string, value: boolean) {
    if (this.keyCache.get(key) === value) return;
    this.keyCache.set(key, value);
    this.log.appendLine(`  setContext('${key}', ${value})`);
    vscode.commands.executeCommand('setContext', key, value);
  }

  public refresh(context: ActionContext) {
    this.lastContext = context;
    this.log.appendLine(`Refresh: file=${context.fileName}, ext=${context.fileExt}`);
    
    // 1. Find matching actions and map to slots
    const activeSlotMap = new Map<string, string>(); // slotId -> command
    const iconCounts = new Map<string, number>();

    for (const action of this.actions) {
      if (action.enabled === false) {
        this.log.appendLine(`  Skipped (disabled): ${action.id}`);
        continue;
      }

      const matched = this.matches(action, context);
      this.log.appendLine(`  Action "${action.id}" (icon=${action.icon}, exts=${action.exts}): ${matched ? 'MATCH' : 'no match'}`);

      if (matched) {
        const icon = action.icon || 'play';
        const count = (iconCounts.get(icon) || 0) + 1;
        iconCounts.set(icon, count);
        const slotId = `context-bar.slot.${icon}.${count}`;
        
        // Only use this slot if it exists in package.json
        if (this.allSlots.includes(`${icon}.${count}`)) {
          activeSlotMap.set(slotId, action.command);
          this.log.appendLine(`    -> Mapped to slot: ${slotId}`);
        } else {
          this.log.appendLine(`    -> No slot available for ${icon}.${count}`);
        }
      }
    }

    // 2. Update ALL slot visibility
    for (const slot of this.allSlots) {
      const slotId = `context-bar.slot.${slot}`;
      const isVisible = activeSlotMap.has(slotId);
      
      if (isVisible) {
        this.slots.set(slotId, {
          id: slotId,
          actionId: 'dynamic',
          command: activeSlotMap.get(slotId)!,
          icon: slot.split('.')[0],
          visible: true
        });
      } else {
        this.slots.delete(slotId);
      }
      
      this.setContextKey(`${slotId}.visible`, isVisible);
    }

    this.log.appendLine(`Refresh complete: ${activeSlotMap.size} visible slots`);
  }

  private matches(action: Action, context: ActionContext): boolean {
    // Support both old 'when' field and new 'exts' field
    const exts = (action.exts || '').trim();
    
    // If no exts field, check legacy 'when' field
    if (!exts) {
      const when = (action.when || '').trim();
      if (!when || when === 'true') return true;
      // Legacy: editorLangId == 'markdown'
      if (when.includes('editorLangId')) {
        const match = when.match(/'(.+?)'/);
        if (match) return context.languageId === match[1];
      }
      return true;
    }
    
    if (exts === '*' || exts === 'any') return true;
    
    const allowed = exts.split(',').map(e => e.trim().toLowerCase().replace(/^\./, ''));
    const currentExt = context.fileExt.toLowerCase().replace(/^\./, '');
    return allowed.includes(currentExt);
  }

  public getActionForSlot(slotId: string): string | undefined {
    return this.slots.get(slotId)?.command;
  }

  public getDebugInfo(): string {
    const activeSlots = Array.from(this.keyCache.entries())
      .filter(([_, v]) => v)
      .map(([k]) => k.replace('context-bar.slot.', '').replace('.visible', ''));
    return `Actions: ${this.actions.length}, Active Slots: [${activeSlots.join(', ')}], Current Ext: ${this.lastContext?.fileExt || 'none'}, Lang: ${this.lastContext?.languageId || 'none'}`;
  }
}
