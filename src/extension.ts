import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

interface StoredCodeMap {
  [filePath: string]: {
    [lineRange: string]: {
      code: string;
      category: string;
      timestamp: number;
      description?: string;
    };
  };
}

interface StoredCodeItem {
  filePath: string;
  lineRange: string;
  code: string;
  timestamp: number;
}

class UnusedCodeLensProvider implements vscode.CodeLensProvider {
  public onDidChangeCodeLenses: vscode.Event<void>;
  private codeLensesEmitter = new vscode.EventEmitter<void>();

  private storedCodes: StoredCodeMap = {};
  private storedCodesFile: string = "";

  constructor(storedCodesFile: string) {
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

  async provideCodeLenses(
    document: vscode.TextDocument
  ): Promise<vscode.CodeLens[]> {
    this.refreshStoredCodes();

    const workspacePath = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
    if (!workspacePath) return [];

    // Dosya yolunu göreceli hale getir
    const relativePath = path.relative(workspacePath, document.fileName);
    const codeLenses: vscode.CodeLens[] = [];

    if (this.storedCodes[relativePath]) {
      for (const [lineRange, codeData] of Object.entries(
        this.storedCodes[relativePath]
      )) {
        const [startLine, endLine] = lineRange
          .split("-")
          .map((num) => parseInt(num) - 1);
        const range = new vscode.Range(
          new vscode.Position(startLine, 0),
          new vscode.Position(startLine, 0)
        );

        // View button with hover preview
        codeLenses.push(
          new vscode.CodeLens(range, {
            title: "👁️ View Code",
            command: "lomment-cine.showStoredCode",
            arguments: [codeData.code, lineRange],
            tooltip: `Preview: ${codeData.code.slice(0, 50)}...`,
          })
        );

        // Restore button
        codeLenses.push(
          new vscode.CodeLens(range, {
            title: "⏮️ Restore",
            command: "lomment-cine.restoreCode",
            arguments: [relativePath, lineRange, codeData.code],
            tooltip: "Restore code to its original position",
          })
        );

        // Delete button
        codeLenses.push(
          new vscode.CodeLens(range, {
            title: "🗑️ Delete",
            command: "lomment-cine.deleteStoredCode",
            arguments: [relativePath, lineRange],
            tooltip: "Permanently delete stored code",
          })
        );
      }
    }

    return codeLenses;
  }

  public refresh(): void {
    this.codeLensesEmitter.fire();
  }
}

export function activate(context: vscode.ExtensionContext) {
  console.log("=====================================");
  console.log("Lomment-Cine is now active!");
  console.log("=====================================");

  vscode.window.showInformationMessage("Lomment-Cine is now active!");

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
  function ensureStorageFile(workspacePath: string): string {
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
      vscode.window.showInformationMessage("Store Comment command executed!");
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

      // Dosya yolunu göreceli hale getir
      const relativePath = path.relative(
        workspacePath,
        editor.document.fileName
      );

      const filePath = ensureStorageFile(workspacePath);
      let storedCodes: StoredCodeMap = JSON.parse(
        fs.readFileSync(filePath, "utf-8")
      );

      if (!storedCodes[relativePath]) {
        storedCodes[relativePath] = {};
      }
      storedCodes[relativePath][lineRange] = {
        code: text,
        category: "comment",
        timestamp: Date.now(),
      };

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
    async (code: string, lineRange: string) => {
      const document = await vscode.workspace.openTextDocument({
        content: code,
        language:
          vscode.window.activeTextEditor?.document.languageId || "plaintext",
      });
      await vscode.window.showTextDocument(document, {
        viewColumn: vscode.ViewColumn.Beside,
        preview: true,
        preserveFocus: true,
      });
    }
  );

  // Restore code command
  let restoreCode = vscode.commands.registerCommand(
    "lomment-cine.restoreCode",
    async (filePath: string, lineRange: string, code: string) => {
      const workspacePath = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
      if (!workspacePath) return;

      // Göreceli yolu tam yola çevir
      const absolutePath = path.join(workspacePath, filePath);

      const document = await vscode.workspace.openTextDocument(absolutePath);
      const editor = await vscode.window.showTextDocument(document);

      const [startLine] = lineRange.split("-").map((num) => parseInt(num) - 1);
      const position = new vscode.Position(startLine, 0);

      await editor.edit((editBuilder) => {
        editBuilder.insert(position, code + "\n");
      });

      // Remove restored code from storage
      const storagePath = path.join(workspacePath, "stored-codes.json");
      const storedCodes: StoredCodeMap = JSON.parse(
        fs.readFileSync(storagePath, "utf-8")
      );

      delete storedCodes[filePath][lineRange];
      if (Object.keys(storedCodes[filePath]).length === 0) {
        delete storedCodes[filePath];
      }

      fs.writeFileSync(storagePath, JSON.stringify(storedCodes, null, 2));
      codeLensProvider.refresh();

      vscode.window.showInformationMessage("Code restored successfully!");
    }
  );

  // Delete stored code command
  let deleteStoredCode = vscode.commands.registerCommand(
    "lomment-cine.deleteStoredCode",
    async (filePath: string, lineRange: string) => {
      const result = await vscode.window.showWarningMessage(
        "Are you sure you want to permanently delete this stored code?",
        { modal: true },
        "Yes",
        "No"
      );

      if (result === "Yes") {
        const workspacePath = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
        if (workspacePath) {
          const storagePath = path.join(workspacePath, "stored-codes.json");
          const storedCodes: StoredCodeMap = JSON.parse(
            fs.readFileSync(storagePath, "utf-8")
          );

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

  // Tüm saklanan kodları getiren yardımcı fonksiyon
  function getAllStoredCodes(): StoredCodeItem[] {
    const workspacePath = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
    if (!workspacePath) return [];

    const storagePath = path.join(workspacePath, "stored-codes.json");
    if (!fs.existsSync(storagePath)) return [];

    try {
      const storedCodes: StoredCodeMap = JSON.parse(
        fs.readFileSync(storagePath, "utf-8")
      );
      const allCodes: StoredCodeItem[] = [];

      for (const [filePath, fileData] of Object.entries(storedCodes)) {
        for (const [lineRange, codeData] of Object.entries(fileData)) {
          if (typeof codeData === "string") {
            // Eski format için geriye dönük uyumluluk
            allCodes.push({
              filePath: filePath,
              lineRange: lineRange,
              code: codeData,
              timestamp: Date.now(),
            });
          } else {
            // Yeni format
            allCodes.push({
              filePath: filePath,
              lineRange: lineRange,
              code: codeData.code,
              timestamp: codeData.timestamp,
            });
          }
        }
      }
      return allCodes;
    } catch (error) {
      console.error("Error parsing stored codes:", error);
      return [];
    }
  }

  // Arama komutu
  let searchStoredCode = vscode.commands.registerCommand(
    "lomment-cine.searchCode",
    async () => {
      const allCodes = getAllStoredCodes();

      if (allCodes.length === 0) {
        vscode.window.showInformationMessage("No stored code snippets found.");
        return;
      }

      const items = allCodes.map((codeItem) => ({
        label: `$(file) ${path.basename(codeItem.filePath)} (Lines: ${
          codeItem.lineRange
        })`,
        detail:
          codeItem.code.slice(0, 100) +
          (codeItem.code.length > 100 ? "..." : ""),
        description: new Date(codeItem.timestamp).toLocaleString(),
        filePath: codeItem.filePath,
        lineRange: codeItem.lineRange,
        code: codeItem.code,
      }));

      const selected = await vscode.window.showQuickPick(items, {
        placeHolder: "Search stored code snippets...",
        matchOnDetail: true,
        matchOnDescription: true,
      });

      if (selected) {
        const actions = ["View", "Restore", "Copy to Clipboard", "Delete"];
        const action = await vscode.window.showQuickPick(actions, {
          placeHolder: "What would you like to do with this code?",
        });

        switch (action) {
          case "View":
            const document = await vscode.workspace.openTextDocument({
              content: selected.code,
              language: "typescript",
            });
            await vscode.window.showTextDocument(
              document,
              vscode.ViewColumn.Beside
            );
            break;

          case "Copy to Clipboard":
            await vscode.env.clipboard.writeText(selected.code);
            vscode.window.showInformationMessage("Code copied to clipboard!");
            break;

          case "Restore":
            vscode.commands.executeCommand(
              "lomment-cine.restoreCode",
              selected.filePath,
              selected.lineRange,
              selected.code
            );
            break;

          case "Delete":
            vscode.commands.executeCommand(
              "lomment-cine.deleteStoredCode",
              selected.filePath,
              selected.lineRange
            );
            break;
        }
      }
    }
  );

  context.subscriptions.push(
    storeComment,
    showStoredCode,
    restoreCode,
    deleteStoredCode,
    searchStoredCode
  );
}

export function deactivate() {
  console.log("Lomment-Cine is now deactivated!");
}
