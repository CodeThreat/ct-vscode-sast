// Inside the script tag in your HTML
const scanButton = document.getElementById("scan-button");

scanButton.addEventListener("click", () => {
  // Disable the button and change its style on click
  scanButton.disabled = true;
  scanButton.style.opacity = "0.5";  // Makes the button look disabled
  scanButton.textContent = "Syncing...";  // Change the text to indicate it's syncing

  vscode.postMessage({ command: "startScan" });
});

(function () {

  window.addEventListener("message", (event) => {
    const message = event.data;
    switch (message.command) {
      case "ctSyncActive":
        const responseData = message.data;
        console.log("ct sync active notification" + responseData);
        handleCtSyncActiveResponse(responseData);
        break;
      case "scanFinished":
        // Re-enable the button and reset its style once scan is finished
        scanButton.disabled = false;
        scanButton.style.opacity = "1";  // Reset the button's opacity
        scanButton.textContent = "Syncronize";  // Reset the button's text
        break;
      default:
        break;
      // ... handle other commands
    }
  });
  function handleCtSyncActiveResponse(data) {
    const badgeElement = document.querySelector(".badge");
    const projectNameElement = document.getElementById("projectName");
    const scanStatusElement = document.getElementById("scanStatus");

    if (data) {
      badgeElement.textContent = "Active"; // This sets the badge to "Active"
      badgeElement.classList.remove("badge-danger");
      badgeElement.classList.add("badge-success");
  
      projectNameElement.textContent = data.project_name; // This sets the project name
      

    } else {
      badgeElement.textContent = "Disabled"; // This sets the badge to "Disabled"
      badgeElement.classList.remove("badge-success");
      badgeElement.classList.add("badge-danger");
    }
  }
})();

