import type { StorageSchema } from '../shared/types/storage'
import { logger } from '../shared/utils/logger'

type Migration = (data: Record<string, unknown>) => Record<string, unknown>

/** Keyed by the version they PRODUCE (e.g., key 2 upgrades v1 → v2) */
const migrations: Record<number, Migration> = {
  // Placeholder: v1 is the initial schema — no migration needed
  // 2: (data) => ({ ...data, newField: 'default' }),
}

export function runMigrations(
  data: Record<string, unknown>,
  fromVersion: number,
  toVersion: number,
): Record<string, unknown> {
  let result = data
  for (let v = fromVersion + 1; v <= toVersion; v++) {
    const migrate = migrations[v]
    if (migrate) {
      logger.info(`Running storage migration to v${v}`)
      result = migrate(result)
    }
  }
  return result
}

export type { StorageSchema }
