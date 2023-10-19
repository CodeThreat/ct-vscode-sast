const scanButton = document.getElementById("buttons");
const vscode = acquireVsCodeApi();

scanButton.addEventListener("click", () => {
  scanButton.disabled = true;
  scanButton.style.opacity = "0.5";
  scanButton.textContent = "Syncing...";

  vscode.postMessage({ command: "startScan" });
});

(function () {

  window.addEventListener("message", (event) => {
    const message = event.data;
    switch (message.command) {
      case "ctSyncActive":
        const responseData = message.data;
        handleCtSyncActiveResponse(responseData);
        break;
      case "scanFinished":
        scanButton.disabled = false;
        scanButton.style.opacity = "1";
        scanButton.textContent = "Syncronize";
        break;
      default:
        break;
    }
  });
  function handleCtSyncActiveResponse(data) {
    const badgeElement = document.querySelector(".badge");
    const projectNameElement = document.getElementById("projectName");

    if (data) {
      badgeElement.textContent = "Active";
      badgeElement.classList.remove("badge-danger");
      badgeElement.classList.add("badge-success");
  
      projectNameElement.textContent = data.project_name;
      

    } else {
      badgeElement.textContent = "Disabled";
      badgeElement.classList.remove("badge-success");
      badgeElement.classList.add("badge-danger");
    }
  }
})();

