import axios from "axios";
import * as vscode from "vscode";
import { scanID } from "./extensionSettings";
import { getCodeThreatConfig } from "./getConfig";
let isProgressShown = false;
const config = getCodeThreatConfig();

export async function getProgress() {
  let response;
  let getUrl;
  const getToken = config?.apiToken;
  const getOrganization: string | undefined = config?.organizatonName;
  const getBaseUrl = config?.apiBaseUrl;

  try {
    getUrl = `${getBaseUrl}/api/scan/status/${scanID}`;

    response = await axios.get(getUrl, {
      headers: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        Authorization: `Bearer ${getToken}`,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        "x-ct-organization": getOrganization,
      },
    });
    return response.data.progress_data.progress;
  } catch (error: any) {
    console.error("Error:", error);
    vscode.window.showErrorMessage("Error:" + error.toString());
    return error;
  }
}

export const showProgressNotification = vscode.commands.registerCommand(
  "codethreat-vscode.showProgress",
  () => {
    if (isProgressShown) {
      vscode.window.showInformationMessage(
        "Progress already shown. Skipping..."
      );
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
          vscode.window.showErrorMessage(
            "User canceled the long running operation"
          );
          isProgressShown = false;
        });

        try {
          await showScanProgress(progress);
        } finally {
          isProgressShown = false;
        }
      }
    );
  }
);

async function showScanProgress(
  progress: vscode.Progress<{ increment: number; message?: string }>
) {
  return new Promise<void>((resolve) => {
    let id = setInterval(async () => {
      const p = await getProgress();
      if (p !== 100) {
        progress.report({
          message: "still running...",
          increment: 1,
        });
      } else {
        progress.report({
          message: "finished",
          increment: 0,
        });
        clearInterval(id);
        resolve();
      }
    }, 5000);
  });
}
