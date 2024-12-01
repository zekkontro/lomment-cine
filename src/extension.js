"use strict";
var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (
          !desc ||
          ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)
        ) {
          desc = {
            enumerable: true,
            get: function () {
              return m[k];
            },
          };
        }
        Object.defineProperty(o, k2, desc);
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
      });
var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? function (o, v) {
        Object.defineProperty(o, "default", { enumerable: true, value: v });
      }
    : function (o, v) {
        o["default"] = v;
      });
var __importStar =
  (this && this.__importStar) ||
  (function () {
    var ownKeys = function (o) {
      ownKeys =
        Object.getOwnPropertyNames ||
        function (o) {
          var ar = [];
          for (var k in o)
            if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
          return ar;
        };
      return ownKeys(o);
    };
    return function (mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null)
        for (var k = ownKeys(mod), i = 0; i < k.length; i++)
          if (k[i] !== "default") __createBinding(result, mod, k[i]);
      __setModuleDefault(result, mod);
      return result;
    };
  })();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class UnusedCodeLensProvider {
  onDidChangeCodeLenses;
  codeLensesEmitter = new vscode.EventEmitter();
  storedCodes = {};
  storedCodesFile = "";
  constructor(storedCodesFile) {
    this.storedCodesFile = storedCodesFile;
    this.onDidChangeCodeLenses = this.codeLensesEmitter.event;
    this.refreshStoredCodes();
  }
  refreshStoredCodes() {
    const workspacePath = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
    if (!workspacePath) return;
    const filePath = path.join(workspacePath, this.storedCodesFile);
    if (fs.existsSync(filePath)) {
      this.storedCodes = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    }
  }
  async provideCodeLenses(document) {
    this.refreshStoredCodes();
    const filePath = document.fileName;
    const codeLenses = [];
    if (this.storedCodes[filePath]) {
      for (const [lineRange, code] of Object.entries(
        this.storedCodes[filePath]
      )) {
        const [startLine, endLine] = lineRange
          .split("-")
          .map((num) => parseInt(num) - 1);
        const range = new vscode.Range(
          new vscode.Position(startLine, 0),
          new vscode.Position(startLine, 0)
        );
        // View button with hover preview
        const markdown = new vscode.MarkdownString();
        markdown.appendCodeblock(code, "typescript");
        markdown.isTrusted = true;
        codeLenses.push(
          new vscode.CodeLens(range, {
            title: "👁️ View Code",
            command: "lomment-cine.showStoredCode",
            arguments: [code],
            tooltip: `Preview: ${code.slice(0, 50)}...`,
          })
        );
        // Restore button
        codeLenses.push(
          new vscode.CodeLens(range, {
            title: "⏮️ Restore",
            command: "lomment-cine.restoreCode",
            arguments: [filePath, lineRange, code],
            tooltip: "Restore code to its original position",
          })
        );
        // Delete button
        codeLenses.push(
          new vscode.CodeLens(range, {
            title: "🗑️ Delete",
            command: "lomment-cine.deleteStoredCode",
            arguments: [filePath, lineRange],
            tooltip: "Permanently delete stored code",
          })
        );
      }
    }
    return codeLenses;
  }
  refresh() {
    this.codeLensesEmitter.fire();
  }
}
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
function activate(context) {
  let storedCodesFile = "stored-codes.json";
  // Register CodeLens provider
  const codeLensProvider = new UnusedCodeLensProvider(storedCodesFile);
  context.subscriptions.push(
    vscode.languages.registerCodeLensProvider(
      { pattern: "**/*" },
      codeLensProvider
    )
  );
  // Create or check existing storage file
  function ensureStorageFile(workspacePath) {
    const filePath = path.join(workspacePath, storedCodesFile);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify({}, null, 2));
    }
    return filePath;
  }
  // Store code command
  let storeComment = vscode.commands.registerCommand(
    "lomment-cine.storeComment",
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;
      const selection = editor.selection;
      const text = editor.document.getText(selection);
      if (!text) {
        vscode.window.showWarningMessage("Please select code to store");
        return;
      }
      const startLine = selection.start.line + 1;
      const endLine = selection.end.line + 1;
      const lineRange = `${startLine}-${endLine}`;
      const workspacePath = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
      if (!workspacePath) return;
      const filePath = ensureStorageFile(workspacePath);
      let storedCodes = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      if (!storedCodes[editor.document.fileName]) {
        storedCodes[editor.document.fileName] = {};
      }
      storedCodes[editor.document.fileName][lineRange] = text;
      fs.writeFileSync(filePath, JSON.stringify(storedCodes, null, 2));
      // Delete selected code
      editor.edit((editBuilder) => {
        editBuilder.delete(selection);
      });
      vscode.window.showInformationMessage("Code stored successfully!");
    }
  );
  // Show stored code command
  let showStoredCode = vscode.commands.registerCommand(
    "lomment-cine.showStoredCode",
    async (code) => {
      const document = await vscode.workspace.openTextDocument({
        content: code,
        language: vscode.window.activeTextEditor?.document.languageId || "text",
      });
      vscode.window.showTextDocument(document, vscode.ViewColumn.Beside);
    }
  );
  // Restore code command
  let restoreCode = vscode.commands.registerCommand(
    "lomment-cine.restoreCode",
    async (filePath, lineRange, code) => {
      const document = await vscode.workspace.openTextDocument(filePath);
      const editor = await vscode.window.showTextDocument(document);
      const [startLine] = lineRange.split("-").map((num) => parseInt(num) - 1);
      const position = new vscode.Position(startLine, 0);
      await editor.edit((editBuilder) => {
        editBuilder.insert(position, code + "\n");
      });
      // Remove restored code from storage
      const workspacePath = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
      if (workspacePath) {
        const storagePath = path.join(workspacePath, storedCodesFile);
        const storedCodes = JSON.parse(fs.readFileSync(storagePath, "utf-8"));
        delete storedCodes[filePath][lineRange];
        if (Object.keys(storedCodes[filePath]).length === 0) {
          delete storedCodes[filePath];
        }
        fs.writeFileSync(storagePath, JSON.stringify(storedCodes, null, 2));
        codeLensProvider.refresh();
        vscode.window.showInformationMessage("Code restored successfully!");
      }
    }
  );
  // Delete stored code command
  let deleteStoredCode = vscode.commands.registerCommand(
    "lomment-cine.deleteStoredCode",
    async (filePath, lineRange) => {
      const result = await vscode.window.showWarningMessage(
        "Are you sure you want to permanently delete this stored code?",
        { modal: true },
        "Yes",
        "No"
      );
      if (result === "Yes") {
        const workspacePath = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
        if (workspacePath) {
          const storagePath = path.join(workspacePath, storedCodesFile);
          const storedCodes = JSON.parse(fs.readFileSync(storagePath, "utf-8"));
          delete storedCodes[filePath][lineRange];
          if (Object.keys(storedCodes[filePath]).length === 0) {
            delete storedCodes[filePath];
          }
          fs.writeFileSync(storagePath, JSON.stringify(storedCodes, null, 2));
          codeLensProvider.refresh();
          vscode.window.showInformationMessage(
            "Stored code deleted successfully!"
          );
        }
      }
    }
  );
  context.subscriptions.push(
    storeComment,
    showStoredCode,
    restoreCode,
    deleteStoredCode
  );
}
// This method is called when your extension is deactivated
function deactivate() {}
//# sourceMappingURL=extension.js.map
