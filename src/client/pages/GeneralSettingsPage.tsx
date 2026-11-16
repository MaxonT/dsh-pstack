/** General pstack settings shown in the configuration dialog. */

import { useEffect, useState, type ReactElement } from "react";

import { messageOf } from "../components/message.ts";
import { ensurePstackStyles } from "../components/styles.ts";
import { Spinner, Switch } from "../components/ui.tsx";
import type { PstackTranslations } from "../locales/index.ts";

ensurePstackStyles();

export interface PotetoSettingsApi {
  readDefault(): Promise<boolean>;
  writeDefault(enabled: boolean): Promise<string | null>;
}

export function GeneralSettingsView(props: {
  api: PotetoSettingsApi;
  translations: PstackTranslations;
}): ReactElement {
  const { api, translations } = props;
  const t = translations.poteto;
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    let live = true;
    void api.readDefault().then(
      (value) => {
        if (live) {
          setEnabled(value);
          setLoading(false);
        }
      },
      (reason: unknown) => {
        if (!live) return;
        setError(t("defaultFailed", { message: messageOf(reason) }));
        setLoading(false);
      },
    );
    return () => {
      live = false;
    };
  }, [api, t]);

  const change = (next: boolean): void => {
    setPending(true);
    setError(undefined);
    void api
      .writeDefault(next)
      .then((failure) => {
        if (failure === null) setEnabled(next);
        else setError(failure);
      })
      .finally(() => setPending(false));
  };

  if (loading) {
    return (
      <div className="pstack-loading">
        <Spinner />
      </div>
    );
  }

  return (
    <section className="pstack-setting-list" aria-label={t("defaultLabel")}>
      <div className="pstack-setting-item">
        <div className="pstack-setting-copy">
          <div className="pstack-setting-title">{t("defaultLabel")}</div>
          <p className="pstack-setting-description">{t("defaultDescription")}</p>
          {error === undefined ? null : (
            <p className="pstack-setting-description" role="alert">
              {error}
            </p>
          )}
        </div>
        <div className="pstack-setting-control">
          <Switch
            checked={enabled}
            disabled={pending}
            label={t("defaultLabel")}
            onChange={change}
          />
        </div>
      </div>
    </section>
  );
}
