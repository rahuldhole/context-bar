export function getWebviewContent(config: any): string {
    const commonShortcuts = [
        { label: 'Save (Ctrl+S)', command: 'workbench.action.files.save' },
        { label: 'Format (Shift+Alt+F)', command: 'editor.action.formatDocument' },
        { label: 'Preview (Ctrl+Shift+V)', command: 'markdown.showPreviewToSide' },
        { label: 'Toggle Sidebar (Ctrl+B)', command: 'workbench.action.toggleSidebarVisibility' },
        { label: 'Terminal (Ctrl+\`)', command: 'workbench.action.terminal.toggleTerminal' },
        { label: 'Quick Open (Ctrl+P)', command: 'workbench.action.quickOpen' },
        { label: 'Command Palette (Ctrl+Shift+P)', command: 'workbench.action.showCommands' }
    ];

    const supportedIcons = [
        'play', 'debug-start', 'eye', 'checklist', 'sync', 'trash', 'save', 'book', 'bug', 'zap', 
        'gear', 'search', 'refresh', 'edit', 'list-unordered', 'symbol-method', 'symbol-class', 
        'new-file', 'new-folder', 'diff', 'git-commit', 'terminal', 'graph', 'database', 'cloud', 
        'lock', 'unlock', 'home', 'mail', 'bell'
    ];

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Context Bar Builder</title>
    <style>
        :root {
            --accent: var(--vscode-button-background);
            --border: var(--vscode-panel-border);
            --bg: var(--vscode-editor-background);
            --input-bg: var(--vscode-input-background);
        }
        body {
            background-color: var(--bg);
            color: var(--vscode-foreground);
            font-family: var(--vscode-font-family);
            padding: 40px;
            margin: 0;
            font-size: 13px;
        }
        .header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 40px; }
        h1 { margin: 0; font-size: 20px; font-weight: 400; opacity: 0.8; }
        
        .action-list { margin-top: 20px; }
        .action-row {
            display: grid;
            grid-template-columns: 40px 1fr 1.5fr 1fr 40px;
            gap: 20px;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid var(--border);
            position: relative;
        }
        
        input {
            background: transparent; border: none; border-bottom: 1px solid transparent;
            color: var(--vscode-foreground); padding: 6px 0; width: 100%; outline: none;
        }
        input:focus { border-bottom-color: var(--accent); }
        
        .icon-btn {
            width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;
            background: var(--input-bg); border-radius: 2px; cursor: pointer; font-size: 16px;
        }

        .picker {
            position: absolute; top: 100%; left: 0; z-index: 100;
            background: var(--bg); border: 1px solid var(--border); padding: 8px;
            display: grid; grid-template-columns: repeat(8, 1fr); gap: 4px;
            box-shadow: 0 8px 24px rgba(0,0,0,0.5);
        }
        .picker-icon { width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; cursor: pointer; }
        .picker-icon:hover { background: var(--input-bg); }

        .suggestions {
            position: absolute; top: 100%; left: 40px; right: 40px; z-index: 90;
            background: var(--input-bg); border: 1px solid var(--border);
            max-height: 200px; overflow-y: auto;
        }
        .suggestion { padding: 8px 12px; cursor: pointer; display: flex; justify-content: space-between; gap: 20px; }
        .suggestion:hover { background: var(--accent); color: var(--vscode-button-foreground); }
        .suggestion .cmd { opacity: 0.5; font-size: 0.9em; font-family: monospace; }

        .btn-trash { opacity: 0.4; cursor: pointer; appearance: none; border: none; background: none; color: inherit; }
        .btn-trash:hover { opacity: 1; color: var(--vscode-errorForeground); }
        
        .footer { margin-top: 40px; display: flex; gap: 20px; align-items: center; }
        .btn-add { background: none; border: none; color: var(--vscode-textLink-foreground); cursor: pointer; padding: 0; font-size: 12px; }
        .btn-save { background: var(--accent); color: var(--vscode-button-foreground); border: none; padding: 8px 20px; cursor: pointer; font-weight: 500; font-size: 13px; }
        
        .toggle-container { display: flex; align-items: center; gap: 10px; font-weight: 500; opacity: 0.8; }
        .switch { width: 34px; height: 20px; background: #666; border-radius: 10px; position: relative; cursor: pointer; }
        .switch.on { background: var(--accent); }
        .switch-handle { width: 16px; height: 16px; background: white; border-radius: 50%; position: absolute; top: 2px; left: 2px; transition: 0.2s; }
        .switch.on .switch-handle { left: 16px; }
    </style>
</head>
<body>
    <div id="app">
        <div class="header">
            <h1>Context Actions</h1>
            <div class="toggle-container">
                <span>Active</span>
                <div class="switch" :class="{ on: enabled }" @click="enabled = !enabled">
                    <div class="switch-handle"></div>
                </div>
            </div>
        </div>

        <div class="action-list">
            <div v-for="(action, index) in actions" :key="index" class="action-row">
                <!-- Icon Picker -->
                <div class="icon-btn" @click="activePicker = activePicker === index ? -1 : index">
                    <span :class="'codicon codicon-' + action.icon"></span>
                </div>
                <div v-if="activePicker === index" class="picker">
                    <div v-for="i in supportedIcons" :key="i" class="picker-icon" @click="setIcon(index, i)">
                        <span :class="'codicon codicon-' + i"></span>
                    </div>
                </div>

                <!-- Label -->
                <input v-model="action.title" placeholder="Description (e.g. Save File)">

                <!-- Command Input with Suggestions -->
                <div style="position: relative;">
                    <input v-model="action.command" placeholder="Shortcut or Command ID" 
                           @focus="activeSearch = index" @blur="hideSearch">
                    <div v-if="activeSearch === index" class="suggestions">
                        <div v-for="s in filteredSuggestions(action.command)" 
                             :key="s.command" class="suggestion" @mousedown="setCommand(index, s)">
                            <span>{{ s.label }}</span>
                            <span class="cmd">{{ s.command }}</span>
                        </div>
                    </div>
                </div>

                <!-- Agnostic Language Input -->
                <input v-model="action.lang" placeholder="For any file (*)" style="opacity: 0.6;">

                <button class="btn-trash" @click="actions.splice(index, 1)">
                    <span class="codicon codicon-trash"></span>
                </button>
            </div>
        </div>

        <div class="footer">
            <button class="btn-add" @click="addAction">+ Add Shortcut</button>
            <button class="btn-save" style="margin-left: auto;" @click="save">Apply Changes</button>
        </div>
    </div>

    <script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@vscode/codicons@0.0.32/dist/codicon.css">
    <script>
        const { createApp, ref } = Vue;
        createApp({
            setup() {
                const vscode = acquireVsCodeApi();
                const config = ${JSON.stringify(config)};
                const actions = ref(config.actions.map(a => {
                    const match = (a.when || '').match(/editorLangId == '(.+?)'/);
                    return { ...a, lang: match ? match[1] : '*' };
                }));
                const enabled = ref(config.enabled !== false);
                const activePicker = ref(-1);
                const activeSearch = ref(-1);
                
                const supportedIcons = ${JSON.stringify(supportedIcons)};
                const suggestions = ${JSON.stringify(commonShortcuts)};

                const addAction = () => actions.value.push({
                    id: 's.' + Date.now(), title: '', command: '', icon: 'zap', lang: '*'
                });

                const filteredSuggestions = (query) => {
                    const q = (query || '').toLowerCase();
                    return suggestions.filter(s => s.label.toLowerCase().includes(q) || s.command.includes(q));
                };

                const setIcon = (index, icon) => {
                    actions.value[index].icon = icon;
                    activePicker.value = -1;
                };

                const setCommand = (index, s) => {
                    actions.value[index].command = s.command;
                    if (!actions.value[index].title) actions.value[index].title = s.label.split(' (')[0];
                    activeSearch.value = -1;
                };

                const hideSearch = () => { setTimeout(() => activeSearch.value = -1, 150); };

                const save = () => {
                    const data = actions.value.map(a => {
                        const { lang, ...rest } = a;
                        rest.when = (!lang || lang === '*') ? 'true' : \`editorLangId == '\${lang}'\`;
                        return rest;
                    });
                    vscode.postMessage({ type: 'save', actions: data, enabled: enabled.value });
                };

                return { actions, enabled, activePicker, activeSearch, supportedIcons, addAction, filteredSuggestions, setIcon, setCommand, hideSearch, save };
            }
        }).mount('#app');
    </script>
</body>
</html>`;
}
