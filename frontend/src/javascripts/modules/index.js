/*
  Automatically instantiates modules based on data-attributes
  specifying module file-names.
*/

export const initModules = (el, force) => {
  const moduleElements = (el ? el : document).querySelectorAll("[data-module]");

  for (let i = 0; i < moduleElements.length; i++) {
    const el = moduleElements[i];
    const name = el.getAttribute("data-module");
    if (el.dataset.moduleDeferred && force !== true) {
      continue;
    }
    const Module = require(`./${name}`).default;
    new Module(el);
  }
};

export default initModules();
/*
  Usage:
  ======

  html
  ----
  <button data-module="disappear">disappear!</button>

  js
  --
  // modules/disappear.js
  export default class Disappear {
    constructor(el) {
      el.style.display = 'none'
    }
  }
*/
