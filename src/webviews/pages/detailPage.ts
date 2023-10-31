import * as vscode from "vscode";

export let ctdetailPage: vscode.WebviewView | undefined;

export class detailBarViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "codethreat-vscode.detailView";
  private _view?: vscode.WebviewView;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;
    ctdetailPage = this._view;
    webviewView.webview.options = {
      enableScripts: true,
      enableCommandUris: true,
      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(async (data) => {
      switch (data.command) {
        case "ctgetDetail":
          break;
      }
    });
  }
  public show() {
    this._view?.show(true);
  }
  public gopage() {
    if (this._view) {
      this._view.show?.(true);
      this._view.webview.postMessage({ type: "gopage" });
    }
  }

  private _getHtmlForWebview(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "js", "detail.js")
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
    const svgUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "assets", "readMore.svg")
    );
    const styleDetailUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "css", "detailPage.css")
    );
    return `
    <!DOCTYPE html>
    <html lang="en">
    
    <head>
        <link href="${bootstrapCSS}" rel="stylesheet">
        <link href="${styleMainUri}" rel="stylesheet">
        <link href="${styleDetailUri}" rel="stylesheet">

    </head>
    
    <body class="bg-dark p-4 full-height-flex">
            <div class="panel">
              <div id="kbfields-title" class="panel-content"></div>
            </div>
            
            <div class="panel">
              <h3 class="panel-header">Description</h3>
                <div id="description-content" class="panel-content">
                  To exploit the vulnerability, an attacker can use...
                </div>
                <p class="detail-group">
                  <svg class="detail-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v16.5c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9zm3.75 11.625a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                  </svg>
                  <a href="" id="readMoreLink"> 
                  Read More</a>
              </p>
            </div>
        
            <div class="panel">
              <h3 class="panel-header">Mitigation</h3>
              <div id="mitigation-content" class="panel-content">
                  What you can do to close this vulnerability...
                </div>
                <p class="detail-group">
                  <svg class="detail-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v16.5c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9zm3.75 11.625a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                  </svg>
                  <a href="" id="readMoreLink">
                      Read More</a>
                </p>
            </div>

        <div class="panel">
            <h3 class="panel-header">Labels</h3>
            <span  class="labels "></span>
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
