import * as vscode from "vscode";
import axios from "axios";
import { Buffer } from "buffer";
import { getCurrentBranchName, getProjectName } from "./getRepoUrl";
import { ctMainBarView } from "./webviews/pages/sidebar";

export let stateData: any[] = [];
export let scanID: string;

export function getHeaders(getToken: string, getOrganization: string) {
  return {
    Authorization: `Bearer ${getToken}`,
    "x-ct-organization": getOrganization,
  };
}

function extractUsernameFromOrganization(
  organization: string
): string | undefined {
  const parts = organization.split("@");
  return parts.length > 1 ? parts[0] : undefined;
}

function showTemporaryErrorMessage(message: string, duration: number) {
  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBarItem.text = message;
  statusBarItem.backgroundColor = new vscode.ThemeColor('errorForeground');
  statusBarItem.show();

  setTimeout(() => {
      statusBarItem.hide();
      statusBarItem.dispose();  // Clean up the status bar item to free resources
  }, duration);
}

export async function initExtensionSettings() {
  const configured = vscode.workspace.getConfiguration();
  const getToken = configured.get("codethreat-vscode.codethreatApiToken");
  if (typeof getToken !== "string") {
    throw new Error("Token not configured or not a string");
  }

  const getOrganization: string = configured.get(
    "codethreat-vscode.codethreatOrganization"
  ) as string;

  const getBaseUrl = configured.get(
    "codethreat-vscode.codethreatApiBaseUrl"
  ) as string;
  if (typeof getBaseUrl !== "string") {
    throw new Error("Base URL not configured or not a string");
  }

  const projectName = getProjectName();

  let getUrl = `${getBaseUrl}/api/project?key=${projectName}`;

  try {
    const response = await axios.get(getUrl, {
      headers: getHeaders(getToken, getOrganization),
    });
    if (ctMainBarView !== undefined) {
      let dataToSend = "";

      if (
        response.status === 200 &&
        response.data.project_name === projectName
      ) {
        dataToSend = response.data.project_name;
        console.log("CT Project Syncronized");
        vscode.window.showInformationMessage(
          "CT Repository Syncronized!"
        );
      } else {
        console.error("Project name does not match.");
      }

      ctMainBarView.webview.postMessage({
        command: "ctSyncActive",
        data: response.data,
      });
    }
    if (response.status !== 200) {
      vscode.window.showErrorMessage("Failed to sync, check your credentials ");
    }

    const { scan_ids } = response.data;
    const document = vscode.window.activeTextEditor?.document.uri.fsPath;
    scanID = scan_ids[scan_ids.length - 1];

    const payload = {
      status: ["Open", "Accepted", "ReCheck"],
      projectName: projectName,
      directory: document,
    };

    const getUrl2 = `${getBaseUrl}/api/scanlog/issues?sid=${scanID}&pageSize=50`;
    const response2 = await axios.get(getUrl2, {
      headers: getHeaders(getToken, getOrganization),
    });

    if (response2.status !== 200) {
      vscode.window.showErrorMessage("Incoming data is blank or incorrect.");
    }
    else{
      vscode.window.showInformationMessage(
        "CT Repository Issues Updated!"
      );
    }

    stateData = response2.data;
  } catch (error) {
    return error;
  }

  vscode.commands.executeCommand("codethreat-vscode.updateDiagnostic");
  return "success";
}

export async function letStartScan() {
  const configured = vscode.workspace.getConfiguration();
  const getToken = configured.get("codethreat-vscode.codethreatApiToken");
  if (typeof getToken !== "string") {
    showTemporaryErrorMessage("CT Token not configured or not a string", 10);

    throw new Error("Token not configured or not a string");
  }

  const getOrganization: string | undefined = configured.get(
    "codethreat-vscode.codethreatOrganization"
  );
  const getBaseUrl = configured.get("codethreat-vscode.codethreatApiBaseUrl");
  const projectName = getProjectName();
  const branch = getCurrentBranchName();
  let getUrl = `${getBaseUrl}/api/integration/github/start`;

  if (!getOrganization) {
    showTemporaryErrorMessage("CT Organization not configured", 10);

    throw new Error("Organization not configured");
  }

  try {
    const account = extractUsernameFromOrganization(getOrganization);

    const response = await axios.post(
      getUrl,
      {
        project: projectName,
        branch,
      },
      {
        headers: getHeaders(getToken, getOrganization),
      }
    );

    if (response.status !== 200) {
      showTemporaryErrorMessage("Failed to start scan, request invalid.", 10);
    }

    vscode.commands.executeCommand("codethreat-vscode.showProgress");
  } catch (error) {
    showTemporaryErrorMessage("Failed to sync, check your credentials", 10);
    console.error("Error:", error);
    return error;
  } 

  await initExtensionSettings();
  vscode.commands.executeCommand("codethreat-vscode.updateDiagnostic");
}
