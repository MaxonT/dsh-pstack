/**
 * A discard confirmation built from the DSH `RiskConfirmation` primitive.
 *
 * Callers ask before a destructive navigation or reload. The dialog requires an
 * explicit acknowledgement before the confirm action enables, matching DSH's
 * shared risk-confirmation behavior instead of the browser `confirm` dialog.
 */

import { useCallback, useState, type ReactElement } from "react";
import { RiskConfirmation } from "@deepseek-ai/dsh-client-ui-primitives";

export interface DiscardConfirmationLabels {
  readonly title: string;
  readonly description: string;
  readonly acknowledge: string;
  readonly cancel: string;
  readonly close: string;
  readonly confirm: string;
}

export interface DiscardConfirmation {
  /** Run the action after the user confirms; shows the dialog first. */
  readonly request: (action: () => void) => void;
  readonly dialog: ReactElement | null;
}

/** Track one pending discard action and render its confirmation dialog. */
export function useDiscardConfirm(labels: DiscardConfirmationLabels): DiscardConfirmation {
  const [pending, setPending] = useState<(() => void) | undefined>(undefined);
  const [acknowledged, setAcknowledged] = useState(false);

  const request = useCallback((action: () => void) => {
    setAcknowledged(false);
    setPending(() => action);
  }, []);

  const cancel = useCallback(() => {
    setPending(undefined);
    setAcknowledged(false);
  }, []);

  const confirm = useCallback(() => {
    const action = pending;
    setPending(undefined);
    setAcknowledged(false);
    action?.();
  }, [pending]);

  const dialog =
    pending === undefined ? null : (
      <RiskConfirmation
        open
        title={labels.title}
        description={labels.description}
        acknowledgeLabel={labels.acknowledge}
        cancelLabel={labels.cancel}
        closeLabel={labels.close}
        confirmLabel={labels.confirm}
        acknowledged={acknowledged}
        onAcknowledgedChange={setAcknowledged}
        onCancel={cancel}
        onConfirm={confirm}
      />
    );

  return { request, dialog };
}
