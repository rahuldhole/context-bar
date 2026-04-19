export function getWebviewContent(config: any): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Context Bar Configuration</title>
    <script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
        .glass { background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.1); }
        .active-card { border-color: #4f46e5; background: rgba(79, 70, 229, 0.1); }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 4px; }
    </style>
</head>
<body class="bg-[#0e0e10] text-[#e1e1e3] p-8">
    <div id="app" v-cloak>
        <div class="max-w-5xl mx-auto">
            <!-- Header -->
            <header class="mb-10 flex justify-between items-center">
                <div>
                    <h1 class="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">Context Bar Builder</h1>
                    <p class="text-gray-400 mt-1 text-sm">Design your perfect editor workflow without writing a single line of JSON.</p>
                </div>
                <div class="flex gap-3">
                    <button @click="save" class="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg font-medium transition-all shadow-lg shadow-indigo-500/20">
                        Save Changes
                    </button>
                </div>
            </header>

            <div class="grid grid-cols-12 gap-8">
                <!-- Sidebar: Action List -->
                <aside class="col-span-4 space-y-4">
                    <div class="flex justify-between items-center mb-2">
                        <h2 class="text-xs font-semibold uppercase tracking-wider text-gray-500">Active Actions</h2>
                        <button @click="addAction" class="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">+ New Action</button>
                    </div>
                    
                    <div v-for="(action, index) in actions" :key="action.id" 
                         @click="selectAction(index)"
                         :class="['p-4 rounded-xl glass cursor-pointer transition-all hover:translate-x-1', selectedIndex === index ? 'active-card' : 'hover:border-white/20']">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-indigo-400">
                                <i :class="getIconClass(action.icon)"></i>
                            </div>
                            <div class="flex-1 overflow-hidden">
                                <h3 class="font-medium truncate">{{ action.title || 'Untitled Action' }}</h3>
                                <p class="text-[10px] text-gray-500 uppercase font-mono truncate">{{ action.id }}</p>
                            </div>
                            <button @click.stop="removeAction(index)" class="text-gray-600 hover:text-red-400 transition-colors">
                                <i class="fas fa-trash-can"></i>
                            </button>
                        </div>
                    </div>

                    <div v-if="actions.length === 0" class="p-8 text-center glass rounded-xl border-dashed border-2 border-white/5">
                        <p class="text-gray-500 text-sm">No actions yet. Click "New Action" to begin.</p>
                    </div>
                </aside>

                <!-- Main Content: Editor Form -->
                <main class="col-span-8">
                    <div v-if="selectedAction" class="glass rounded-2xl p-8 space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div class="space-y-6">
                            <h2 class="text-xl font-semibold">Action Properties</h2>
                            
                            <div class="grid grid-cols-2 gap-6">
                                <div class="space-y-2">
                                    <label class="text-xs font-semibold text-gray-400 uppercase">Title</label>
                                    <input v-model="selectedAction.title" type="text" class="w-full bg-white/5 border border-white/10 rounded-lg p-3 outline-none focus:border-indigo-500 transition-all font-medium" placeholder="Preview File">
                                </div>
                                <div class="space-y-2">
                                    <label class="text-xs font-semibold text-gray-400 uppercase">Unique ID</label>
                                    <input v-model="selectedAction.id" type="text" class="w-full bg-white/5 border border-white/10 rounded-lg p-3 outline-none focus:border-indigo-500 transition-all font-mono text-sm" placeholder="my.custom.action">
                                </div>
                            </div>

                            <div class="space-y-2">
                                <label class="text-xs font-semibold text-gray-400 uppercase text-indigo-400">Command to Execute</label>
                                <select v-model="selectedAction.command" class="w-full bg-white/5 border border-white/10 rounded-lg p-3 outline-none focus:border-indigo-500 transition-all appearance-none text-sm">
                                    <optgroup label="Common Commands">
                                        <option value="markdown.showPreviewToSide">Markdown: Preview to Side</option>
                                        <option value="editor.action.formatDocument">Editor: Format Document</option>
                                        <option value="workbench.action.terminal.runSelectedText">Terminal: Run Selection</option>
                                        <option value="workbench.action.files.save">File: Save</option>
                                        <option value="workbench.action.tasks.runTask">Tasks: Run Task</option>
                                    </optgroup>
                                    <optgroup label="Custom">
                                        <option :value="selectedAction.command">{{ selectedAction.command }} (Custom)</option>
                                    </optgroup>
                                </select>
                            </div>

                            <div class="space-y-4">
                                <label class="text-xs font-semibold text-gray-400 uppercase">Visual Icon</label>
                                <div class="grid grid-cols-6 gap-3">
                                    <button v-for="icon in supportedIcons" :key="icon" 
                                            @click="selectedAction.icon = icon"
                                            :class="['w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-all', selectedAction.icon === icon ? 'bg-indigo-600 text-white border-none shadow-lg shadow-indigo-600/30' : 'bg-white/5 hover:bg-white/10 text-gray-400 border border-white/5']">
                                        <i :class="getIconClass(icon)"></i>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <hr class="border-white/5">

                        <div class="space-y-6">
                            <h2 class="text-xl font-semibold">Conditions (When to show?)</h2>
                            
                            <div class="grid grid-cols-2 gap-8">
                                <div class="space-y-4">
                                    <div class="flex items-center gap-3">
                                        <input type="checkbox" id="checkLang" class="w-4 h-4 rounded bg-indigo-600 border-none cursor-pointer" v-model="hasLangLimit">
                                        <label for="checkLang" class="text-sm cursor-pointer font-medium">Specific Language</label>
                                    </div>
                                    <select v-if="hasLangLimit" v-model="langId" @change="updateWhen" class="w-full bg-white/5 border border-white/10 rounded-lg p-3 outline-none text-sm">
                                        <option value="markdown">Markdown</option>
                                        <option value="javascript">JavaScript</option>
                                        <option value="typescript">TypeScript</option>
                                        <option value="python">Python</option>
                                        <option value="json">JSON</option>
                                        <option value="html">HTML</option>
                                    </select>
                                </div>

                                <div class="space-y-4">
                                    <div class="flex items-center gap-3">
                                        <input type="checkbox" id="checkDirty" class="w-4 h-4 rounded bg-indigo-600 border-none cursor-pointer" v-model="onlyIfDirty" @change="updateWhen">
                                        <label for="checkDirty" class="text-sm cursor-pointer font-medium">Only if file is dirty (unsaved)</label>
                                    </div>
                                    <div class="flex items-center gap-3">
                                        <input type="checkbox" id="checkSelection" class="w-4 h-4 rounded bg-indigo-600 border-none cursor-pointer" v-model="onlyIfSelection" @change="updateWhen">
                                        <label for="checkSelection" class="text-sm cursor-pointer font-medium">Show only when text is selected</label>
                                    </div>
                                </div>
                            </div>

                            <div class="p-4 rounded-lg bg-black/40 border border-white/5 font-mono text-xs text-indigo-300">
                                <span class="text-gray-500 uppercase mr-2 tracking-tighter">Evaluation Rule:</span>
                                {{ selectedAction.when }}
                            </div>
                        </div>
                    </div>

                    <div v-else class="h-[500px] flex flex-col items-center justify-center glass rounded-2xl p-12 text-center opacity-60">
                        <div class="w-20 h-20 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-6 border border-indigo-500/20">
                            <i class="fas fa-arrow-left text-2xl"></i>
                        </div>
                        <h2 class="text-2xl font-bold mb-2">Editor Ready</h2>
                        <p class="text-gray-400 max-w-sm">Select an existing action from the left sidebar to edit its properties, or create a new one to add a button to your editor title bar.</p>
                    </div>
                </main>
            </div>
        </div>
    </div>

    <script>
        const { createApp, ref, computed, watch } = Vue;

        createApp({
            setup() {
                const actions = ref(${JSON.stringify(config)});
                const selectedIndex = ref(-1);
                const vscode = acquireVsCodeApi();

                const supportedIcons = ['preview', 'format', 'play', 'debug', 'test', 'sync', 'trash', 'save', 'book', 'bug', 'zap', 'gear'];

                // Rule Builder Helpers
                const hasLangLimit = ref(false);
                const langId = ref('markdown');
                const onlyIfDirty = ref(false);
                const onlyIfSelection = ref(false);

                const selectedAction = computed(() => {
                    if (selectedIndex.value === -1) return null;
                    return actions.value[selectedIndex.value];
                });

                watch(selectedIndex, (newIdx) => {
                    if (newIdx === -1) return;
                    const action = actions.value[newIdx];
                    // Parse 'when' to UI state (simple parser)
                    hasLangLimit.value = action.when.includes('editorLangId');
                    if (hasLangLimit.value) {
                        const match = action.when.match(/editorLangId == '(.+?)'/);
                        if (match) langId.value = match[1];
                    }
                    onlyIfDirty.value = action.when.includes('isDirty');
                    onlyIfSelection.value = action.when.includes('!selectionEmpty');
                });

                const updateWhen = () => {
                    if (selectedIndex.value === -1) return;
                    let rules = [];
                    if (hasLangLimit.value) rules.push(\`editorLangId == '\${langId.value}'\`);
                    if (onlyIfDirty.value) rules.push('isDirty');
                    if (onlyIfSelection.value) rules.push('!selectionEmpty');
                    
                    actions.value[selectedIndex.value].when = rules.length > 0 ? rules.join(' && ') : 'true';
                };

                const selectAction = (idx) => {
                    selectedIndex.value = idx;
                };

                const addAction = () => {
                    const newAction = {
                        id: 'custom.action.' + Date.now(),
                        title: 'New Action',
                        command: 'editor.action.formatDocument',
                        icon: 'zap',
                        when: 'true',
                        priority: 0
                    };
                    actions.value.push(newAction);
                    selectedIndex.value = actions.value.length - 1;
                };

                const removeAction = (idx) => {
                    actions.value.splice(idx, 1);
                    if (selectedIndex.value === idx) selectedIndex.value = -1;
                    else if (selectedIndex.value > idx) selectedIndex.value--;
                };

                const getIconClass = (icon) => {
                    const map = {
                        'preview': 'fas fa-eye',
                        'format': 'fas fa-checklist',
                        'play': 'fas fa-play',
                        'debug': 'fas fa-bug',
                        'test': 'fas fa-flask',
                        'sync': 'fas fa-sync',
                        'trash': 'fas fa-trash',
                        'save': 'fas fa-save',
                        'book': 'fas fa-book',
                        'bug': 'fas fa-bug',
                        'zap': 'fas fa-bolt',
                        'gear': 'fas fa-cog'
                    };
                    return map[icon] || 'fas fa-star';
                };

                const save = () => {
                    vscode.postMessage({
                        type: 'save',
                        actions: JSON.parse(JSON.stringify(actions.value))
                    });
                };

                return {
                    actions, selectedIndex, selectedAction, supportedIcons,
                    hasLangLimit, langId, onlyIfDirty, onlyIfSelection,
                    selectAction, addAction, removeAction, getIconClass, updateWhen, save
                };
            }
        }).mount('#app');
    </script>
</body>
</html>`;
}
