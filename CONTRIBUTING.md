# Contributing to Context Bar

Thank you for your interest in contributing to Context Bar! 

## Development Setup

1. Clone the repository
2. Run `npm install` to install the dependencies
3. Press `F5` in VS Code to run the extension in a new Extension Development Host window

## Release Process

When a new version is ready to be released, follow these manual steps to publish the extension to the Visual Studio Code Marketplace and tag the release on GitHub.

### 1. Update Version and Changelog
- Update the `version` field in `package.json` following [Semantic Versioning](https://semver.org/).
- Add release notes for the new version in `CHANGELOG.md`.

### 2. Package and Publish
To publish the extension, you must have the publisher Personal Access Token (PAT) configured with `vsce`.

You can publish the extension directly using the npm script:
```bash
npm run publish
```

*(This command uses `npx vsce publish` under the hood, and will automatically compile the extension for both Node and Web before publishing.)*

Alternatively, to just build a `.vsix` package for manual testing:
```bash
npm run package
```

### 3. Git Tag the Release
After successfully publishing, create a Git tag for the new version and push it to the repository.

```bash
# Replace <version> with the actual version number (e.g., v0.1.1)
git tag v<version>

# Push the tag to GitHub
git push origin v<version>
```

## Useful Links
- [VS Code Extension Publishing Guide](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
