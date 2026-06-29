/**
 * Minimal logger that is API-compatible with `@libp2p/logger` but does not
 * import `weald` or `supports-color`, both of which read numerous
 * `process.env.*` variables at import time and trigger Deno's `--allow-env`
 * permission check.
 *
 * Enabled namespaces are read from the `DEBUG` environment variable using
 * `Deno.env.get` when available, falling back to `process.env.DEBUG` in Node,
 * wrapped in a try/catch so a missing env permission does not crash.
 */

type LogFn = (...args: any[]) => void

interface Logger extends LogFn {
  trace: LogFn
  debug: LogFn
  info: LogFn
  warn: LogFn
  error: LogFn
  enabled: boolean
}

/** Read the DEBUG env var safely (works in Deno, Node, browsers). */
function readDebugEnv(): string | undefined {
  try {
    // Deno
    if (typeof Deno !== 'undefined' && typeof Deno.env?.get === 'function') {
      return Deno.env.get('DEBUG') ?? undefined
    }
  } catch { /* permission denied — ignore */ }
  try {
    // Node
    if (typeof globalThis.process !== 'undefined' && typeof globalThis.process.env === 'object') {
      return globalThis.process.env.DEBUG ?? undefined
    }
  } catch { /* permission denied — ignore */ }
  return undefined
}

const DEBUG_NAMESPACES = readDebugEnv()

/** Glob-style match (supports `*` wildcards) against a namespace. */
function matchesPattern(namespace: string, pattern: string): boolean {
  if (pattern === '*') return true
  const re = '^' + pattern
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*') + '$'
  return new RegExp(re).test(namespace)
}

/** Is the given namespace enabled by the DEBUG env var? */
function isNamespaceEnabled(namespace: string): boolean {
  if (DEBUG_NAMESPACES == null || DEBUG_NAMESPACES === '') return false
  for (const part of DEBUG_NAMESPACES.split(/[,\s]+/)) {
    const neg = part.startsWith('-')
    const pat = neg ? part.slice(1) : part
    if (pat === '' || pat === '*') return !neg
    if (matchesPattern(namespace, pat)) return !neg
  }
  return false
}

/** Simple printf-style formatter: replaces %s/%d/%j/%o/%O in the first arg. */
function formatArgs(args: any[]): any[] {
  if (args.length < 2) return args
  const fmt = args[0]
  if (typeof fmt !== 'string' || !/%[sdoOj%]/.test(fmt)) return args
  const out: any[] = []
  let i = 0
  let argIdx = 1
  while (i < fmt.length) {
    if (fmt[i] === '%' && i + 1 < fmt.length) {
      const spec = fmt[i + 1]
      if (spec === '%') { out.push('%'); i += 2; continue }
      const val = args[argIdx++]
      switch (spec) {
        case 's': out.push(String(val)); break
        case 'd': out.push(Number(val)); break
        case 'j':
        case 'o':
        case 'O': out.push(typeof val === 'string' ? val : JSON.stringify(val)); break
        default: out.push('%' + spec)
      }
      i += 2
    } else {
      out.push(fmt[i])
      i++
    }
  }
  // Append remaining args
  for (; argIdx < args.length; argIdx++) out.push(args[argIdx])
  return out
}

/** Create a logger function for the given namespace. */
export function logger(namespace: string): Logger {
  const enabled = isNamespaceEnabled(namespace)

  const base: LogFn = (...args: any[]) => {
    if (!enabled) return
    const formatted = formatArgs(args)
    // eslint-disable-next-line no-console
    console.error(`\x1b[90m${namespace}\x1b[0m`, ...formatted)
  }

  const makeLevel = (levelLabel: string, target: (...a: any[]) => void): LogFn =>
    (...args: any[]) => {
      if (!enabled) return
      target(`\x1b[90m${namespace}:${levelLabel}\x1b[0m`, ...formatArgs(args))
    }

  const fn = base as Logger
  fn.trace = makeLevel('trace', console.trace.bind(console))
  fn.debug = makeLevel('debug', (...a) => console.error(...a))
  fn.info = makeLevel('info', console.info.bind(console))
  fn.warn = makeLevel('warn', console.warn.bind(console))
  fn.error = makeLevel('error', console.error.bind(console))
  fn.enabled = enabled

  return fn
}

export default logger
