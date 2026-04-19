export function getWebviewContent(config: any): string {
    const supportedIcons = [
        'play', 'debug-start', 'eye', 'checklist', 'sync', 'trash', 'save', 'book', 'bug', 'zap', 
        'gear', 'search', 'refresh', 'edit', 'list-unordered', 'symbol-method', 'symbol-class', 
        'new-file', 'new-folder', 'diff', 'git-commit', 'terminal', 'graph', 'database', 'cloud', 
        'lock', 'unlock', 'home', 'mail', 'bell'
    ];

    const commonShortcuts = [
        { label: 'Save (Ctrl+S)', command: 'workbench.action.files.save' },
        { label: 'Format (Shift+Alt+F)', command: 'editor.action.formatDocument' },
        { label: 'Preview (Ctrl+Shift+V)', command: 'markdown.showPreviewToSide' },
        { label: 'Toggle Sidebar (Ctrl+B)', command: 'workbench.action.toggleSidebarVisibility' },
        { label: 'Terminal (Ctrl+\`)', command: 'workbench.action.terminal.toggleTerminal' }
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

        .btn-delete { opacity: 0.3; cursor: pointer; color: var(--vscode-errorForeground); background: none; border: none; }
        .btn-delete:hover { opacity: 1; }

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

        .footer { margin-top: 40px; display: flex; justify-content: space-between; align-items: center; }
        .btn-main { background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: none; padding: 8px 24px; cursor: pointer; border-radius: 2px; }
        .btn-main:hover { background: var(--vscode-button-hoverBackground); }
        .btn-main.success { background: #28a745 !important; color: white !important; }
        .btn-text { background: none; border: none; color: var(--vscode-textLink-foreground); cursor: pointer; }
    </style>
</head>
<body>
    <div id="app">
        <header>
            <h1>Context Actions</h1>
            <div>
                <button :class="['btn-main', { success: saveState === 'saved' }]" @click="save" :disabled="saveState === 'saving'">
                    {{ saveState === 'saved' ? 'Saved! ✅' : (saveState === 'saving' ? 'Saving...' : 'Save & Apply') }}
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
                    <button class="btn-delete" @click="actions.splice(index, 1)">
                        <span class="codicon codicon-trash"></span>
                    </button>
                </td>
            </tr>
        </table>

        <div class="footer">
            <button class="btn-text" @click="addAction">+ Add Action</button>
        </div>
    </div>

    <script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
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

                return { actions, supportedIcons, pickerIdx, searchIdx, addAction, filteredSuggestions, applySuggestion, hideSearch, setIcon, save };
            }
        }).mount('#app');
    </script>
</body>
</html>`;
}
