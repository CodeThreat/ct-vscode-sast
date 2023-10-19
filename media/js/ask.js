function renderMarkdown(markdownContent, targetElement) {
  const converter = new showdown.Converter();
  targetElement.innerHTML = converter.makeHtml(markdownContent);
}

function showTab(tabId) {
  const tabs = document.querySelectorAll(".tab-content");
  tabs.forEach((tab) => tab.classList.remove("active"));

  const tabButtons = document.querySelectorAll(".tab-button");
  tabButtons.forEach((button) => button.classList.remove("active"));

  document.getElementById(tabId).classList.add("active");
  document
    .querySelector(`.tab-button[onclick="showTab('${tabId}')"]`)
    .classList.add("active");
}

window.addEventListener("message", (event) => {
  const message = event.data; 

  switch (message.command) {
    case "aiJobResponse":
      const panels = document.querySelectorAll(".panel-content");
      message = JSON.parse(message.data);
      renderMarkdown(message.example_exploit_request_or_methods, panels[0]);
      renderMarkdown(message.human_readable_flow_graph_and_explaination, panels[1]);
      renderMarkdown(message.optimal_fix_remediation, panels[2]);
      break;
  }
});
