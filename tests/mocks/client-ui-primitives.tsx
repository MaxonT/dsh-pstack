/** Minimal primitives stand-in for unit tests that only exercise plugin wiring. */

import type { ReactElement } from "react";

export function Button({ children, ...props }: Record<string, unknown>): ReactElement {
  return <button {...(props as object)}>{children as never}</button>;
}

export function Switch(): null {
  return null;
}

export function Tooltip({ children }: { children: ReactElement }): ReactElement {
  return children;
}

export function IconInfoOutlineRegular(): null {
  return null;
}
