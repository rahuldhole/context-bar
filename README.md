# Context Bar

<p align="center">
  <img src="./assets/hero.png" alt="Context Bar Hero" width="100%">
</p>

## ⌨️ Your Shortcuts, on the Tab Bar.

**Context Bar** is a minimalist VS Code extension that lets you trigger your favorite shortcuts and commands directly from the editor title bar. 

No more memorizing complex key combinations for every language. Just map any VS Code command to a native Codicon and set it to appear exactly when you need it.

---

## 🛠 Features

- **Trigger Anything**: Map any VS Code command ID (e.g., `workbench.action.terminal.toggleTerminal`) to a button.
- **Context Aware**: Buttons appear based on the file type you are currently editing.
- **Native Look**: Configuration UI that matches VS Code's built-in settings style.
- **30+ Icons**: Support for all common VS Code Codicons (`play`, `diff`, `terminal`, `git`, etc.).

---

## 🏗 Configuration

The extension includes a **Simple Builder** to help you map your commands visually.

1. Open the **Command Palette** (`Ctrl+Shift+P`).
2. Search for **"Context Bar: Configure Shortcuts"**.
3. Add your commands, pick an icon, and optionally restrict it to a specific language.

### Example Mapping

```json
{
  "id": "run-python",
  "title": "Run in Terminal",
  "command": "python.execInTerminal",
  "icon": "play",
  "when": "editorLangId == 'python'"
}
```

---

## 🔍 Why Context Bar?

VS Code's title bar is often underutilized. **Context Bar** turns it into a context-sensitive dashboard for your most frequent tasks—whether it's formatting, running tests, or jumping to specific views—without the "shiny" overhead of complex UI builders.

---

<p align="center">
  Simple. Custom. Native.
</p>