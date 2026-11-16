/** Status badge shown in the session header while poteto workflow is on. */

import { useEffect, useState } from "react";
import type { ReactElement } from "react";

import { POTETO_MODE_EVENT, type PotetoModeToggleInjected } from "./PotetoModeToggle.tsx";

type BadgeProps = PotetoModeToggleInjected;

export function PotetoModeBadge(props: BadgeProps): ReactElement | null {
  const { sessionId, readMode, t } = props;
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    let live = true;
    void readMode().then(
      (value) => {
        if (live) setEnabled(value);
      },
      () => undefined,
    );
    const onChange = (event: Event): void => {
      const detail = (event as CustomEvent<{ sessionId: string; enabled: boolean }>).detail;
      if (detail.sessionId === sessionId) setEnabled(detail.enabled);
    };
    window.addEventListener(POTETO_MODE_EVENT, onChange);
    return () => {
      live = false;
      window.removeEventListener(POTETO_MODE_EVENT, onChange);
    };
  }, [sessionId, readMode]);

  if (!enabled) return null;
  return (
    <span
      title={t("enabledLabel")}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        height: 22,
        padding: "0 6px 0 2px",
        borderRadius: "var(--dsw-radius-xs, 4px)",
        border: "none",
        background: "var(--dsw-alias-fill-tsp-secondary)",
        color: "var(--dsw-alias-label-tertiary)",
        font: "inherit",
        fontSize: 12,
        lineHeight: "22px",
        cursor: "default",
        whiteSpace: "nowrap",
      }}
    >
      <svg width="11" height="11" viewBox="0 0 12 12" aria-hidden="true">
        <defs>
          <linearGradient id="pstack-poteto-badge-gradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#7c6cff" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>
        </defs>
        <path
          d="M6 0l1.4 4.6L12 6 7.4 7.4 6 12 4.6 7.4 0 6l4.6-1.4z"
          fill="url(#pstack-poteto-badge-gradient)"
        />
      </svg>
      {t("label")}
    </span>
  );
}
