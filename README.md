# Context Bar

![Context Bar Hero](https://github.com/rahuldhole/context-bar/raw/main/assets/hero.png)

<p align="center">
  <b>Elevate your workflow by pinning your favorite shortcuts exactly where your eyes land—the tab bar.</b>
</p>

<p align="center">
  <img src="https://img.shields.io/visual-studio-marketplace/v/rahuldhole.context-bar?style=flat-square&color=0078d7" alt="Marketplace Version">
  <img src="https://img.shields.io/visual-studio-marketplace/i/rahuldhole.context-bar?style=flat-square&color=0078d7" alt="Installs">
  <img src="https://img.shields.io/github/license/rahuldhole/context-bar?style=flat-square&color=0078d7" alt="License">
</p>

---

## ✨ Why Context Bar?

VS Code has thousands of commands, but you probably only use a handful frequently. **Context Bar** turns the empty space in your editor title bar into a dynamic, context-aware dashboard for your most essential tasks.

No more memorizing complex key combinations. No more hunting through the Command Palette. Just **Pin, Click, and Code.**

### 🚀 Key Features

- **🎯 Context-Aware Buttons**: Buttons appear and disappear automatically based on the file extension you are currently editing (e.g., show a 'Run' button for `.py` files and a 'Preview' button for `.md`).
- **🎨 Swiss Minimalism**: A clean, distraction-free configuration interface that matches the native VS Code aesthetic. No "shiny" clutter—just pure functionality.
- **🔍 Smart Shortcut Search**: Don't know the Command ID? Just search by keybinding (like "Ctrl+S") or command name in our built-in builder.
- **📦 30+ Native Icons**: Support for the full library of official VS Code Codicons for a seamless, "built-in" look.
- **⚡ High Performance**: Zero UI lag. Context matches are pre-computed and cached for instantaneous tab switching.

---

## 🛠 Quick Start

1. **Open the Builder**: Type `Context Bar: Configure Shortcuts` in the Command Palette (`Ctrl+Shift+P`).
2. **Add a Shortcut**: Click "+ Add Action" and type a familiar shortcut or command name to see suggestions.
3. **Set the Scope**: Enter extensions like `md, py` or use `*` for a global button that never hides.
4. **Save & Apply**: Hit "Save & Apply" and watch your icons appear instantly in the tab bar.

---

## 📖 Pro Tips

- **Multi-Targeting**: List multiple extensions comma-separated (e.g., `ts, js, tsx`) to share a single button across languages.
- **Individual Toggles**: Use the checkboxes in the builder to quickly enable or disable buttons without deleting their configuration.
- **Edit JSON**: For power users, click the "Edit JSON" link in the header to modify your shortcuts directly in `settings.json`.

---

## ⚙️ Extension Settings

This extension contributes the following settings:

* `context-bar.enabled`: Enable/disable all Context Bar buttons globally.
* `tabTools.actions`: The list of configured shortcuts and their context rules.

## 📋 Requirements

* VS Code version 1.75.0 or higher.

## 🐛 Known Issues

* Some custom icons might not render correctly if the theme overrides VS Code's default Codicons.
* Large numbers of buttons may crowd the editor title bar on smaller screens.

---

## 🤝 Contributing

We love contributions! If you have ideas for new features or icons, feel free to open an issue or a pull request on our [GitHub Repository](https://github.com/rahuldhole/context-bar).

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  Made with ❤️ for the VS Code community.
</p>