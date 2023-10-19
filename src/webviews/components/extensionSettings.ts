import * as vscode from "vscode";
import axios from "axios";
import { ctMainBarView } from "../pages/sidebar";
import { allData, getCodeThreatConfig } from "./getConfig";
import { unescape } from "querystring";

export let stateData: any[] = [];
export let scanID: string;
let account_id: number;
let projectID: number;
let account_name: string;
let type: string;
let typei: string;
const config = getCodeThreatConfig();
export function getHeaders(getToken: string, getOrganization: string) {
  return {
    Authorization: `Bearer ${getToken}`,
    "x-ct-organization": getOrganization,
  };
}

function showTemporaryErrorMessage(message: string, duration: number) {
  const statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  statusBarItem.text = message;
  statusBarItem.backgroundColor = new vscode.ThemeColor("errorForeground");
  statusBarItem.show();

  setTimeout(() => {
    statusBarItem.hide();
    statusBarItem.dispose();
  }, duration);
}

export async function initExtensionSettings() {
  const getToken = config?.apiToken;
  if (typeof getToken !== "string") {
    throw new Error("Token not configured or not a string");
  }

  const getOrganization: string = config?.organizatonName as string;

  const getBaseUrl = config?.apiBaseUrl as string;
  if (typeof getBaseUrl !== "string") {
    throw new Error("Base URL not configured or not a string");
  }

  const projectName = config?.projectName;
  let getUrl = `${getBaseUrl}/api/project?key=${projectName}`;

  try {
    const response = await axios.get(getUrl, {
      headers: getHeaders(getToken, getOrganization),
    });
    typei = response.data.type;
    if (ctMainBarView !== undefined) {
      let dataToSend = "";

      if (
        response.status === 200 &&
        response.data.project_name === projectName
      ) {
        dataToSend = response.data.project_name;
        console.log("CT Project Syncronized");
        vscode.window.showInformationMessage("CT Repository Syncronized!");
      } else {
        vscode.window.showErrorMessage("Project name does not match.");
      }
      ctMainBarView.webview.postMessage({
        command: "ctSyncActive",
        data: response.data,
      });
    }
    if (response.status !== 200) {
      vscode.window.showErrorMessage(
        "Failed to sync, check your credentials! "
      );
    }

    const { scan_ids } = response.data;
    const { issueTrend } = response.data.analytics;
    type = response.data.integrations.gitlab.type;
    projectID = response.data.integrations.gitlab.projectID;
    account_id = response.data.integrations.gitlab.account;
    account_name = response.data.integrations.azure.account;
    const document = vscode.window.activeTextEditor?.document.uri.fsPath;
    scanID = scan_ids[scan_ids.length - 1];
    if (issueTrend && issueTrend.length > 0) {
      const lastItem = issueTrend[issueTrend.length - 1];
      scanID = lastItem.id;
    }

    const payload = {
      status: ["Open", "Accepted", "ReCheck"],
      projectName: projectName,
      directory: document,
    };
    const query = {
      projectName: projectName,
    };
    const encodeQ = btoa(unescape(encodeURIComponent(JSON.stringify(query))));

    const getUrl2 = `${getBaseUrl}/api/scanlog/issues?q=${encodeQ}&sid=${scanID}&pageSize=500`;
    const response2 = await axios.get(getUrl2, {
      headers: getHeaders(getToken, getOrganization),
    });

    if (response2.status !== 200) {
      vscode.window.showErrorMessage("Incoming data is blank or incorrect.");
    } else {
      vscode.window.showInformationMessage("CT Repository Issues Updated!");
    }
    stateData = response2.data;
  } catch (error: any) {
    console.error("Error:", error);
    vscode.window.showErrorMessage("Error:" + error.toString());
    return error;
  }

  vscode.commands.executeCommand("codethreat-vscode.updateDiagnostic");
  return "success";
}

export async function letStartScan() {
  const getToken = config?.apiToken;
  if (typeof getToken !== "string") {
    showTemporaryErrorMessage("CT Token not configured or not a string", 10);

    throw new Error("Token not configured or not a string");
  }

  const getOrganization: string | undefined = config?.organizatonName;
  const getBaseUrl = config?.apiBaseUrl;
  const projectName = config?.projectName;
  const branch = config?.branch;

  if (!getOrganization) {
    showTemporaryErrorMessage("CT Organization not configured", 10);

    throw new Error("Organization not configured");
  }
  try {
    if (typei === "github") {
      const getHub = `${getBaseUrl}/api/integration/github/start`;

      const response = await axios.post(
        getHub,
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
    } else if (config?.type === "gitlab") {
      const getLab = `${getBaseUrl}/api/plugins/gitlab`;

      const response = await axios.post(
        getLab,
        {
          project_name: projectName,
          account: account_id,
          branch,
          type: type,
          projectId: projectID,
        },
        {
          headers: getHeaders(getToken, getOrganization),
        }
      );

      if (response.status !== 200) {
        showTemporaryErrorMessage("Failed to start scan, request invalid.", 10);
      }

      //vscode.commands.executeCommand("codethreat-vscode.showProgress");
    } else if (config?.type === "azure") {
      const getAzure = `${getBaseUrl}/api/integration/azure/start`;

      const response = await axios.post(
        getAzure,
        {
          project: projectName,
          account: account_name,
          branch,
        },
        {
          headers: getHeaders(getToken, getOrganization),
        }
      );

      if (response.status !== 200) {
        showTemporaryErrorMessage("Failed to start scan, request invalid.", 10);
      }

      //vscode.commands.executeCommand("codethreat-vscode.showProgress");
    }
  } catch (error) {
    showTemporaryErrorMessage("Failed to sync, check your credentials", 10);
    console.error("Error:", error);
    return error;
  }

  await initExtensionSettings();
  vscode.commands.executeCommand("codethreat-vscode.updateDiagnostic");
}
