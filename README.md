# Context Bar

<p align="center">
  <img src="./assets/hero.png" alt="Context Bar Hero" width="100%">
</p>

## ✨ The Editor Bar, Reimagined.

**Context Bar** is a premium Visual Studio Code extension that brings **context-aware, user-configurable action buttons** to your editor's title area. Stop hunting through menus or remembering dozens of shortcuts—get exactly the tools you need, exactly when you need them.

---

## 🚀 Key Features

- **🧠 Intelligent Context Detection**: Buttons appear and disappear dynamically based on the file type, selection state, and workspace conditions.
- **🎨 User-Configurable Actions**: Define your own workflows in `settings.json`. Map any VSCode command to a sleek icon.
- **⚡ Zero UI Lag**: Optimized to recompute context in under 50ms, ensuring a fluid typing and navigating experience.
- **🛠 Universal Slot System**: Leverages a high-performance slot registry to provide custom icons without the overhead of heavy UI frameworks.

---

## 🛠 How It Works

Context Bar uses a reactive engine to monitor your active editor. By evaluating custom `when` rules, it dynamically assigns your configured commands to a pool of pre-registered **Action Slots** in the editor's title bar.

### Example Configuration

Add this to your `settings.json` to get started:

```json
{
  "tabTools.actions": [
    {
      "id": "markdown.preview",
      "title": "Open Preview",
      "command": "markdown.showPreviewToSide",
      "icon": "preview",
      "when": "editorLangId == 'markdown'"
    },
    {
      "id": "json.format",
      "title": "Format Document",
      "command": "editor.action.formatDocument",
      "icon": "format",
      "when": "editorLangId == 'json'"
    },
    {
      "id": "run.python",
      "title": "Run Script",
      "command": "python.execInTerminal",
      "icon": "play",
      "when": "fileExt == 'py' && !selectionEmpty"
    }
  ]
}
```

---

## 🔍 Supported Icons & Logic

### 🔘 Iconic Slots
Choose from a curated set of high-visibility icons:
`preview` • `format` • `play` • `debug` • `test` • `sync` • `trash` • `save` • `book` • `bug` • `zap` • `gear`

### 🧪 Advanced Rule Engine
The `when` clause supports powerful variables to fine-tune your bar:
- `editorLangId`: Language of the file (e.g., `'typescript'`)
- `fileName`: Full path evaluation
- `fileExt`: Extension pattern matching (e.g., `'md'`)
- `isDirty`: React to unsaved changes
- `isUntitled`: Target new buffers
- `selectionEmpty`: Show actions only when text is (or isn't) selected

---

## 📦 Installation

1. Open **VSCode**
2. Go to **Extensions** (`Ctrl+Shift+X`)
3. Search for **Context Bar**
4. Click **Install**
5. Start configuring your dream workflow!

---

<p align="center">
  Built with ❤️ for the Developer Community.
</p>