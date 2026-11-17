/** General pstack settings shown in the configuration dialog. */

import { useEffect, useState, type ReactElement } from "react";

import { messageOf } from "../lib/message.ts";
import { ensurePstackStyles } from "../lib/styles.ts";
import { Spinner, Switch } from "../components/ui.tsx";
import type { PstackTranslations } from "../locales/index.ts";

ensurePstackStyles();

export interface PotetoSettingsApi {
  readDefault(): Promise<boolean>;
  writeDefault(enabled: boolean): Promise<string | null>;
  readAgentTeamDefault(): Promise<boolean>;
  writeAgentTeamDefault(enabled: boolean): Promise<string | null>;
}

type SettingKey = "poteto" | "agentTeam";

export function GeneralSettingsView(props: {
  api: PotetoSettingsApi;
  translations: PstackTranslations;
}): ReactElement {
  const { api, translations } = props;
  const t = translations.poteto;
  const [enabled, setEnabled] = useState(false);
  const [agentTeamEnabled, setAgentTeamEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<SettingKey | null>(null);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    let live = true;
    void Promise.all([api.readDefault(), api.readAgentTeamDefault()]).then(
      ([poteto, agentTeam]) => {
        if (live) {
          setEnabled(poteto);
          setAgentTeamEnabled(agentTeam);
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

  const change = (key: SettingKey, next: boolean): void => {
    setPending(key);
    setError(undefined);
    const request = key === "poteto" ? api.writeDefault(next) : api.writeAgentTeamDefault(next);
    void request
      .then((failure) => {
        if (failure === null) {
          if (key === "poteto") setEnabled(next);
          else setAgentTeamEnabled(next);
        } else setError(failure);
      })
      .finally(() => setPending(null));
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
            disabled={pending !== null}
            label={t("defaultLabel")}
            onChange={(next) => change("poteto", next)}
          />
        </div>
      </div>
      <div className="pstack-setting-item">
        <div className="pstack-setting-copy">
          <div className="pstack-setting-title">{t("agentTeamLabel")}</div>
          <p className="pstack-setting-description">{t("agentTeamDescription")}</p>
        </div>
        <div className="pstack-setting-control">
          <Switch
            checked={agentTeamEnabled}
            disabled={pending !== null}
            label={t("agentTeamLabel")}
            onChange={(next) => change("agentTeam", next)}
          />
        </div>
      </div>
    </section>
  );
}
