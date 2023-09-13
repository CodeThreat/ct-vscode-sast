"use strict";
import * as vscode from "vscode";
import * as path from "path";
import { initExtensionSettings, stateData } from "./extensionSettings";
import { parseDataFromFile } from "./parse";
import { getProjectName } from "./getRepoUrl";
import { barViewProvider } from "./webviews/pages/sidebar";
import { KBFields, FlowSteps, IssueState } from "./parse";
import { env } from "vscode";
import { showProgressNotification } from "./webviews/components/notifications";
import { AIQuickAsk } from "./webviews/components/quickfix";
import { updateDiagnostics, diaInfos, setDiagnostics, addDiagnostic, getDiagnostics } from "./webviews/components/updateDiagnostic";
import { askBarViewProvider } from "./webviews/pages/questionPage";
import { askAIAssistant } from "./webviews/components/quickfix";
const collection =
vscode.languages.createDiagnosticCollection("ct-diagnostic");

export let extensionState: any = {}; // This variable is set at the top level of your extension

function isOverlappingWithDiagnostics(startLine: number, endLine: number): boolean {
  for (let diagnostic of diaInfos) {
      if (startLine <= diagnostic.range.end.line && endLine >= diagnostic.range.start.line) {
          return true;
      }
  }
  return false;
}

function debounce(func: Function, wait: number) {
  let timeout: NodeJS.Timeout;

  return function executedFunction(...args: any[]) {
      const later = () => {
          clearTimeout(timeout);
          func(...args);
      };

      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
  };
};

function handleDocumentChange(event: vscode.TextDocumentChangeEvent) {
  const uri = event.document.uri;
  updateDiagnostics(event.document, collection);
}

export function deactivate() {
  collection.clear();
}

export function activate(context: vscode.ExtensionContext) {
  extensionState.ai_last_state = "";

  let openSettingsDisposable = vscode.commands.registerCommand(
    "codethreat-vscode.settings",
    () => {
      vscode.commands.executeCommand(
        "workbench.action.openSettings",
        "codethreat-vscode"
      );
    }
  );
  context.subscriptions.push(openSettingsDisposable);
  let openHelpDisposable = vscode.commands.registerCommand(
    "codethreat-vscode.help",
    () => {
      const helpUrl = "https://www.codethreat.com/company/contact";
      env.openExternal(vscode.Uri.parse(helpUrl));
    }
  );
  let openRefreshDisposable = vscode.commands.registerCommand(
    "codethreat-vscode.Refresh",
    () => {
      initExtensionSettings();
    }
  );

  context.subscriptions.push(openHelpDisposable);
  context.subscriptions.push(openRefreshDisposable);
  initExtensionSettings();

  const providerc = new barViewProvider(context.extensionUri);
  

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      barViewProvider.viewType,
      providerc
    )
  );

  const providercask = new askBarViewProvider(context.extensionUri);
  // Make it visible
  providercask.show();
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      askBarViewProvider.viewType,
      providercask
    )
  );
  vscode.commands.registerCommand("codethreat-vscode.updateDiagnostic", () => {
    if (vscode.window.activeTextEditor) {
      updateDiagnostics(vscode.window.activeTextEditor.document, collection);
    }
  });
  context.subscriptions.push(
    vscode.commands.registerCommand("codethreat-vscode.startScan", () => {
      providerc.startScan();
      vscode.commands.executeCommand("codethreat-vscode.showProgress");
    })
  );
  const showAllNotifications = vscode.commands.registerCommand(
    "codethreat-vscode.showAll",
    () => {
      //vscode.commands.executeCommand("codethreat-vscode.showProgress");
    }
  );
  
  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider("*", new AIQuickAsk(), {
      providedCodeActionKinds: AIQuickAsk.providedCodeActionKinds,
    })
  );

  context.subscriptions.push(showProgressNotification);

  const disposable = vscode.commands.registerCommand(
    "codethreat-vscode.codethreat",
    () => {}
  );
  const debouncedHandleDocumentChange = debounce(handleDocumentChange, 300); // 300ms delay

  let disposableOnDidChange = vscode.workspace.onDidChangeTextDocument(event => {
    if (event.document === vscode.window.activeTextEditor?.document) {
      debouncedHandleDocumentChange(event);
    }
  });

  const executeScriptDisposable = vscode.commands.registerCommand(
    "codethreat-vscode.barView",
    (issueId) => {
      askAIAssistant(issueId);
    }
  );
  context.subscriptions.push(disposableOnDidChange);

  context.subscriptions.push(executeScriptDisposable);

  if (vscode.window.activeTextEditor) {
    updateDiagnostics(vscode.window.activeTextEditor.document, collection);
  }
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor) {
        if (stateData.length >= 0) {
          updateDiagnostics(editor.document, collection);
        } else {
          throw new Error("Data is null.");
        }
      }
    })
  );
  context.subscriptions.push(disposable);
}
