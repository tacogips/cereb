let configData: any = undefined;

export function setConfigData(data: any) {
  configData = data;
}

export interface ConfigKey {
  envKey: string;
  configDataKey: string; // key for config data in config file
}

export function defaultAiModel(): string | undefined {
  return getValueFromEnv("CEREB_DEFAULT_MODEL");
}

function getValueFromEnv(key: string): any | undefined {
  if (typeof process !== "undefined" && process.env && process.env[key]) {
    return process.env[key];
  }
  return undefined;
}

function getValueFromConfig(key: string): any | undefined {
  if (
    typeof configData !== "undefined" &&
    typeof configData === "object" &&
    configData[key]
  ) {
    return configData[key];
  }

  return undefined;
}

export function getConfigValue(key: ConfigKey): string | undefined {
  return getValueFromEnv(key.envKey) ?? getValueFromConfig(key.configDataKey);
}
