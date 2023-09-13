import { Style } from "util";
import * as vscode from "vscode";
import { getProjectName } from "../../getRepoUrl";
import { initExtensionSettings, letStartScan } from "../../extensionSettings";
import { extensionState } from "../../extension";

export let aiOutputWebview: vscode.WebviewView | undefined;

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
      // Restore the saved state
      webviewView.webview.postMessage({
        command: "aiJobResponse",
        data: extensionState,
      });
    }
    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
    
    webviewView.webview.onDidReceiveMessage(async (data) => {
      switch (data.command) {
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
          webviewView.webview.postMessage({
            command: "configData",
            data: config,
          });
          break;
      }
    });
  }
  public show() {
    this._view?.show(true);
}

  public startScan() {
    this._view?.show?.(true);
    this._view?.webview.postMessage({ type: "startScan" });
  }

  public clearColors() {
    this._view?.webview.postMessage({ type: "clearColors" });
  }

  private _getHtmlForWebview(webview: vscode.Webview): string {
    // ... (Same HTML content but beautified)

    // I've kept this intact. I would strongly recommend using a dedicated HTML file for this.
    // The method would simply read the HTML file and return its contents. This improves readability and separation of concerns.
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
    // const styleResetUri = webview.asWebviewUri(
    //   vscode.Uri.joinPath(this._extensionUri, "media", "reset.css")
    // );
    // const styleVSCodeUri = webview.asWebviewUri(
    //   vscode.Uri.joinPath(this._extensionUri, "media", "vscode.css")
    // );
    const styleMainUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "css", "main.css")
    );
    // const fontUri = webview.asWebviewUri(
    //   vscode.Uri.joinPath(this._extensionUri, "media", "Montserrat-Regular.ttf")
    // );

    return `
    <!DOCTYPE html>
    <html lang="en">
    
    <head>
        <!-- ... (other head elements) -->
        <link href="${bootstrapCSS}" rel="stylesheet">
        <link href="${styleMainUri}" rel="stylesheet">

        <style>
        .panel {
          padding: 10px;
          margin-bottom: 20px;
          border-radius: 5px;
          background-color: #2b2b2b; /* Slight darker background for distinction */
          box-shadow: 0px 2px 5px rgba(0,0,0,0.1);
          color: #ffdd57;  /* Color for headers */

        }
      
      .panel-header {
          font-size: 12px; /* Decreased font size for headers */
          margin-bottom: 10px; 
      }
      
      .panel-content {
          font-size: 11px; /* Regular font size for content */
      }
      .panel-content h1, .panel-content h2, .panel-content h3 {
        color: #ffdd57;  /* Color for headers */
    }
    
    .panel-content a {
        color: #1e90ff;  /* Color for links */
        text-decoration: underline;
    }
    
    .panel-content ul {
        list-style-type: disc;
        list-style-position: inside;
    }
    
    .panel-content li {
        color: #eaeaea;  /* Base text color for list items */
    }
    
    .panel-content code {
        background-color: #333333; /* Background for inline code */
        padding: 2px 4px;
        border-radius: 4px;
        color: #f1c40f;  /* Color for inline code */
    }
    
    .panel-content pre {
        background-color: #333333; /* Background for code blocks */
        padding: 10px;
        border-radius: 4px;
        overflow-x: auto;  /* For code that exceeds the container width */
    }
    
    .panel-content blockquote {
        border-left: 3px solid #ffdd57;
        padding-left: 10px;
        color: #ddd;  /* Color for blockquote text */
    }
        </style>
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
