/** Temporary, top-level feedback shared by Client surfaces. */

import { createElement } from "react";
import { flushSync } from "react-dom";
import { createRoot, type Root } from "react-dom/client";
import {
  IconInfoOutlineRegular,
  IconWarningTriangleOutlineRegular,
  Toast,
} from "@deepseek-ai/dsh-client-ui-primitives";

export interface ToastMessage {
  readonly tone: "success" | "warn" | "error" | "neutral";
  readonly text: string;
}

let host: HTMLElement | undefined;
let root: Root | undefined;
let sequence = 0;

/** Show one short feedback toast through the official DSH Toast component. */
export function showToast(message: ToastMessage, duration = 2600): void {
  if (typeof document === "undefined") return;
  if (host === undefined) {
    host = document.createElement("div");
    document.body.append(host);
  }
  if (root === undefined) root = createRoot(host);
  const current = root;
  const token = ++sequence;
  const icon =
    message.tone === "error"
      ? createElement(IconWarningTriangleOutlineRegular, { size: 14 })
      : message.tone === "warn"
        ? createElement(IconInfoOutlineRegular, { size: 14 })
        : undefined;
  flushSync(() =>
    current.render(
      createElement(Toast, {
        key: token,
        text: message.text,
        tone: message.tone === "success" ? "success" : undefined,
        icon,
        holdMs: Math.max(0, duration - 1000),
        onDone: () => {
          if (token !== sequence) return;
          current.unmount();
          if (root === current) root = undefined;
          host?.remove();
          host = undefined;
        },
      }),
    ),
  );
}
