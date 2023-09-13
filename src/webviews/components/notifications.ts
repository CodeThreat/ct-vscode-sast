import axios from "axios";
import * as vscode from "vscode";
import { initExtensionSettings, scanID, stateData } from "../../extensionSettings";
import { IssueState } from "../../parse";
let isProgressShown = false;


export async function getProgress() {
    let response;
    let getUrl;
    const configured = vscode.workspace.getConfiguration();
    const getToken = configured.get("codethreat-vscode.codethreatApiToken");
    const getOrganization: string | undefined = configured.get(
      "codethreat-vscode.codethreatOrganization"
    );
    const getBaseUrl = configured.get("codethreat-vscode.codethreatApiBaseUrl");

    try {
      getUrl = `${getBaseUrl}/api/scan/status/${scanID}`;
      let account: string | undefined;

  
      response = await axios.get(getUrl, {
        headers: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          Authorization: `Bearer ${getToken}`,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          "x-ct-organization": getOrganization,
        },
      });
       return response.data.progress_data.progress;
    } catch (error) {
      console.error("Error:", error);
      return error;
    }
  }
  

  export const showProgressNotification = vscode.commands.registerCommand(
    "codethreat-vscode.showProgress",
    () => {
      if (isProgressShown) {
        console.log("Progress already shown. Skipping...");
        return;
      }
      isProgressShown = true;
  
      vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "Scan Progress...",
          cancellable: true,
        },
        async (progress, token) => {
          token.onCancellationRequested(() => {
            console.log("User canceled the long running operation");
            isProgressShown = false;  // reset the flag when cancelled
          });
  
          try {
            await showScanProgress(progress);
          } finally {
            isProgressShown = false;  // reset the flag when done
          }
        }
      );
    }
  );
  
  async function showScanProgress(progress: vscode.Progress<{ increment: number, message?: string }>) {
    return new Promise<void>((resolve) => {
      let id = setInterval(async () => {
        const p = await getProgress();
        console.log(p);
        if (p !== 100) {
          progress.report({
            message: "still running...",
            increment: 1
          });
        } else {
          progress.report({
            message: "finished",
            increment: 0
          });
          clearInterval(id);
          resolve();
        }
      }, 5000);
    });
  }