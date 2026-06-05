export interface FeatureFlag {
  enabled: boolean
  config?: Record<string, any>
}

const flags: Record<string, FeatureFlag> = {
  marketplace: { enabled: true },
  chat: { enabled: false, config: { provider: "sendbird" } },
  leadsPremium: { enabled: true },
  reviews: { enabled: true },
  promotions: { enabled: true },
  agentCRM: { enabled: true },
  mobileApp: { enabled: false },
  multiCity: { enabled: false },
  csvImport: { enabled: true },
}

let overrides: Record<string, FeatureFlag> = {}

try {
  const fs = require("fs")
  const path = require("path")
  const flagsPath = path.join(process.cwd(), "config", "features.json")
  if (fs.existsSync(flagsPath)) {
    overrides = JSON.parse(fs.readFileSync(flagsPath, "utf-8"))
  }
} catch {}

export function isFeatureEnabled(name: string): boolean {
  const flag = overrides[name] ?? flags[name]
  return flag?.enabled ?? false
}

export function getFeatureConfig(name: string): Record<string, any> | undefined {
  return (overrides[name] ?? flags[name])?.config
}

export function getAllFeatures(): Record<string, FeatureFlag> {
  return { ...flags, ...overrides }
}
