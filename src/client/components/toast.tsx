/** Temporary, top-level feedback shared by Client surfaces. */

import { ensurePstackStyles } from "./styles.ts";

export interface ToastMessage {
  readonly tone: "success" | "warn" | "error" | "neutral";
  readonly text: string;
}

let activeToast: HTMLElement | undefined;

function toastIcon(tone: ToastMessage["tone"]): SVGSVGElement | undefined {
  if (tone === "neutral") return undefined;
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "12");
  svg.setAttribute("height", "12");
  svg.setAttribute("viewBox", "0 0 16 16");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "1.5");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("aria-hidden", "true");
  const paths =
    tone === "success"
      ? ["M2.8 8.4l3.4 3.4 7-7.4"]
      : tone === "error"
        ? ["M8 2.2L14 13H2z", "M8 6.2v3M8 11.4v.2"]
        : ["M8 8a6 6 0 1 0 0-12 6 6 0 0 0 0 12z", "M8 7.2v4M8 4.9v.2"];
  for (const d of paths) {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", d);
    svg.append(path);
  }
  return svg;
}

/** Show one short feedback toast outside a React tree. */
export function showToast(message: ToastMessage, duration = 2600): void {
  if (typeof document === "undefined") return;
  ensurePstackStyles();
  activeToast?.remove();
  const node = document.createElement("div");
  node.className = "pstack-toast";
  node.dataset.tone = message.tone;
  node.setAttribute(
    "role",
    message.tone === "error" || message.tone === "warn" ? "alert" : "status",
  );
  const icon = toastIcon(message.tone);
  if (icon !== undefined) node.append(icon);
  node.append(document.createTextNode(message.text));
  document.body.append(node);
  activeToast = node;
  setTimeout(() => {
    if (activeToast === node) activeToast = undefined;
    node.remove();
  }, duration);
}
