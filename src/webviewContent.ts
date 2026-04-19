export function getWebviewContent(config: any): string {
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
        h1 { font-size: 1.5em; margin-bottom: 20px; font-weight: normal; }
        .action-row {
            border: 1px solid var(--panel-border);
            padding: 15px;
            margin-bottom: 10px;
            border-radius: 4px;
            display: flex;
            flex-direction: column;
            gap: 15px;
        }
        .field-group { display: flex; flex-direction: column; gap: 5px; }
        label { font-size: 0.9em; opacity: 0.8; }
        input, select {
            background: var(--input-bg);
            color: var(--input-fg);
            border: 1px solid var(--input-border);
            padding: 8px;
            outline: none;
            border-radius: 2px;
        }
        .controls { display: flex; gap: 10px; margin-bottom: 20px; }
        button {
            background: var(--button-bg);
            color: var(--button-fg);
            border: none;
            padding: 8px 16px;
            cursor: pointer;
            border-radius: 2px;
        }
        button:hover { background: var(--button-hover); }
        button.secondary { background: transparent; border: 1px solid var(--button-bg); color: var(--button-bg); }
        button.danger { background: #d03030; color: white; }
        .icon-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
            gap: 5px;
            margin-top: 5px;
        }
        .icon-btn {
            width: 40px;
            height: 40px;
            background: var(--input-bg);
            border: 1px solid var(--input-border);
            color: var(--input-fg);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.2em;
        }
        .icon-btn.selected { border: 2px solid var(--button-bg); }
        .rule-preview { font-family: monospace; font-size: 0.85em; opacity: 0.6; margin-top: 5px; }
        .row-header { display: flex; justify-content: space-between; align-items: center; }
    </style>
</head>
<body>
    <div id="app">
        <h1>Context Bar Actions</h1>
        <div class="controls">
            <button @click="addAction">+ Add Action</button>
            <button @click="save" style="margin-left: auto;">Save Configuration</button>
        </div>

        <div v-for="(action, index) in actions" :key="index" class="action-row">
            <div class="row-header">
                <strong>Action #{{ index + 1 }}</strong>
                <button class="danger" @click="removeAction(index)">Delete</button>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div class="field-group">
                    <label>Button Label (Tooltip)</label>
                    <input v-model="action.title" placeholder="e.g., Save File">
                </div>
                <div class="field-group">
                    <label>Command to Trigger</label>
                    <input v-model="action.command" placeholder="e.g., workbench.action.files.save">
                </div>
            </div>

            <div class="field-group">
                <label>Icon</label>
                <div class="icon-grid">
                    <button v-for="icon in supportedIcons" 
                            :key="icon" 
                            @click="action.icon = icon"
                            :class="['icon-btn', action.icon === icon ? 'selected' : '']"
                            :title="icon">
                        <span :class="'codicon codicon-' + icon"></span>
                    </button>
                </div>
            </div>

            <div class="field-group">
                <label>When to show (Simplified Rule)</label>
                <div style="display: flex; gap: 10px; align-items: center;">
                    <select v-model="action.langType" @change="updateWhen(index)">
                        <option value="any">Any File Type</option>
                        <option value="lang">Language ID...</option>
                    </select>
                    <input v-if="action.langType === 'lang'" v-model="action.customLang" @input="updateWhen(index)" placeholder="markdown, python, etc.">
                </div>
                <div class="rule-preview">Current Condition: {{ action.when }}</div>
            </div>
        </div>
    </div>

    <script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@vscode/codicons@0.0.32/dist/codicon.css">
    <script>
        const { createApp, ref, onMounted } = Vue;

        createApp({
            setup() {
                const actions = ref(${JSON.stringify(config)});
                const vscode = acquireVsCodeApi();
                const supportedIcons = [
                    'play', 'debug-start', 'eye', 'checklist', 'sync', 'trash', 'save', 'book', 'bug', 'zap', 
                    'gear', 'search', 'refresh', 'edit', 'list-unordered', 'symbol-method', 'symbol-class', 
                    'new-file', 'new-folder', 'diff', 'git-commit', 'terminal', 'graph', 'database', 'cloud', 
                    'lock', 'unlock', 'home', 'mail', 'bell'
                ];

                // Initialize internal state for UI helpers
                actions.value = actions.value.map(a => {
                    const isLang = a.when.includes('editorLangId');
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

                const addAction = () => {
                    actions.value.push({
                        id: 'action.' + Date.now(),
                        title: 'New Shortcut',
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

                const updateWhen = (index) => {
                    const a = actions.value[index];
                    if (a.langType === 'lang' && a.customLang) {
                        a.when = \`editorLangId == '\${a.customLang}'\`;
                    } else {
                        a.when = 'true';
                    }
                };

                const save = () => {
                    // Strip the UI helper fields before saving
                    const dataToSave = actions.value.map(a => {
                        const { langType, customLang, ...rest } = a;
                        return rest;
                    });
                    vscode.postMessage({ type: 'save', actions: dataToSave });
                };

                return { actions, supportedIcons, addAction, removeAction, updateWhen, save };
            }
        }).mount('#app');
    </script>
</body>
</html>`;
}
