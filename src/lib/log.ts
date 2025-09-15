export function stringifyError(err: unknown): string {
  try {
    if (err instanceof Error) return err.stack || err.message
    if (typeof err === 'string') return err
    return JSON.stringify(err, Object.getOwnPropertyNames(err as object))
  } catch (_e) {
    return String(err)
  }
}

export function logError(prefix: string, err: unknown): void {
  const msg = stringifyError(err)
  // keep a single console call to avoid React devtools compacting output
  console.error(prefix, msg)
}
