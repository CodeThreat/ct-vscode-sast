import * as fs from "fs";
import * as vscode from "vscode";
import * as path from "path";
import { CodeThreatConfig } from "./parse";

export function getCodeThreatConfig(): CodeThreatConfig | null {
  try {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      throw new Error("Workspace folder not found!");
    }

    const workspaceFolderPath = workspaceFolders[0].uri.fsPath;
    const codethreatConfigPath = path.join(
      workspaceFolderPath,
      "codethreat.json"
    );

    if (fs.existsSync(codethreatConfigPath)) {
      const codethreatConfig = JSON.parse(
        fs.readFileSync(codethreatConfigPath, "utf-8")
      );
      return codethreatConfig as CodeThreatConfig;
    } else {
      throw new Error("codethreat.json not found!");
    }
  } catch (error: any) {
    vscode.window.showErrorMessage(error.message);
    return null;
  }
}

export function allData() {
  const config = getCodeThreatConfig();
  const getToken = config?.apiToken;
  if (typeof getToken !== "string") {
    showTemporaryErrorMessage("CT Token not configured or not a string", 10);
    throw new Error("Token not configured or not a string");
  }

  const getOrganization: string | undefined = config?.organizatonName;
  const getBaseUrl = config?.apiBaseUrl;
}

function showTemporaryErrorMessage(arg0: string, arg1: number) {
  throw new Error("Function not implemented.");
}
