# Context Bar

A VSCode extension that provides **context-aware, user-configurable action buttons** in the editor title area (top-right of tabs).

## Features

- **Dynamic Visibility**: Buttons appear and disappear based on the active editor context.
- **Fully Configurable**: Define your own actions, commands, and icons via settings.
- **Fast Performance**: Context updates are debounced and efficient.

## Configuration

Add your actions to `tabTools.actions` in your `settings.json`.

```json
{
  "tabTools.actions": [
    {
      "id": "markdown.preview",
      "title": "Preview",
      "command": "markdown.showPreviewToSide",
      "icon": "preview",
      "when": "editorLangId == 'markdown'"
    },
    {
      "id": "json.format",
      "title": "Format",
      "command": "editor.action.formatDocument",
      "icon": "format",
      "when": "editorLangId == 'json'"
    },
    {
      "id": "run.python",
      "title": "Run Python",
      "command": "python.execInTerminal",
      "icon": "play",
      "when": "fileExt == 'py'"
    }
  ]
}
```

### Supported Icons
Currently supported icon keywords:
- `preview`, `format`, `play`, `debug`, `test`, `sync`, `trash`, `save`, `book`, `bug`, `zap`, `gear`

### Rule Context
The `when` clause supports the following variables:
- `editorLangId`: Language ID of the active file (e.g., `'markdown'`, `'javascript'`)
- `fileName`: Full path of the file
- `fileExt`: Extension of the file (e.g., `'md'`, `'py'`)
- `isDirty`: `true` if the file has unsaved changes
- `selectionEmpty`: `true` if there is no text selection

## How it works

The extension uses a **Slot system** to provide dynamic buttons. Since VSCode menu contributions are static, we pre-register a set of command slots with common icons and use `setContext` to toggle their visibility and map them to your configured commands at runtime.