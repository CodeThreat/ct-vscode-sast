import { Style } from "util";
import * as vscode from "vscode";
import { getProjectName } from "../../getRepoUrl";
import { initExtensionSettings, letStartScan } from "../../extensionSettings";
export let ctMainBarView: vscode.WebviewView | undefined;

export class barViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "codethreat-vscode.barView";

  private _view?: vscode.WebviewView;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;
    ctMainBarView = this._view;
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    this._view.webview.onDidReceiveMessage(async (data) => {
      switch (data.command) {
        case "ctSyncActive":
          this._view?.webview.postMessage({
            command: "ctSyncActive",
            status: data  // status can be either "Active" or "Disabled"
          });
          break;
        case "startScan":
          let message = await letStartScan();
          this._view?.webview.postMessage({
            command: "scanFinished",
            data: message,
          });
          break;
        case "getConfig":
          const configured = vscode.workspace.getConfiguration();
          const config = {
            codethreatApiToken: configured.get("codethreat-vscode.codethreatApiToken"),
            codethreatOrganization: configured.get(
              "codethreat-vscode.codethreatOrganization"
            ),
            codethreatApiBaseUrl: configured.get(
              "codethreat-vscode.codethreatApiBaseUrl"
            ),
            projectName: getProjectName(),
          };
          this._view?.webview.postMessage({
            command: "configData",
            data: config,
          });
          break;
      }
    });
    
  }

  public startScan() {
    if (this._view) {
      this._view.show?.(true);
      this._view.webview.postMessage({ type: "startScan" });
    }
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "js", "main.js")
    );
    const bootstrapJs = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "js", "bootstrap.min.js")
    );
    const bootstrapCSS = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this._extensionUri,
        "media",
        "css",
        "bootstrap.min.css"
      )
    );
    const logoUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "assets", "CT-logo.png")
    );

    const JQueryJS = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this._extensionUri,
        "media",
        "js",
        "jquery-3.7.1.min.js"
      )
    );
    const styleResetUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "css", "reset.css")
    );
    const styleVSCodeUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "css", "vscode.css")
    );
    const styleMainUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "css", "main.css")
    );

    const nonce = getNonce();

    return `<!DOCTYPE html>
    <html lang="en">
    
    <head>
        <meta charset="UTF-8">
        <meta http-equiv="Content-Security-Policy" content="...">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="${bootstrapCSS}" rel="stylesheet">
        <link href="${styleMainUri}" rel="stylesheet">

        <title>CodeThreat</title>
            <style>
            
        </style>
    </head>
    <div class="content-grow"> <!-- This div wraps all content except the footer, making it push the footer down -->

    <body class="bg-dark p-4 full-height-flex">
      <div class="content-grow"> <!-- This div wraps all content except the footer, making it push the footer down -->
      <img src="${logoUri}" alt="CodeThreat Logo" class="mx-auto d-block mb-4" style="max-width: 40px;">

       <h4 class="text-center mb-4">CodeThreat VSCode Plugin</h4>
    
          <div class="mb-3">
            <h5>Code Monitoring <span class="badge badge-danger">Disabled</span></h5>
            <p><strong>Project:</strong> <span id="projectName">Not synced yet</span></p>
          </div>
    
          <div class="alert alert-success" role="alert">
              <small>Starting the sync initiates a SAST scan from your last commit, offering a snapshot of your most recent repository security status. Right-click any diagnostic output to seek guidance from our AI.</small>
          </div>

          <div class="container-fluid">
        <div class="row">
            <div class="col-12 d-flex justify-content-center mb-3">
            <button id="scan-button" class="btn btn-primary btn-sm" style="padding: 5px 10px; font-size: 0.8rem;">Syncronize</button>
            </div>
        </div>
    </div>
        </div>
    
        <!-- Footer -->
<div class="footer text-center">
    <small>&copy; ${new Date().getFullYear()} CodeThreat Inc. All rights reserved.</small><br>
    <small><a href="https://github.com/CodeThreat/ct-vscode" class="text-info">Troubleshoot or get help on GitHub repo</a></small>
</div>
    
        <script>
        const vscode = acquireVsCodeApi();

        document.getElementById("scan-button").addEventListener("click", () => {
          vscode.postMessage({ command: "startScan" });
        });
        document.getElementById("settings").addEventListener("click", () => {
          vscode.postMessage({ command: "settings" });
        });
        window.addEventListener("message", (event) => {
          console.log("Received message:", event.data); // Debug log
          const message = event.data;
          switch (message.command) {
            case "ctSyncActive":
              const responseData = message.data;
              handleCtSyncActiveResponse(responseData);
              break;
            case "scanFinished":
              // Handle scanFinished if needed
              break;
            default:
              break;
            // ... handle other commands
          }
        });
        function handleCtSyncActiveResponse(data) {
          const badgeElement = document.querySelector(".badge");
          const projectNameElement = document.getElementById("projectName");
        
          if (data && data.projectName) {
            badgeElement.textContent = "Active"; // This sets the badge to "Active"
            badgeElement.classList.remove("badge-danger");
            badgeElement.classList.add("badge-success");
        
            projectNameElement.textContent = data.projectName; // This sets the project name
          } else {
            badgeElement.textContent = "Disabled"; // This sets the badge to "Disabled"
            badgeElement.classList.remove("badge-success");
            badgeElement.classList.add("badge-danger");
          }
        }
        </script>
        <script type="module" defer nonce="${getNonce()}" src="${bootstrapJs}"></script>
        <script type="module" defer nonce="${getNonce()}" src="${JQueryJS}"></script>
        <script type="module" defer nonce="${getNonce()}" src="${scriptUri}"></script>

        </body>
    
    </html>`;
  }
}

function getNonce() {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
