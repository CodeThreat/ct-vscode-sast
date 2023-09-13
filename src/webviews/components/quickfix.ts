import * as vscode from "vscode";
import { diaInfos } from "./updateDiagnostic";
import { getProjectName } from "../../getRepoUrl";
import axios from "axios";
import { getHeaders } from "../../extensionSettings";
import { aiOutputWebview } from "../pages/questionPage";
import { extensionState } from "../../extension";


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
      issueId = diagnostic.code?.toString(); // Extracting the issue_id from the diagnostic's code
    }
    const ctFix = new vscode.CodeAction(
      "CodeThreat: Ask AI",
      vscode.CodeActionKind.QuickFix
    );
    ctFix.command = {
      title: "Execute AI Assistant",
      command: "codethreat-vscode.barView",
      // Assuming you want to pass the extracted ID as an argument
      arguments: [issueId],
    };

    ctFix.isPreferred = true;


    return [ctFix];
  }
  private extractIdFromDiagnostic(message: string): string | null {
    const match = message.match(/\[ID:(\w+)\]/);
    return match ? match[1] : null;
  }
  private isAtStartOfSmiley(
    document: vscode.TextDocument,
    range: vscode.Range
  ) {
    return (
      diaInfos.filter(
        (d: vscode.Diagnostic) =>
          JSON.stringify(d.range) === JSON.stringify(range)
      ).length > 0
    );
    //return diaInfos.filter((d: vscode.Diagnostic) =>d.range.isEqual(range)  ).length > 0;
  }
}


export async function askAIAssistant(issueId: String) {
  if (issueId === null || issueId === undefined) {
    throw new Error(
      "issueId is null or empty, please sync again or start scan"
    );
  }

  const configured = vscode.workspace.getConfiguration();
  const getToken = configured.get("codethreat-vscode.codethreatApiToken");
  if (typeof getToken !== "string") {
    throw new Error("Token not configured or not a string");
  }

  const getOrganization: string | undefined = configured.get(
    "codethreat.codethreatOrganization"
  );
  const getBaseUrl = configured.get("codethreat.codethreatApiBaseUrl");
  const projectName = getProjectName();
  let getUrl = `${getBaseUrl}/api/assistant/issue`;

  if (!getOrganization) {
    throw new Error("Organization not configured");
  }
  vscode.window.showInformationMessage("CodeThreat AI - Generating personalized solution");

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

    if (aiOutputWebview !== undefined) {
      aiOutputWebview.webview.postMessage({
        command: "aiJobResponse",
        data: response.data, // or whatever part of the response you want to send
      });

      extensionState.ai_last_state = response.data;
    }

  } catch (error) {
    console.error("Error:", error);
    return error;
  }
}
