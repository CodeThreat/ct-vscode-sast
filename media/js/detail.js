const goPage = document.getElementById("buttons");
const vscode = acquireVsCodeApi();


(function () {
  window.addEventListener("message", (event) => {
    const message = event.data;
    switch (message.command) {
      case "ctgetDetail":
        const responseData = message.data;
        handleCtgetDetail(responseData);
        break;
        case "getTitle":
          document.querySelector("#kbfields-title").innerHTML = message.data;
        break;
        case "getLabels":
          let labelselement = document.querySelector(".labels");
          labelselement.innerHTML = '';
          message.data.forEach(label => {
            let el = document.createElement("span");
            el.className = "label badge";
            el.innerText = label;
            labelselement.append(el);
          });
          break;
          case "gopage":
            document.getElementById("readMoreLink").href = message.data;
            break;  
    }
  });
  function handleCtgetDetail(data) {
    document.querySelector("#description-content").innerHTML = data.description;
    document.querySelector("#mitigation-content").innerHTML = data.mitigation;
    
  }
})();
