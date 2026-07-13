"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/extension.ts
var extension_exports = {};
__export(extension_exports, {
  activate: () => activate,
  deactivate: () => deactivate
});
module.exports = __toCommonJS(extension_exports);
var vscode4 = __toESM(require("vscode"));

// src/ContextManager.ts
var vscode = __toESM(require("vscode"));
var ContextManager = class {
  _onContextChanged = new vscode.EventEmitter();
  onContextChanged = this._onContextChanged.event;
  debounceTimer;
  constructor() {
    vscode.window.onDidChangeActiveTextEditor(() => this.updateContext());
    vscode.window.onDidChangeTextEditorSelection(() => this.updateContext());
    vscode.workspace.onDidChangeTextDocument(() => this.updateContext());
  }
  getContext() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return void 0;
    }
    const doc = editor.document;
    const fileName = doc.fileName;
    const fileExt = fileName.split(".").pop() || "";
    return {
      languageId: doc.languageId,
      fileName,
      fileExt,
      isDirty: doc.isDirty,
      isUntitled: doc.isUntitled,
      selectionEmpty: editor.selection.isEmpty,
      workspaceName: vscode.workspace.name
    };
  }
  updateContext() {
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
  updateVSCodeContext(context) {
    vscode.commands.executeCommand("setContext", "context-bar.langId", context.languageId);
    vscode.commands.executeCommand("setContext", "context-bar.isDirty", context.isDirty);
    vscode.commands.executeCommand("setContext", "context-bar.selectionEmpty", context.selectionEmpty);
  }
};

// src/ActionEngine.ts
var vscode2 = __toESM(require("vscode"));
var ActionEngine = class {
  actions = [];
  slots = /* @__PURE__ */ new Map();
  lastContext;
  keyCache = /* @__PURE__ */ new Map();
  log;
  // Must match package.json exactly
  allSlots = [
    "play.1",
    "play.2",
    "debug-start.1",
    "eye.1",
    "eye.2",
    "checklist.1",
    "sync.1",
    "trash.1",
    "save.1",
    "book.1",
    "bug.1",
    "zap.1",
    "gear.1",
    "search.1",
    "refresh.1",
    "edit.1",
    "list-unordered.1",
    "symbol-method.1",
    "symbol-class.1",
    "new-file.1",
    "new-folder.1",
    "diff.1",
    "git-commit.1",
    "terminal.1",
    "graph.1",
    "database.1",
    "cloud.1",
    "lock.1",
    "unlock.1",
    "home.1",
    "mail.1",
    "bell.1"
  ];
  constructor(log2) {
    this.log = log2;
    this.loadConfig();
    vscode2.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration("tabTools.actions")) {
        this.log.appendLine("Config changed \u2014 reloading actions");
        this.loadConfig();
        if (this.lastContext) this.refresh(this.lastContext);
      }
    });
  }
  loadConfig() {
    this.actions = vscode2.workspace.getConfiguration().get("tabTools.actions") || [];
    this.actions.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    this.log.appendLine(`Loaded ${this.actions.length} actions: ${JSON.stringify(this.actions.map((a) => a.id))}`);
  }
  setContextKey(key, value) {
    if (this.keyCache.get(key) === value) return;
    this.keyCache.set(key, value);
    this.log.appendLine(`  setContext('${key}', ${value})`);
    vscode2.commands.executeCommand("setContext", key, value);
  }
  refresh(context) {
    this.lastContext = context;
    this.log.appendLine(`Refresh: file=${context.fileName}, ext=${context.fileExt}`);
    const activeSlotMap = /* @__PURE__ */ new Map();
    const iconCounts = /* @__PURE__ */ new Map();
    for (const action of this.actions) {
      if (action.enabled === false) {
        this.log.appendLine(`  Skipped (disabled): ${action.id}`);
        continue;
      }
      const matched = this.matches(action, context);
      this.log.appendLine(`  Action "${action.id}" (icon=${action.icon}, exts=${action.exts}): ${matched ? "MATCH" : "no match"}`);
      if (matched) {
        const icon = action.icon || "play";
        const count = (iconCounts.get(icon) || 0) + 1;
        iconCounts.set(icon, count);
        const slotId = `context-bar.slot.${icon}.${count}`;
        if (this.allSlots.includes(`${icon}.${count}`)) {
          activeSlotMap.set(slotId, action.command);
          this.log.appendLine(`    -> Mapped to slot: ${slotId}`);
        } else {
          this.log.appendLine(`    -> No slot available for ${icon}.${count}`);
        }
      }
    }
    for (const slot of this.allSlots) {
      const slotId = `context-bar.slot.${slot}`;
      const isVisible = activeSlotMap.has(slotId);
      if (isVisible) {
        this.slots.set(slotId, {
          id: slotId,
          actionId: "dynamic",
          command: activeSlotMap.get(slotId),
          icon: slot.split(".")[0],
          visible: true
        });
      } else {
        this.slots.delete(slotId);
      }
      this.setContextKey(`${slotId}.visible`, isVisible);
    }
    this.log.appendLine(`Refresh complete: ${activeSlotMap.size} visible slots`);
  }
  matches(action, context) {
    const exts = (action.exts || "").trim();
    if (!exts) {
      const when = (action.when || "").trim();
      if (!when || when === "true") return true;
      if (when.includes("editorLangId")) {
        const match = when.match(/'(.+?)'/);
        if (match) return context.languageId === match[1];
      }
      return true;
    }
    if (exts === "*" || exts === "any") return true;
    const allowed = exts.split(",").map((e) => e.trim().toLowerCase().replace(/^\./, ""));
    const currentExt = context.fileExt.toLowerCase().replace(/^\./, "");
    return allowed.includes(currentExt);
  }
  getActionForSlot(slotId) {
    return this.slots.get(slotId)?.command;
  }
  getDebugInfo() {
    const activeSlots = Array.from(this.keyCache.entries()).filter(([_, v]) => v).map(([k]) => k.replace("context-bar.slot.", "").replace(".visible", ""));
    return `Actions: ${this.actions.length}, Active Slots: [${activeSlots.join(", ")}], Current Ext: ${this.lastContext?.fileExt || "none"}, Lang: ${this.lastContext?.languageId || "none"}`;
  }
};

// src/ConfigWebviewProvider.ts
var vscode3 = __toESM(require("vscode"));

// src/webviewContent.ts
function getWebviewContent(config) {
  const supportedIcons = [
    "play",
    "debug-start",
    "eye",
    "checklist",
    "sync",
    "trash",
    "save",
    "book",
    "bug",
    "zap",
    "gear",
    "search",
    "refresh",
    "edit",
    "list-unordered",
    "symbol-method",
    "symbol-class",
    "new-file",
    "new-folder",
    "diff",
    "git-commit",
    "terminal",
    "graph",
    "database",
    "cloud",
    "lock",
    "unlock",
    "home",
    "mail",
    "bell"
  ];
  const commonShortcuts = [
    { label: "Save (Ctrl+S)", command: "workbench.action.files.save" },
    { label: "Format (Shift+Alt+F)", command: "editor.action.formatDocument" },
    { label: "Preview (Ctrl+Shift+V)", command: "markdown.showPreviewToSide" },
    { label: "Toggle Sidebar (Ctrl+B)", command: "workbench.action.toggleSidebarVisibility" },
    { label: "Terminal (Ctrl+`)", command: "workbench.action.terminal.toggleTerminal" }
  ];
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Context Bar Builder</title>
    <style>
        body {
            background-color: var(--vscode-editor-background);
            color: var(--vscode-foreground);
            font-family: var(--vscode-font-family);
            font-size: 13px;
            padding: 40px;
            margin: 0;
            line-height: 1.5;
        }
        header { margin-bottom: 40px; display: flex; justify-content: space-between; align-items: center; }
        h1 { font-size: 20px; font-weight: 300; margin: 0; }
        
        .header-actions { display: flex; gap: 20px; align-items: center; }
        .link-json { color: var(--vscode-textLink-foreground); cursor: pointer; font-size: 11px; opacity: 0.8; display: flex; align-items: center; gap: 4px; text-decoration: none; }
        .link-json:hover { opacity: 1; text-decoration: underline; }
        .link-guide { color: var(--vscode-textLink-foreground); font-size: 11px; opacity: 0.8; text-decoration: none; display: flex; align-items: center; gap: 4px; }
        .link-guide:hover { opacity: 1; text-decoration: underline; }
        
        .action-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        .action-row { border-bottom: 1px solid var(--vscode-panel-border); }
        .action-row:hover { background: rgba(255,255,255,0.02); }
        td { padding: 12px 10px; vertical-align: middle; position: relative; }

        .checkbox-container { width: 30px; }
        .icon-container { width: 40px; }
        .icon-trigger {
            width: 30px; height: 30px; cursor: pointer;
            display: flex; align-items: center; justify-content: center;
            background: var(--vscode-input-background); border-radius: 2px;
        }

        input {
            background: transparent; color: var(--vscode-foreground); border: none;
            padding: 4px 0; outline: none; border-bottom: 1px solid transparent; width: 100%;
        }
        input:focus { border-bottom-color: var(--vscode-button-background); }
        
        .label-cell { width: 150px; }
        .command-cell { flex-grow: 1; }
        .ext-cell { width: 100px; opacity: 0.6; }

        .btn-delete { 
            opacity: 0.8; 
            cursor: pointer; 
            color: var(--vscode-descriptionForeground); 
            background: none; 
            border: none; 
            display: flex; 
            align-items: center; 
            gap: 5px;
            font-size: 11px;
        }
        .btn-delete:hover { opacity: 1; color: var(--vscode-errorForeground); }

        .icon-picker {
            position: absolute; top: 40px; left: 0; z-index: 100;
            background: var(--vscode-editor-background); border: 1px solid var(--vscode-panel-border);
            padding: 8px; display: grid; grid-template-columns: repeat(8, 1fr); gap: 4px;
            box-shadow: 0 8px 24px rgba(0,0,0,0.5);
        }
        .icon-choice { width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; cursor: pointer; }
        .icon-choice:hover { background: var(--vscode-input-background); }

        .suggestions {
            position: absolute; top: 100%; left: 0; right: 0; z-index: 90;
            background: var(--vscode-input-background); border: 1px solid var(--vscode-panel-border);
            max-height: 150px; overflow-y: auto;
        }
        .suggestion { padding: 6px 10px; cursor: pointer; display: flex; justify-content: space-between; font-size: 11px; }
        .suggestion:hover { background: var(--vscode-button-background); color: var(--vscode-button-foreground); }
        .suggestion span.cmd { opacity: 0.5; font-family: monospace; }

        .footer { margin-top: 40px; display: flex; gap: 20px; align-items: center; justify-content: space-between; }
        .btn-main { background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: none; padding: 8px 24px; cursor: pointer; border-radius: 2px; font-size: 13px; }
        .btn-main:hover { background: var(--vscode-button-hoverBackground); }
        .btn-main.success { background: #28a745 !important; color: white !important; }
        .btn-reset { background: transparent; border: 1px solid var(--vscode-button-background); color: var(--vscode-button-background); padding: 7px 16px; cursor: pointer; border-radius: 2px; font-size: 12px; }
        .btn-reset:hover { background: var(--vscode-button-background); color: white; }
        .btn-text { background: none; border: none; color: var(--vscode-textLink-foreground); cursor: pointer; padding: 0; font-size: 12px; }
    </style>
</head>
<body>
    <div id="app">
        <header>
            <div style="display: flex; align-items: baseline; gap: 15px;">
                <h1>Context Actions</h1>
                <a class="link-json" @click="openJson">
                    <span class="codicon codicon-code"></span>
                    Edit JSON
                </a>
                <a class="link-guide" href="https://github.com/rahuldhole/context-bar#guide" target="_blank">
                    <span class="codicon codicon-question"></span>
                    Guide
                </a>
            </div>
            <div>
                <button :class="['btn-main', { success: saveState === 'saved' }]" @click="save" :disabled="saveState === 'saving'">
                    {{ saveState === 'saved' ? 'Saved! \u2705' : (saveState === 'saving' ? 'Saving...' : 'Save & Apply') }}
                </button>
            </div>
        </header>

        <table class="action-table">
            <tr v-for="(action, index) in actions" :key="index" class="action-row">
                <td class="checkbox-container">
                    <input type="checkbox" v-model="action.enabled" style="width: 14px; height: 14px; cursor: pointer;">
                </td>
                <td class="icon-container">
                    <div class="icon-trigger" @click="pickerIdx = pickerIdx === index ? -1 : index">
                        <span :class="'codicon codicon-' + action.icon"></span>
                    </div>
                    <div v-if="pickerIdx === index" class="icon-picker">
                        <div v-for="i in supportedIcons" :key="i" class="icon-choice" @click="setIcon(index, i)">
                            <span :class="'codicon codicon-' + i"></span>
                        </div>
                    </div>
                </td>
                <td class="label-cell">
                    <input v-model="action.title" placeholder="Description">
                </td>
                <td class="command-cell">
                    <input v-model="action.command" placeholder="command.id or shortcut" @focus="searchIdx = index" @blur="hideSearch">
                    <div v-if="searchIdx === index" class="suggestions">
                        <div v-for="s in filteredSuggestions(action.command)" :key="s.command" class="suggestion" @mousedown="applySuggestion(index, s)">
                            <span>{{ s.label }}</span>
                            <span class="cmd">{{ s.command }}</span>
                        </div>
                    </div>
                </td>
                <td class="ext-cell">
                    <input v-model="action.exts" placeholder="md, py, *">
                </td>
                <td>
                    <button class="btn-delete" @click="actions.splice(index, 1)" title="Delete Action">
                        <span class="codicon codicon-trash"></span>
                        <span>Delete</span>
                    </button>
                </td>
            </tr>
        </table>

        <div class="footer">
            <button class="btn-text" @click="addAction">+ Add Action</button>
            <div style="display: flex; gap: 15px; align-items: center;">
                <button class="btn-reset" @click="resetConfig">Reset to Defaults</button>
            </div>
        </div>
    </div>

    <script src="https://unpkg.com/vue@3/dist/vue.global.js"><\/script>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@vscode/codicons@0.0.32/dist/codicon.css">
    <script>
        const { createApp, ref } = Vue;
        createApp({
            setup() {
                const actions = ref(${JSON.stringify(config.actions)});
                const vscode = acquireVsCodeApi();
                const pickerIdx = ref(-1);
                const searchIdx = ref(-1);
                const saveState = ref('ready'); // ready, saving, saved
                const supportedIcons = ${JSON.stringify(supportedIcons)};
                const suggestions = ${JSON.stringify(commonShortcuts)};

                const addAction = () => actions.value.push({
                    id: 's.' + Date.now(), title: '', command: '', icon: 'zap', enabled: true, exts: '*'
                });

                const filteredSuggestions = (q) => {
                    const query = (q || '').toLowerCase();
                    return suggestions.filter(s => s.label.toLowerCase().includes(query) || s.command.includes(query));
                };

                const applySuggestion = (idx, s) => {
                    actions.value[idx].command = s.command;
                    if (!actions.value[idx].title) actions.value[idx].title = s.label.split(' (')[0];
                    searchIdx.value = -1;
                };

                const hideSearch = () => setTimeout(() => searchIdx.value = -1, 150);

                const setIcon = (idx, icon) => {
                    actions.value[idx].icon = icon;
                    pickerIdx.value = -1;
                };

                const save = () => {
                    saveState.value = 'saving';
                    vscode.postMessage({ type: 'save', actions: JSON.parse(JSON.stringify(actions.value)), enabled: true });
                    setTimeout(() => {
                        saveState.value = 'saved';
                        setTimeout(() => { saveState.value = 'ready'; }, 2000);
                    }, 500);
                };

                const resetConfig = () => {
                    if (confirm('Are you sure you want to reset all shortcuts to defaults? This cannot be undone.')) {
                        vscode.postMessage({ type: 'reset' });
                    }
                };

                const openJson = () => {
                    vscode.postMessage({ type: 'openSettings' });
                };

                return { actions, supportedIcons, pickerIdx, searchIdx, saveState, addAction, filteredSuggestions, applySuggestion, hideSearch, setIcon, save, resetConfig, openJson };
            }
        }).mount('#app');
    <\/script>
</body>
</html>`;
}

// src/ConfigWebviewProvider.ts
var ConfigWebviewProvider = class _ConfigWebviewProvider {
  static viewType = "contextBarConfig";
  static _currentPanel;
  static show(extensionUri) {
    const column = vscode3.window.activeTextEditor ? vscode3.window.activeTextEditor.viewColumn : void 0;
    if (_ConfigWebviewProvider._currentPanel) {
      _ConfigWebviewProvider._currentPanel.reveal(column);
      return;
    }
    const panel = vscode3.window.createWebviewPanel(
      _ConfigWebviewProvider.viewType,
      "Context Bar Builder",
      column || vscode3.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [extensionUri]
      }
    );
    _ConfigWebviewProvider._currentPanel = panel;
    _ConfigWebviewProvider._update(panel);
    panel.onDidDispose(() => {
      _ConfigWebviewProvider._currentPanel = void 0;
    }, null);
    panel.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.type) {
          case "save":
            await _ConfigWebviewProvider._saveConfig(message.actions, message.enabled);
            vscode3.window.showInformationMessage("Context Bar configuration saved!");
            return;
          case "reset":
            await _ConfigWebviewProvider._resetConfig();
            vscode3.window.showInformationMessage("Context Bar reset to defaults!");
            _ConfigWebviewProvider._update(panel);
            return;
          case "openSettings":
            vscode3.commands.executeCommand("workbench.action.openSettingsJson", "tabTools.actions");
            return;
        }
      },
      null
    );
  }
  static _update(panel) {
    const actions = vscode3.workspace.getConfiguration().get("tabTools.actions") || [];
    const enabled = vscode3.workspace.getConfiguration().get("context-bar.enabled") !== false;
    panel.webview.html = getWebviewContent({ actions, enabled });
  }
  static async _saveConfig(actions, enabled) {
    const config = vscode3.workspace.getConfiguration();
    await config.update("tabTools.actions", actions, vscode3.ConfigurationTarget.Global);
    await config.update("context-bar.enabled", enabled, vscode3.ConfigurationTarget.Global);
  }
  static async _resetConfig() {
    const config = vscode3.workspace.getConfiguration();
    await config.update("tabTools.actions", void 0, vscode3.ConfigurationTarget.Global);
    await config.update("context-bar.enabled", void 0, vscode3.ConfigurationTarget.Global);
  }
};

// src/extension.ts
var log = vscode4.window.createOutputChannel("Context Bar");
function activate(context) {
  log.appendLine("Context Bar: Activating...");
  const contextManager = new ContextManager();
  const actionEngine = new ActionEngine(log);
  context.subscriptions.push(
    vscode4.commands.registerCommand("context-bar.configure", () => {
      ConfigWebviewProvider.show(context.extensionUri);
    })
  );
  context.subscriptions.push(
    vscode4.commands.registerCommand("context-bar.debugState", () => {
      const info = actionEngine.getDebugInfo();
      log.appendLine(info);
      log.show();
      vscode4.window.showInformationMessage(info);
    })
  );
  const slotsToRegister = [
    "play.1",
    "play.2",
    "debug-start.1",
    "eye.1",
    "eye.2",
    "checklist.1",
    "sync.1",
    "trash.1",
    "save.1",
    "book.1",
    "bug.1",
    "zap.1",
    "gear.1",
    "search.1",
    "refresh.1",
    "edit.1",
    "list-unordered.1",
    "symbol-method.1",
    "symbol-class.1",
    "new-file.1",
    "new-folder.1",
    "diff.1",
    "git-commit.1",
    "terminal.1",
    "graph.1",
    "database.1",
    "cloud.1",
    "lock.1",
    "unlock.1",
    "home.1",
    "mail.1",
    "bell.1"
  ];
  for (const slot of slotsToRegister) {
    const slotId = `context-bar.slot.${slot}`;
    context.subscriptions.push(
      vscode4.commands.registerCommand(slotId, async () => {
        log.appendLine(`Slot triggered: ${slotId}`);
        const targetCommand = actionEngine.getActionForSlot(slotId);
        if (targetCommand) {
          try {
            vscode4.window.showInformationMessage(`Triggering: ${targetCommand}`);
            await vscode4.commands.executeCommand(targetCommand);
            log.appendLine(`Executed: ${targetCommand}`);
          } catch (err) {
            log.appendLine(`Error: ${err}`);
            vscode4.window.showErrorMessage(`Action failed: ${err}`);
          }
        } else {
          log.appendLine(`No action mapped to slot: ${slotId}`);
        }
      })
    );
  }
  log.appendLine(`Registered ${slotsToRegister.length} slot commands`);
  context.subscriptions.push(
    contextManager.onContextChanged((ctx) => {
      log.appendLine(`Context changed: ext=${ctx.fileExt}, lang=${ctx.languageId}`);
      actionEngine.refresh(ctx);
    })
  );
  log.appendLine("Running initial context check...");
  const initialCtx = contextManager.getContext();
  if (initialCtx) {
    log.appendLine(`Initial context: ext=${initialCtx.fileExt}, lang=${initialCtx.languageId}`);
    actionEngine.refresh(initialCtx);
  } else {
    log.appendLine("No active editor on activation \u2014 icons will appear when you open a file.");
  }
  log.appendLine("Context Bar: Activated successfully!");
}
function deactivate() {
  log.appendLine("Context Bar: Deactivated.");
}
