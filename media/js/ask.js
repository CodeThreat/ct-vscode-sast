function renderMarkdown(markdownContent, targetElement) {
  const converter = new showdown.Converter();
  targetElement.innerHTML = converter.makeHtml(markdownContent);
}

function showTab(tabId) {
  // Hide all tabs
  const tabs = document.querySelectorAll(".tab-content");
  tabs.forEach((tab) => tab.classList.remove("active"));

  // Deactivate all tab buttons
  const tabButtons = document.querySelectorAll(".tab-button");
  tabButtons.forEach((button) => button.classList.remove("active"));

  // Show the selected tab and activate the button
  document.getElementById(tabId).classList.add("active");
  document
    .querySelector(`.tab-button[onclick="showTab('${tabId}')"]`)
    .classList.add("active");
}

window.addEventListener("message", (event) => {
  const message = event.data; // The JSON data our extension sent

  switch (message.command) {
    case "aiJobResponse":
      console.log(message)
      const panels = document.querySelectorAll(".panel-content");
      renderMarkdown(message.data.example_exploit_request_or_methods, panels[0]);
      renderMarkdown(message.data.human_readable_flow_graph_and_explaination, panels[1]);
      renderMarkdown(message.data.optimal_fix_remediation, panels[2]);
      break;
    // ... handle other commands
  }
});
