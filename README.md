<div align="center">
  <img src="https://raw.githubusercontent.com/zekkontro/lomment-cine/main/images/icon.png" width="64" height="64" alt="Lomment-Cine Logo">
  <h1>Lomment-Cine</h1>
</div>

# Lomment-Cine VSCode Extension

Lomment-Cine is a VSCode extension that helps you maintain clean code by safely storing unused code blocks instead of leaving them as comments. This extension promotes code cleanliness while ensuring you don't lose potentially useful code segments.

<div align="center">
  <img src="https://raw.githubusercontent.com/zekkontro/lomment-cine/main/images/introduction.gif" alt="Lomment-Cine Usage Demo" width="800">
</div>

## Why Lomment-Cine?

- ✨ **Keep Your Code Clean**: Instead of cluttering your codebase with commented-out code, store it safely
- 🔄 **Safe Code Management**: Never lose potentially useful code while maintaining clean files
- 📊 **Better Code Review**: Makes code reviews easier by removing unused code from view
- 🎯 **Improved Code Quality**: Helps maintain high code quality standards by reducing clutter
- 🔍 **Easy Access**: Quickly find and restore stored code when needed

## Features

- 📦 Store selected code blocks and remove them from their original location
- 🔍 Search and filter stored code
- 👁️ Preview stored code
- ⏮️ Restore code to original locations
- 🗑️ Delete unwanted stored code

## Usage

### Storing Code

1. Select the code block you want to store
2. Right-click and select "Store Unused Code" or click the archive icon in the editor title bar
3. The selected code will be removed and safely stored

### Viewing Stored Code

- CodeLens buttons will appear on lines where code is stored:
  - 👁️ View Code: Preview the code
  - ⏮️ Restore: Restore code to its original location
  - 🗑️ Delete: Permanently delete stored code

### Searching Code

1. Click the search icon in the editor title bar
2. Search through stored code
3. Perform these actions on found code:
   - View
   - Restore
   - Copy to Clipboard
   - Delete

## Best Practices

- Use Lomment-Cine instead of commenting out code during refactoring
- Store experimental code variations for easy comparison
- Keep your codebase clean while preserving potentially useful code
- Use the search feature to organize and manage stored code effectively

## Installation

1. Search for "Lomment-Cine" in VSCode Marketplace
2. Click "Install"
3. Restart VSCode

## Requirements

- Visual Studio Code 1.80.0 or higher

## Extension Settings

This extension currently doesn't have any custom settings.

## Known Issues

No known issues at this time.

## Release Notes

### 0.0.1

- Initial release
- Basic code storing and restoration features
- CodeLens integration
- Code search functionality

## Contributing

1. Fork this repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Contact

For questions and suggestions, please use the Issues section.

---

**Note**: This extension is perfect for developers who want to maintain clean, readable code while safely preserving unused code segments. Instead of cluttering your files with commented-out code, use Lomment-Cine to store and manage your code snippets effectively. It's an essential tool for maintaining code quality and cleanliness in your projects.
