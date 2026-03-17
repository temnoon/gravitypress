export { renderPolarGridSVG } from "./polar";
export { renderLinedPageSVG } from "./lined";
export { renderDotGridSVG } from "./dot";
export { renderCartesianGridSVG } from "./cartesian";
export { renderBlankPageSVG } from "./blank";
export { renderPromptPageSVG } from "./prompt";
export { LuluClient, buildPodPackageId, calculateSpineWidth } from "./lulu";

import type { PageConfig } from "@gravitypress/schemas";
import { renderPolarGridSVG } from "./polar";
import { renderLinedPageSVG } from "./lined";
import { renderDotGridSVG } from "./dot";
import { renderCartesianGridSVG } from "./cartesian";
import { renderBlankPageSVG } from "./blank";
import { renderPromptPageSVG } from "./prompt";

/**
 * Render any page type to SVG based on its config
 */
export function renderPageSVG(config: PageConfig): string {
  switch (config.type) {
    case "polar":
      return renderPolarGridSVG(config);
    case "lined":
      return renderLinedPageSVG(config);
    case "dot":
      return renderDotGridSVG(config);
    case "cartesian":
      return renderCartesianGridSVG(config);
    case "blank":
      return renderBlankPageSVG(config);
    case "prompt":
      return renderPromptPageSVG(config);
    default:
      throw new Error(`Unknown page type: ${(config as any).type}`);
  }
}
