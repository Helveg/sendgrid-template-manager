import { Design } from "./designs/design.interfaces.js";
import { TemplateVersion } from "./templates/template.interfaces.js";
import { JSDOM } from "jsdom";
import { STMError } from "./errors.js";

export function makeDom(html: Design | TemplateVersion): JSDOM {
  return new JSDOM(html.html_content);
}

export function getModuleContainer(dom: JSDOM) {
  const container = dom.window.document.querySelector(
    "[role=modules-container]",
  );

  if (!container) {
    throw new STMError(`Failed to extract modules node from content version`, {
      code: "content.parse-failed",
    });
  }
  return container;
}

export function getAllModules(container: Element) {
  return [...container.querySelectorAll(`:scope > [role=module]`)];
}

export function getTargetModule(container: Element) {
  const elem = [
    ...container.querySelectorAll(`[role=module][data-type=text]`),
  ].find(
    (elem) =>
      elem.querySelector("[role=module-content]")?.innerHTML ===
      '<div><div style="font-family: inherit; text-align: inherit"><br></div><div></div></div>',
  );
  if (!elem) {
    throw new STMError(
      "The design is missing an empty text module to inject the template into.",
      { code: "design.no-target" },
    );
  }
  return elem;
}

function getPreheaderElement(dom: JSDOM) {
  const elem = dom.window.document.querySelector(
    "[data-type=preheader] [role=module-content] > p",
  );
  if (elem === null) {
    throw new STMError("Preheader element not found", {
      code: "template.no-preheader",
    });
  }
  return elem;
}

export function getPreheader(dom: JSDOM) {
  return getPreheaderElement(dom).innerHTML;
}

export function setPreheader(dom: JSDOM, preheader: string) {
  getPreheaderElement(dom).innerHTML = preheader;
}
