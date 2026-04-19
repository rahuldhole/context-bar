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
        .container { max-width: 800px; margin: 0 auto; }
        header { margin-bottom: 60px; }
        h1 { font-size: 24px; font-weight: 300; letter-spacing: -0.5px; opacity: 0.9; }
        
        .action-list { border-top: 1px solid var(--vscode-panel-border); }
        .action-item {
            display: flex;
            align-items: center;
            padding: 20px 0;
            gap: 20px;
            border-bottom: 1px solid var(--vscode-panel-border);
            position: relative;
        }

        .icon-trigger {
            width: 32px; height: 32px; cursor: pointer;
            display: flex; align-items: center; justify-content: center;
            background: var(--vscode-input-background);
            border-radius: 2px; border: 1px solid transparent; transition: all 0.2s;
            font-size: 16px; flex-shrink: 0;
        }
        .icon-trigger:hover { border-color: var(--vscode-button-background); }

        .form-fields { display: flex; flex-grow: 1; gap: 15px; }
        input, select {
            background: transparent; color: var(--vscode-foreground); border: none;
            padding: 8px 0; outline: none; border-bottom: 1px solid transparent;
            font-size: 13px; width: 100%; transition: border 0.3s;
        }
        input:focus { border-bottom-color: var(--vscode-button-background); }
        
        .label-field { width: 150px; font-weight: 500; }
        .command-field { flex-grow: 2; font-family: var(--vscode-editor-font-family); opacity: 0.7; }
        .rule-field { width: 120px; opacity: 0.6; }

        .btn-delete {
            opacity: 0; cursor: pointer; padding: 5px; color: var(--vscode-errorForeground);
            transition: opacity 0.2s; background: none; border: none; font-size: 14px;
        }
        .action-item:hover .btn-delete { opacity: 0.6; }
        .btn-delete:hover { opacity: 1 !important; }

        .footer { margin-top: 60px; display: flex; justify-content: space-between; align-items: center; }
        .btn-main {
            background: var(--vscode-button-background); color: var(--vscode-button-foreground);
            border: none; padding: 10px 24px; cursor: pointer; font-weight: 500;
        }
        .btn-main:hover { background: var(--vscode-button-hoverBackground); }
        .btn-text { background: none; border: none; color: var(--vscode-textLink-foreground); cursor: pointer; padding: 0; }

        /* Modal-less Icon Picker */
        .icon-picker {
            position: absolute; top: 60px; left: 0; z-index: 10;
            background: var(--vscode-editor-background); 
            border: 1px solid var(--vscode-panel-border);
            padding: 10px; display: grid; grid-template-columns: repeat(10, 1fr); gap: 4px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        }
        .icon-choice { 
            width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;
            cursor: pointer; opacity: 0.6;
        }
        .icon-choice:hover { opacity: 1; background: var(--vscode-input-background); }
    </style>
</head>
<body>
    <div id="app" class="container">
        <header>
            <h1>Context Actions</h1>
        </header>

        <div class="action-list">
            <div v-for="(action, index) in actions" :key="index" class="action-item">
                <div class="icon-trigger" @click="togglePicker(index)">
                    <span :class="'codicon codicon-' + action.icon"></span>
                </div>

                <div v-if="pickerIdx === index" class="icon-picker">
                    <div v-for="icon in supportedIcons" :key="icon" 
                         class="icon-choice" @click="setIcon(index, icon)">
                        <span :class="'codicon codicon-' + icon"></span>
                    </div>
                </div>

                <div class="form-fields">
                    <input class="label-field" v-model="action.title" placeholder="Description">
                    <input class="command-field" v-model="action.command" placeholder="command.id">
                    <select class="rule-field" v-model="action.lang">
                        <option value="any">Always</option>
                        <option value="markdown">MD</option>
                        <option value="javascript">JS</option>
                        <option value="python">PY</option>
                    </select>
                </div>

                <button class="btn-delete" @click="removeAction(index)">
                    <span class="codicon codicon-trash"></span>
                </button>
            </div>
        </div>

        <div class="footer">
            <button class="btn-text" @click="addAction">+ Add another shortcut</button>
            <button class="btn-main" @click="save">Save and Apply</button>
        </div>
    </div>

    <script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@vscode/codicons@0.0.32/dist/codicon.css">
    <script>
        const { createApp, ref } = Vue;

        createApp({
            setup() {
                const actions = ref(${JSON.stringify(config)});
                const vscode = acquireVsCodeApi();
                const pickerIdx = ref(-1);
                const supportedIcons = ${JSON.stringify(supportedIcons)};

                // Map 'when' to simplified 'lang' for UI
                actions.value = actions.value.map(a => {
                    let lang = 'any';
                    if (a.when.includes('markdown')) lang = 'markdown';
                    if (a.when.includes('javascript')) lang = 'javascript';
                    if (a.when.includes('python')) lang = 'python';
                    return { ...a, lang };
                });

                const addAction = () => {
                    actions.value.push({
                        id: 's.' + Date.now(),
                        title: '',
                        command: '',
                        icon: 'zap',
                        when: 'true',
                        lang: 'any'
                    });
                };

                const removeAction = (idx) => { actions.value.splice(idx, 1); };

                const togglePicker = (idx) => {
                    pickerIdx.value = pickerIdx.value === idx ? -1 : idx;
                };

                const setIcon = (idx, icon) => {
                    actions.value[idx].icon = icon;
                    pickerIdx.value = -1;
                };

                const save = () => {
                    const data = actions.value.map(a => {
                        const { lang, ...rest } = a;
                        rest.when = lang === 'any' ? 'true' : \`editorLangId == '\${lang}'\`;
                        return rest;
                    });
                    vscode.postMessage({ type: 'save', actions: data });
                };

                return { actions, supportedIcons, pickerIdx, togglePicker, setIcon, addAction, removeAction, save };
            }
        }).mount('#app');
    </script>
</body>
</html>`;
}
