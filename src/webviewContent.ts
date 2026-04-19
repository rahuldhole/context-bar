export function getWebviewContent(config: any): string {
    const commonShortcuts = [
        { label: 'Save (Ctrl+S)', command: 'workbench.action.files.save' },
        { label: 'Format (Alt+Shift+F)', command: 'editor.action.formatDocument' },
        { label: 'Preview (Ctrl+Shift+V)', command: 'markdown.showPreviewToSide' },
        { label: 'Toggle Sidebar (Ctrl+B)', command: 'workbench.action.toggleSidebarVisibility' },
        { label: 'Search (Ctrl+Shift+F)', command: 'workbench.action.findInFiles' },
        { label: 'Terminal (Ctrl+\`)', command: 'workbench.action.terminal.toggleTerminal' },
        { label: 'Go to File (Ctrl+P)', command: 'workbench.action.quickOpen' },
        { label: 'Command Palette (Ctrl+Shift+P)', command: 'workbench.action.showCommands' },
        { label: 'Replace (Ctrl+H)', command: 'editor.action.startFindReplaceAction' },
        { label: 'Comments (Ctrl+/)', command: 'editor.action.commentLine' }
    ];

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Context Bar Configuration</title>
    <style>
        :root {
            --input-bg: var(--vscode-input-background);
            --input-fg: var(--vscode-input-foreground);
            --input-border: var(--vscode-input-border, transparent);
            --button-bg: var(--vscode-button-background);
            --button-fg: var(--vscode-button-foreground);
            --button-hover: var(--vscode-button-hoverBackground);
            --panel-border: var(--vscode-panel-border);
            --font-size: var(--vscode-font-size);
            --font-family: var(--vscode-font-family);
        }
        body {
            background-color: var(--vscode-editor-background);
            color: var(--vscode-foreground);
            font-family: var(--font-family);
            font-size: var(--font-size);
            padding: 20px;
            margin: 0;
        }
        h1 { font-size: 1.5em; margin-bottom: 5px; font-weight: normal; }
        p.subtitle { opacity: 0.6; margin-bottom: 25px; font-size: 0.9em; }
        .action-row {
            border: 1px solid var(--panel-border);
            padding: 15px;
            margin-bottom: 20px;
            border-radius: 4px;
            display: flex;
            flex-direction: column;
            gap: 15px;
            position: relative;
        }
        .field-group { display: flex; flex-direction: column; gap: 8px; }
        label { font-size: 0.85em; font-weight: bold; opacity: 0.9; text-transform: uppercase; letter-spacing: 0.05em; }
        input, select {
            background: var(--input-bg);
            color: var(--input-fg);
            border: 1px solid var(--input-border);
            padding: 10px;
            outline: none;
            border-radius: 2px;
        }
        .controls { display: flex; gap: 10px; margin-bottom: 20px; border-bottom: 1px solid var(--panel-border); padding-bottom: 20px; }
        button {
            background: var(--button-bg);
            color: var(--button-fg);
            border: none;
            padding: 8px 16px;
            cursor: pointer;
            border-radius: 2px;
            font-weight: 500;
        }
        button:hover { background: var(--button-hover); }
        button.danger { background: transparent; border: 1px solid #d03030; color: #d03030; font-size: 0.8em; }
        button.danger:hover { background: #d03030; color: white; }
        
        .icon-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(36px, 1fr));
            gap: 4px;
            margin-top: 5px;
        }
        .icon-btn {
            width: 36px; height: 36px; background: var(--input-bg); border: 1px solid var(--input-border);
            color: var(--input-fg); display: flex; align-items: center; justify-content: center; font-size: 1.1em;
            padding: 0;
        }
        .icon-btn.selected { border: 2px solid var(--button-bg); background: var(--button-hover); }
        .icon-btn:hover { background: var(--button-hover); }

        .shortcut-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
        }
        .rule-preview { font-family: monospace; font-size: 0.8em; opacity: 0.5; margin-top: 5px; background: rgba(0,0,0,0.1); padding: 4px 8px; border-radius: 2px; }
        .row-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; }

        .suggestion-list {
            position: absolute;
            z-index: 100;
            background: var(--input-bg);
            border: 1px solid var(--panel-border);
            width: calc(100% - 30px);
            max-height: 150px;
            overflow-y: auto;
            margin-top: 40px;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        }
        .suggestion-item { padding: 8px 12px; cursor: pointer; display: flex; justify-content: space-between; gap: 10px; }
        .suggestion-item:hover { background: var(--button-bg); color: var(--button-fg); }
        .suggestion-item .cmd { font-family: monospace; font-size: 0.8em; opacity: 0.7; }
    </style>
</head>
<body>
    <div id="app">
        <h1>Context Bar Builder</h1>
        <p class="subtitle">Promote your most used shortcuts to the tab bar.</p>

        <div class="controls">
            <button @click="addAction">+ New Shortcut Action</button>
            <button @click="save" style="margin-left: auto;">Save to VS Code</button>
        </div>

        <div v-for="(action, index) in actions" :key="index" class="action-row">
            <div class="row-header">
                <strong>#{{ index + 1 }} {{ action.title || 'Action' }}</strong>
                <button class="danger" @click="removeAction(index)">Remove</button>
            </div>

            <div class="shortcut-grid">
                <div class="field-group">
                    <label>Action Tooltip</label>
                    <input v-model="action.title" placeholder="e.g., Format Document">
                </div>
                
                <div class="field-group" style="position: relative;">
                    <label>Assigned Shortcut / Command</label>
                    <input v-model="action.command" 
                           @focus="showSuggestions(index)"
                           @blur="hideSuggestions(index)"
                           placeholder="Type a command or common keybinding...">
                    <div v-if="activeSuggestionIdx === index" class="suggestion-list">
                        <div v-for="s in filteredSuggestions" :key="s.command" class="suggestion-item" @mousedown="applySuggestion(index, s)">
                            <span>{{ s.label }}</span>
                            <span class="cmd">{{ s.command }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="field-group">
                <label>Visual Icon</label>
                <div class="icon-grid">
                    <button v-for="icon in supportedIcons" :key="icon" 
                            @click="action.icon = icon"
                            :class="['icon-btn', action.icon === icon ? 'selected' : '']"
                            :title="icon">
                        <span :class="'codicon codicon-' + icon"></span>
                    </button>
                </div>
            </div>

            <div class="field-group">
                <label>Visibility Condition</label>
                <div style="display: flex; gap: 10px; align-items: center;">
                    <select v-model="action.langType" @change="updateWhen(index)">
                        <option value="any">Always Visible</option>
                        <option value="lang">Only for Language ID...</option>
                    </select>
                    <input v-if="action.langType === 'lang'" v-model="action.customLang" @input="updateWhen(index)" placeholder="e.g., markdown, python">
                </div>
                <div class="rule-preview">Logic: {{ action.when }}</div>
            </div>
        </div>
    </div>

    <script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@vscode/codicons@0.0.32/dist/codicon.css">
    <script>
        const { createApp, ref, computed } = Vue;

        createApp({
            setup() {
                const actions = ref(${JSON.stringify(config)});
                const vscode = acquireVsCodeApi();
                const activeSuggestionIdx = ref(-1);
                
                const commonShortcuts = ${JSON.stringify(commonShortcuts)};
                
                const supportedIcons = [
                    'play', 'debug-start', 'eye', 'checklist', 'sync', 'trash', 'save', 'book', 'bug', 'zap', 
                    'gear', 'search', 'refresh', 'edit', 'list-unordered', 'symbol-method', 'symbol-class', 
                    'new-file', 'new-folder', 'diff', 'git-commit', 'terminal', 'graph', 'database', 'cloud', 
                    'lock', 'unlock', 'home', 'mail', 'bell'
                ];

                actions.value = actions.value.map(a => {
                    const isLang = a.when && a.when.includes('editorLangId');
                    let customLang = '';
                    if (isLang) {
                        const match = a.when.match(/editorLangId == '(.+?)'/);
                        if (match) customLang = match[1];
                    }
                    return {
                        ...a,
                        langType: isLang ? 'lang' : 'any',
                        customLang: customLang
                    };
                });

                const filteredSuggestions = computed(() => {
                    if (activeSuggestionIdx.value === -1) return commonShortcuts;
                    const query = actions.value[activeSuggestionIdx.value].command.toLowerCase();
                    if (!query) return commonShortcuts;
                    return commonShortcuts.filter(s => 
                        s.label.toLowerCase().includes(query) || 
                        s.command.toLowerCase().includes(query)
                    );
                });

                const addAction = () => {
                    actions.value.push({
                        id: 's.' + Date.now(),
                        title: 'New Event',
                        command: 'workbench.action.files.save',
                        icon: 'save',
                        when: 'true',
                        langType: 'any',
                        customLang: ''
                    });
                };

                const removeAction = (index) => {
                    actions.value.splice(index, 1);
                };

                const showSuggestions = (idx) => { activeSuggestionIdx.value = idx; };
                const hideSuggestions = () => { setTimeout(() => activeSuggestionIdx.value = -1, 100); };
                
                const applySuggestion = (idx, s) => {
                    actions.value[idx].command = s.command;
                    // Auto-fill title if empty
                    if (!actions.value[idx].title || actions.value[idx].title === 'New Event') {
                        actions.value[idx].title = s.label.split(' (')[0];
                    }
                    activeSuggestionIdx.value = -1;
                };

                const updateWhen = (index) => {
                    const a = actions.value[index];
                    if (a.langType === 'lang' && a.customLang) {
                        a.when = \`editorLangId == '\${a.customLang}'\`;
                    } else {
                        a.when = 'true';
                    }
                };

                const save = () => {
                    const dataToSave = actions.value.map(a => {
                        const { langType, customLang, ...rest } = a;
                        return rest;
                    });
                    vscode.postMessage({ type: 'save', actions: dataToSave });
                };

                return { 
                    actions, supportedIcons, addAction, removeAction, updateWhen, save,
                    commonShortcuts, activeSuggestionIdx, filteredSuggestions, 
                    showSuggestions, hideSuggestions, applySuggestion
                };
            }
        }).mount('#app');
    </script>
</body>
</html>`;
}
