import { getConfigValue, type ConfigKey } from "~/config";

export interface ClaudeConfig {
  apiKey: string | undefined;
  defaultMaxToken: number;
}

const apiSecretConfigKey: ConfigKey = {
  envKey: "CEREB_ANTHROPIC_API_KEY",
  configDataKey: "", //TODO(tacogips) define
};

const defaultMaxTokenNumber: ConfigKey = {
  envKey: "CEREB_ANTHROPIC_MAX_TOKEN_NUM",
  configDataKey: "", //TODO(tacogips) define
};

export function loadClaudeConfig(): ClaudeConfig {
  const apiKey = getConfigValue(apiSecretConfigKey);
  const defaultMaxToken =
    Number(getConfigValue(defaultMaxTokenNumber) || "") || 1024;

  return {
    apiKey,
    defaultMaxToken,
  };
}
