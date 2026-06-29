/**
 * Runtime environment detection without accessing `process.env`.
 *
 * This is a Deno-safe replacement for the `wherearewe` package. The original
 * package reads `process.env.NODE_ENV` at import time which triggers Deno's
 * `--allow-env` permission check. This module avoids all `process.env` access.
 */

// Detect Deno early — it has a global `Deno` object.
const isDeno = typeof Deno !== 'undefined' && typeof Deno.version !== 'undefined'

const isEnvWithDom = typeof window === 'object' && typeof document === 'object' && document.nodeType === 9

// Electron detection without env access — check process.versions.electron.
const isElectron = typeof globalThis.process !== 'undefined' &&
  typeof globalThis.process.versions === 'object' &&
  typeof globalThis.process.versions.electron === 'string'

export const isBrowser = isEnvWithDom && !isElectron
export const isElectronMain = isElectron && !isEnvWithDom
export const isElectronRenderer = isElectron && isEnvWithDom

// In Deno, `process.release.name` is 'node' (via the node-compat layer), so
// we must explicitly exclude Deno to avoid mis-detection.
export const isNode = !isDeno &&
  typeof globalThis.process !== 'undefined' &&
  typeof globalThis.process.release !== 'undefined' &&
  globalThis.process.release.name === 'node' &&
  !isElectron

export const isWebWorker = typeof importScripts === 'function' &&
  typeof self !== 'undefined' &&
  typeof WorkerGlobalScope !== 'undefined' &&
  self instanceof WorkerGlobalScope

// Do not read process.env.NODE_ENV — it triggers Deno env permission checks.
export const isTest = false

export const isReactNative = typeof navigator !== 'undefined' && navigator.product === 'ReactNative'
