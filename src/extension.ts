"use strict";
import * as vscode from "vscode";
import {
  initExtensionSettings,
  stateData,
} from "./webviews/components/extensionSettings";
import { barViewProvider } from "./webviews/pages/sidebar";
import { env } from "vscode";
import { showProgressNotification } from "./webviews/components/notifications";
import { AIQuickAsk } from "./webviews/components/quickfix";
import { updateDiagnostics } from "./webviews/components/updateDiagnostic";
import { askBarViewProvider } from "./webviews/pages/questionPage";
import { askAIAssistant } from "./webviews/components/quickfix";
import { detailBarViewProvider } from "./webviews/pages/detailPage";
import { GetDescMiti, GetDetails } from "./webviews/components/getDetail";
import { getCodeThreatConfig } from "./webviews/components/getConfig";
const collection = vscode.languages.createDiagnosticCollection("ct-diagnostic");

export let extensionState: any = {};
const config = getCodeThreatConfig();

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
}

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

  let openHelpDisposable = vscode.commands.registerCommand(
    "codethreat-vscode.help",
    () => {
      const helpUrl = "https://www.codethreat.com/company/contact";
      env.openExternal(vscode.Uri.parse(helpUrl));
    }
  );
  let openDetailDisposable = vscode.commands.registerCommand(
    "codethreat-vscode.expand",
    () => {
      const projectName = config?.projectName;
      const detailUrl = `https://dev.codethreat.com/kstore/${projectName}`;
      env.openExternal(vscode.Uri.parse(detailUrl));
    }
  );
  let openRefreshDisposable = vscode.commands.registerCommand(
    "codethreat-vscode.Refresh",
    () => {
      initExtensionSettings();
    }
  );

  context.subscriptions.push(openSettingsDisposable);
  context.subscriptions.push(openHelpDisposable);
  context.subscriptions.push(openRefreshDisposable);
  context.subscriptions.push(openDetailDisposable);

  initExtensionSettings();

  const providerc = new barViewProvider(context.extensionUri);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      barViewProvider.viewType,
      providerc
    )
  );

  const providercask = new askBarViewProvider(context.extensionUri);
  providercask.show();
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      askBarViewProvider.viewType,
      providercask
    )
  );

  const providercdetail = new detailBarViewProvider(context.extensionUri);
  providercdetail.show();
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      detailBarViewProvider.viewType,
      providercdetail
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

  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider("*", new AIQuickAsk(), {
      providedCodeActionKinds: AIQuickAsk.providedCodeActionKinds,
    })
  );
  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider("*", new GetDetails(), {
      providedCodeActionKinds: GetDetails.providedCodeActionKinds,
    })
  );

  context.subscriptions.push(showProgressNotification);

  const disposable = vscode.commands.registerCommand(
    "codethreat-vscode.codethreat",
    () => {}
  );
  const debouncedHandleDocumentChange = debounce(handleDocumentChange, 300);

  let disposableOnDidChange = vscode.workspace.onDidChangeTextDocument(
    (event) => {
      if (event.document === vscode.window.activeTextEditor?.document) {
        debouncedHandleDocumentChange(event);
      }
    }
  );

  const executeScriptDisposable = vscode.commands.registerCommand(
    "codethreat-vscode.barView",
    (issueId) => {
      askAIAssistant(issueId);
    }
  );

  const executedetailDispoble = vscode.commands.registerCommand(
    "codethreat-vscode.detailView",
    (issueId) => {
      GetDescMiti(issueId);
    }
  );
  context.subscriptions.push(disposableOnDidChange);

  context.subscriptions.push(executeScriptDisposable);
  context.subscriptions.push(executedetailDispoble);

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
