type Level = 'debug' | 'info' | 'warn' | 'error'
type Threshold = Level | 'silent'

const LEVELS: Record<Threshold, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  silent: 4,
}

// NEXT_PUBLIC_ so the value is inlined into the client bundle too.
const resolveThreshold = (): number => {
  const logLevel = process.env.NEXT_PUBLIC_LOG_LEVEL as Threshold | undefined
  const defaultLevel: Threshold = process.env.NODE_ENV === 'production' ? 'error' : 'debug'
  return LEVELS[logLevel ?? defaultLevel] ?? LEVELS.debug
}

const threshold = resolveThreshold()

function log(level: Level, event: string, data?: Record<string, unknown>) {
  if (LEVELS[level] < threshold) return
  const entry = { level, event, time: new Date().toISOString(), ...data }
  console[level](JSON.stringify(entry))
}

export const logger = {
  debug: (event: string, data?: Record<string, unknown>) => log('debug', event, data),
  info: (event: string, data?: Record<string, unknown>) => log('info', event, data),
  warn: (event: string, data?: Record<string, unknown>) => log('warn', event, data),
  error: (event: string, data?: Record<string, unknown>) => log('error', event, data),
}
