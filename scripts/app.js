var dragAndDropSetup=function(){$(".control").draggable({addClasses:!1,scroll:!1,appendTo:"body",helper:"clone",cursor:"move",revert:"invalid"}),$("#upload").on("click",function(){document.querySelector("#uploadInput").click()}),$("#uploadInput").on("change",function(){var e,t=document.querySelector("t-stage"),n=this.files,o=new FileReader;n=Array.prototype.slice.call(n),e=n.find(function(e){return"state.json"===e.name}),e&&(o.addEventListener("load",function(e){t.reset(),t.recreateBuilder(e.target.result)}),o.readAsText(e))}),$("#download").on("click",function(){var e=new JSZip,t=document.querySelector("t-stage");t&&t.getDownloadFiles().then(function(t){var n;e.file(t.componentFileName,t.componentFile),e.file(t.stateFileName,t.stateFile),n=e.generate({type:"blob"}),saveAs(n,t.componentFileName.replace(".html",".zip"))})}),$("body").on("click",".control",function(e){var t=document.querySelector("t-stage"),n=e.currentTarget.getAttribute("data-category"),o=e.currentTarget.getAttribute("data-component");t.addToBuilder(o,n)}),$(".component-list").on("click","paper-item.menu-item",function(){$(".component-list").toggleClass("active")}),$(".headerText").on("keydown",function(e){13===e.which&&($(this).blur(),window.getSelection().removeAllRanges())}),$(".headerText").on("focus",function(){function e(e){var t=document.createRange();t.selectNodeContents(e);var n=window.getSelection();n.removeAllRanges(),n.addRange(t)}var t=this;$(this).removeClass("inactive"),requestAnimationFrame(function(){e(t)})}),$(".headerText").on("blur",function(){var e=document.querySelector("t-stage"),t=$(this).text().trim(),n=t.toLowerCase().replace(/\s+/,"-"),o=$(this);0===t.length?o.hasClass("form-header")?o.text("Untitled Form"):o.text("Untitled Page"):(e.updateBuilderState("heading",t),e.updateBuilderState("name",n)),this.scrollLeft=0,o.addClass("inactive")})};!function(e){"use strict";var t=e.querySelector("#app");t.baseUrl="",t.menu=null,""===window.location.port&&(t.baseUrl="/fusion"),t._getElementsInCategory=function(e){var n=t.menu.elements.filter(function(t){return t.category===e.name});return n},t._getPropertySource=function(e){return"bower_components/"+t.builderType+"/property.json"},t.toggleAccordion=function(t,n,o){var a=t.currentTarget,r=e.querySelector(".menu-item.active");a.classList.contains("active")?a.classList.remove("active"):a.classList.add("active"),r&&r.classList.remove("active")},t._onElementsReceived=function(e){t.menu=e.detail.response},t.displayInstalledToast=function(){Polymer.dom(e).querySelector("platinum-sw-cache").disabled||Polymer.dom(e).querySelector("#caching-complete").show()},t.addEventListener("dom-change",function(){console.log("Fusion app is ready to rock!")}),window.addEventListener("WebComponentsReady",function(){var e=$("t-component-panel")[0],t=$(".property-panel-Header")[0],n=$("t-stage")[0];n.componentPanel=e,n.componentPanelHeader=t})}(document);