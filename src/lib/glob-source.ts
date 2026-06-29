import type { InvalidParametersError } from '@libp2p/interface'
import type { MtimeLike } from 'ipfs-unixfs'
import type { Options as GlobOptions } from 'it-glob'

export interface GlobSourceOptions {
  /**
   * Include .dot files in matched paths
   */
  hidden?: boolean

  /**
   * follow symlinks
   */
  followSymlinks?: boolean

  /**
   * Preserve mode
   */
  preserveMode?: boolean

  /**
   * mode to use - if preserveMode is true this will be ignored
   */
  mode?: number

  /**
   * mtime to use - if preserveMtime is true this will be ignored
   */
  mtime?: MtimeLike
}

export interface GlobSourceResult {
  path: string
  content: AsyncIterable<Uint8Array> | undefined
  mode: number | undefined
  mtime: MtimeLike | undefined
}

/**
 * Create an async iterator that yields paths that match requested glob pattern
 *
 * Note: the heavy node-only dependencies (`it-glob`, `node:fs`, `node:os`,
 * `node:path`) are loaded lazily via dynamic `import()` so that merely
 * importing this module does not trigger `os.cpus()` (which requires
 * `--allow-sys` in Deno) or load `fast-glob`.
 */
export async function * globSource (cwd: string, pattern: string, options?: GlobSourceOptions): AsyncGenerator<GlobSourceResult> {
  options = options ?? {}

  if (typeof pattern !== 'string') {
    const { InvalidParametersError } = await import('@libp2p/interface')
    throw new InvalidParametersError('Pattern must be a string')
  }

  // Lazily load node-only deps
  const [
    { default: fs },
    { default: fsp },
    { default: os },
    { default: Path },
    { default: glob }
  ] = await Promise.all([
    import('node:fs'),
    import('node:fs/promises'),
    import('node:os'),
    import('node:path'),
    import('it-glob')
  ])

  if (!Path.isAbsolute(cwd)) {
    cwd = Path.resolve(process.cwd(), cwd)
  }

  if (os.platform() === 'win32') {
    cwd = toPosix(cwd)
  }

  const globOptions: GlobOptions = Object.assign({}, {
    onlyFiles: false,
    absolute: true,
    dot: Boolean(options.hidden),
    followSymbolicLinks: options.followSymlinks ?? true
  } satisfies GlobOptions)

  for await (const p of glob(cwd, pattern, globOptions)) {
    // Workaround for https://github.com/micromatch/micromatch/issues/251
    if (Path.basename(p).startsWith('.') && options.hidden !== true) {
      continue
    }

    const stat = await fsp.stat(p)

    let mode = options.mode

    if (options.preserveMode === true) {
      mode = stat.mode
    }

    let mtime = options.mtime

    if (options.preserveMtime === true) {
      mtime = stat.mtime
    }

    yield {
      path: p.replace(cwd, ''),
      content: stat.isFile() ? fs.createReadStream(p) : undefined,
      mode,
      mtime
    }
  }
}

const toPosix = (path: string): string => path.replace(/\\/g, '/')
