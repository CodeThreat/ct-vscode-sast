import * as vscode from "vscode";
import { extensionState } from "../../extension";
import { getCodeThreatConfig } from "../components/getConfig";

export let aiOutputWebview: vscode.WebviewView | undefined;
const config = getCodeThreatConfig();

export class askBarViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "codethreat-vscode.askView";
  private _view?: vscode.WebviewView;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;
    aiOutputWebview = this._view;
    webviewView.webview.options = {
      enableScripts: true,
      enableCommandUris: true,
      localResourceRoots: [this._extensionUri],
    };

    if (extensionState) {
      webviewView.webview.postMessage({
        command: "aiJobResponse",
        data: extensionState,
      });
    }
    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
    
    webviewView.webview.onDidReceiveMessage(async (data) => {
      switch (data.command) {
        case "getConfigQ":
          const configm = {
            codethreatApiToken: config?.apiToken,
            codethreatOrganization: config?.organizatonName,
            codethreatApiBaseUrl: config?.apiBaseUrl,
            projectName: config?.projectName,
          };
          webviewView.webview.postMessage({
            command: "configData",
            data: configm,
          });
          break;
      }
    });
  }
  public show() {
    this._view?.show(true);
}

  private _getHtmlForWebview(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "js", "ask.js")
    );
    const bootstrapJs = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "js", "bootstrap.min.js")
    );
    const markdownRenderer = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "js", "showdown.min.js")
    );
    const JQueryJS = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this._extensionUri,
        "media",
        "js",
        "jquery-3.7.1.min.js"
      )
    );
    const bootstrapCSS = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this._extensionUri,
        "media",
        "css",
        "bootstrap.min.css"
      )
    );
    const styleMainUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "css", "main.css")
    );
    const styleQuestionUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "css", "questionPage.css")
    );

    return `
    <!DOCTYPE html>
    <html lang="en">
    
    <head>
        <meta charset="UTF-8">
        <link href="${bootstrapCSS}" rel="stylesheet">
        <link href="${styleQuestionUri}" rel="stylesheet">
        <link href="${styleMainUri}" rel="stylesheet">
        
    </head>
    
    <body class="bg-dark p-4 full-height-flex">
            <div class="alert alert-success" role="alert">
            <small>
                Your security and data privacy are paramount to us. We assure you that we don't send any confidential data to any third-party AI models. CodeThreat uses Azure OpenAI in a private infrastructure, ensuring dedicated and isolated processing for each organization on the CodeThreat SAST platform.
                As result, we only produce dedicated ai model and data endpoint for your own organization only.
            </small>
        </div>
            <div class="panel">
            <h3 class="panel-header">Example Exploit Request or Methods</h3>
            <div class="panel-content">
                To exploit the vulnerability, an attacker can use...
            </div>
        </div>
        
        <div class="panel">
            <h3 class="panel-header">Human Readable Flow Graph and Explanation</h3>
            <div class="panel-content">
                The vulnerability is caused by concatenating user...
            </div>
        </div>
        
        <div class="panel">
            <h3 class="panel-header">Optimal Fix Remediation</h3>
            <div class="panel-content">
                To fix the connection string injection vulnerability...
            </div>
        </div>
        </div>

        <!-- Footer -->
        <div class="footer text-center">
            <small>&copy; ${new Date().getFullYear()} CodeThreat Inc. All rights reserved.</small><br>
            <small><a href="https://github.com/CodeThreat/ct-vscode" class="text-info">Troubleshoot or get help on GitHub repo</a></small>
        </div>

        <script type="module" defer nonce="${getNonce()}" src="${bootstrapJs}"></script>
        <script type="module" defer nonce="${getNonce()}" src="${JQueryJS}"></script>
        <script defer src="${markdownRenderer}"></script>
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
