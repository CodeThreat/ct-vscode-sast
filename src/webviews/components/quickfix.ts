import * as vscode from "vscode";
import { diaInfos } from "./updateDiagnostic";
import axios from "axios";
import { getHeaders } from "./extensionSettings";
import { aiOutputWebview } from "../pages/questionPage";
import { extensionState } from "../../extension";
import { getCodeThreatConfig } from "./getConfig";
const config = getCodeThreatConfig();

export class AIQuickAsk implements vscode.CodeActionProvider {
  public static readonly providedCodeActionKinds = [
    vscode.CodeActionKind.QuickFix,
  ];

  public provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range,
    context: vscode.CodeActionContext
  ): vscode.CodeAction[] | undefined {
    const { diagnostics } = context;
    let issueId = null;

    for (const diagnostic of diagnostics) {
      issueId = diagnostic.code?.toString();
    }
    const ctFix = new vscode.CodeAction(
      "CodeThreat: Ask AI",
      vscode.CodeActionKind.QuickFix
    );
    ctFix.command = {
      title: "Execute AI Assistant",
      command: "codethreat-vscode.barView",
      arguments: [issueId],
    };

    ctFix.isPreferred = true;

    return [ctFix];
  }
  private extractIdFromDiagnostic(message: string): string | null {
    const match = message.match(/\[ID:(\w+)\]/);
    return match ? match[1] : null;
  }
  private isAtStartOfAsk(document: vscode.TextDocument, range: vscode.Range) {
    return (
      diaInfos.filter(
        (d: vscode.Diagnostic) =>
          JSON.stringify(d.range) === JSON.stringify(range)
      ).length > 0
    );
  }
}

export async function askAIAssistant(issueId: String) {
  if (issueId === null || issueId === undefined) {
    throw new Error(
      "issueId is null or empty, please sync again or start scan"
    );
  }

  const getToken = config?.apiToken;
  if (typeof getToken !== "string") {
    throw new Error("Token not configured or not a string");
  }

  const getOrganization: string | undefined = config?.organizatonName;
  const getBaseUrl = config?.apiBaseUrl;
  const projectName = config?.projectName;
  let getUrl = `${getBaseUrl}/api/assistant/issue`;

  if (!getOrganization) {
    throw new Error("Organization not configured");
  }
  vscode.window.showInformationMessage(
    "CodeThreat AI - Generating personalized solution"
  );

  try {
    const response = await axios.post(
      getUrl,
      {
        project_name: projectName,
        issue_id: issueId,
      },
      {
        headers: getHeaders(getToken, getOrganization),
      }
    );

    if (response.status !== 200) {
      vscode.window.showErrorMessage("Failed to start scan, request invalid.");
    } else {
      vscode.window.showInformationMessage("CodeThreat AI Job Finished");
    }
    console.log("AI: ", response.data);
    if (aiOutputWebview !== undefined) {
      aiOutputWebview.webview.postMessage({
        command: "aiJobResponse",
        data: response.data,
      });

      extensionState.ai_last_state = response.data;
    }
  } catch (error: any) {
    console.error("Error:", error);
    vscode.window.showErrorMessage("Error:" + error.toString());
    return error;
  }
}
