import * as vscode from "vscode";
import axios from "axios";
import { getHeaders, scanID } from "./extensionSettings";
import { ctdetailPage } from "../pages/detailPage";
import { getCodeThreatConfig } from "./getConfig";

export class GetDetails implements vscode.CodeActionProvider {
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

    const ctDetail = new vscode.CodeAction(
      "CodeThreat: See the issue Details",
      vscode.CodeActionKind.QuickFix
    );
    ctDetail.command = {
      title: "See Description",
      command: "codethreat-vscode.detailView",
      arguments: [issueId],
    };

    ctDetail.isPreferred = true;

    return [ctDetail];
  }
}

export async function GetDescMiti(issueId: String) {
  if (issueId === null || issueId === undefined) {
    throw new Error(
      "issueId is null or empty, please sync again or start scan"
    );
  }

  const config = getCodeThreatConfig();
  const getToken = config?.apiToken;
  if (typeof getToken !== "string") {
    throw new Error("Token not configured or not a string");
  }

  const getOrganization: string | undefined = config?.organizatonName;
  const getBaseUrl = config?.apiBaseUrl;
  const projectName = config?.projectName;
  const document = vscode.window.activeTextEditor?.document.uri.fsPath;

  if (!getOrganization) {
    throw new Error("Organization not configured");
  }
  try {
    const payload = {
      status: ["Open", "Accepted", "ReCheck"],
      projectName: projectName,
      directory: document,
      sid: scanID,
    };
    const query = {
      projectName: projectName,
    };
    const encodeQ = btoa(unescape(encodeURIComponent(JSON.stringify(query))));

    const fileExtension = vscode.window.activeTextEditor?.document.fileName
      .split(".")
      .pop();
    const getUrl = `${getBaseUrl}/api/scanlog/issues?sid=${scanID}&${encodeQ}&pageSize=500`;

    const response = await axios.get(getUrl, {
      headers: getHeaders(getToken, getOrganization),
    });
    if (response.status !== 200) {
      vscode.window.showErrorMessage("Incoming data is blank or incorrect.");
    } else {
      vscode.window.showInformationMessage("CT Repository Issues Updated!");
    }

    let issue = response.data.find(
      (iss: { issue_state: any; issue_id: String }) =>
        iss.issue_state.issue_id === issueId
    );
    let lang = "default";
    switch (fileExtension) {
      case "js":
        lang = "javascript";
        break;
      case "cpp":
        lang = "cpp";
        break;
      case "cs":
        lang = "csharp";
        break;
      case "ts":
        lang = "typescript";
        break;
      case "py":
        lang = "python";
        break;
      case "java":
        lang = "java";
        break;
      case "cfm" || "cfc":
        lang = "coldfusion";
        break;
      case "kt":
        lang = "android";
        break;

      default:
        break;
    }
    const uniqueLabels = Array.from(new Set(issue.kb_fields.labels));

    ctdetailPage?.webview.postMessage({
      command: "ctgetDetail",
      data:
        lang === "default"
          ? "unknown File Extension"
          : issue.kb_fields.platformnotes.en[lang],
    });
    ctdetailPage?.webview.postMessage({
      command: "getTitle",
      data: issue.kb_fields.title.en,
    });
    ctdetailPage?.webview.postMessage({
      command: "getLabels",
      data: issue.kb_fields.labels,
    });
    uniqueLabels.length = 0;
    ctdetailPage?.webview.postMessage({
      command: "gopage",
      data: `https://dev.codethreat.com/kstore/${getOrganization}/knowledge-base/${lang}/${issue.issue_state.weakness_id}`,
    });
  } catch (error: any) {
    console.error("Error:", error);
    vscode.window.showErrorMessage("Error: "+ error.toString());
    return error;
  }
}
